"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Msg = {
  id: string;
  sender_id: string;
  message_type: string;
  body: string | null;
  created_at: string;
};

export default function ChatRoom({
  conversationId, userId, otherUserId, initialMessages,
}: {
  conversationId: string;
  userId: string;
  otherUserId: string;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState("");
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("harassment");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const sb = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    void sb.rpc("mark_conversation_read", { cid: conversationId });
    const channel = sb.channel("messages:" + conversationId)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: "conversation_id=eq." + conversationId,
      }, (payload) => {
        const incoming = payload.new as Msg;
        setMessages((current) =>
          current.some((message) => message.id === incoming.id)
            ? current
            : [...current, incoming].sort(
                (a, b) => a.created_at.localeCompare(b.created_at),
              ),
        );
      })
      .subscribe();
    return () => { void sb.removeChannel(channel); };
  }, [conversationId, sb]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    async function loadImageAttachments() {
      const missing = messages.filter(
        (message) => message.message_type === "image" && !imageUrls[message.id],
      );
      for (const message of missing) {
        // The message row and attachment row are written separately. Retry briefly
        // so realtime delivery of the message cannot permanently hide its image.
        for (let attempt = 0; attempt < 4 && !cancelled; attempt++) {
          const { data: attachment } = await sb
            .from("message_attachments")
            .select("storage_path")
            .eq("message_id", message.id)
            .maybeSingle();
          if (attachment?.storage_path) {
            const { data: signed } = await sb.storage
              .from("plunge-messages")
              .createSignedUrl(attachment.storage_path, 3600);
            if (signed && !cancelled) {
              setImageUrls((current) => ({ ...current, [message.id]: signed.signedUrl }));
            }
            break;
          }
          if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 350));
        }
      }
    }
    void loadImageAttachments();
    return () => { cancelled = true; };
  }, [messages, imageUrls, sb]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text || sending || uploading) return;
    setSending(true);
    setError("");
    setBody("");
    try {
      const { error: sendError } = await sb.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userId,
        message_type: "text",
        body: text,
      });
      if (sendError) {
        setBody(text);
        setError("Message could not be sent. The conversation may no longer be available.");
      }
    } catch {
      setBody(text);
      setError("Message could not be sent. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  async function sendImage(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    input.value = "";
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Use JPG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("Maximum image size is 25 MB.");
      return;
    }

    setUploading(true);
    setError("");
    let uploadedPath: string | null = null;
    let messageId: string | null = null;
    let attachmentSaved = false;
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      uploadedPath = conversationId + "/" + userId + "/" + crypto.randomUUID() + "-" + safeName;
      const upload = await sb.storage.from("plunge-messages").upload(uploadedPath, file, {
        contentType: file.type, upsert: false,
      });
      if (upload.error) {
        uploadedPath = null;
        setError("Image upload failed. Check your connection and try again.");
        return;
      }

      const inserted = await sb.from("messages").insert({
        conversation_id: conversationId, sender_id: userId, message_type: "image",
      }).select("id").single();
      if (inserted.error) {
        await sb.storage.from("plunge-messages").remove([uploadedPath]);
        uploadedPath = null;
        setError("Image could not be sent. The conversation may no longer be available.");
        return;
      }
      messageId = inserted.data.id;

      const attachment = await sb.from("message_attachments").insert({
        message_id: messageId, storage_path: uploadedPath,
        mime_type: file.type, file_size_bytes: file.size,
      });
      if (attachment.error) {
        await sb.from("messages").delete().eq("id", messageId);
        await sb.storage.from("plunge-messages").remove([uploadedPath]);
        messageId = null;
        uploadedPath = null;
        setError("Image attachment could not be saved. Please try again.");
        return;
      }
      attachmentSaved = true;
      const { data: signed } = await sb.storage.from("plunge-messages").createSignedUrl(uploadedPath, 3600);
      if (signed) setImageUrls((current) => ({ ...current, [messageId as string]: signed.signedUrl }));
    } catch {
      if (!attachmentSaved) {
        if (messageId) await sb.from("messages").delete().eq("id", messageId);
        if (uploadedPath) await sb.storage.from("plunge-messages").remove([uploadedPath]);
        setError("Image could not be sent. Check your connection and try again.");
      } else {
        setError("Your image may have been sent, but its preview couldn’t load. Check the conversation before retrying.");
      }
    } finally {
      setUploading(false);
    }
  }

  async function report() {
    if (reporting || reported) return;
    setReporting(true);
    setError("");
    const { error: reportError } = await sb.rpc("report_conversation_user", {
      cid: conversationId,
      target_user_id: otherUserId,
      report_reason: reportReason,
      report_details: reportDetails.trim() || null,
    });
    if (reportError) setError("Report could not be submitted. Please try again.");
    else { setReported(true); setReportOpen(false); }
    setReporting(false);
  }

  async function block() {
    if (blocking) return;
    setBlocking(true);
    setError("");
    const { error: blockError } = await sb.rpc("block_user", { target_user_id: otherUserId });
    if (blockError) {
      setError("Block could not be completed. Please try again.");
      setBlocking(false);
    } else {
      router.push("/matches");
    }
  }

  return (
    <section className="chat-shell">
      <div className="chat-heading">
        <div><span className="eyebrow">PRIVATE CHAT</span><h1>Conversation</h1></div>
        <div className="chat-safety">
          <button onClick={() => setReportOpen((value) => !value)}>Report</button>
          <button onClick={block} disabled={blocking}>{blocking ? "Blocking…" : "Block"}</button>
        </div>
      </div>
      {reportOpen && <div className="report-panel">
        <select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
          <option value="harassment">Harassment</option><option value="spam">Spam</option>
          <option value="scam">Scam</option><option value="fake_profile">Fake profile</option>
          <option value="inappropriate_image">Inappropriate image</option><option value="threat">Threat</option>
          <option value="underage_concern">Underage concern</option><option value="other">Other</option>
        </select>
        <label className="report-details-label">Details (optional)<textarea value={reportDetails} maxLength={2000} onChange={(event) => setReportDetails(event.target.value)} placeholder="Tell us what happened (up to 2,000 characters)." /></label><button onClick={report} disabled={reporting || reported}>{reported ? "Reported" : reporting ? "Submitting…" : "Submit report"}</button>
      </div>}
      <div className="messages">
        {messages.map((message) => <div
          className={"message " + (message.sender_id === userId ? "mine" : "theirs")}
          key={message.id}
        >
          {message.message_type === "image"
            ? imageUrls[message.id]
              ? <img className="chat-image" src={imageUrls[message.id]} alt="Image shared in chat" />
              : <span>Loading image…</span>
            : message.body}
        </div>)}
        <div ref={bottom} />
        {!messages.length && <p className="chat-empty">Say hello. 👋</p>}
      </div>
      {error && <div className="error-box" role="alert">{error}</div>}
      <form className="chat-composer" onSubmit={send}>
        <label className="attach-button" aria-label="Attach an image">
          {uploading ? "…" : "＋"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={sendImage} disabled={uploading || sending} />
        </label>
        <input value={body} onChange={(event) => setBody(event.target.value)}
          placeholder="Write a message…" maxLength={4000} />
        <button className="primary-button" disabled={sending || uploading || !body.trim()}>
          {sending ? "…" : "Send"}
        </button>
      </form>
    </section>
  );
}
