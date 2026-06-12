drop policy if exists "owners can upload receipts" on storage.objects;
drop policy if exists "owners can read receipts" on storage.objects;
drop policy if exists "owners can delete receipts" on storage.objects;
drop policy if exists "users upload own receipts" on storage.objects;
drop policy if exists "users read own receipts" on storage.objects;
drop policy if exists "users delete own receipts" on storage.objects;

create policy "users upload own receipts"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'expense-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users read own receipts"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'expense-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own receipts"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'expense-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members memberships
    where memberships.project_id = target_project_id
      and memberships.user_id = auth.uid()
  );
$$;

grant execute on function public.is_project_member(uuid) to authenticated;

drop policy if exists "invited members can read projects" on public.projects;
drop policy if exists "invited members can read project_members" on public.project_members;
drop policy if exists "invited members can read expenses" on public.expenses;
drop policy if exists "invited members can read project_phases" on public.project_phases;
drop policy if exists "invited members can read project_tabs" on public.project_tabs;
drop policy if exists "invited members can read project_revenues" on public.project_revenues;
drop policy if exists "invited members can read project_tasks" on public.project_tasks;
drop policy if exists "invited members can read project_invitations" on public.project_invitations;

create policy "invited members can read projects"
  on public.projects for select
  using (public.is_project_member(id));

create policy "invited members can read project_members"
  on public.project_members for select
  using (public.is_project_member(project_id));

create policy "invited members can read expenses"
  on public.expenses for select
  using (public.is_project_member(project_id));

create policy "invited members can read project_phases"
  on public.project_phases for select
  using (public.is_project_member(project_id));

create policy "invited members can read project_tabs"
  on public.project_tabs for select
  using (public.is_project_member(project_id));

create policy "invited members can read project_revenues"
  on public.project_revenues for select
  using (public.is_project_member(project_id));

create policy "invited members can read project_tasks"
  on public.project_tasks for select
  using (public.is_project_member(project_id));

create policy "invited members can read project_invitations"
  on public.project_invitations for select
  using (public.is_project_member(project_id));

drop policy if exists "users can insert own profile" on public.profiles;

create policy "users can insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists project_members_user_id_idx on public.project_members(user_id);
create index if not exists project_members_project_id_idx on public.project_members(project_id);
create index if not exists expenses_project_id_idx on public.expenses(project_id);
