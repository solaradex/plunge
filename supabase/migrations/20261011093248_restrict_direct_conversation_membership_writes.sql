-- Membership must only be created by the authorized SECURITY DEFINER RPC.
-- A direct self-insert could otherwise grant access to another conversation's history.
drop policy if exists conversation_members_insert_self on public.conversation_members;
revoke insert on table public.conversation_members from authenticated;

-- Direct conversation rows are created through create_direct_conversation().
drop policy if exists conversations_insert_own on public.conversations;
revoke insert on table public.conversations from authenticated;
