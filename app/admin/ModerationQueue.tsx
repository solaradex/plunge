"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
type Report={id:string;reason:string;details:string|null;status:string;created_at:string;reported_user_id:string};
export default function ModerationQueue({initial}:{initial:Report[]}){
 const [rows,setRows]=useState(initial),[busy,setBusy]=useState<string|null>(null),[msg,setMsg]=useState("");
 async function act(id:string,status:string){setBusy(id);const {error}=await createClient().rpc("admin_set_report_status",{report_id:id,new_status:status});if(error)setMsg(error.message);else setRows(x=>x.filter(r=>r.id!==id));setBusy(null)}
 async function user(id:string,status:string){if(!confirm("Set this account to "+status+"?"))return;setBusy(id);const {error}=await createClient().rpc("admin_set_user_status",{target_user_id:id,new_status:status});setMsg(error?error.message:"Account marked "+status+".");setBusy(null)}
 return <div className="admin-list">{msg&&<div className="form-success">{msg}</div>}{rows.length?rows.map(r=><article className="admin-report" key={r.id}><div><strong>{r.reason.replaceAll("_"," ")}</strong><p>{r.details||"No additional details."}</p><small>{new Date(r.created_at).toLocaleString()}</small></div><div className="admin-actions"><button disabled={busy===r.id} onClick={()=>act(r.id,"resolved")}>Resolve</button><button disabled={busy===r.id} onClick={()=>act(r.id,"dismissed")}>Dismiss</button><button disabled={busy===r.id} onClick={()=>user(r.reported_user_id,"paused")}>Pause account</button><button disabled={busy===r.id} onClick={()=>user(r.reported_user_id,"banned")}>Ban account</button></div></article>):<div className="empty-discovery"><div className="empty-icon">✓</div><h2>Queue clear.</h2><p>No open reports need review.</p></div>}</div>;
}