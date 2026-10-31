alter table public.tasks
  add column urgency_lead_hours integer not null default 24
  check (urgency_lead_hours between 0 and 8760);
