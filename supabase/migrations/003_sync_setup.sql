-- RLS for user_profiles (id = auth.users.id)
alter table user_profiles enable row level security;
create policy "Users manage own profile" on user_profiles for all using (auth.uid() = id);

-- RLS for equipment_profiles
alter table equipment_profiles enable row level security;
create policy "Users manage own equipment" on equipment_profiles for all using (auth.uid() = user_id);

-- RLS for user_skill_levels
alter table user_skill_levels enable row level security;
create policy "Users manage own skills" on user_skill_levels for all using (auth.uid() = user_id);

-- RLS for training_blocks
alter table training_blocks enable row level security;
create policy "Users manage own blocks" on training_blocks for all using (auth.uid() = user_id);

-- RLS for workout_sessions
alter table workout_sessions enable row level security;
create policy "Users manage own sessions" on workout_sessions for all using (auth.uid() = user_id);

-- RLS for personal_records
alter table personal_records enable row level security;
create policy "Users manage own PRs" on personal_records for all using (auth.uid() = user_id);

-- Add fields to user_profiles
alter table user_profiles add column if not exists allow_park_discovery boolean not null default true;

-- Parks table
create table if not exists user_parks (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references user_profiles(id) on delete cascade,
  place_id      text not null,
  name          text not null,
  address       text,
  lat           double precision,
  lng           double precision,
  created_at    timestamptz not null default now(),
  unique (user_id, place_id)
);
alter table user_parks enable row level security;
create policy "Users manage own parks" on user_parks for all using (auth.uid() = user_id);
create policy "Discoverable parks visible to all authed users" on user_parks for select
  using (
    auth.role() = 'authenticated' and
    exists (select 1 from user_profiles up where up.id = user_id and up.allow_park_discovery = true)
  );

-- Supabase Storage bucket for avatars (run manually in Supabase dashboard if needed)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
