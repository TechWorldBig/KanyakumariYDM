import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  MessageCircle,
  Paperclip,
  Pencil,
  Search,
  Send,
  Smile,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Fragment, lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { UserRole } from "../types";
import { conversationChannelName, getAblyClient } from "../services/ably";
import { GroupMessages } from './GroupMessages';
import { VoicePreview, VoiceRecordButton } from '../components/shared/VoiceMessage';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { TabsList, TabTrigger } from '../components/ui/tabs';

const EmojiPicker = lazy(() => import("emoji-picker-react"));
const quickReactions = ["\u{1F44D}", "\u{2764}\u{FE0F}", "\u{1F602}", "\u{1F64F}", "\u{1F62E}"];

type ChatMessage = {
  id: string;
  from: string;
  to: string;
  text: string;
  sentAt: string;
  editedAt?: string;
  deletedAt?: string;
  readAt?: string;
  reactions?: Record<string, string[]>;
  attachment?: { url: string; name: string; type: string };
};
type ChatProfile = { name: string; photo: string };
const legacyEmojiOptions = [
  "😀",
  "😂",
  "😍",
  "🙏",
  "👍",
  "❤️",
  "🎉",
  "😊",
  "👏",
  "🔥",
  "✅",
  "🙌",
];
function statusLabel(lastSeen: string | null, online: boolean) {
  if (online) return "Active now";
  if (!lastSeen) return "Inactive · No recent activity";
  const minutes = Math.max(
    1,
    Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000),
  );
  if (minutes < 2) return "Inactive · Active this minute ago";
  if (minutes < 60) return `Inactive · Active ${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return `Inactive · Active ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30)
    return `Inactive · Active ${days} ${days === 1 ? "day" : "days"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12)
    return `Inactive · Active ${months} ${months === 1 ? "month" : "months"} ago`;
  const years = Math.floor(months / 12);
  return `Inactive · Active ${years} ${years === 1 ? "year" : "years"} ago`;
}
function messageDateLabel(value: string) {
  const date = new Date(value)
  const today = new Date()
  const startOfDay = (item: Date) => new Date(item.getFullYear(), item.getMonth(), item.getDate()).getTime()
  const daysApart = Math.round((startOfDay(today) - startOfDay(date)) / 86_400_000)
  if (daysApart === 0) return 'Today'
  if (daysApart === 1) return 'Yesterday'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}
const recipients: Array<{ id: UserRole; label: string }> = [
  { id: "district", label: "District Super Admin" },
  { id: "head-pastor", label: "Head Pastor" },
  { id: "district-ydm", label: "District YDM Leader" },
  { id: "district-women", label: "District Women Leader" },
  { id: "headmaster-admin", label: "Headmaster Admin" },
  { id: "teacher-admin", label: "Teacher Admin" },
  { id: "section1", label: "Section 1 Admin" },
  { id: "section2", label: "Section 2 Admin" },
  { id: "section3", label: "Section 3 Admin" },
  { id: "section4", label: "Section 4 Admin" },
];

async function attachmentData(file: File) {
  if (!file.type.startsWith("image/"))
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  const source = await createImageBitmap(file),
    scale = Math.min(1, 1600 / Math.max(source.width, source.height)),
    canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.78);
}

export function MessagesPage({ role }: { role: UserRole }) {
  const [view, setView] = useState<'people' | 'groups'>('people');
  const outgoingTypingTimer = useRef<number | null>(null),
    incomingTypingTimer = useRef<number | null>(null);
  const [selected, setSelected] = useState<UserRole>(
      recipients.find((item) => item.id !== role)?.id || "district",
    ),
    [messages, setMessages] = useState<ChatMessage[]>([]),
    [text, setText] = useState(""),
    [attachment, setAttachment] = useState<File | null>(null),
    [uploading, setUploading] = useState(false),
    [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({}),
    [online, setOnline] = useState<string[]>([]),
    [recipientProfiles, setRecipientProfiles] = useState<Record<string, ChatProfile>>({}),
    [lastSeen, setLastSeen] = useState<Record<string, string | null>>({}),
    [typing, setTyping] = useState(false),
    [error, setError] = useState(""),
    [editingId, setEditingId] = useState<string | null>(null),
    [emojiOpen, setEmojiOpen] = useState(false),
    [reactionFor, setReactionFor] = useState<string | null>(null),
    [searchQuery, setSearchQuery] = useState(""),
    [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const conversation = useMemo(
    () =>
      messages.filter(
        (message) =>
          !message.deletedAt &&
          ((message.from === role && message.to === selected) ||
            (message.from === selected && message.to === role)),
      ),
    [messages, role, selected],
  );
  const filteredRecipients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return recipients
      .filter((item) => item.id !== role)
      .filter((item) => {
        if (!query) return true;
        const name = (recipientProfiles[item.id]?.name || item.label).toLowerCase();
        return name.includes(query) || item.id.toLowerCase().includes(query);
      });
  }, [recipients, role, recipientProfiles, searchQuery]);
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversation, selected, typing]);
  const channel = () =>
    getAblyClient(selected).channels.get(
      conversationChannelName(role, selected),
    );
  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/chat-files?mode=statuses", { credentials: "include" });
        if (!response.ok) return;
        const result = await response.json();
        const statuses = result.statuses || {};
        setLastSeen(Object.fromEntries(recipients.filter((item) => item.id !== role).map((item) => [item.id, statuses[item.id]?.lastSeen || null])));
        setOnline(recipients.filter((item) => item.id !== role && statuses[item.id]?.online).map((item) => item.id));
      } catch { /* The realtime presence check remains available as fallback. */ }
    };
    void load();
    const timer = window.setInterval(() => void load(), 10000);
    const refreshOnFocus = () => void load();
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refreshOnFocus); document.removeEventListener("visibilitychange", refreshOnFocus); };
  }, [role]);
  const loadUnreadCounts = () =>
    fetch('/api/chat-files?mode=unread', { credentials: 'include' })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => setUnreadCounts(Object.fromEntries((result?.unread || []).map((item: { role: string; count: number }) => [item.role, item.count]))))
      .catch(() => undefined);
  const markConversationRead = (partner: UserRole) =>
    fetch('/api/chat-files?mode=messages&with=' + encodeURIComponent(partner), { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark-read' }) })
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json();
        setUnreadCounts((current) => ({ ...current, [partner]: 0 }));
        if (result.messages?.length) {
          const receiptChannel = getAblyClient(partner).channels.get(conversationChannelName(role, partner));
          await receiptChannel.publish('chat-read', { reader: role, messages: result.messages });
        }
      })
      .catch(() => undefined);
  useEffect(() => {
    void loadUnreadCounts();
    const timer = window.setInterval(() => void loadUnreadCounts(), 10000);
    return () => window.clearInterval(timer);
  }, [role]);
  useEffect(() => {
    const activeChannel = channel(),
      realtimeChannel = activeChannel as any,
      statusChannel = getAblyClient(selected).channels.get("kanyakumari-district") as any;
    const receive = (event: { data: ChatMessage }) => {
      if (event.data?.id)
        setMessages((current) =>
          current.some((item) => item.id === event.data.id)
            ? current
            : [...current, event.data],
        );
      if (event.data?.from === selected && event.data?.to === role) void markConversationRead(selected);
      else void loadUnreadCounts();
    };
    const edit = (event: {
      data: { id: string; text: string; editedAt: string };
    }) =>
      setMessages((current) =>
        current.map((item) =>
          item.id === event.data.id
            ? { ...item, text: event.data.text, editedAt: event.data.editedAt }
            : item,
        ),
      );
    const remove = (event: { data: { id: string; deletedAt: string } }) =>
      setMessages((current) =>
        current.map((item) =>
          item.id === event.data.id
            ? { ...item, deletedAt: event.data.deletedAt }
            : item,
        ),
      );
    const reaction = (event: { data: { id: string; reactions: Record<string, string[]> } }) =>
      setMessages((current) => current.map((item) => item.id === event.data.id ? { ...item, reactions: event.data.reactions } : item));
    const readReceipt = (event: { data: { reader: string; messages: Array<{ id: string; readAt: string }> } }) => {
      if (event.data?.reader !== selected) return;
      const readTimes = new Map(event.data.messages.map((item) => [item.id, item.readAt]));
      setMessages((current) => current.map((item) => readTimes.has(item.id) ? { ...item, readAt: readTimes.get(item.id) } : item));
    };
    const typingListener = (event: {
      data: { from: string; typing: boolean };
    }) => {
      if (event.data?.from !== selected) return;
      if (incomingTypingTimer.current) window.clearTimeout(incomingTypingTimer.current);
      setTyping(Boolean(event.data.typing));
      if (event.data.typing) {
        incomingTypingTimer.current = window.setTimeout(() => setTyping(false), 2500);
      }
    };
    const statusListener = (event: { data: { role: string; online: boolean; lastSeen?: string } }) => {
      const status = event.data;
      if (!status?.role || status.role === role) return;
      setOnline((current) => status.online ? [...new Set([...current, status.role])] : current.filter((value) => value !== status.role));
      if (status.lastSeen) setLastSeen((current) => ({ ...current, [status.role]: status.lastSeen || null }));
    };
    const loadConversation = async () => {
      try {
        const response = await fetch("/api/chat-files?mode=messages&with=" + encodeURIComponent(selected), { credentials: "include" });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Could not load messages.");
        setMessages(result.messages || []);
        void markConversationRead(selected);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Could not load messages.");
      }
    };
    void loadConversation();
    Promise.all([
      realtimeChannel.subscribe("chat", receive),
      realtimeChannel.subscribe("chat-edit", edit),
      realtimeChannel.subscribe("chat-delete", remove),
      realtimeChannel.subscribe("chat-reaction", reaction),
      realtimeChannel.subscribe("chat-read", readReceipt),
      realtimeChannel.subscribe("typing", typingListener),
      statusChannel.subscribe("role-status", statusListener),
    ]).catch(() => setError("Live updates are unavailable. Messages will refresh automatically."));
    const timer = window.setInterval(() => { void loadConversation(); }, 10000);
    return () => {
      window.clearInterval(timer);
      if (incomingTypingTimer.current) window.clearTimeout(incomingTypingTimer.current);
      setTyping(false);
      realtimeChannel.unsubscribe();
      statusChannel.unsubscribe("role-status", statusListener);
    };
  }, [role, selected]);
  useEffect(() => {
    fetch("/api/accounts?mode=chat-profiles", { credentials: "include" })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => setRecipientProfiles(Object.fromEntries((result?.profiles || []).map((profile: { role: string; name: string; photo: string }) => [profile.role, { name: profile.name || "", photo: profile.photo || "" }]))) )
      .catch(() => undefined);
  }, [role]);
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value && !attachment) return;
    if (outgoingTypingTimer.current) window.clearTimeout(outgoingTypingTimer.current);
    outgoingTypingTimer.current = null;
    channel().publish("typing", { from: role, typing: false }).catch(() => undefined);
    setUploading(Boolean(attachment));
    setError("");
    try {
      if (editingId) {
        const response = await fetch(
          "/api/chat-files?mode=messages&with=" + encodeURIComponent(selected),
          {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingId, text: value }),
          },
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        await channel().publish("chat-edit", result);
        setEditingId(null);
        setText("");
        return;
      }
      let uploaded: ChatMessage["attachment"];
      if (attachment) {
        const data = await attachmentData(attachment),
          response = await fetch("/api/chat-files", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: attachment.name,
              type: attachment.type.startsWith("image/")
                ? "image/jpeg"
                : attachment.type,
              data,
            }),
          }),
          result = await response.json();
        if (!response.ok) throw new Error(result.error);
        uploaded = result;
      }
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        from: role,
        to: selected,
        text: value,
        sentAt: new Date().toISOString(),
        attachment: uploaded,
      };
      const saved = await fetch(
        "/api/chat-files?mode=messages&with=" + encodeURIComponent(selected),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message),
        },
      );
      if (!saved.ok) throw new Error("Message could not be saved");
      await channel().publish("chat", message);
      setText("");
      setAttachment(null);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Message could not be sent",
      );
    } finally {
      setUploading(false);
    }
  };
  const deleteMessage = async (message: ChatMessage) => {
    const response = await fetch(
        "/api/chat-files?mode=messages&with=" + encodeURIComponent(selected),
        {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: message.id }),
        },
      ),
      result = await response.json();
    if (!response.ok) {
      setError(result.error);
      return;
    }
    await channel().publish("chat-delete", result);
    setMessages((current) =>
      current.map((item) =>
        item.id === message.id
          ? { ...item, deletedAt: result.deletedAt }
          : item,
      ),
    );
  };
  const reactToMessage = async (message: ChatMessage, emoji: string) => {
    const response = await fetch("/api/chat-files?mode=messages&with=" + encodeURIComponent(selected), { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: message.id, action: "reaction", emoji }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error); return; }
    setMessages((current) => current.map((item) => item.id === message.id ? { ...item, reactions: result.reactions } : item));
    await channel().publish("chat-reaction", result);
    setReactionFor(null);
  };
  const updateTyping = (value: string) => {
    setText(value);
    if (outgoingTypingTimer.current) window.clearTimeout(outgoingTypingTimer.current);
    channel().publish("typing", { from: role, typing: Boolean(value) }).catch(() => undefined);
    if (value) {
      outgoingTypingTimer.current = window.setTimeout(() => {
        channel().publish("typing", { from: role, typing: false }).catch(() => undefined);
      }, 1500);
    }
  };
  const stopTyping = () => {
    if (outgoingTypingTimer.current) window.clearTimeout(outgoingTypingTimer.current);
    outgoingTypingTimer.current = null;
    channel().publish("typing", { from: role, typing: false }).catch(() => undefined);
  };
  const recipientName =
    recipientProfiles[selected]?.name || recipients.find((item) => item.id === selected)?.label || selected;
  const recipientStatus = statusLabel(
    lastSeen[selected] || null,
    online.includes(selected),
  );
  const selectedLabel = `${recipientName} · ${recipientStatus.replace(/^Inactive · /, "")}`;
  return (
    <section className="messages-page flex flex-col h-full min-h-0 flex-1">
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-[var(--border)] shrink-0 ${
          mobileView === 'chat' ? 'hidden md:flex' : ''
        }`}
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Messages & Collaboration
          </h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            Secure, encrypted realtime direct chat and district team groups.
          </p>
        </div>
        <TabsList className="self-start sm:self-center">
          <TabTrigger
            active={view === 'people'}
            onClick={() => {
              setView('people');
              setMobileView('list');
            }}
          >
            <UserRound size={14} className="mr-1.5" />
            Direct Messages
          </TabTrigger>
          <TabTrigger
            active={view === 'groups'}
            onClick={() => {
              setView('groups');
              setMobileView('list');
            }}
          >
            <Users size={14} className="mr-1.5" />
            Team Groups
          </TabTrigger>
        </TabsList>
      </div>

      {view === 'people' && error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-sm font-medium shrink-0 mb-2" role="alert">
          {error}
        </div>
      )}

      {view === 'groups' ? (
        <GroupMessages onMobileViewChange={setMobileView} />
      ) : (
        <>
          {/* Mobile View Switcher */}
          <div className={`md:hidden flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-2 shrink-0 ${mobileView === 'chat' ? 'hidden' : ''}`}>
            <button
              type="button"
              onClick={() => setMobileView('list')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                mobileView === 'list'
                  ? 'bg-white dark:bg-slate-700 text-[var(--ink)] shadow-xs'
                  : 'text-[var(--muted-foreground)]'
              }`}
            >
              <UserRound size={13} />
              <span>People ({filteredRecipients.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileView('chat')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                mobileView === 'chat'
                  ? 'bg-white dark:bg-slate-700 text-[var(--ink)] shadow-xs'
                  : 'text-[var(--muted-foreground)]'
              }`}
            >
              <MessageCircle size={13} />
              <span className="truncate">Chat: {recipientName}</span>
            </button>
          </div>

          <Card className="chat-layout panel flex-1 min-h-0 h-full">
        <aside className={`chat-contacts ${mobileView === 'chat' ? 'mobile-pane-hidden' : ''}`}>
          <div className="chat-contacts-header">
            <h2>People</h2>
            <Badge variant="outline" className="text-[11px] font-semibold">
              {filteredRecipients.length}
            </Badge>
          </div>
          <div className="chat-search-wrap">
            <Search size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none" />
            <input
              type="text"
              className="chat-search-input"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search people"
            />
          </div>
          <div className="chat-contacts-list">
            {filteredRecipients.map((item) => {
              const isActive = online.includes(item.id);
              return (
                <button
                  key={item.id}
                  className={`chat-contact ${selected === item.id ? "active" : ""}`}
                  onClick={() => {
                    setSelected(item.id);
                    setMobileView('chat');
                  }}
                  type="button"
                >
                  <span className="chat-avatar-with-presence shrink-0">
                    <span className="chat-avatar">
                      {recipientProfiles[item.id]?.photo ? (
                        <img src={recipientProfiles[item.id].photo} alt="" />
                      ) : (
                        <UserRound size={19} />
                      )}
                    </span>
                    {isActive && (
                      <i className="chat-presence-dot" aria-label="Active now" />
                    )}
                  </span>
                  <div className="chat-contact-info min-w-0 flex-1">
                    <strong>{recipientProfiles[item.id]?.name || item.label}</strong>
                    {typing && item.id === selected ? (
                      <small className="online font-semibold flex items-center gap-1">
                        <span>typing</span>
                        <span className="typing-dots-animated"><span>.</span><span>.</span><span>.</span></span>
                      </small>
                    ) : (
                      <small className={isActive ? "online" : ""}>
                        {recipientProfiles[item.id]?.name &&
                        recipientProfiles[item.id]?.name !== item.label
                          ? `${item.label} · `
                          : ''}
                        {statusLabel(lastSeen[item.id] || null, isActive)}
                      </small>
                    )}
                  </div>
                  {unreadCounts[item.id] > 0 ? (
                    <span
                      className="chat-unread-count shrink-0"
                      aria-label={`${unreadCounts[item.id]} unread messages`}
                    >
                      {unreadCounts[item.id] > 99 ? '99+' : unreadCounts[item.id]}
                    </span>
                  ) : (
                    <span className="shrink-0 md:hidden ml-auto">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        selected === item.id
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        <span>{selected === item.id ? 'Open chat' : 'Chat'}</span>
                        <ChevronRight size={13} />
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
            {!filteredRecipients.length && (
              <div className="p-6 text-center text-xs text-[var(--muted-foreground)]">
                No people matching &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        </aside>

        <div className={`chat-window ${mobileView === 'list' ? 'mobile-pane-hidden' : ''}`}>
          <div className="chat-window-head">
            <div className="chat-window-head-left min-w-0 flex-1 overflow-hidden">
              <button
                type="button"
                className="md:hidden flex items-center gap-1 px-2.5 py-1.5 -ml-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg shrink-0 cursor-pointer transition-colors"
                onClick={() => setMobileView('list')}
                aria-label="Back to contacts list"
                title="Back to contacts"
              >
                <ChevronLeft size={16} />
                <span>People</span>
              </button>
              <span className="chat-avatar-with-presence shrink-0">
                <span className="chat-avatar">
                  {recipientProfiles[selected]?.photo ? (
                    <img src={recipientProfiles[selected].photo} alt="" />
                  ) : (
                    <UserRound size={20} />
                  )}
                </span>
                {online.includes(selected) && (
                  <i className="chat-presence-dot" aria-label="Active now" />
                )}
              </span>
              <div className="chat-window-head-info min-w-0 flex-1 overflow-hidden">
                <h2 className="truncate">{recipientName}</h2>
                {typing ? (
                  <p className="typing-header-status truncate">
                    <span>typing</span>
                    <span className="typing-dots-animated">
                      <span>.</span><span>.</span><span>.</span>
                    </span>
                  </p>
                ) : (
                  <p className={`truncate ${online.includes(selected) ? "online" : ""}`}>
                    {statusLabel(lastSeen[selected] || null, online.includes(selected))}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="chat-messages" ref={messagesContainerRef} aria-live="polite">
            {conversation.length ? (
              conversation.map((message, index) => {
                const isMine = message.from === role;
                const prev = index > 0 ? conversation[index - 1] : null;
                const showDivider =
                  index === 0 ||
                  new Date(message.sentAt).toDateString() !==
                    new Date(prev!.sentAt).toDateString();

                return (
                  <Fragment key={message.id}>
                    {showDivider && (
                      <div className="chat-date-divider" role="separator">
                        {messageDateLabel(message.sentAt)}
                      </div>
                    )}
                    <div className={`chat-message-row ${isMine ? "mine" : ""}`}>
                      <div className={`chat-bubble-group ${isMine ? "mine" : ""}`}>
                        {/* Hover action menu */}
                        <div className="message-hover-actions">
                          <button
                            type="button"
                            className="message-action-btn"
                            onClick={() =>
                              setReactionFor((current) =>
                                current === message.id ? null : message.id
                              )
                            }
                            title="React with emoji"
                            aria-label="React"
                          >
                            <Smile size={14} />
                          </button>
                          {isMine && (
                            <>
                              <button
                                type="button"
                                className="message-action-btn"
                                onClick={() => {
                                  setEditingId(message.id);
                                  setText(message.text);
                                }}
                                title="Edit message"
                                aria-label="Edit"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                className="message-action-btn delete"
                                onClick={() => void deleteMessage(message)}
                                title="Delete message"
                                aria-label="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Quick Reaction Picker Popup */}
                        {reactionFor === message.id && (
                          <div
                            className={`message-reaction-picker ${
                              isMine ? "right-0" : "left-0"
                            }`}
                          >
                            {quickReactions.map((emoji) => (
                              <button
                                type="button"
                                key={emoji}
                                onClick={() => void reactToMessage(message, emoji)}
                                title={emoji}
                              >
                                {emoji}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setReactionFor(null)}
                              className="message-action-btn"
                              style={{ width: 22, height: 22 }}
                              aria-label="Close reaction picker"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}

                        {/* WhatsApp Bubble */}
                        <div className={`chat-bubble ${isMine ? "mine" : ""}`}>
                          {message.deletedAt ? (
                            <span className="italic text-slate-500 text-xs flex items-center gap-1.5 py-0.5">
                              <Trash2 size={12} /> This message was deleted
                            </span>
                          ) : (
                            <>
                              {/* Attachment */}
                              {message.attachment && (
                                <div className="mb-1.5">
                                  {message.attachment.type.startsWith("image/") ? (
                                    <a
                                      href={message.attachment.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block overflow-hidden rounded-lg hover:opacity-95 transition-opacity"
                                    >
                                      <img
                                        src={message.attachment.url}
                                        alt={message.attachment.name}
                                        className="chat-attachment-img"
                                      />
                                    </a>
                                  ) : message.attachment.type.startsWith("audio/") ? (
                                    <audio
                                      className="chat-audio"
                                      controls
                                      preload="none"
                                      src={message.attachment.url}
                                      aria-label="Voice message"
                                    />
                                  ) : (
                                    <a
                                      className="chat-attachment"
                                      href={message.attachment.url}
                                      download={message.attachment.name}
                                    >
                                      <span className="flex items-center gap-2 truncate text-xs font-medium">
                                        <FileText
                                          size={16}
                                          className="shrink-0 text-emerald-600 dark:text-emerald-400"
                                        />
                                        <span className="truncate max-w-[190px]">
                                          {message.attachment.name}
                                        </span>
                                      </span>
                                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                                        <Download size={13} />
                                        Download
                                      </span>
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* Message Text */}
                              {message.text && (
                                <span className="chat-text-content">{message.text}</span>
                              )}

                              {/* Inline Float Timestamp and Read Receipts */}
                              <div className="chat-meta">
                                <time>
                                  {new Date(message.sentAt).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  {message.editedAt ? " · edited" : ""}
                                </time>
                                {isMine && (
                                  <span
                                    className={
                                      message.readAt
                                        ? "message-status read"
                                        : "message-status"
                                    }
                                    aria-label={message.readAt ? "Read" : "Sent"}
                                    title={message.readAt ? "Read" : "Sent"}
                                  >
                                    {message.readAt ? (
                                      <CheckCheck size={14} className="text-[#53bdeb]" />
                                    ) : (
                                      <Check size={14} />
                                    )}
                                  </span>
                                )}
                              </div>
                            </>
                          )}

                          {/* Reactions Row */}
                          {message.reactions &&
                            Object.keys(message.reactions).length > 0 && (
                              <div className="message-reactions">
                                {Object.entries(message.reactions).map(
                                  ([emoji, members]) => (
                                    <button
                                      type="button"
                                      key={emoji}
                                      onClick={() => void reactToMessage(message, emoji)}
                                      className={`message-reaction-pill ${
                                        members.includes(role) ? "mine" : ""
                                      }`}
                                      title={`Reacted by ${members.join(", ")}`}
                                    >
                                      <span>{emoji}</span>
                                      <span>{members.length}</span>
                                    </button>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </Fragment>
                );
              })
            ) : (
              <div className="chat-empty">
                <div className="chat-empty-card">
                  <div className="chat-empty-icon">
                    <MessageCircle size={28} />
                  </div>
                  <strong>No messages yet with {recipientName}</strong>
                  <span>Send a message to start this secure realtime conversation.</span>
                </div>
              </div>
            )}

            {typing && (
              <div className="chat-message-row typing-row">
                <div
                  className="chat-bubble typing-bubble"
                  role="status"
                  aria-label={`${recipientName} is typing`}
                >
                  <div className="typing-wave" aria-hidden="true">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                  <span className="typing-sender-name">{recipientName} is typing…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="chat-compose" onSubmit={send} noValidate>
            {(attachment || editingId) && (
              <div className="chat-compose-top">
                {editingId && (
                  <div className="attachment-chip border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200">
                    <Pencil size={12} className="text-amber-600" />
                    <span className="truncate max-w-[240px]">Editing message</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setText("");
                      }}
                      aria-label="Cancel edit"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
                {attachment && (
                  <div
                    className={`attachment-chip ${
                      attachment.type.startsWith("audio/") ? "voice-chip" : ""
                    }`}
                  >
                    {attachment.type.startsWith("audio/") ? (
                      <VoicePreview file={attachment} />
                    ) : (
                      <>
                        <Paperclip size={13} className="text-emerald-600" />
                        <span className="truncate max-w-[200px]">
                          {attachment.name}
                        </span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      aria-label="Remove attachment"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="chat-compose-main">
              <label
                className="attachment-button"
                title="Attach file or image"
                aria-label="Attach file or image"
              >
                <Paperclip size={18} />
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={(event) =>
                    setAttachment(event.target.files?.[0] || null)
                  }
                />
              </label>

              <VoiceRecordButton
                disabled={uploading || Boolean(editingId)}
                onRecorded={(file) => {
                  setAttachment(file);
                  setError("");
                }}
                onError={setError}
              />

              <div className="emoji-wrap">
                <button
                  type="button"
                  className="emoji-button"
                  onClick={() => setEmojiOpen((value) => !value)}
                  title="Add emoji"
                  aria-label="Add emoji"
                >
                  <Smile size={18} />
                </button>
                {emojiOpen && (
                  <div className="emoji-picker-surface">
                    <Suspense
                      fallback={
                        <div className="p-4 bg-white dark:bg-slate-800 text-xs">
                          Loading emoji…
                        </div>
                      }
                    >
                      <EmojiPicker
                        width={320}
                        height={380}
                        searchPlaceholder="Search emoji"
                        onEmojiClick={(emojiData) => {
                          setText((value) => value + emojiData.emoji);
                          setEmojiOpen(false);
                        }}
                      />
                    </Suspense>
                  </div>
                )}
              </div>

              <input
                type="text"
                className="chat-input-pill"
                value={text}
                onChange={(event) => updateTyping(event.target.value)}
                onBlur={stopTyping}
                placeholder={
                  editingId
                    ? "Edit message..."
                    : `Message ${recipientName}...`
                }
                maxLength={4000}
              />

              <button
                type="submit"
                className="chat-send-btn"
                disabled={uploading || (!text.trim() && !attachment)}
                aria-label={uploading ? "Sending message" : "Send message"}
                title="Send"
              >
                {uploading ? (
                  <span className="animate-spin text-sm">⟳</span>
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </form>
        </div>
      </Card>
      </>
      )}
    </section>
  );
}
