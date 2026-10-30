-- WARNING: This is an incomplete descriptive copy of the existing
-- public.profiles table, not an executable migration.
-- DRAFT FOR REVIEW ONLY.
-- This file is not an approved migration and must not be executed or registered remotely.
-- It describes only objects confirmed by the read-only Supabase audit.
-- It is not a complete schema baseline for the project.

create table public.profiles (
  id uuid not null,
  created_at timestamp with time zone not null default now(),
  role text,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey
    foreign key (id) references auth.users (id) on delete cascade,
  constraint profiles_role_check
    check (role is null or role = any (array['student'::text, 'teacher'::text, 'admin'::text]))
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
on public.profiles
as permissive
for select
to authenticated
using ((select auth.uid()) = id);

grant select on table public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  insert into public.profiles (id, created_at, role)
  values (new.id, now(), 'student');

  return new;
end;
$function$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
