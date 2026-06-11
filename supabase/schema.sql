create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  type text not null,
  currency text not null default 'EUR',
  end_date date,
  total_budget numeric(12, 2) not null default 0,
  revenue_generation boolean not null default false,
  payment_methods text[] not null default array['Espèces', 'Virement', 'Chèque', 'CB'],
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
  share_percentage numeric(5, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.project_tabs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  position int not null default 0
);

create table if not exists public.project_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  slug text not null,
  name text not null,
  color text not null default '#0f0f0f',
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique(project_id, slug)
);

do $$
begin
  create type public.expense_status as enum ('Payée', 'À rembourser', 'En validation');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase_id uuid references public.project_phases(id) on delete set null,
  member_id uuid references public.project_members(id) on delete set null,
  title text not null,
  category text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'EUR',
  status public.expense_status not null default 'En validation',
  payment_method text not null default 'Virement',
  expense_date date not null default current_date,
  receipt_path text,
  receipt_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  create type public.revenue_status as enum ('Encaissé', 'En attente', 'En retard');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.project_revenues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  revenue_date date not null default current_date,
  object text not null,
  client text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'EUR',
  status public.revenue_status not null default 'En attente',
  receipt_path text,
  receipt_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_credentials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  service_name text not null,
  login text not null,
  password_secret text not null,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  first_name text not null,
  email text not null,
  invite_link text not null,
  sent_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text,
  subscription_status text not null default 'none',
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  plan_expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  price_id text,
  email text,
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
alter table public.project_phases enable row level security;
alter table public.expenses enable row level security;
alter table public.project_revenues enable row level security;
alter table public.project_credentials enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_invitations enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;

alter table public.projects
  add column if not exists end_date date,
  add column if not exists total_budget numeric(12, 2) not null default 0,
  add column if not exists revenue_generation boolean not null default false,
  add column if not exists payment_methods text[] not null default array['Espèces', 'Virement', 'Chèque', 'CB'];

alter table public.project_members
  add column if not exists share_percentage numeric(5, 2) not null default 0;

alter table public.expenses
  add column if not exists phase_id uuid references public.project_phases(id) on delete set null,
  add column if not exists payment_method text not null default 'Virement',
  add column if not exists receipt_required boolean not null default true;

alter table public.profiles
  add column if not exists email text,
  add column if not exists plan text,
  add column if not exists subscription_status text not null default 'none',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists plan_expires_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.subscriptions
  alter column stripe_subscription_id drop not null,
  add column if not exists stripe_checkout_session_id text unique,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists price_id text,
  add column if not exists email text;

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

create policy "project phases read by owner"
  on public.project_phases for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_phases.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "project phases managed by owner"
  on public.project_phases for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_phases.project_id
      and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_phases.project_id
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

create policy "revenues read by owner"
  on public.project_revenues for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_revenues.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "revenues managed by owner"
  on public.project_revenues for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_revenues.project_id
      and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_revenues.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "credentials read by owner"
  on public.project_credentials for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_credentials.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "credentials managed by owner"
  on public.project_credentials for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_credentials.project_id
      and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_credentials.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "tasks read by owner"
  on public.project_tasks for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_tasks.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "tasks managed by owner"
  on public.project_tasks for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_tasks.project_id
      and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_tasks.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "invitations read by owner"
  on public.project_invitations for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_invitations.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "invitations managed by owner"
  on public.project_invitations for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_invitations.project_id
      and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_invitations.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "profiles read by owner"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles update by owner"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

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
