import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  ArrowUpRight,
  ChevronDown,
  Clock3,
  FileText,
  Inbox,
  Mail,
  MessageCircleReply,
  Paperclip,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const statusLabels = {
  all: "All messages",
  new: "New",
  read: "Read",
  replied: "Replied",
} as const;

type Status = keyof typeof statusLabels;
type Inquiry = {
  id: number;
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "replied";
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
  attachmentSize: number | null;
  replyMessage: string | null;
  repliedAt: Date | null;
  createdAt: Date;
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "";
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function AdminInbox() {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "name" | "status">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 260);
    return () => window.clearTimeout(timer);
  }, [search]);

  const queryInput = useMemo(() => ({
    search: debouncedSearch || undefined,
    status,
    sortBy,
    sortDir,
  }), [debouncedSearch, status, sortBy, sortDir]);

  const inquiriesQuery = trpc.contact.list.useQuery(queryInput, {
    enabled: user?.role === "admin",
  });
  const updateInquiry = trpc.contact.update.useMutation({
    onSuccess: async () => {
      setNotice("Inquiry updated");
      await inquiriesQuery.refetch();
    },
    onError: () => setNotice("Could not update this inquiry"),
  });

  const inquiries = inquiriesQuery.data ?? [];
  const selected = inquiries.find((item) => item.id === selectedId) ?? inquiries[0];
  const newCount = inquiries.filter((item) => item.status === "new").length;
  const repliedCount = inquiries.filter((item) => item.status === "replied").length;

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
  }, [selected, selectedId]);

  useEffect(() => {
    setReplyMessage(selected?.replyMessage ?? "");
    setNotice("");
  }, [selected?.id, selected?.replyMessage]);

  if (loading) {
    return <div className="admin-loading"><Sparkles size={18} className="admin-spin" /> Loading your inbox…</div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-empty-state">
        <div className="admin-empty-icon"><Inbox size={22} /></div>
        <p className="admin-eyebrow">Restricted area</p>
        <h1>Admin access required.</h1>
        <p>Your account does not have permission to view contact submissions.</p>
      </div>
    );
  }

  const updateStatus = (nextStatus: Exclude<Status, "all">) => {
    if (!selected) return;
    updateInquiry.mutate({ id: selected.id, status: nextStatus });
  };

  const saveReply = () => {
    if (!selected) return;
    updateInquiry.mutate({
      id: selected.id,
      status: replyMessage.trim() ? "replied" : "read",
      replyMessage,
    });
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Auralis / Operations</p>
          <h1>Inbox <span>({inquiries.length})</span></h1>
          <p className="admin-subtitle">Keep every thoughtful note moving forward.</p>
        </div>
        <div className="admin-header-stats">
          <div><strong>{newCount}</strong><span>New in view</span></div>
          <div><strong>{repliedCount}</strong><span>Replied in view</span></div>
        </div>
      </header>

      <section className="inbox-toolbar" aria-label="Filter and sort inquiries">
        <label className="inbox-search"><Search size={16} /><span className="sr-only">Search inquiries</span><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or message" /></label>
        <div className="inbox-toolbar-controls">
          <label className="admin-select"><SlidersHorizontal size={15} /><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value as Status)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={14} /></label>
          <label className="admin-select"><span className="sr-only">Sort inquiries by</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}><option value="createdAt">Newest first</option><option value="name">Name</option><option value="status">Status</option></select><ChevronDown size={14} /></label>
          <button className="sort-direction" type="button" onClick={() => setSortDir((direction) => direction === "desc" ? "asc" : "desc")} aria-label={`Sort ${sortDir === "desc" ? "ascending" : "descending"}`}>
            <ArrowUpRight size={15} className={sortDir === "asc" ? "sort-asc" : ""} />
          </button>
        </div>
      </section>

      <div className="inbox-layout">
        <section className="inbox-list" aria-label="Inquiry list">
          {inquiriesQuery.isLoading ? <div className="admin-list-state"><Sparkles size={17} className="admin-spin" /> Finding messages…</div> : inquiries.length === 0 ? <div className="admin-list-state"><Inbox size={20} /><p>No inquiries match those filters.</p></div> : inquiries.map((inquiry) => (
            <button key={inquiry.id} className={`inquiry-row ${selected?.id === inquiry.id ? "is-selected" : ""} ${inquiry.status === "new" ? "is-new" : ""}`} type="button" onClick={() => setSelectedId(inquiry.id)}>
              <span className="inquiry-avatar">{inquiry.name.slice(0, 1).toUpperCase()}</span>
              <span className="inquiry-row-main"><span className="inquiry-row-top"><strong>{inquiry.name}</strong><time>{formatDate(inquiry.createdAt)}</time></span><span className="inquiry-row-email">{inquiry.email}</span><span className="inquiry-row-preview">{inquiry.message}</span></span>
              <span className={`status-pill status-${inquiry.status}`}>{inquiry.status}</span>
            </button>
          ))}
        </section>

        <section className="inquiry-detail" aria-label="Selected inquiry">
          {!selected ? <div className="admin-detail-empty"><Mail size={24} /><p>Select an inquiry to read it.</p></div> : <>
            <div className="detail-header"><div className="detail-person"><span className="detail-avatar">{selected.name.slice(0, 1).toUpperCase()}</span><div><h2>{selected.name}</h2><a href={`mailto:${selected.email}`}>{selected.email}</a></div></div><div className="detail-actions"><button type="button" className="detail-icon-button" onClick={() => updateStatus("read")} title="Mark as read"><Clock3 size={16} /></button><a className="detail-icon-button" href={`mailto:${selected.email}`} title="Open email"><Mail size={16} /></a></div></div>
            <div className="detail-meta"><span className={`status-pill status-${selected.status}`}>{selected.status}</span><span>{formatDate(selected.createdAt)}</span>{selected.attachmentName && <span><Paperclip size={13} /> Attachment</span>}</div>
            <div className="detail-message"><p>{selected.message}</p></div>
            {selected.attachmentName && selected.attachmentUrl && <a className="attachment-card" href={selected.attachmentUrl} target="_blank" rel="noreferrer"><span className="attachment-icon"><FileText size={18} /></span><span><strong>{selected.attachmentName}</strong><small>{selected.attachmentType} · {formatFileSize(selected.attachmentSize)}</small></span><ArrowUpRight size={15} /></a>}
            {selected.replyMessage && <div className="previous-reply"><div><MessageCircleReply size={15} /><span>Saved response · {selected.repliedAt ? formatDate(selected.repliedAt) : "recently"}</span></div><p>{selected.replyMessage}</p></div>}
            <div className="reply-composer"><label htmlFor="reply-message">Write a response</label><Textarea id="reply-message" value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} placeholder="Draft a thoughtful reply for this listener…" rows={5} /><div className="reply-actions"><span>Saved replies are recorded on the inquiry.</span><Button type="button" onClick={saveReply} disabled={updateInquiry.isPending || !replyMessage.trim()}><Send size={15} />{updateInquiry.isPending ? "Saving…" : "Save response"}</Button></div>{notice && <p className="admin-notice" role="status">{notice}</p>}</div>
          </>}
        </section>
      </div>
      <div className="admin-footer-note"><UserRound size={14} /> Signed in as {user.name || user.email || "Auralis admin"}</div>
    </div>
  );
}
