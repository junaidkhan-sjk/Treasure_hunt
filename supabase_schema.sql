-- 1. Create Venues Table
CREATE TABLE venues (
  id TEXT PRIMARY KEY,
  order_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  location_label TEXT,
  hint_text TEXT,
  venue_image_url TEXT,
  correct_code TEXT NOT NULL,
  coordinator_name TEXT,
  task_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Teams Table
CREATE TABLE teams (
  team_id TEXT PRIMARY KEY,
  team_name TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  leader_phone TEXT NOT NULL,
  members TEXT[] DEFAULT '{}',
  current_level_index INTEGER DEFAULT 0,
  last_completion_at BIGINT,
  started_at BIGINT,
  finished_at BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Realtime (Optional but recommended for the Dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE venues;

-- 4. Set up Row Level Security (RLS)
-- For a public hunt, you might want to allow anyone to read/write,
-- or use service role keys. For simplicity here, we'll allow public access.
-- WARNING: In a real production app, you should use more restrictive policies.

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Allow public read/write access on teams" ON teams FOR ALL USING (true);
CREATE POLICY "Allow public all access on venues for devs" ON venues FOR ALL USING (true);
