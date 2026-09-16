import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  CreateOpenaiConversationBody,
  GetOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageBody,
  SendOpenaiMessageParams,
} from "@workspace/api-zod";
import { db, conversationsTable, messagesTable } from "@workspace/db";

const router: IRouter = Router();

function serializeConversation(row: typeof conversationsTable.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeMessage(row: typeof messagesTable.$inferSelect) {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/openai/conversations", async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(conversationsTable)
      .orderBy(desc(conversationsTable.createdAt));
    res.json(rows.map(serializeConversation));
  } catch (error) {
    next(error);
  }
});

router.post("/openai/conversations", async (req, res, next) => {
  try {
    const parsed = CreateOpenaiConversationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "A conversation title is required." });
      return;
    }

    const [conversation] = await db
      .insert(conversationsTable)
      .values({ title: parsed.data.title.trim() || "New study session" })
      .returning();
    res.status(201).json(serializeConversation(conversation));
  } catch (error) {
    next(error);
  }
});

router.get("/openai/conversations/:id", async (req, res, next) => {
  try {
    const parsed = GetOpenaiConversationParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid conversation id." });
      return;
    }

    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, parsed.data.id));
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }

    const conversationMessages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversation.id))
      .orderBy(asc(messagesTable.createdAt));
    res.json({
      ...serializeConversation(conversation),
      messages: conversationMessages.map(serializeMessage),
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/openai/conversations/:id", async (req, res, next) => {
  try {
    const parsed = GetOpenaiConversationParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid conversation id." });
      return;
    }
    const deleted = await db
      .delete(conversationsTable)
      .where(eq(conversationsTable.id, parsed.data.id))
      .returning({ id: conversationsTable.id });
    if (deleted.length === 0) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/openai/conversations/:id/messages", async (req, res, next) => {
  try {
    const parsed = ListOpenaiMessagesParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid conversation id." });
      return;
    }
    const rows = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, parsed.data.id))
      .orderBy(asc(messagesTable.createdAt));
    res.json(rows.map(serializeMessage));
  } catch (error) {
    next(error);
  }
});

router.post("/openai/conversations/:id/messages", async (req, res, next) => {
  try {
    const params = SendOpenaiMessageParams.safeParse({ id: Number(req.params.id) });
    const body = SendOpenaiMessageBody.safeParse(req.body);
    if (!params.success || !body.success || !body.data.content.trim()) {
      res.status(400).json({ error: "A non-empty message is required." });
      return;
    }

    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, params.data.id));
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found." });
      return;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        error: "OpenAI is not connected yet. Add OPENAI_API_KEY to Secrets to enable the AI tutor.",
      });
      return;
    }

    const priorMessages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversation.id))
      .orderBy(asc(messagesTable.createdAt));
    const userMessage = body.data.content.trim();
    await db.insert(messagesTable).values({
      conversationId: conversation.id,
      role: "user",
      content: userMessage,
    });

    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-5.4",
        max_completion_tokens: 8192,
        stream: true,
        messages: [
          {
            role: "system",
            content:
              "You are AI Study, a patient and precise personal tutor. Explain concepts clearly, adapt to the student's level, use examples, and help them learn rather than just giving answers. Answer any school subject question. Keep formatting readable in plain text or Markdown.",
          },
          ...priorMessages.map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: message.content,
          })),
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!openAiResponse.ok || !openAiResponse.body) {
      const detail = await openAiResponse.text();
      req.log.error({ status: openAiResponse.status, detail }, "OpenAI request failed");
      res.status(502).json({ error: "OpenAI could not answer right now. Please try again." });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const reader = openAiResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullResponse = "";

    const emitLine = (line: string) => {
      if (!line.startsWith("data: ")) return;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const content = JSON.parse(payload).choices?.[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      } catch {
        // Ignore incomplete provider frames.
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) emitLine(line.trim());
      if (done) break;
    }

    if (fullResponse) {
      await db.insert(messagesTable).values({
        conversationId: conversation.id,
        role: "assistant",
        content: fullResponse,
      });
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    next(error);
  }
});

export default router;