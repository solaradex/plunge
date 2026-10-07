import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server"; import ActivityLink from "@/components/ActivityLink";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage(){
 const s=await createClient(); const {data:{user}}=await s.auth.getUser(); if(!user) redirect("/login");
 const {data:profile}=await s.from("profiles").select("username,display_name,bio,gender,city,state").eq("id",user.id).maybeSingle();
 const {data:pref}=await s.from("preferences").select("interested_genders,min_age,max_age,max_distance_miles,connection_types").eq("user_id",user.id).maybeSingle();
 if(!profile) redirect("/onboarding");
 return <main className="auth-page"><section className="auth-card onboarding"><a className="brand" href="/home">plunge</a><h1>Your preferences</h1><p>Keep your profile and discovery settings up to date.</p><SettingsForm initialProfile={profile} initialPref={pref}/><p className="auth-switch"><a href="/profile">← Back to profile</a></p></section></main>;
}