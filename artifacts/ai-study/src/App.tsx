import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, BookOpenCheck, Bell, Check, ChevronRight, CircleHelp, Crown, FlaskConical, LockKeyhole, Menu, MessageCircle, MoreHorizontal, Plus, Send, Settings2, ShieldCheck, Sparkles, Trash2, UserRound, X, Zap } from 'lucide-react';
import type { OpenaiConversation, OpenaiMessage } from '@workspace/api-client-react';
import { useCreateOpenaiConversation, useDeleteOpenaiConversation, useGetOpenaiConversation, useListOpenaiConversations, useListOpenaiMessages, useSendOpenaiMessage } from '@workspace/api-client-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import './index.css';

const queryClient = new QueryClient();

type Icon = typeof MessageCircle;
type NavItem = { label: string; href: string; icon: Icon };

const navItems: NavItem[] = [
  { label: 'Ask AI', href: '/', icon: MessageCircle },
  { label: 'Study', href: '/study', icon: BookOpenCheck },
  { label: 'Profile', href: '/profile', icon: UserRound },
];

const settingsItems: NavItem[] = [
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Security', href: '/security', icon: ShieldCheck },
];

const formatDate = (date?: string) => {
  if (!date) return 'Just now';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(parsed);
};

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <div className={`brand-mark ${small ? 'brand-mark-small' : ''}`} aria-label="AI Study mark" data-testid="brand-mark">
      <span className="brand-node brand-node-a" />
      <span className="brand-node brand-node-b" />
      <span className="brand-node brand-node-c" />
      <span className="brand-node brand-node-d" />
      <span className="brand-line brand-line-a" />
      <span className="brand-line brand-line-b" />
      <span className="brand-line brand-line-c" />
    </div>
  );
}

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3 focus-ring" data-testid="link-home">
      <BrandMark small />
      <span className="font-extrabold tracking-[-0.04em] text-[15px] text-white">AI Study</span>
    </Link>
  );
}

function Sidebar({ mobileOpen, closeMobile }: { mobileOpen: boolean; closeMobile: () => void }) {
  const [location] = useLocation();
  return (
    <>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-[#100d1d]/60 lg:hidden" onClick={closeMobile} aria-label="Close navigation" data-testid="button-close-navigation-overlay" />}
      <aside className={`app-sidebar ${mobileOpen ? 'app-sidebar-open' : ''}`} data-testid="sidebar-navigation">
        <div className="flex items-center justify-between">
          <Logo />
          <button className="icon-button text-white/60 hover:text-white lg:hidden" onClick={closeMobile} aria-label="Close navigation" data-testid="button-close-navigation">
            <X size={18} />
          </button>
        </div>

        <div className="mt-12">
          <p className="eyebrow mb-3 text-white/35">Workspace</p>
          <nav className="space-y-1" aria-label="Main navigation">
            {navItems.map((item) => <SideLink key={item.href} item={item} active={location === item.href} onClick={closeMobile} />)}
          </nav>
        </div>

        <div className="mt-9">
          <p className="eyebrow mb-3 text-white/35">Account</p>
          <nav className="space-y-1" aria-label="Account navigation">
            {settingsItems.map((item) => <SideLink key={item.href} item={item} active={location === item.href} onClick={closeMobile} />)}
          </nav>
        </div>

        <div className="mt-auto">
          <Link href="/pro" className={`pro-side-card ${location === '/pro' ? 'pro-side-card-active' : ''}`} onClick={closeMobile} data-testid="link-pro-sidebar">
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c7b7ff]/15 text-[#d7ceff]"><Crown size={16} /></span>
              <ArrowTiny />
            </div>
            <p className="mt-4 text-sm font-bold text-white">Study with more room</p>
            <p className="mt-1 text-xs leading-5 text-white/45">Unlock deep practice and unlimited history.</p>
          </Link>
          <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-5">
            <div className="avatar avatar-lavender" data-testid="avatar-maya">MS</div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white" data-testid="text-sidebar-user">Maya Salim</p>
              <p className="mt-0.5 truncate text-[11px] text-white/40">Curious by default</p>
            </div>
            <Link href="/profile" className="ml-auto text-white/45 hover:text-white" aria-label="Open profile settings" data-testid="link-sidebar-profile"><MoreHorizontal size={17} /></Link>
          </div>
        </div>
      </aside>
    </>
  );
}

function SideLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const IconComponent = item.icon;
  return (
    <Link href={item.href} onClick={onClick} className={`side-link ${active ? 'side-link-active' : ''}`} data-testid={`link-${item.label.toLowerCase().replace(/\s/g, '-')}`}>
      <IconComponent size={17} strokeWidth={active ? 2.3 : 1.8} />
      <span>{item.label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#a997ff]" />}
    </Link>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const currentLabel = [...navItems, ...settingsItems, { label: 'Pro plan', href: '/pro', icon: Crown }].find((item) => item.href === location)?.label ?? 'Ask AI';
  return (
    <div className="grain min-h-[100dvh] bg-[#171428] p-0 sm:p-4 lg:p-7">
      <div className="app-frame mx-auto flex min-h-[calc(100dvh-2rem)] max-w-[1540px] overflow-hidden rounded-none sm:rounded-[30px]">
        <Sidebar mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} />
        <div className="app-main min-w-0 flex-1">
          <header className="mobile-topbar">
            <button className="icon-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-navigation"><Menu size={20} /></button>
            <span className="text-xs font-bold text-[#332f4e]">{currentLabel}</span>
            <Link href="/profile" className="avatar avatar-lavender" data-testid="link-mobile-profile">MS</Link>
          </header>
          <div className="app-content">{children}</div>
        </div>
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="animate-rise">
        {eyebrow && <p className="eyebrow text-[#8c78df]" data-testid={`text-eyebrow-${eyebrow.toLowerCase().replace(/\s/g, '-')}`}>{eyebrow}</p>}
        <h1 className="display-title mt-2" data-testid={`heading-${title.toLowerCase().replace(/\s/g, '-')}`}>{title}</h1>
        {description && <p className="mt-2 max-w-xl text-sm leading-6 text-[#77728b]" data-testid="text-page-description">{description}</p>}
      </div>
      {action && <div className="animate-rise animate-rise-delay-1 shrink-0">{action}</div>}
    </div>
  );
}

function ArrowTiny() {
  return <ChevronRight size={15} />;
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="empty-state animate-rise" data-testid="empty-conversations">
      <div className="empty-orbit"><BrandMark /></div>
      <p className="mt-6 text-lg font-extrabold tracking-[-0.03em] text-[#302b48]">A blank page is a good start.</p>
      <p className="mt-2 max-w-xs text-center text-sm leading-6 text-[#878196]">Open a conversation and turn the first question into a little more confidence.</p>
      <button className="primary-button mt-6" onClick={onCreate} data-testid="button-start-first-session"><Plus size={16} /> Start a study session</button>
    </div>
  );
}

