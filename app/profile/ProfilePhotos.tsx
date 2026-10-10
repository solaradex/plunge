"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Photo = {
  id: string;
  storage_path: string;
  sort_order: number;
  is_primary: boolean;
  moderation_status: "pending" | "approved" | "rejected";
  photo_url?: string | null;
};

export default function ProfilePhotos({ initial, userId }: { initial: Photo[]; userId: string }) {
  const [photos, setPhotos] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMsg("Use JPG, PNG, or WebP.");
      input.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMsg("Maximum photo size is 10 MB.");
      input.value = "";
      return;
    }

    setBusy(true);
    setMsg("");
    try {
      const sb = createClient();
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${extension}`;
      const uploaded = await sb.storage.from("plunge-profiles").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

      if (uploaded.error) {
        setMsg("The photo couldn’t be uploaded. Check your connection and try again.");
        return;
      }

      const inserted = await sb.from("profile_photos")
        .insert({
          user_id: userId,
          storage_path: path,
          sort_order: photos.length,
          is_primary: photos.length === 0,
        })
        .select("id,storage_path,sort_order,is_primary,moderation_status")
        .single();

      if (inserted.error) {
        const cleanup = await sb.storage.from("plunge-profiles").remove([path]);
        setMsg(cleanup.error
          ? "The photo record could not be saved and the uploaded file needs cleanup. Please contact support."
          : "The photo record couldn’t be saved. Please try again.");
        return;
      }

      setPhotos(current => [...current, inserted.data as Photo]);
      setMsg("Photo uploaded. It stays hidden from discovery until approved.");
    } catch {
      setMsg("The photo upload couldn’t finish. Check your connection and try again.");
    } finally {
      setBusy(false);
      input.value = "";
    }
  }

  async function removePhoto(photo: Photo) {
    if (busy || !confirm("Remove this photo from your profile?")) return;
    setBusy(true);
    setMsg("");
    try {
      const sb = createClient();
      const deleted = await sb.from("profile_photos")
        .delete()
        .eq("id", photo.id)
        .eq("user_id", userId);

      if (deleted.error) {
        setMsg("This photo couldn’t be removed. Please try again.");
        return;
      }

      setPhotos(current => current.filter(item => item.id !== photo.id));
      const removed = await sb.storage.from("plunge-profiles").remove([photo.storage_path]);
      setMsg(removed.error
        ? "Photo removed from your profile, but its stored file could not be deleted. Please retry or contact support."
        : "Photo removed.");
    } catch {
      setMsg("The photo change couldn’t finish. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="photo-manager">
      <div className="photo-heading">
        <h2>Profile photos</h2>
        <label className="upload-button">
          {busy ? "Working…" : "Add photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={busy} />
        </label>
      </div>
      <p className="photo-note">Photos are reviewed before appearing publicly. JPG, PNG, or WebP · 10 MB max.</p>
      {msg && <div className="success-box" role="status">{msg}</div>}
      <div className="photo-grid">
        {photos.map(photo => (
          <div className="photo-tile" key={photo.id}>
            {photo.moderation_status === "approved" && photo.photo_url ? (
              <img src={photo.photo_url} alt="Approved profile photo" />
            ) : (
              <div className="photo-pending" aria-label={`Photo ${photo.moderation_status}`}>
                <span>{photo.moderation_status === "pending" ? "Under review" : photo.moderation_status === "rejected" ? "Not approved" : "Preview unavailable"}</span>
              </div>
            )}
            <button onClick={() => removePhoto(photo)} disabled={busy}>Remove</button>
          </div>
        ))}
      </div>
      {!photos.length && <div className="photo-empty">Add your first photo to complete your profile.</div>}
    </div>
  );
}
