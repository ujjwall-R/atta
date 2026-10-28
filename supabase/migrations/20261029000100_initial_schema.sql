create extension if not exists pgcrypto;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 160),
  description text check (description is null or length(description) <= 2000),
  importance integer not null default 65 check (importance between 0 and 100),
  manual_urgency integer not null default 25 check (manual_urgency between 0 and 100),
  urgency_growth_rate numeric not null default 0.7 check (urgency_growth_rate > 0 and urgency_growth_rate <= 20),
  deadline timestamptz,
  estimated_effort_minutes integer check (estimated_effort_minutes is null or estimated_effort_minutes between 0 and 100000),
  status text not null default 'open' check (status in ('open', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'completed' or completed_at is not null)
);

create index tasks_user_status_idx on public.tasks (user_id, status, created_at desc);
create index tasks_user_deadline_idx on public.tasks (user_id, deadline) where status = 'open';

create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;
create policy "Users can read their own tasks" on public.tasks for select to authenticated using (auth.uid() = user_id);
create policy "Users can add their own tasks" on public.tasks for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own tasks" on public.tasks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own tasks" on public.tasks for delete to authenticated using (auth.uid() = user_id);
revoke all on public.tasks from anon;
grant select, insert, update, delete on public.tasks to authenticated;

create table public.batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 120),
  status text not null default 'planned' check (status in ('planned', 'active', 'completed')),
  created_at timestamptz not null default now()
);

create index batches_user_created_idx on public.batches (user_id, created_at desc);
alter table public.batches enable row level security;
create policy "Users can read their own batches" on public.batches for select to authenticated using (auth.uid() = user_id);
create policy "Users can create their own batches" on public.batches for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own batches" on public.batches for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own batches" on public.batches for delete to authenticated using (auth.uid() = user_id);
revoke all on public.batches from anon;
grant select, insert, update, delete on public.batches to authenticated;

create table public.batch_tasks (
  batch_id uuid not null references public.batches(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  primary key (batch_id, task_id)
);
create index batch_tasks_task_idx on public.batch_tasks (task_id);
alter table public.batch_tasks enable row level security;
create policy "Users can read their own batch tasks" on public.batch_tasks for select to authenticated
  using (exists (select 1 from public.batches b where b.id = batch_id and b.user_id = auth.uid()));
create policy "Users can add their own batch tasks" on public.batch_tasks for insert to authenticated
  with check (
    exists (select 1 from public.batches b where b.id = batch_id and b.user_id = auth.uid())
    and exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
  );
create policy "Users can remove their own batch tasks" on public.batch_tasks for delete to authenticated
  using (exists (select 1 from public.batches b where b.id = batch_id and b.user_id = auth.uid()));
revoke all on public.batch_tasks from anon;
grant select, insert, delete on public.batch_tasks to authenticated;
