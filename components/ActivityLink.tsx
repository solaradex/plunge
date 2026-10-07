"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {createClient} from "@/lib/supabase/client";
export default function ActivityLink(){
 const [count,setCount]=useState(0);
 useEffect(()=>{const sb=createClient();let mounted=true;async function load(){const {count}=await sb.from("notifications").select("id",{count:"exact",head:true}).is("read_at",null);if(mounted)setCount(count??0)}load();const ch=sb.channel("activity-badge").on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications"},()=>load()).subscribe();return()=>{mounted=false;sb.removeChannel(ch)}},[]);
 return <Link href="/notifications">Activity{count>0&&<span className="activity-badge">{count>99?"99+":count}</span>}</Link>;
}