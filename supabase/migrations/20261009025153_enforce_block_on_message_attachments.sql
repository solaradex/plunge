create or replace function private.is_conversation_blocked(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.conversation_members mine where mine.conversation_id = target_conversation_id and mine.user_id = (select auth.uid()))
    and exists (select 1 from public.conversation_members peer join public.blocks b on (b.blocker_id = (select auth.uid()) and b.blocked_id = peer.user_id) or (b.blocker_id = peer.user_id and b.blocked_id = (select auth.uid())) where peer.conversation_id = target_conversation_id and peer.user_id <> (select auth.uid()));
$$;
revoke all on function private.is_conversation_blocked(uuid) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_conversation_blocked(uuid) to authenticated;
drop policy if exists message_attachments_insert_member on public.message_attachments;
create policy message_attachments_insert_member on public.message_attachments for insert to authenticated with check (exists (select 1 from public.messages m join public.conversation_members cm on cm.conversation_id = m.conversation_id where m.id = message_attachments.message_id and m.sender_id = (select auth.uid()) and cm.user_id = (select auth.uid()) and not private.is_conversation_blocked(m.conversation_id)));
drop policy if exists plunge_message_upload_member on storage.objects;
create policy plunge_message_upload_member on storage.objects for insert to authenticated with check (bucket_id = 'plunge-messages' and exists (select 1 from public.conversation_members cm where cm.conversation_id = ((storage.foldername(objects.name))[1])::uuid and cm.user_id = (select auth.uid())) and not private.is_conversation_blocked(((storage.foldername(objects.name))[1])::uuid));
