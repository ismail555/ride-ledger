-- Run this in your Supabase SQL editor

create table if not exists cycling_sessions (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  km numeric(5,2) not null,
  duration_minutes integer not null,
  avg_hr integer,
  ef_score numeric(4,3),
  type text not null check (type in ('Long ride', 'Tempo', 'SweetSpot', 'Zone2', 'Rest')),
  kcal_burned integer,
  notes text,
  created_at timestamptz default now()
);

create table if not exists calorie_log (
  id uuid default gen_random_uuid() primary key,
  date date not null unique,
  calories integer not null,
  protein numeric(5,1) not null,
  carbs numeric(5,1) not null,
  fat numeric(5,1) not null,
  tdee_target integer not null,
  created_at timestamptz default now()
);

create table if not exists body_log (
  id uuid default gen_random_uuid() primary key,
  date date not null unique,
  weight numeric(4,1) not null,
  waist numeric(4,1),
  created_at timestamptz default now()
);

-- Enable RLS (disable for local dev if needed)
alter table cycling_sessions enable row level security;
alter table calorie_log enable row level security;
alter table body_log enable row level security;

-- Public read policy (adjust for auth later)
create policy "public read cycling_sessions" on cycling_sessions for select using (true);
create policy "public write cycling_sessions" on cycling_sessions for insert with check (true);
create policy "public read calorie_log" on calorie_log for select using (true);
create policy "public write calorie_log" on calorie_log for insert with check (true);
create policy "public read body_log" on body_log for select using (true);
create policy "public write body_log" on body_log for insert with check (true);

-- Seed data (current week example)
insert into cycling_sessions (date, km, duration_minutes, avg_hr, ef_score, type, kcal_burned) values
  ('2026-06-16', 52.3, 115, 142, 1.28, 'Long ride', 1850),
  ('2026-06-18', 38.7, 78, 158, 1.21, 'Tempo', 1420),
  ('2026-06-20', 45.1, 102, 138, 1.31, 'Zone2', 1280),
  ('2026-06-22', 41.8, 89, 151, 1.24, 'SweetSpot', 1510)
on conflict do nothing;

insert into calorie_log (date, calories, protein, carbs, fat, tdee_target) values
  ('2026-06-16', 2180, 198, 210, 62, 3400),
  ('2026-06-17', 1980, 201, 185, 58, 2150),
  ('2026-06-18', 2320, 195, 228, 71, 3150),
  ('2026-06-19', 2050, 203, 190, 60, 2150),
  ('2026-06-20', 2210, 197, 205, 65, 3050),
  ('2026-06-21', 1920, 208, 172, 55, 2150),
  ('2026-06-22', 2380, 192, 234, 74, 3150)
on conflict do nothing;

insert into body_log (date, weight, waist) values
  ('2026-06-16', 87.2, 93.5),
  ('2026-06-17', 87.0, 93.4),
  ('2026-06-18', 86.8, 93.2),
  ('2026-06-19', 86.5, 93.0),
  ('2026-06-20', 86.3, 92.8),
  ('2026-06-21', 86.1, 92.6),
  ('2026-06-22', 85.9, 92.4)
on conflict do nothing;
