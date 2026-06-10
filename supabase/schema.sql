create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  type text not null,
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  role text not null,
  color text not null default '#c94a1a',
  created_at timestamptz not null default now()
);

create table if not exists public.project_tabs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  position int not null default 0
);

do $$
begin
  create type public.expense_status as enum ('Payee', 'A rembourser', 'En validation');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  member_id uuid references public.project_members(id) on delete set null,
  title text not null,
  category text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'EUR',
  status public.expense_status not null default 'En validation',
  expense_date date not null default current_date,
  receipt_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text unique not null,
  status text not null,
  plan text not null default 'starter',
  current_period_end timestamptz,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_tabs enable row level security;
alter table public.expenses enable row level security;
alter table public.subscriptions enable row level security;

create policy "owners can read projects"
  on public.projects for select
  using (owner_id = auth.uid());

create policy "owners can manage projects"
  on public.projects for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "project members read by owner"
  on public.project_members for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_members.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "project members managed by owner"
  on public.project_members for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_members.project_id
      and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_members.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "project tabs read by owner"
  on public.project_tabs for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_tabs.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "project tabs managed by owner"
  on public.project_tabs for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_tabs.project_id
      and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_tabs.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "expenses read by owner"
  on public.expenses for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = expenses.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "expenses managed by owner"
  on public.expenses for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = expenses.project_id
      and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = expenses.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "subscriptions read by owner"
  on public.subscriptions for select
  using (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('expense-receipts', 'expense-receipts', false)
on conflict (id) do nothing;

create policy "owners can upload receipts"
  on storage.objects for insert
  with check (bucket_id = 'expense-receipts' and auth.role() = 'authenticated');

create policy "owners can read receipts"
  on storage.objects for select
  using (bucket_id = 'expense-receipts' and auth.role() = 'authenticated');