function AssistantPage() {
  const queryClient = useQueryClient();
  const conversationsQuery = useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();
  const deleteConversation = useDeleteOpenaiConversation();
  const sendMessageMutation = useSendOpenaiMessage();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [composer, setComposer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [localMessages, setLocalMessages] = useState<OpenaiMessage[]>([]);
  const sending = isStreaming || sendMessageMutation.isPending;

  const conversations = useMemo(() => [...(conversationsQuery.data ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [conversationsQuery.data]);
  useEffect(() => {
    if (activeId === null && conversations[0]) setActiveId(conversations[0].id);
    if (activeId !== null && conversations.length && !conversations.some((conversation) => conversation.id === activeId)) setActiveId(conversations[0].id);
  }, [activeId, conversations]);

  const conversationQuery = useGetOpenaiConversation(activeId ?? 0, { query: { enabled: activeId !== null, queryKey: ['/api/openai/conversations', activeId ?? 0] } });
  const messagesQuery = useListOpenaiMessages(activeId ?? 0, { query: { enabled: activeId !== null, queryKey: ['/api/openai/conversations', activeId ?? 0, 'messages'] } });
  const selectedConversation = conversations.find((conversation) => conversation.id === activeId);
  const serverMessages = conversationQuery.data?.messages ?? messagesQuery.data ?? [];
  const shownMessages = [...serverMessages, ...localMessages.filter((message) => message.conversationId === activeId)];
  const isLoadingChat = activeId !== null && conversationQuery.isLoading && messagesQuery.isLoading;

  const createSession = useCallback((title = 'Untitled study session', afterCreate?: (conversation: OpenaiConversation) => void) => {
    createConversation.mutate({ data: { title } }, {
      onSuccess: (conversation) => {
        setActiveId(conversation.id);
        setStreamError('');
        queryClient.invalidateQueries({ queryKey: ['/api/openai/conversations'] });
        afterCreate?.(conversation);
      },
      onError: () => setStreamError('We could not open a new session. Please try again.'),
    });
  }, [createConversation, queryClient]);

  const streamReply = useCallback(async (conversationId: number, content: string) => {
    const now = new Date().toISOString();
    const userMessage: OpenaiMessage = { id: -Date.now(), conversationId, role: 'user', content, createdAt: now };
    const assistantId = -(Date.now() + 1);
    const assistantMessage: OpenaiMessage = { id: assistantId, conversationId, role: 'assistant', content: '', createdAt: now };
    setLocalMessages((messages) => [...messages, userMessage, assistantMessage]);
    setIsStreaming(true);
    setStreamError('');
    try {
      const response = await fetch(`/api/openai/conversations/${conversationId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok || !response.body) throw new Error('Stream unavailable');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finished = false;
      while (!finished) {
        const chunk = await reader.read();
        buffer += decoder.decode(chunk.value ?? new Uint8Array(), { stream: !chunk.done });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const event of events) {
          const line = event.split('\n').find((entry) => entry.startsWith('data:'));
          if (!line) continue;
          try {
            const payload = JSON.parse(line.replace(/^data:\s*/, '')) as { content?: string; done?: boolean };
            if (payload.content) setLocalMessages((messages) => messages.map((message) => message.id === assistantId ? { ...message, content: message.content + payload.content } : message));
            if (payload.done) finished = true;
          } catch {
            // Ignore a malformed SSE frame and continue reading the stream.
          }
        }
        if (chunk.done) finished = true;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/openai/conversations', conversationId] }),
        queryClient.invalidateQueries({ queryKey: ['/api/openai/conversations', conversationId, 'messages'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/openai/conversations'] }),
      ]);
      setLocalMessages([]);
    } catch {
      setStreamError('The tutor lost its place. Your question is still here — try sending it again.');
    } finally {
      setIsStreaming(false);
    }
  }, [queryClient]);

  const sendPrompt = useCallback((event?: FormEvent) => {
    event?.preventDefault();
    const content = composer.trim();
    if (!content || sending || createConversation.isPending) return;
    setComposer('');
    if (activeId === null) {
      createSession(content.length > 34 ? `${content.slice(0, 34)}…` : content, (conversation) => { void streamReply(conversation.id, content); });
    } else {
      void streamReply(activeId, content);
    }
  }, [activeId, composer, createConversation.isPending, createSession, sending, streamReply]);

  const removeConversation = (conversation: OpenaiConversation) => {
    if (!window.confirm(`Delete "${conversation.title}"?`)) return;
    deleteConversation.mutate({ id: conversation.id }, {
      onSuccess: () => {
        if (activeId === conversation.id) setActiveId(null);
        queryClient.invalidateQueries({ queryKey: ['/api/openai/conversations'] });
      },
      onError: () => setStreamError('That session could not be deleted. Please try again.'),
    });
  };

  const quickPrompts = ['Explain this like I am new to it', 'Quiz me on a topic', 'Help me make a study plan'];

  return (
    <div className="assistant-layout">
      <section className="assistant-column">
        <div className="flex items-start justify-between gap-4">
          <div className="animate-rise">
            <div className="flex items-center gap-2">
              <span className="live-dot" />
              <p className="eyebrow text-[#8c78df]">Your study companion</p>
            </div>
            <h1 className="display-title mt-2" data-testid="heading-ask-ai">What are you learning today?</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#77728b]">Ask anything. We will take it one clear step at a time.</p>
          </div>
          <button className="quiet-button hidden sm:flex" onClick={() => createSession()} disabled={createConversation.isPending} data-testid="button-new-conversation"><Plus size={16} /> New session</button>
        </div>

        <div className="chat-surface animate-rise animate-rise-delay-1 mt-8">
          <div className="chat-toolbar">
            <div className="flex min-w-0 items-center gap-3">
              <div className="mini-mark"><BrandMark small /></div>
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold text-[#322c4c]" data-testid="text-active-conversation">{selectedConversation?.title ?? 'New study session'}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#9a94a8]"><span className="h-1.5 w-1.5 rounded-full bg-[#63cabf]" /> AI Study tutor</p>
              </div>
            </div>
            <button className="icon-button text-[#928da4] hover:bg-[#f2effa] hover:text-[#3c3657]" onClick={() => createSession()} aria-label="Start another conversation" data-testid="button-conversation-actions"><MoreHorizontal size={18} /></button>
          </div>

          <div className="chat-messages scrollbar-thin" data-testid="chat-message-list">
            {isLoadingChat ? <MessageSkeleton /> : activeId === null && !conversationsQuery.isLoading ? <EmptyState onCreate={() => createSession()} /> : shownMessages.length === 0 ? <ChatWelcome onPrompt={(prompt) => setComposer(prompt)} /> : shownMessages.map((message) => <MessageBubble key={message.id} message={message} />)}
            {isStreaming && <div className="thinking-row" data-testid="status-ai-thinking"><div className="thinking-avatar"><Sparkles size={15} /></div><div className="thinking-bubble"><span /><span /><span /></div></div>}
          </div>

          {streamError && <div className="mx-5 mb-3 rounded-xl border border-[#e8c9c5] bg-[#fff5f3] px-3 py-2.5 text-xs text-[#9c5048]" data-testid="status-chat-error">{streamError}</div>}
          <form onSubmit={sendPrompt} className="chat-composer" data-testid="form-chat-composer">
            <input value={composer} onChange={(event) => setComposer(event.target.value)} className="chat-input focus-ring" placeholder="Ask a question about your studies..." aria-label="Ask a question" data-testid="input-chat-message" />
            <button type="submit" className="send-button" disabled={!composer.trim() || sending || createConversation.isPending} aria-label="Send question" data-testid="button-send-message"><Send size={16} /></button>
          </form>
          <div className="chat-footer"><span>AI can make mistakes. Check important work.</span><span className="font-mono">⌘ + K</span></div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 animate-rise animate-rise-delay-2">
          {quickPrompts.map((prompt) => <button key={prompt} className="prompt-chip" onClick={() => setComposer(prompt)} data-testid={`button-prompt-${prompt.toLowerCase().replace(/\s/g, '-').slice(0, 18)}`}>{prompt}<ArrowTiny /></button>)}
        </div>
      </section>

      <aside className="history-panel animate-rise animate-rise-delay-2">
        <div className="flex items-center justify-between">
          <div><p className="eyebrow text-[#8c78df]">Your library</p><h2 className="mt-1 text-lg font-extrabold tracking-[-0.04em] text-[#302b48]">Recent sessions</h2></div>
          <button className="icon-button text-[#8d87a0] hover:bg-[#f0edfa]" onClick={() => createSession()} aria-label="Create session" data-testid="button-create-session-history"><Plus size={17} /></button>
        </div>
        <div className="mt-5 space-y-2" data-testid="conversation-history">
          {conversationsQuery.isLoading ? <HistorySkeleton /> : conversationsQuery.isError ? <ErrorMini text="History is unavailable right now." onRetry={() => conversationsQuery.refetch()} /> : conversations.length === 0 ? <div className="rounded-2xl border border-dashed border-[#ddd7ec] p-5 text-center text-xs leading-5 text-[#918ba2]" data-testid="empty-history">Your saved sessions will live here.</div> : conversations.map((conversation) => <ConversationRow key={conversation.id} conversation={conversation} active={conversation.id === activeId} onSelect={() => setActiveId(conversation.id)} onDelete={() => removeConversation(conversation)} />)}
        </div>
        <Link href="/study" className="study-rail-card group mt-6" data-testid="link-study-rail">
          <div className="flex items-center justify-between"><span className="rounded-lg bg-[#dff7f4] p-2 text-[#3c9d98]"><BookOpenCheck size={15} /></span><ArrowTiny /></div>
          <p className="mt-4 text-sm font-extrabold text-[#393252]">Keep the thread going</p>
          <p className="mt-1 text-xs leading-5 text-[#89839a]">You have a 4-day learning rhythm.</p>
        </Link>
      </aside>
    </div>
  );
}

function ChatWelcome({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return (
    <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-6 text-center" data-testid="empty-chat-welcome">
      <div className="welcome-glow"><BrandMark /></div>
      <p className="mt-6 text-xl font-extrabold tracking-[-0.04em] text-[#302b48]">Start with a real question.</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#89839b]">From calculus to creative writing, a good explanation starts wherever you are.</p>
      <button className="text-link mt-5" onClick={() => onPrompt('Help me understand something I am stuck on')} data-testid="button-suggest-chat-prompt">Give me a place to begin <ArrowTiny /></button>
    </div>
  );
}

function MessageSkeleton() {
  return <div className="space-y-5 p-6" data-testid="loading-chat-skeleton"><div className="skeleton h-10 w-3/5 rounded-2xl" /><div className="ml-auto skeleton h-14 w-2/3 rounded-2xl" /><div className="skeleton h-20 w-4/5 rounded-2xl" /></div>;
}

function HistorySkeleton() {
  return <div className="space-y-2" data-testid="loading-history-skeleton">{[1, 2, 3].map((item) => <div key={item} className="skeleton h-16 rounded-xl" />)}</div>;
}

function ErrorMini({ text, onRetry }: { text: string; onRetry: () => void }) {
  return <div className="rounded-2xl border border-[#ead1ce] bg-[#fff6f4] p-4 text-xs leading-5 text-[#9c5048]" data-testid="status-history-error"><p>{text}</p><button className="mt-2 font-bold underline" onClick={onRetry} data-testid="button-retry-history">Try again</button></div>;
}

function MessageBubble({ message }: { message: OpenaiMessage }) {
  const assistant = message.role !== 'user';
  return (
    <div className={`message-row ${assistant ? 'message-row-assistant' : 'message-row-user'}`} data-testid={`message-${message.id}`}>
      {assistant && <div className="thinking-avatar shrink-0"><Sparkles size={14} /></div>}
      <div className={`message-bubble ${assistant ? 'message-bubble-assistant' : 'message-bubble-user'}`}>
        {message.content || <span className="inline-flex gap-1"><i className="typing-dot" /><i className="typing-dot" /><i className="typing-dot" /></span>}
        <span className="message-time">{formatDate(message.createdAt)}</span>
      </div>
      {!assistant && <div className="avatar avatar-user shrink-0">MS</div>}
    </div>
  );
}

function ConversationRow({ conversation, active, onSelect, onDelete }: { conversation: OpenaiConversation; active: boolean; onSelect: () => void; onDelete: () => void }) {
  return (
    <div className={`conversation-row ${active ? 'conversation-row-active' : ''}`} data-testid={`conversation-${conversation.id}`}>
      <button className="min-w-0 flex-1 text-left" onClick={onSelect} data-testid={`button-select-conversation-${conversation.id}`}>
        <p className="truncate text-xs font-bold text-[#3c3657]">{conversation.title || 'Untitled session'}</p>
        <p className="mt-1 text-[10px] text-[#9b95a8]">{formatDate(conversation.createdAt)}</p>
      </button>
      <button className="conversation-delete" onClick={onDelete} aria-label={`Delete ${conversation.title}`} data-testid={`button-delete-conversation-${conversation.id}`}><Trash2 size={14} /></button>
    </div>
  );
}

function StudyPage() {
  const [focus, setFocus] = useState('Biology');
  const [checked, setChecked] = useState<string[]>(['Review cell transport']);
  const tasks = ['Review cell transport', 'Sketch the nephron', 'Read chapter 08 notes'];
  const subjects = [{ name: 'Biology', meta: '4 sessions · 72%', color: '#a997ff' }, { name: 'History', meta: '2 sessions · 48%', color: '#70ccc5' }, { name: 'Physics', meta: '1 session · 31%', color: '#f0b876' }];
  return (
    <div className="page-wrap">
      <PageHeader eyebrow="Your practice room" title="A little progress, often." description="Small sessions compound. Here is the shape of your learning this week." action={<button className="primary-button" onClick={() => setChecked([])} data-testid="button-reset-study-week"><Zap size={15} /> Reset week</button>} />
      <div className="study-grid">
        <section className="study-hero-card animate-rise animate-rise-delay-1">
          <div className="flex items-start justify-between gap-5"><div><p className="eyebrow text-[#a79af0]">Current rhythm</p><p className="mt-3 text-5xl font-extrabold tracking-[-0.08em] text-white">04 <span className="text-xl tracking-[-0.03em] text-white/45">days</span></p><p className="mt-2 text-sm text-white/55">You showed up four times this week.</p></div><div className="streak-orbit"><span>04</span><small>days</small></div></div>
          <div className="mt-9 flex items-end gap-2">{[42, 64, 48, 82, 55, 30, 18].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className={`w-full rounded-t-md ${index === 3 ? 'bg-[#c8bcff]' : 'bg-white/20'}`} style={{ height: `${height}px` }} /><span className="text-[10px] text-white/35">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span></div>)}</div>
        </section>
        <section className="metric-card animate-rise animate-rise-delay-2"><p className="eyebrow text-[#8c78df]">Focus time</p><p className="mt-4 text-4xl font-extrabold tracking-[-0.08em] text-[#373052]">3h 28m</p><p className="mt-2 text-xs text-[#8d879b]">+42m from last week</p><div className="progress-line mt-6"><span style={{ width: '68%' }} /></div><p className="mt-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#9a94a8]">68% of your weekly intention</p></section>
        <section className="metric-card animate-rise animate-rise-delay-3"><div className="flex items-center justify-between"><p className="eyebrow text-[#8c78df]">Recall check</p><FlaskConical size={17} className="text-[#70aaa6]" /></div><p className="mt-4 text-4xl font-extrabold tracking-[-0.08em] text-[#373052]">76<span className="text-xl">%</span></p><p className="mt-2 text-xs text-[#8d879b]">12 of 16 answers felt solid</p><div className="mt-5 flex gap-1.5">{[1, 1, 1, 1, 1, 1, 1, 0, 0, 0].map((filled, index) => <span key={index} className={`h-2 flex-1 rounded-full ${filled ? 'bg-[#70ccc5]' : 'bg-[#e5e0ee]'}`} />)}</div></section>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <section className="paper-card animate-rise animate-rise-delay-2"><div className="flex items-center justify-between"><div><p className="eyebrow text-[#8c78df]">Study list</p><h2 className="section-title mt-1">Next gentle steps</h2></div><button className="icon-button text-[#928da4] hover:bg-[#f2effa]" onClick={() => setChecked([])} aria-label="Clear completed study steps" data-testid="button-study-list-options"><MoreHorizontal size={18} /></button></div><div className="mt-5 space-y-3">{tasks.map((task) => <label key={task} className="task-row" data-testid={`task-${task.toLowerCase().replace(/\s/g, '-')}`}><input type="checkbox" checked={checked.includes(task)} onChange={() => setChecked((current) => current.includes(task) ? current.filter((item) => item !== task) : [...current, task])} /><span className="custom-check"><Check size={12} /></span><span className={checked.includes(task) ? 'task-done' : ''}>{task}</span><span className="ml-auto text-[10px] text-[#a39daf]">{checked.includes(task) ? 'Done' : 'Next'}</span></label>)}</div></section>
        <section className="paper-card animate-rise animate-rise-delay-3"><div className="flex items-center justify-between"><div><p className="eyebrow text-[#8c78df]">Subject focus</p><h2 className="section-title mt-1">Your constellation</h2></div><button className="text-link" onClick={() => setFocus(subjects[(subjects.findIndex((subject) => subject.name === focus) + 1) % subjects.length].name)} data-testid="button-cycle-focus">Cycle focus <ArrowTiny /></button></div><div className="mt-5 space-y-4">{subjects.map((subject) => <button key={subject.name} onClick={() => setFocus(subject.name)} className={`subject-row ${focus === subject.name ? 'subject-row-active' : ''}`} data-testid={`button-subject-${subject.name.toLowerCase()}`}><span className="subject-dot" style={{ backgroundColor: subject.color }} /><span className="flex-1 text-left"><span className="block text-xs font-extrabold text-[#3a3454]">{subject.name}</span><span className="mt-1 block text-[10px] text-[#9992a8]">{subject.meta}</span></span>{focus === subject.name && <Check size={15} className="text-[#8c78df]" />}</button>)}</div></section>
      </div>
    </div>
  );
}

function ProfilePage() {
  const [name, setName] = useState('Maya Salim');
  const [email, setEmail] = useState('maya.salim@northstar.edu');
  const [saved, setSaved] = useState(false);
  const save = (event: FormEvent) => { event.preventDefault(); setSaved(true); window.setTimeout(() => setSaved(false), 2200); };
  return (
    <div className="page-wrap max-w-5xl"><PageHeader eyebrow="Your details" title="Make this space yours." description="A few details help your tutor meet you where you are." />
      <div className="profile-layout">
        <section className="profile-card animate-rise animate-rise-delay-1"><div className="profile-avatar-wrap"><div className="profile-avatar">MS</div><button className="avatar-edit" onClick={() => setSaved(true)} aria-label="Change profile avatar" data-testid="button-change-avatar"><Settings2 size={14} /></button></div><h2 className="mt-5 text-xl font-extrabold tracking-[-0.05em] text-[#332d4d]" data-testid="text-profile-name">{name}</h2><p className="mt-1 text-xs text-[#958da4]">Curious by default</p><div className="mt-8 grid grid-cols-2 gap-2"><div className="profile-stat"><strong>12</strong><span>Sessions</span></div><div className="profile-stat"><strong>04</strong><span>Day rhythm</span></div></div></section>
        <form className="paper-card animate-rise animate-rise-delay-2" onSubmit={save} data-testid="form-profile"><div><p className="eyebrow text-[#8c78df]">Personal information</p><h2 className="section-title mt-1">How should we call you?</h2></div><div className="mt-7 grid gap-5 sm:grid-cols-2"><Field label="Full name" value={name} onChange={setName} id="full-name" /><Field label="Email address" value={email} onChange={setEmail} id="email-address" type="email" /></div><div className="mt-5"><label className="field-label" htmlFor="learning-style">Learning style</label><select id="learning-style" className="field-input mt-2" defaultValue="clear"><option value="clear">Clear explanations</option><option value="visual">Visual examples</option><option value="practice">Practice first</option></select></div><div className="mt-8 flex items-center justify-between gap-3 border-t border-[#eeeaf4] pt-5"><span className={`text-xs font-bold text-[#5e9a93] ${saved ? 'opacity-100' : 'opacity-0'}`} data-testid="status-profile-saved">Changes saved</span><button className="primary-button" type="submit" data-testid="button-save-profile"><Check size={15} /> Save details</button></div></form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, id, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; id: string; type?: string }) {
  return <div><label className="field-label" htmlFor={id}>{label}</label><input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="field-input mt-2 focus-ring" data-testid={`input-${id}`} /></div>;
}

type ToggleProps = { label: string; description: string; checked: boolean; onChange: () => void; testId: string };
function ToggleRow({ label, description, checked, onChange, testId }: ToggleProps) {
  return <div className="toggle-row"><div className="min-w-0"><p className="text-sm font-bold text-[#40395b]">{label}</p><p className="mt-1 text-xs leading-5 text-[#918a9f]">{description}</p></div><button className={`toggle ${checked ? 'toggle-on' : ''}`} onClick={onChange} role="switch" aria-checked={checked} aria-label={label} data-testid={testId}><span /></button></div>;
}

function NotificationsPage() {
  const [settings, setSettings] = useState({ reminders: true, weekly: true, product: false, quiet: false });
  const set = (key: keyof typeof settings) => setSettings((current) => ({ ...current, [key]: !current[key] }));
  return <div className="page-wrap max-w-4xl"><PageHeader eyebrow="Preferences" title="Choose your signals." description="Useful nudges, never noise. You are in control of how AI Study checks in." action={<span className="soft-status" data-testid="status-notification-sync"><span /> Synced just now</span>} /><section className="paper-card animate-rise animate-rise-delay-1"><div className="settings-section-heading"><span className="settings-icon"><Bell size={17} /></span><div><h2 className="section-title">Study rhythm</h2><p className="mt-1 text-xs text-[#918a9f]">Stay close to the habits you are building.</p></div></div><div className="mt-5"><ToggleRow label="Study reminders" description="A gentle note when it is a good time to return." checked={settings.reminders} onChange={() => set('reminders')} testId="switch-study-reminders" /><ToggleRow label="Weekly reflection" description="A Sunday snapshot of your questions and progress." checked={settings.weekly} onChange={() => set('weekly')} testId="switch-weekly-reflection" /></div><div className="settings-section-heading mt-9 border-t border-[#eeeaf4] pt-7"><span className="settings-icon settings-icon-teal"><Sparkles size={17} /></span><div><h2 className="section-title">From AI Study</h2><p className="mt-1 text-xs text-[#918a9f]">News about features that make learning lighter.</p></div></div><div className="mt-5"><ToggleRow label="Product updates" description="Occasional notes when something new is ready." checked={settings.product} onChange={() => set('product')} testId="switch-product-updates" /><ToggleRow label="Quiet hours" description="Pause all non-essential notifications from 9 pm to 8 am." checked={settings.quiet} onChange={() => set('quiet')} testId="switch-quiet-hours" /></div></section></div>;
}

function SecurityPage() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [saved, setSaved] = useState(false);
  return <div className="page-wrap max-w-4xl"><PageHeader eyebrow="Private by design" title="Your space, protected." description="Simple controls for a calm, secure place to think." /><div className="space-y-5"><section className="paper-card animate-rise animate-rise-delay-1"><div className="settings-section-heading"><span className="settings-icon settings-icon-rose"><LockKeyhole size={17} /></span><div><h2 className="section-title">Account security</h2><p className="mt-1 text-xs text-[#918a9f]">Keep your account accessible only to you.</p></div></div><div className="security-row mt-6"><div><p className="text-sm font-bold text-[#40395b]">Password</p><p className="mt-1 text-xs text-[#918a9f]">Last updated 24 days ago</p></div><button className="quiet-button" onClick={() => setSaved(true)} data-testid="button-change-password">Change password <ArrowTiny /></button></div><div className="security-row"><div><p className="text-sm font-bold text-[#40395b]">Two-step verification</p><p className="mt-1 text-xs leading-5 text-[#918a9f]">Ask for a second code when you sign in on a new device.</p></div><button className={`toggle ${twoFactor ? 'toggle-on' : ''}`} onClick={() => setTwoFactor(!twoFactor)} role="switch" aria-checked={twoFactor} aria-label="Two-step verification" data-testid="switch-two-factor"><span /></button></div></section><section className="paper-card animate-rise animate-rise-delay-2"><div className="settings-section-heading"><span className="settings-icon settings-icon-amber"><ShieldCheck size={17} /></span><div><h2 className="section-title">Your data</h2><p className="mt-1 text-xs text-[#918a9f]">You can take your information with you.</p></div></div><div className="security-row mt-6"><div><p className="text-sm font-bold text-[#40395b]">Download a copy</p><p className="mt-1 text-xs leading-5 text-[#918a9f]">Export your profile and conversation history as a JSON file.</p></div><button className="quiet-button" onClick={() => { const blob = new Blob([JSON.stringify({ profile: 'Maya Salim', exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'ai-study-data.json'; anchor.click(); URL.revokeObjectURL(url); }} data-testid="button-download-data">Download <ArrowUpRight /></button></div><div className="security-row"><div><p className="text-sm font-bold text-[#40395b]">Delete account</p><p className="mt-1 text-xs leading-5 text-[#918a9f]">This removes your account and saved sessions.</p></div><button className="danger-button" onClick={() => window.confirm('Are you sure you want to delete your account?')} data-testid="button-delete-account">Delete account</button></div></section></div>{saved && <p className="mt-4 text-center text-xs font-bold text-[#5e9a93]" data-testid="status-security-saved">Security settings updated locally.</p>}</div>;
}

function ProPage() {
  const [selected, setSelected] = useState('pro');
  const features = ['Unlimited AI study sessions', 'Deep practice and recall checks', 'A longer memory for your learning'];
  return <div className="page-wrap max-w-5xl"><PageHeader eyebrow="A little more room" title="Go deeper, when you are ready." description="More context for your tutor. More space for the way you learn." /><div className="pro-hero animate-rise animate-rise-delay-1"><div className="pro-hero-orb"><Crown size={25} /></div><div className="relative max-w-lg"><p className="eyebrow text-[#c9c0ff]">AI Study Pro</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.07em] text-white sm:text-4xl">Keep the questions coming.</h2><p className="mt-3 text-sm leading-6 text-white/58">Your curiosity should not have a quota. Choose a plan that gives your study practice more breathing room.</p></div><div className="pro-hero-detail"><span>Built for your rhythm</span><span>Cancel whenever</span></div></div><div className="mt-6 grid gap-5 md:grid-cols-2">{[{ id: 'free', name: 'Free', price: '$0', caption: 'A thoughtful place to begin.', features: ['10 AI sessions each month', 'Conversation history for 7 days', 'Core study prompts'] }, { id: 'pro', name: 'Pro', price: '$8', caption: 'For a practice that keeps going.', features }].map((plan) => <button key={plan.id} onClick={() => setSelected(plan.id)} className={`plan-card ${selected === plan.id ? 'plan-card-selected' : ''}`} data-testid={`button-plan-${plan.id}`}><div className="flex items-start justify-between text-left"><div><span className="eyebrow text-[#8c78df]">{plan.name}</span><p className="mt-3 text-4xl font-extrabold tracking-[-0.08em] text-[#352f50]">{plan.price}<span className="ml-1 text-sm font-bold tracking-normal text-[#9790a5]">{plan.id === 'pro' ? '/ month' : ''}</span></p></div><span className={`plan-radio ${selected === plan.id ? 'plan-radio-on' : ''}`}>{selected === plan.id && <Check size={12} />}</span></div><p className="mt-3 text-left text-xs text-[#918a9f]">{plan.caption}</p><div className="mt-6 space-y-3 text-left">{plan.features.map((feature) => <span key={feature} className="flex items-center gap-2 text-xs font-semibold text-[#57506f]"><Check size={14} className={plan.id === 'pro' ? 'text-[#8c78df]' : 'text-[#99a2ad]'} />{feature}</span>)}</div>{plan.id === 'pro' && <span className="mt-7 flex w-full items-center justify-center rounded-xl bg-[#393250] py-3 text-xs font-extrabold text-white">{selected === 'pro' ? 'Selected plan' : 'Choose Pro'} <ArrowTiny /></span>}</button>)}</div><div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[#9b95a8]"><ShieldCheck size={14} className="text-[#70aaa6]" /> Secure billing handled by Stripe <CircleHelp size={13} /></div></div>;
}

function NotFoundPage() {
  return <div className="flex min-h-[70vh] items-center justify-center text-center"><div><BrandMark /><h1 className="display-title mt-6">This page wandered off.</h1><p className="mt-2 text-sm text-[#77728b]">Let's get you back to your study desk.</p><Link href="/" className="primary-button mt-6 inline-flex" data-testid="link-not-found-home">Back to Ask AI</Link></div></div>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AppShell>
          <Switch>
            <Route path="/" component={AssistantPage} />
            <Route path="/study" component={StudyPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route path="/notifications" component={NotificationsPage} />
            <Route path="/security" component={SecurityPage} />
            <Route path="/pro" component={ProPage} />
            <Route component={NotFoundPage} />
          </Switch>
        </AppShell>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;