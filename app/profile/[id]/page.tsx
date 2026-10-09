import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import PublicProfile from "./PublicProfile";
export default async function PublicProfilePage({params}:{params:Promise<{id:string}>}){
 const {id}=await params; const s=await createClient(); const {data:{user}}=await s.auth.getUser(); if(!user)redirect("/login");
 const {data,error}=await s.rpc("get_public_profile",{target_user_id:id}); if(error||!data)redirect("/home");
 const photos = await Promise.all((data.photos ?? []).map(async (photo: any) => {
  const { data: signed } = await s.storage.from("plunge-profiles").createSignedUrl(photo.storage_path, 600);
  return { ...photo, photo_url: signed?.signedUrl ?? null };
 }));
 const profileData = { ...data, photos };
 return <main className="home-page"><header className="home-header"><a className="home-logo" href="/home">plunge</a><nav><a href="/home">Discover</a><a href="/matches">Matches</a></nav></header><PublicProfile data={profileData} userId={user.id}/></main>;
}