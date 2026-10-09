"use client";

import {useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Photo={id:string;user_id:string;storage_path:string;created_at:string;photo_url:string|null};

export default function PhotoModerationQueue({initial}:{initial:Photo[]}){
 const [rows,setRows]=useState(initial),[busy,setBusy]=useState<string|null>(null),[msg,setMsg]=useState("");
 async function act(id:string,status:string){
  setBusy(id);
  const {error}=await createClient().rpc("admin_set_photo_status",{photo_id:id,new_status:status});
  if(error)setMsg(error.message);else setRows(x=>x.filter(p=>p.id!==id));
  setBusy(null);
 }
 return <div className="admin-list">
  {msg&&<div className="form-success">{msg}</div>}
  {rows.length?rows.map(p=><article className="admin-report" key={p.id}>
   <div>
    {p.photo_url?<img className="admin-photo-preview" src={p.photo_url} alt="Profile photo pending moderation"/>:<div className="admin-photo-preview">Photo preview unavailable</div>}
    <small>Uploaded {new Date(p.created_at).toLocaleString()}</small>
   </div>
   <div className="admin-actions">
    <button disabled={busy===p.id} onClick={()=>act(p.id,"approved")}>Approve</button>
    <button disabled={busy===p.id} onClick={()=>act(p.id,"rejected")}>Reject</button>
   </div>
  </article>):<div className="empty-discovery"><div className="empty-icon">✓</div><h2>Photo queue clear.</h2><p>No profile photos are waiting for review.</p></div>}
 </div>;
}
