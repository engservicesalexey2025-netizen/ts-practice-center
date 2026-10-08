-- =====================================================================
-- Центр «Практика ТН» — схема Supabase (этап 1: перенос прототипа)
-- Выполнить в Supabase → SQL Editor целиком, один раз.
-- Модель повторяет хранилище прототипа (документы по путям), чтобы
-- перенести приложение почти без переписывания. Нормализацию таблиц
-- делаем на этапе 2.
-- =====================================================================

-- 1. Профили и роли --------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  role        text not null default 'trainee' check (role in ('owner','mentor','trainee')),
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- новый пользователь автоматически получает профиль с ролью trainee
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_mentor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('owner','mentor'));
$$;
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'owner');
$$;

drop policy if exists "profiles: read own or mentor" on public.profiles;
create policy "profiles: read own or mentor" on public.profiles
  for select using (id = auth.uid() or public.is_mentor());
drop policy if exists "profiles: owner changes roles" on public.profiles;
create policy "profiles: owner changes roles" on public.profiles
  for update using (public.is_owner()) with check (public.is_owner());

-- 2. Хранилище документов (как в прототипе) --------------------------
-- path:       'cms/main', 'cms/main/lessons/A1', 'cms/main/sections/K',
--             'cms/main/access/<uid>', 'trainees/<uid>'
-- collection: путь без последнего сегмента ('cms/main/lessons', 'trainees')
create table if not exists public.docs (
  path        text primary key,
  collection  text generated always as (regexp_replace(path, '/[^/]+$', '')) stored,
  doc_id      text generated always as (regexp_replace(path, '^.*/', '')) stored,
  data        jsonb not null default '{}'::jsonb,
  version     bigint not null default 1,
  updated_by  uuid default auth.uid(),
  updated_at  timestamptz not null default now()
);
create index if not exists docs_collection_idx on public.docs(collection);
alter table public.docs enable row level security;

create or replace function public.docs_touch() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if tg_op = 'UPDATE' then new.version := old.version + 1; end if;
  return new;
end $$;
drop trigger if exists docs_touch on public.docs;
create trigger docs_touch before insert or update on public.docs
  for each row execute function public.docs_touch();

-- Чтение: материалы курса — всем вошедшим; данные абитуриента — ему и наставникам
drop policy if exists "docs: read" on public.docs;
create policy "docs: read" on public.docs for select using (
  auth.uid() is not null and (
       path = 'cms/main' or path like 'cms/main/%'
    or path = 'trainees/' || auth.uid()::text
    or public.is_mentor()
  )
);
-- Запись материалов курса и доступа к разделам — только наставники
drop policy if exists "docs: mentors write cms" on public.docs;
create policy "docs: mentors write cms" on public.docs for all
  using (public.is_mentor() and (path = 'cms/main' or path like 'cms/main/%'))
  with check (public.is_mentor() and (path = 'cms/main' or path like 'cms/main/%'));
-- Абитуриент пишет только свой документ прогресса
drop policy if exists "docs: trainee writes own" on public.docs;
create policy "docs: trainee writes own" on public.docs for all
  using (path = 'trainees/' || auth.uid()::text)
  with check (path = 'trainees/' || auth.uid()::text);
-- Наставник может удалить запись абитуриента из журнала (тестовые/лишние анкеты)
drop policy if exists "docs: mentors delete trainees" on public.docs;
create policy "docs: mentors delete trainees" on public.docs for delete
  using (public.is_mentor() and path like 'trainees/%');

-- Realtime (замена onSnapshot)
alter publication supabase_realtime add table public.docs;

-- 3. Фото (замена хранилища ассетов) ---------------------------------
-- Публичное чтение по неугадываемому имени файла; загрузка — только наставники.
insert into storage.buckets (id, name, public) values ('assets','assets', true)
  on conflict (id) do nothing;
drop policy if exists "assets: mentors upload" on storage.objects;
create policy "assets: mentors upload" on storage.objects for insert
  with check (bucket_id = 'assets' and public.is_mentor());
drop policy if exists "assets: mentors delete" on storage.objects;
create policy "assets: mentors delete" on storage.objects for delete
  using (bucket_id = 'assets' and public.is_mentor());

-- 4. После первой регистрации владельца выполнить вручную:
-- update public.profiles set role = 'owner'  where email = 'ВАШ_EMAIL';
-- update public.profiles set role = 'mentor' where email in ('наставник1@...','наставник2@...');
