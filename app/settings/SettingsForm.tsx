"use client";
import {FormEvent,useState} from "react";
import {createClient} from "@/lib/supabase/client";

const genders=[["man","Men"],["woman","Women"],["nonbinary","Nonbinary"]] as const;
const types=["dating","friendship","chat","activities"];
export default function SettingsForm({initialProfile,initialPref}:{initialProfile:any;initialPref:any}){
 const [p,setP]=useState(initialProfile),[pref,setPref]=useState(initialPref??{}),[saving,setSaving]=useState(false),[msg,setMsg]=useState("");
 const toggle=(key:string,v:string)=>setPref((x:any)=>({...x,[key]:(x[key]??[]).includes(v)?x[key].filter((z:string)=>z!==v):[...(x[key]??[]),v]}));
 async function save(e:FormEvent){e.preventDefault();setSaving(true);setMsg("");const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user)return;
  const a=await s.from("profiles").update({username:p.username.trim().toLowerCase(),display_name:p.display_name.trim(),bio:p.bio.trim()||null,city:p.city.trim(),state:p.state.trim().toUpperCase()}).eq("id",user.id);
  const b=await s.from("preferences").upsert({user_id:user.id,interested_genders:pref.interested_genders??[],min_age:Math.max(18,Number(pref.min_age)),max_age:Math.max(18,Number(pref.max_age)),max_distance_miles:Math.min(500,Math.max(1,Number(pref.max_distance_miles))),connection_types:pref.connection_types??[]});
  setSaving(false);setMsg(a.error?.message||b.error?.message||"Saved. Your discovery preferences are updated.");
 }
 return <form onSubmit={save}>
  <div className="form-grid"><label>Username<input value={p.username??""} onChange={e=>setP({...p,username:e.target.value})}/></label><label>Display name<input value={p.display_name??""} onChange={e=>setP({...p,display_name:e.target.value})}/></label><label>City<input value={p.city??""} onChange={e=>setP({...p,city:e.target.value})}/></label><label>State<input value={p.state??"FL"} maxLength={2} onChange={e=>setP({...p,state:e.target.value})}/></label></div>
  <label>Bio<textarea maxLength={500} value={p.bio??""} onChange={e=>setP({...p,bio:e.target.value})}/></label>
  <fieldset><legend>Interested in</legend><div className="chips">{genders.map(([v,l])=><button type="button" key={v} className={`chip ${(pref.interested_genders??[]).includes(v)?"selected":""}`} onClick={()=>toggle("interested_genders",v)}>{l}</button>)}</div></fieldset>
  <div className="form-grid"><label>Minimum age<input type="number" min="18" max="100" value={pref.min_age??18} onChange={e=>setPref({...pref,min_age:Number(e.target.value)})}/></label><label>Maximum age<input type="number" min="18" max="100" value={pref.max_age??100} onChange={e=>setPref({...pref,max_age:Number(e.target.value)})}/></label><label>Distance<input type="number" min="1" max="500" value={pref.max_distance_miles??50} onChange={e=>setPref({...pref,max_distance_miles:Number(e.target.value)})}/></label></div>
  <fieldset><legend>Connection type</legend><div className="chips">{types.map(v=><button type="button" key={v} className={`chip ${(pref.connection_types??[]).includes(v)?"selected":""}`} onClick={()=>toggle("connection_types",v)}>{v[0].toUpperCase()+v.slice(1)}</button>)}</div></fieldset>
  {msg&&<div className={msg.startsWith("Saved")?"form-success":"form-error"}>{msg}</div>}<button className="submit-button" disabled={saving}>{saving?"Saving…":"Save changes"}</button>
 </form>
}