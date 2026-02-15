-- Thesis Engine Database Schema
-- Zero-cost implementation using Supabase free tier
-- All tables designed for automated data collection + LLM synthesis

-- ============================================================================
-- CORE METRICS TABLES
-- ============================================================================

-- Daily Garmin metrics (synced at 6am daily)
CREATE TABLE garmin_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  -- Energy metrics
  vo2_max DECIMAL(4,1),
  resting_heart_rate INTEGER,
  hrv_ms INTEGER,
  sleep_hours DECIMAL(3,1),
  sleep_score INTEGER,
  body_battery INTEGER,
  stress_avg INTEGER,
  -- Activity metrics
  steps INTEGER,
  active_minutes INTEGER,
  calories_burned INTEGER,
  training_load DECIMAL(5,1),
  recovery_time_hours INTEGER,
  -- Raw JSON for full data
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_garmin_date ON garmin_metrics(date DESC);

-- Daily calendar time allocation (synced at 6am daily)
CREATE TABLE calendar_time (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  -- Color-coded time categories (in minutes)
  deep_work_min INTEGER DEFAULT 0,      -- Red: coding, research, writing
  meetings_min INTEGER DEFAULT 0,        -- Blue: calls, meetings
  learning_min INTEGER DEFAULT 0,        -- Green: courses, reading
  fitness_min INTEGER DEFAULT 0,         -- Yellow: workouts, training
  social_min INTEGER DEFAULT 0,          -- Purple: dates, networking
  recovery_min INTEGER DEFAULT 0,        -- Gray: rest, leisure
  -- Calculated totals
  productive_min INTEGER GENERATED ALWAYS AS (deep_work_min + learning_min) STORED,
  total_scheduled_min INTEGER GENERATED ALWAYS AS (
    deep_work_min + meetings_min + learning_min + fitness_min + social_min + recovery_min
  ) STORED,
  -- Raw events
  raw_events JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendar_date ON calendar_time(date DESC);
CREATE UNIQUE INDEX idx_calendar_date_unique ON calendar_time(date);

-- Chess.com progress (synced daily)
CREATE TABLE chess_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  rapid_rating INTEGER,
  blitz_rating INTEGER,
  bullet_rating INTEGER,
  puzzle_rating INTEGER,
  games_played_today INTEGER DEFAULT 0,
  puzzles_solved_today INTEGER DEFAULT 0,
  accuracy_pct DECIMAL(4,1),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chess_date ON chess_progress(date DESC);

-- Stripe revenue (synced daily)
CREATE TABLE revenue_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  mrr DECIMAL(10,2),                    -- Monthly recurring revenue
  arr DECIMAL(10,2),                    -- Annual recurring revenue
  daily_revenue DECIMAL(10,2),
  active_subscriptions INTEGER,
  new_customers_today INTEGER DEFAULT 0,
  churned_customers_today INTEGER DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revenue_date ON revenue_metrics(date DESC);

-- GitHub activity (synced daily)
CREATE TABLE github_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  commits INTEGER DEFAULT 0,
  pull_requests INTEGER DEFAULT 0,
  issues_closed INTEGER DEFAULT 0,
  lines_added INTEGER DEFAULT 0,
  lines_deleted INTEGER DEFAULT 0,
  repositories_active INTEGER DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_github_date ON github_activity(date DESC);

-- ============================================================================
-- GOALS TRACKING (19 total goals)
-- ============================================================================

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,              -- foundational | elite
  target_date DATE,
  target_value TEXT,
  unit TEXT,
  description TEXT,
  system_description TEXT,              -- The daily system to achieve it
  automated_tracking BOOLEAN DEFAULT false,
  data_source TEXT,                     -- Which API provides data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal progress snapshots (daily)
CREATE TABLE goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  current_value DECIMAL(10,2),
  target_value DECIMAL(10,2),
  completion_pct DECIMAL(5,2),
  on_track BOOLEAN,
  days_to_target INTEGER,
  velocity DECIMAL(10,4),               -- Rate of progress
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goal_progress_date ON goal_progress(date DESC);
CREATE INDEX idx_goal_progress_goal ON goal_progress(goal_id, date DESC);

-- ============================================================================
-- VOICE INPUT & REFLECTIONS (Wave.ai)
-- ============================================================================

-- Daily reflections from Wave.ai
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  transcript TEXT NOT NULL,
  -- LLM-extracted insights (Groq Llama 3.1 70B)
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  mood TEXT,
  wins TEXT[],
  struggles TEXT[],
  insights TEXT[],
  action_items TEXT[],
  fragmentation_score DECIMAL(3,2),    -- 0-1 scale
  coherence_score DECIMAL(3,2),        -- 0-1 scale
  -- Full LLM analysis
  llm_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reflections_date ON reflections(date DESC);

-- Signal captures from Wave.ai
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  signal_type TEXT NOT NULL,            -- insight | pattern | warning | opportunity
  transcript TEXT NOT NULL,
  context TEXT,
  -- LLM categorization
  category TEXT,                        -- energy | intelligence | relationships | goals | etc
  importance INTEGER CHECK (importance BETWEEN 1 AND 10),
  actionable BOOLEAN,
  action_item TEXT,
  llm_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signals_timestamp ON signals(timestamp DESC);
CREATE INDEX idx_signals_type ON signals(signal_type);

-- ============================================================================
-- LLM SYNTHESIS (Daily/Weekly/Monthly)
-- ============================================================================

-- LLM-generated insights and synthesis
CREATE TABLE llm_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  cadence TEXT NOT NULL,               -- daily | weekly | monthly
  model TEXT NOT NULL,                 -- groq-llama-70b | together-405b | claude-opus

  -- Component scores (from generative reward function)
  generative_energy DECIMAL(4,2),      -- GE: 0-10 scale
  intelligence_growth DECIMAL(4,2),     -- ĠI: 0-10 scale
  value_creation DECIMAL(4,2),         -- ĠVC: 0-10 scale
  capture_ratio DECIMAL(3,2),          -- κ: 0-1 scale
  optionality DECIMAL(4,2),            -- 𝒪: 0-10 scale
  fragmentation DECIMAL(3,2),          -- 𝓕: 0-1 scale (penalty)
  thesis_coherence DECIMAL(3,2),       -- Θ: 0-1 scale

  -- Calculated reward
  reward_score DECIMAL(6,3),           -- g* from formula

  -- Insights
  key_patterns TEXT[],
  risks TEXT[],
  opportunities TEXT[],
  recommendations TEXT[],

  -- Full synthesis
  synthesis_text TEXT,
  raw_llm_output JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_llm_insights_date ON llm_insights(date DESC);
CREATE INDEX idx_llm_insights_cadence ON llm_insights(cadence, date DESC);

-- ============================================================================
-- REWARD FUNCTION HISTORY
-- ============================================================================

-- Daily calculated reward scores
CREATE TABLE daily_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,

  -- Raw component scores
  generative_energy DECIMAL(4,2) NOT NULL,
  intelligence_growth DECIMAL(4,2) NOT NULL,
  value_creation DECIMAL(4,2) NOT NULL,
  capture_ratio DECIMAL(3,2) NOT NULL,
  optionality DECIMAL(4,2) NOT NULL,
  fragmentation DECIMAL(3,2) NOT NULL,
  thesis_coherence DECIMAL(3,2) NOT NULL,

  -- Calculated logs for formula
  log_ge DECIMAL(6,4),
  log_gi DECIMAL(6,4),
  log_gvc DECIMAL(6,4),
  log_kappa DECIMAL(6,4),
  log_optionality DECIMAL(6,4),

  -- Final reward: g* = 𝔼[log GE + log ĠI + log ĠVC + log κ + log 𝒪] − 𝓕 + Θ
  reward_score DECIMAL(6,3) NOT NULL,

  -- Ruin detection
  ruin_detected BOOLEAN DEFAULT false,
  ruin_component TEXT,                  -- Which component hit zero

  -- 7-day rolling average
  reward_7d_avg DECIMAL(6,3),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_rewards_date ON daily_rewards(date DESC);

-- ============================================================================
-- ETL SYNC STATUS
-- ============================================================================

-- Track API sync jobs
CREATE TABLE sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  source TEXT NOT NULL,                -- garmin | calendar | chess | stripe | github
  status TEXT NOT NULL,                -- success | failed | pending
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_status_date ON sync_status(date DESC, source);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_garmin_metrics_updated_at BEFORE UPDATE ON garmin_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_time_updated_at BEFORE UPDATE ON calendar_time
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chess_progress_updated_at BEFORE UPDATE ON chess_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_metrics_updated_at BEFORE UPDATE ON revenue_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_github_activity_updated_at BEFORE UPDATE ON github_activity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_progress_updated_at BEFORE UPDATE ON goal_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reflections_updated_at BEFORE UPDATE ON reflections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_llm_insights_updated_at BEFORE UPDATE ON llm_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_rewards_updated_at BEFORE UPDATE ON daily_rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Insert 19 goals
-- ============================================================================

INSERT INTO goals (name, category, target_date, target_value, unit, description, system_description, automated_tracking, data_source) VALUES

-- Foundational Goals (6)
('1800 ELO Chess', 'foundational', '2026-12-31', '1800', 'elo',
  'Reach 1800 rapid rating on Chess.com to build systematic pattern recognition and decision-making under pressure',
  'Daily: 20min tactics puzzles. 3x/week: analyze games. Weekly: opening study. Monthly: milestone review.',
  true, 'chess_com'),

('55 VO2 Max', 'foundational', '2026-12-31', '55', 'ml/kg/min',
  'Achieve VO2 Max of 55 (elite for females) to maximize energy and cognitive performance',
  '2x/week VO2 intervals (4x4min @ 90% max HR). 1x/week long easy run. Track via Garmin.',
  true, 'garmin'),

('$6k → $12k MRR', 'foundational', '2026-06-30', '12000', 'usd',
  'Double revenue from $6k to $12k/month through systematic outbound + product improvements',
  '3 asks/day (DMs, emails, content). Weekly: conversion analysis. Track via Stripe.',
  true, 'stripe'),

('AI Research Skills', 'foundational', '2027-12-31', '1', 'papers',
  'Build world-class AI research skills: Stanford RL course → paper reproduction → ArXiv publication',
  'Daily: 2hrs study/coding. Weekly: paper review. Monthly: reproduce experiments. Target: 1 published paper.',
  false, 'manual'),

('Female LevelsIO', 'foundational', '2027-12-31', '150', 'ships',
  'Ship 3 products/week in public (150 total) to build audience, skills, and optionality',
  '3 ships/week (tools, content, experiments). Build in public on Twitter. Track ships in notes.',
  false, 'manual'),

('Feminine Aesthetic', 'foundational', '2026-12-31', '100', 'sessions',
  'Master feminine aesthetic movement through sensual dancing: 100 sessions by Dec 2026',
  '3x/week dancing practice. Film progress. Build body confidence and presence.',
  false, 'manual'),

-- Elite Goals (13) - $0 → $10M Net Worth Path

('$150k Net Worth 2026', 'elite', '2026-12-31', '150000', 'usd',
  'End 2026 with $150k net worth: $100k cash + $50k investments',
  'MRR growth to $15k/month. 70% savings rate. Monthly financial review.',
  true, 'stripe'),

('$500k Net Worth 2027', 'elite', '2027-12-31', '500000', 'usd',
  'End 2027 with $500k net worth: $300k cash + $200k investments',
  'Scale to $40k/month revenue. Maintain high savings rate. Begin angel investing.',
  true, 'stripe'),

('$1.5M Net Worth 2028', 'elite', '2028-12-31', '1500000', 'usd',
  'End 2028 with $1.5M net worth through business scaling + investments',
  'Scale to $100k/month revenue. Strategic investments. Portfolio diversification.',
  true, 'stripe'),

('$4M Net Worth 2029', 'elite', '2029-12-31', '4000000', 'usd',
  'End 2029 with $4M net worth: business + investments + real estate',
  'Scale to $200k/month. Multiple income streams. Wealth compounding.',
  true, 'stripe'),

('$10M+ Net Worth 2030', 'elite', '2030-12-31', '10000000', 'usd',
  'End 2030 with $10M+ net worth. Financial independence achieved.',
  'Sustain $250k+/month. Investment returns compound. Exit options.',
  true, 'stripe'),

('70 High-Status Connections', 'elite', '2027-12-31', '70', 'connections',
  'Build network of 70 high-status connections: 10 VCs, 20 founders, 10 researchers, 30 LPs',
  'Weekly: 5 new DMs. Monthly: 2 dinners. Quarterly: 1 event. Track relationships CRM-style.',
  false, 'manual'),

('10k Twitter Followers 2026', 'elite', '2026-12-31', '10000', 'followers',
  'Reach 10k Twitter followers by shipping in public and providing value',
  'Daily: 3 valuable tweets. Weekly: 1 thread. Monthly: 1 viral piece. Build audience systematically.',
  false, 'manual'),

('100k Twitter Followers 2030', 'elite', '2030-12-31', '100000', 'followers',
  'Reach 100k Twitter followers. Recognized voice in AI + startups.',
  'Consistent valuable content. Network effects compound. Media appearances.',
  false, 'manual'),

('AI Research 9/10 Skill', 'elite', '2028-12-31', '9', 'skill_level',
  'World-class AI research skills: 9/10 level (published papers, recognized expertise)',
  'Stanford courses → paper reproductions → original research → publications',
  false, 'manual'),

('Business 8/10 Skill', 'elite', '2027-12-31', '8', 'skill_level',
  'Elite business skills: sales, fundraising, operations at 8/10 level',
  'Scale businesses. Raise capital. Build teams. Learn from top operators.',
  false, 'manual'),

('Communication 9/10', 'elite', '2028-12-31', '9', 'skill_level',
  'World-class communication: writing, speaking, persuasion at 9/10',
  'Daily writing. Public speaking. Podcast appearances. Media training.',
  false, 'manual'),

('Armstrong $24k/month', 'elite', '2026-12-31', '24000', 'usd',
  'Scale Armstrong to $24k/month MRR (400 subscribers @ $60/month)',
  'Product improvements. Systematic outbound. Conversion optimization. Monthly cohort analysis.',
  true, 'stripe'),

('Known in AI + Markets', 'elite', '2028-12-31', '1', 'reputation',
  'Recognized name in AI + Markets communities: published research, speaking, influence',
  'Publish papers. Speak at conferences. Build in public. Provide value consistently.',
  false, 'manual');

-- ============================================================================
-- RLS POLICIES (Optional - for multi-user support later)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE garmin_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE chess_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (single user)
-- Later: add user_id column and restrict by auth.uid()
CREATE POLICY "Allow all operations" ON garmin_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON calendar_time FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON chess_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON revenue_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON github_activity FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON goal_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON reflections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON signals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON llm_insights FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON daily_rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON sync_status FOR ALL USING (true) WITH CHECK (true);
