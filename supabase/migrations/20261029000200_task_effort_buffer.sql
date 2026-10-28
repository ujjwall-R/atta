alter table public.tasks
  add column effort_buffer_minutes integer not null default 30
  check (effort_buffer_minutes between 0 and 100000);
