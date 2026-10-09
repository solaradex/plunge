create index if not exists conversations_created_by_idx
  on public.conversations (created_by);

create index if not exists notifications_actor_user_id_idx
  on public.notifications (actor_user_id);

create index if not exists reports_message_id_idx
  on public.reports (message_id);

create index if not exists reports_reporter_id_idx
  on public.reports (reporter_id);
