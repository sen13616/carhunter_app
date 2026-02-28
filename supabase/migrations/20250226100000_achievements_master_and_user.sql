-- Master achievements definitions + user_achievements with FK and RLS
-- Replaces/includes previous user_achievements schema with id uuid PK and FK to achievements.

create table if not exists public.achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon_key text not null,
  xp_reward int not null default 0,
  created_at timestamptz not null default now()
);

-- Drop old user_achievements if it exists (composite PK version), then create new
drop table if exists public.user_achievements;

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

-- Everyone can read master achievement definitions
create policy "achievements_read_all"
  on public.achievements for select
  using (true);

-- Users can read their own earned achievements
create policy "user_achievements_read_own"
  on public.user_achievements for select
  using (auth.uid() = user_id);

-- Users can insert their own earned achievements
create policy "user_achievements_insert_own"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);

-- Earned achievements immutable
create policy "user_achievements_no_update"
  on public.user_achievements for update
  using (false);

create policy "user_achievements_no_delete"
  on public.user_achievements for delete
  using (false);

-- Seed master achievements (exact IDs and content per spec)
insert into public.achievements (id, title, description, icon_key, xp_reward) values
  ('first_spot', 'First Spot', 'Save your first spotting.', 'camera', 50),
  ('five_spots', 'Getting Started', 'Save 5 spottings.', 'badge', 100),
  ('ten_spots', 'Rolling Ten', 'Save 10 spottings.', 'badge_star', 200),
  ('first_legendary', 'Legendary Find', 'Spot your first legendary car.', 'star', 250),
  ('three_countries', 'Passport Stamps', 'Spot cars in 3 different countries.', 'globe', 150)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  icon_key = excluded.icon_key,
  xp_reward = excluded.xp_reward;
