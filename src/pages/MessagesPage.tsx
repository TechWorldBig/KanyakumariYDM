import {
  Download,
  FileText,
  MessageCircle,
  Paperclip,
  Pencil,
  Send,
  Smile,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Fragment, lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { UserRole } from "../types";
import { conversationChannelName, getAblyClient } from "../services/ably";

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
  if (!lastSeen) return "Not active recently";
  const minutes = Math.max(
    1,
    Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000),
  );
  if (minutes < 2) return "Active this minute";
  if (minutes < 60) return `Active ${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return `Active ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return `Active ${days} ${days === 1 ? "day" : "days"} ago`;
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
    [reactionFor, setReactionFor] = useState<string | null>(null);
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
  const channel = () =>
    getAblyClient(selected).channels.get(
      conversationChannelName(role, selected),
    );
  useEffect(() => {
    const load = () =>
      Promise.all(
        recipients
          .filter((item) => item.id !== role)
          .map(async (item) => {
            const response = await fetch(
                "/api/chat-files?mode=status&with=" +
                  encodeURIComponent(item.id),
                { credentials: "include" },
              ),
              result = await response.json();
            setLastSeen((current) => ({
              ...current,
              [item.id]: result.lastSeen || null,
            }));
            setOnline((current) =>
              result.online
                ? [...new Set([...current, item.id])]
                : current.filter((value) => value !== item.id),
            );
          }),
      ).catch(() => undefined);
    void load();
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, [role]);
  const loadUnreadCounts = () =>
    fetch('/api/chat-files?mode=unread', { credentials: 'include' })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => setUnreadCounts(Object.fromEntries((result?.unread || []).map((item: { role: string; count: number }) => [item.role, item.count]))))
      .catch(() => undefined);
  const markConversationRead = (partner: UserRole) =>
    fetch('/api/chat-files?mode=messages&with=' + encodeURIComponent(partner), { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark-read' }) })
      .then((response) => response.ok && setUnreadCounts((current) => ({ ...current, [partner]: 0 })))
      .catch(() => undefined);
  useEffect(() => {
    void loadUnreadCounts();
    const timer = window.setInterval(() => void loadUnreadCounts(), 10000);
    return () => window.clearInterval(timer);
  }, [role]);
  useEffect(() => {
    const activeChannel = channel(),
      realtimeChannel = activeChannel as any;
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
    const typingListener = (event: {
      data: { from: string; typing: boolean };
    }) => {
      if (event.data?.from === selected) setTyping(event.data.typing);
    };
    const presence = () =>
      activeChannel.presence
        .get()
        .then((members) => {
          const recipientIsPresent = members.some(
            (member) =>
              (member.data || member.clientId.split(":").pop() || "") === selected,
          );
          setOnline((current) =>
            recipientIsPresent
              ? [...new Set([...current, selected])]
              : current.filter((value) => value !== selected),
          );
        })
        .catch(() => undefined);
    const presenceListener = () => void presence();
    Promise.all([
      realtimeChannel.subscribe("chat", receive),
      realtimeChannel.subscribe("chat-edit", edit),
      realtimeChannel.subscribe("chat-delete", remove),
      realtimeChannel.subscribe("chat-reaction", reaction),
      realtimeChannel.subscribe("typing", typingListener),
    ])
      .then(() =>
        fetch(
          "/api/chat-files?mode=messages&with=" + encodeURIComponent(selected),
          { credentials: "include" },
        ),
      )
      .then((response) => response.json())
      .then((result) => {
        setMessages(result.messages || []);
        void markConversationRead(selected);
        return activeChannel.presence.enter(role);
      })
      .then(presence)
      .catch(() =>
        setError(
          "Realtime messaging is unavailable. Check the Ably configuration.",
        ),
      );
    realtimeChannel.presence.subscribe(presenceListener);
    const timer = window.setInterval(presence, 15000);
    return () => {
      window.clearInterval(timer);
      realtimeChannel.presence.unsubscribe(presenceListener);
      realtimeChannel.unsubscribe();
      activeChannel.presence.leave().catch(() => undefined);
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
    channel()
      .publish("typing", { from: role, typing: Boolean(value) })
      .catch(() => undefined);
  };
  const recipientName =
    recipientProfiles[selected]?.name || recipients.find((item) => item.id === selected)?.label || selected;
  const recipientStatus = statusLabel(
    lastSeen[selected] || null,
    online.includes(selected),
  );
  const selectedLabel = `${recipientName} · ${recipientStatus}`;
  return (
    <section className="messages-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Realtime communication</span>
          <h1>Messages</h1>
          <p className="muted">Private conversations with permanent history.</p>
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="chat-layout panel">
        <aside className="chat-contacts">
          <h2>People</h2>
          {recipients
            .filter((item) => item.id !== role)
            .map((item) => (
              <button
                key={item.id}
                className={
                  selected === item.id ? "chat-contact active" : "chat-contact"
                }
                onClick={() => setSelected(item.id)}
              >
                <span className="chat-avatar chat-avatar-with-presence">
                  {recipientProfiles[item.id]?.photo ? <img src={recipientProfiles[item.id].photo} alt="" /> : <UserRound size={16} />}
                  {online.includes(item.id) && (
                    <i className="chat-presence-dot" aria-label="Active now" />
                  )}
                </span>
                <span>
                  <strong>{recipientProfiles[item.id]?.name || item.label}</strong>
                  <small className={online.includes(item.id) ? "online" : ""}>
                    {online.includes(item.id)
                      ? "Online now"
                      : "Offline · messages saved"}
                  </small>
                </span>
                {unreadCounts[item.id] > 0 && <b className="chat-unread-count" aria-label={`${unreadCounts[item.id]} unread messages`}>{unreadCounts[item.id] > 99 ? '99+' : unreadCounts[item.id]}</b>}
              </button>
            ))}
        </aside>
        <div className="chat-window">
          <div className="chat-window-head">
            <span className="chat-avatar chat-avatar-with-presence">
              {recipientProfiles[selected]?.photo ? <img src={recipientProfiles[selected].photo} alt="" /> : <MessageCircle size={17} />}
              {online.includes(selected) && (
                <i className="chat-presence-dot" aria-label="Active now" />
              )}
            </span>
            <div>
              <h2>{selectedLabel}</h2>
            </div>
          </div>
          <div className="chat-messages">
            {conversation.length ? (
              conversation.map((message, index) => <Fragment key={message.id}>
                {(index === 0 || new Date(message.sentAt).toDateString() !== new Date(conversation[index - 1].sentAt).toDateString()) && <div className="chat-date-divider" role="separator">{messageDateLabel(message.sentAt)}</div>}
                <div
                  className={
                    message.from === role ? "chat-bubble mine" : "chat-bubble"
                  }
                  key={message.id}
                >
                  <span>
                    {message.text}
                    {message.attachment && (
                      <a
                        className="chat-attachment"
                        href={message.attachment.url}
                        download={message.attachment.name}
                      >
                        <span>
                          {message.attachment.type.startsWith("image/") ? (
                            <img
                              src={message.attachment.url}
                              alt={message.attachment.name}
                            />
                          ) : (
                            <>
                              <FileText size={15} />
                              {message.attachment.name}
                            </>
                          )}
                        </span>
                        <small>
                          <Download size={12} />
                          Download
                        </small>
                      </a>
                    )}
                  </span>
                  {reactionFor === message.id && <div className="message-reaction-picker">{quickReactions.map((emoji) => <button type="button" key={emoji} onClick={() => void reactToMessage(message, emoji)}>{emoji}</button>)}</div>}
                  {message.reactions && Object.keys(message.reactions).length > 0 && <div className="message-reactions">{Object.entries(message.reactions).map(([emoji,members]) => <button type="button" key={emoji} onClick={() => reactToMessage(message,emoji)} className={members.includes(role)?"mine":""}>{emoji} {members.length}</button>)}</div>}
                  <div className="chat-meta">
                    <time>
                      {new Date(message.sentAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {message.editedAt ? " · edited" : ""}
                    </time>
                    <button className="message-react-button" onClick={() => setReactionFor((current) => current === message.id ? null : message.id)} aria-label="React to message"><Smile size={12}/></button>
                    {message.from === role && (
                      <span className="message-actions">
                        <button
                          onClick={() => {
                            setEditingId(message.id);
                            setText(message.text);
                          }}
                          aria-label="Edit message"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => deleteMessage(message)}
                          aria-label="Delete message"
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </Fragment>)
            ) : (
              <div className="chat-empty">
                <MessageCircle size={28} />
                <strong>Start a conversation</strong>
                <span>Messages are saved securely.</span>
              </div>
            )}
            {typing && (
              <small className="typing-indicator">
                {selectedLabel} is typing…
              </small>
            )}
          </div>
          <form className="chat-compose" onSubmit={send} noValidate>
            {attachment && (
              <div className="attachment-chip">
                <Paperclip size={13} />
                {attachment.name}
                <button type="button" onClick={() => setAttachment(null)}>
                  <X size={13} />
                </button>
              </div>
            )}
            <label className="attachment-button">
              <Paperclip size={17} />
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(event) =>
                  setAttachment(event.target.files?.[0] || null)
                }
              />
            </label>
            <div className="emoji-wrap">
              <button
                type="button"
                className="emoji-button"
                onClick={() => setEmojiOpen((value) => !value)}
              >
                <Smile size={17} />
              </button>
              {emojiOpen && (
                <div className="emoji-picker-surface">
                  <Suspense fallback={<div className="emoji-picker-loading">Loading emoji…</div>}><EmojiPicker width={320} height={390} searchPlaceholder="Search emoji" onEmojiClick={(emojiData) => { setText((value) => value + emojiData.emoji); setEmojiOpen(false); }} /></Suspense>
                </div>
              )}
            </div>
            <input
              value={text}
              onChange={(event) => updateTyping(event.target.value)}
              placeholder={
                editingId ? "Edit message" : `Message ${selectedLabel}`
              }
            />
            {editingId && (
              <button
                type="button"
                className="cancel-edit"
                onClick={() => {
                  setEditingId(null);
                  setText("");
                }}
              >
                <X size={15} />
              </button>
            )}
            <button className="primary" disabled={uploading}>
              {uploading ? "…" : <Send size={16} />}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
