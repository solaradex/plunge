"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Interest = { id: string; category: string; name: string };

const genders = [["man","Man"],["woman","Woman"],["nonbinary","Nonbinary"],["prefer_not_to_say","Prefer not to say"]] as const;
const connectionTypes = ["Dating","Friendship","Chat","Activities"];

export default function OnboardingPage() {
  const [interests,setInterests]=useState<Interest[]>([]); const [selected,setSelected]=useState<string[]>([]);
  const [email,setEmail]=useState(""); const [username,setUsername]=useState(""); const [displayName,setDisplayName]=useState("");
  const [birthDate,setBirthDate]=useState(""); const [gender,setGender]=useState(""); const [city,setCity]=useState(""); const [state,setState]=useState("FL"); const [bio,setBio]=useState("");
  const [minAge,setMinAge]=useState(18); const [maxAge,setMaxAge]=useState(100); const [distance,setDistance]=useState(50);
  const [interestedGenders,setInterestedGenders]=useState<string[]>(["man","woman"]); const [types,setTypes]=useState<string[]>(["Dating"]);
  const [error,setError]=useState(""); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false);
  const supabase=createClient();

  useEffect(()=>{ (async()=>{ const {data:{user}}=await supabase.auth.getUser(); if(!user){window.location.href="/login";return;} setEmail(user.email ?? ""); const {data}=await supabase.from("interests").select("id,category,name").order("category").order("name"); setInterests(data ?? []); setLoading(false); })(); },[]);

  function toggle(list:string[],value:string,setter:(v:string[])=>void){ setter(list.includes(value)?list.filter(x=>x!==value):[...list,value]); }
  async function submit(e:FormEvent){ e.preventDefault(); setError("");
    if(!birthDate || !gender || !username || !displayName || !city) return setError("Please complete all required fields.");
    const birth=new Date(`${birthDate}T00:00:00`); const today=new Date(); let age=today.getFullYear()-birth.getFullYear(); const md=today.getMonth()-birth.getMonth(); if(md<0||(md===0&&today.getDate()<birth.getDate())) age--; if(age<18) return setError("Plunge is for adults 18+.");
    if(minAge>maxAge) return setError("Minimum age cannot be greater than maximum age."); if(!interestedGenders.length) return setError("Choose at least one gender preference."); if(!types.length) return setError("Choose at least one connection type.");
    setSaving(true); const {data:{user}}=await supabase.auth.getUser(); if(!user){window.location.href="/login";return;}
    const p=await supabase.from("profiles").upsert({id:user.id,username:username.trim().toLowerCase(),display_name:displayName.trim(),bio:bio.trim()||null,gender,city:city.trim(),state:state.trim().toUpperCase()||"FL"}); if(p.error){setError(p.error.message);setSaving(false);return;}
    const priv=await supabase.from("profile_private").upsert({user_id:user.id,birth_date:birthDate}); if(priv.error){setError(priv.error.message);setSaving(false);return;}
    const pref=await supabase.from("preferences").upsert({user_id:user.id,interested_genders:interestedGenders,min_age:minAge,max_age:maxAge,max_distance_miles:distance,connection_types:types.map(x=>x.toLowerCase())}); if(pref.error){setError(pref.error.message);setSaving(false);return;}
    await supabase.from("profile_interests").delete().eq("user_id",user.id); if(selected.length){const rows=selected.map(interest_id=>({user_id:user.id,interest_id})); const pi=await supabase.from("profile_interests").insert(rows); if(pi.error){setError(pi.error.message);setSaving(false);return;}}
    window.location.href="/";
  }

  if(loading) return <main className="auth-page"><section className="auth-card"><div className="brand">plunge</div><p>Loading your profile setup…</p></section></main>;
  const grouped=interests.reduce<Record<string,Interest[]>>((a,i)=>{(a[i.category]??=[]).push(i);return a;},{});
  return <main className="auth-page"><section className="auth-card onboarding"><div className="brand">plunge</div><h1>Build your profile</h1><p>Tell people nearby a little about you. Your exact location is never displayed.</p><form onSubmit={submit}>
    <div className="form-grid"><label>Username<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="yourname" required /></label><label>Display name<input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="What people see" required /></label><label>Date of birth<input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} required /></label><label>Gender<select value={gender} onChange={e=>setGender(e.target.value)} required><option value="">Choose…</option>{genders.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>City<input value={city} onChange={e=>setCity(e.target.value)} placeholder="Jacksonville" required /></label><label>State<input value={state} onChange={e=>setState(e.target.value)} maxLength={2} required /></label></div>
    <label>Bio<textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={500} placeholder="A little about you…" /></label>
    <fieldset><legend>I'm interested in</legend><div className="chips">{genders.slice(0,3).map(([v,l])=><button type="button" className={`chip ${interestedGenders.includes(v)?"selected":""}`} onClick={()=>toggle(interestedGenders,v,setInterestedGenders)} key={v}>{l}</button>)}</div></fieldset>
    <div className="form-grid"><label>Minimum age<input type="number" min="18" max="100" value={minAge} onChange={e=>setMinAge(Number(e.target.value))}/></label><label>Maximum age<input type="number" min="18" max="100" value={maxAge} onChange={e=>setMaxAge(Number(e.target.value))}/></label><label>Distance (miles)<input type="number" min="1" max="500" value={distance} onChange={e=>setDistance(Number(e.target.value))}/></label></div>
    <fieldset><legend>Connection type</legend><div className="chips">{connectionTypes.map(v=><button type="button" className={`chip ${types.includes(v)?"selected":""}`} onClick={()=>toggle(types,v,setTypes)} key={v}>{v}</button>)}</div></fieldset>
    <fieldset><legend>Interests</legend><div className="interest-list">{Object.entries(grouped).map(([category,items])=><div key={category}><strong>{category}</strong><div className="chips">{items.map(i=><button type="button" className={`chip ${selected.includes(i.id)?"selected":""}`} onClick={()=>toggle(selected,i.id,setSelected)} key={i.id}>{i.name}</button>)}</div></div>)}</div></fieldset>
    {error&&<div className="form-error">{error}</div>}<button className="submit-button" type="submit" disabled={saving}>{saving?"Saving profile…":"Finish profile"}</button><p className="age-note">Your date of birth is private. Plunge only displays your age.</p>
  </form></section></main>;
}
