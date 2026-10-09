"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ProfileForm = {
  username: string;
  display_name: string;
  bio: string | null;
  city: string;
  state: string;
};
type PreferencesForm = {
  interested_genders: string[];
  min_age: number;
  max_age: number;
  max_distance_miles: number;
  connection_types: string[];
};
type Props = {
  initialProfile: ProfileForm;
  initialPref: Partial<PreferencesForm> | null;
};

const genders = [["man", "Men"], ["woman", "Women"], ["nonbinary", "Nonbinary"]] as const;
const types = ["dating", "friendship", "chat", "activities"];

export default function SettingsForm({ initialProfile, initialPref }: Props) {
  const [profile, setProfile] = useState<ProfileForm>(initialProfile);
  const [pref, setPref] = useState<PreferencesForm>({
    interested_genders: initialPref?.interested_genders ?? ["man", "woman"],
    min_age: initialPref?.min_age ?? 18,
    max_age: initialPref?.max_age ?? 100,
    max_distance_miles: initialPref?.max_distance_miles ?? 50,
    connection_types: initialPref?.connection_types ?? ["dating"],
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function toggle(key: "interested_genders" | "connection_types", value: string) {
    setPref((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setMsg("");
    const username = profile.username.trim().toLowerCase();
    const displayName = profile.display_name.trim();
    const city = profile.city.trim();
    const state = profile.state.trim().toUpperCase();
    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      setMsg("Username must be 3–24 characters and use only letters, numbers, or underscores.");
      return;
    }
    if (!displayName || displayName.length > 60 || !city || city.length > 100 || !/^[A-Z]{2}$/.test(state)) {
      setMsg("Enter a display name, city, and valid two-letter state.");
      return;
    }
    if (pref.min_age < 18 || pref.max_age > 100 || pref.min_age > pref.max_age) {
      setMsg("Choose an age range from 18 to 100, with minimum age no greater than maximum age.");
      return;
    }
    if (pref.max_distance_miles < 1 || pref.max_distance_miles > 500) {
      setMsg("Distance must be between 1 and 500 miles.");
      return;
    }
    if (!pref.interested_genders.length || !pref.connection_types.length) {
      setMsg("Choose at least one gender and one connection type.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMsg("Your session has expired. Please log in again.");
      setSaving(false);
      return;
    }

    const profileResult = await supabase.from("profiles").update({
      username,
      display_name: displayName,
      bio: profile.bio?.trim() || null,
      city,
      state,
    }).eq("id", user.id);

    if (profileResult.error) {
      setMsg(profileResult.error.message);
      setSaving(false);
      return;
    }

    const preferencesResult = await supabase.from("preferences").upsert({
      user_id: user.id,
      interested_genders: pref.interested_genders,
      min_age: pref.min_age,
      max_age: pref.max_age,
      max_distance_miles: pref.max_distance_miles,
      connection_types: pref.connection_types,
    });
    setSaving(false);
    setMsg(preferencesResult.error?.message ?? "Saved. Your discovery preferences are updated.");
  }

  return <form onSubmit={save}>
    <div className="form-grid">
      <label>Username<input value={profile.username} maxLength={24}
        onChange={(event) => setProfile({ ...profile, username: event.target.value })} required /></label>
      <label>Display name<input value={profile.display_name} maxLength={60}
        onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} required /></label>
      <label>City<input value={profile.city} maxLength={100}
        onChange={(event) => setProfile({ ...profile, city: event.target.value })} required /></label>
      <label>State<input value={profile.state} maxLength={2}
        onChange={(event) => setProfile({ ...profile, state: event.target.value })} required /></label>
    </div>
    <label>Bio<textarea maxLength={500} value={profile.bio ?? ""}
      onChange={(event) => setProfile({ ...profile, bio: event.target.value })} /></label>
    <fieldset><legend>Interested in</legend><div className="chips">
      {genders.map(([value, label]) => <button type="button" key={value}
        className={`chip ${pref.interested_genders.includes(value) ? "selected" : ""}`}
        aria-pressed={pref.interested_genders.includes(value)}
        onClick={() => toggle("interested_genders", value)}>{label}</button>)}
    </div></fieldset>
    <div className="form-grid">
      <label>Minimum age<input type="number" min="18" max="100" value={pref.min_age}
        onChange={(event) => setPref({ ...pref, min_age: Number(event.target.value) })} /></label>
      <label>Maximum age<input type="number" min="18" max="100" value={pref.max_age}
        onChange={(event) => setPref({ ...pref, max_age: Number(event.target.value) })} /></label>
      <label>Distance<input type="number" min="1" max="500" value={pref.max_distance_miles}
        onChange={(event) => setPref({ ...pref, max_distance_miles: Number(event.target.value) })} /></label>
    </div>
    <fieldset><legend>Connection type</legend><div className="chips">
      {types.map((value) => <button type="button" key={value}
        className={`chip ${pref.connection_types.includes(value) ? "selected" : ""}`}
        aria-pressed={pref.connection_types.includes(value)}
        onClick={() => toggle("connection_types", value)}>
        {value[0].toUpperCase() + value.slice(1)}
      </button>)}
    </div></fieldset>
    {msg && <div className={msg.startsWith("Saved") ? "form-success" : "form-error"} role="status">{msg}</div>}
    <button className="submit-button" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
  </form>;
}
