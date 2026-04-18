-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Equipment ────────────────────────────────────────────────────────────────
create table if not exists equipment (
  id         text primary key,
  name       text not null,
  category   text not null check (category in ('bars','suspended','static','weighted','floor')),
  icon       text
);

-- ─── Skills ───────────────────────────────────────────────────────────────────
create table if not exists skills (
  id                      text primary key,
  name                    text not null,
  family                  text not null check (family in ('pushing','pulling','balance','legs')),
  type                    text not null check (type in ('static','dynamic')),
  recommended_frequency   int  not null default 3,
  icon                    text,
  description             text
);

-- ─── Progressions ─────────────────────────────────────────────────────────────
create table if not exists progressions (
  id                    text primary key,
  skill_id              text not null references skills(id) on delete cascade,
  level                 int  not null,
  name                  text not null,
  -- unlock_criteria stored as jsonb: { type, target_value, target_sets, consecutive_sessions }
  unlock_criteria       jsonb not null,
  equipment_required    text[] not null default '{}',
  equipment_preferred   text[] not null default '{}',
  -- difficulty_modifiers: { equipment_id -> multiplier }
  difficulty_modifiers  jsonb not null default '{}',
  demo_video_url        text,
  form_cues             text[] not null default '{}',
  common_mistakes       text[] not null default '{}',
  supplementary_exercises text[] not null default '{}'
);

create index if not exists progressions_skill_id_idx on progressions(skill_id);
create index if not exists progressions_level_idx on progressions(skill_id, level);

-- ─── User Profiles ────────────────────────────────────────────────────────────
create table if not exists user_profiles (
  id                    uuid primary key default uuid_generate_v4(),
  display_name          text not null,
  avatar_url            text,
  email                 text,
  created_at            timestamptz not null default now(),
  onboarding_completed  boolean not null default false,
  training_days         int[] not null default '{}',  -- 0=Sun..6=Sat
  training_frequency    int  not null default 4 check (training_frequency in (3,4,5)),
  goal                  text not null default 'balanced' check (goal in ('skill','strength','balanced')),
  experience_level      text check (experience_level in ('beginner','intermediate','advanced'))
);

-- ─── Equipment Profiles ───────────────────────────────────────────────────────
create table if not exists equipment_profiles (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references user_profiles(id) on delete cascade,
  name           text not null,
  is_default     boolean not null default false,
  equipment_ids  text[] not null default '{}'
);

create index if not exists equipment_profiles_user_idx on equipment_profiles(user_id);

-- ─── User Skill Levels ────────────────────────────────────────────────────────
create table if not exists user_skill_levels (
  user_id                  uuid not null references user_profiles(id) on delete cascade,
  skill_id                 text not null references skills(id) on delete cascade,
  current_progression_id   text not null references progressions(id),
  current_progression_level int not null default 1,
  personal_best_value      numeric,
  personal_best_date       date,
  status                   text not null default 'maintenance'
                            check (status in ('focus','maintenance','locked','paused')),
  primary key (user_id, skill_id)
);

create index if not exists user_skill_levels_user_idx on user_skill_levels(user_id);

-- ─── Training Blocks ──────────────────────────────────────────────────────────
create table if not exists training_blocks (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references user_profiles(id) on delete cascade,
  start_date            date not null,
  end_date              date not null,
  duration_weeks        int  not null default 5,
  focus_skill_ids       text[] not null default '{}',
  maintenance_skill_ids text[] not null default '{}',
  current_phase         text not null default 'accumulation'
                         check (current_phase in ('accumulation','intensification','realization')),
  current_week          int not null default 1,
  status                text not null default 'active'
                         check (status in ('active','completed','upcoming'))
);

create index if not exists training_blocks_user_idx on training_blocks(user_id);
create index if not exists training_blocks_active_idx on training_blocks(user_id, status);

-- ─── Workout Sessions ─────────────────────────────────────────────────────────
create table if not exists workout_sessions (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references user_profiles(id) on delete cascade,
  training_block_id     uuid references training_blocks(id) on delete set null,
  date                  date not null,
  type                  text not null check (type in ('program','custom','rest_day_activity')),
  session_type          text not null check (session_type in ('push','pull','legs','skill','custom','rest')),
  session_label         text not null default '',
  week_number           int,
  day_in_week           int,
  -- planned_exercises: array of ExerciseInstance jsonb objects
  planned_exercises     jsonb not null default '[]',
  logged_exercises      jsonb not null default '[]',
  readiness_score       int check (readiness_score between 1 and 5),
  duration_minutes      int,
  status                text not null default 'planned'
                         check (status in ('planned','in_progress','completed','skipped')),
  notes                 text,
  equipment_profile_id  uuid references equipment_profiles(id) on delete set null
);

create index if not exists workout_sessions_user_date_idx on workout_sessions(user_id, date desc);
create index if not exists workout_sessions_block_idx on workout_sessions(training_block_id);

-- ─── Personal Records ─────────────────────────────────────────────────────────
create table if not exists personal_records (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references user_profiles(id) on delete cascade,
  progression_id   text not null references progressions(id),
  value            numeric not null,
  target_type      text not null check (target_type in ('hold_time','reps')),
  achieved_at      timestamptz not null default now(),
  session_id       uuid references workout_sessions(id) on delete set null
);

create index if not exists personal_records_user_idx on personal_records(user_id);
create index if not exists personal_records_progression_idx on personal_records(user_id, progression_id);

-- ─── Social Posts ─────────────────────────────────────────────────────────────
create table if not exists social_posts (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references user_profiles(id) on delete cascade,
  type                  text not null check (type in ('skill_unlock','pr','form_check','text','challenge_complete')),
  content               text not null,
  media_url             text,
  related_skill_id      text references skills(id) on delete set null,
  related_progression_id text references progressions(id) on delete set null,
  created_at            timestamptz not null default now(),
  likes_count           int not null default 0
);

create index if not exists social_posts_created_at_idx on social_posts(created_at desc);
create index if not exists social_posts_user_idx on social_posts(user_id);

create table if not exists post_likes (
  post_id  uuid not null references social_posts(id) on delete cascade,
  user_id  uuid not null references user_profiles(id) on delete cascade,
  primary key (post_id, user_id)
);

create table if not exists post_comments (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid not null references social_posts(id) on delete cascade,
  user_id    uuid not null references user_profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

-- ─── Challenges ───────────────────────────────────────────────────────────────
create table if not exists challenges (
  id               uuid primary key default uuid_generate_v4(),
  title            text not null,
  type             text not null check (type in ('streak','skill_unlock','volume','group')),
  description      text not null,
  start_date       date not null,
  end_date         date not null,
  target_type      text not null,
  target_value     numeric not null,
  participant_count int not null default 0
);

create table if not exists challenge_participants (
  challenge_id  uuid not null references challenges(id) on delete cascade,
  user_id       uuid not null references user_profiles(id) on delete cascade,
  progress      numeric not null default 0,
  joined_at     timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

-- ─── Training Partners ────────────────────────────────────────────────────────
create table if not exists training_partnerships (
  user_id_a   uuid not null references user_profiles(id) on delete cascade,
  user_id_b   uuid not null references user_profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id_a, user_id_b),
  check (user_id_a < user_id_b)
);
