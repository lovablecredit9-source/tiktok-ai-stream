-- =========================================
-- LIVE AI INTERACTION - core schema
-- =========================================

-- ---------- live_sessions ----------
CREATE TABLE public.live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  account_username text NOT NULL DEFAULT '',
  nickname text,
  live_url text,
  provider text NOT NULL DEFAULT 'demo',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  status text NOT NULL DEFAULT 'live',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_sessions TO authenticated;
GRANT ALL ON public.live_sessions TO service_role;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions" ON public.live_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- live_events ----------
CREATE TABLE public.live_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  event_key text NOT NULL,
  event_type text NOT NULL,
  username text NOT NULL,
  nickname text,
  avatar text,
  comment text,
  gift_id text,
  gift_name text,
  gift_count integer NOT NULL DEFAULT 0,
  gift_coins integer NOT NULL DEFAULT 0,
  gift_category text,
  is_question boolean NOT NULL DEFAULT false,
  is_answered boolean NOT NULL DEFAULT false,
  points integer NOT NULL DEFAULT 0,
  raw_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, event_key)
);
CREATE INDEX live_events_session_created_idx ON public.live_events (session_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_events TO authenticated;
GRANT ALL ON public.live_events TO service_role;
ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events" ON public.live_events FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- participants ----------
CREATE TABLE public.participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  username text NOT NULL,
  nickname text,
  avatar text,
  comment_count integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  wrong_answers integer NOT NULL DEFAULT 0,
  follow_count integer NOT NULL DEFAULT 0,
  gift_count integer NOT NULL DEFAULT 0,
  gift_coins integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, username)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.participants TO authenticated;
GRANT ALL ON public.participants TO service_role;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own participants" ON public.participants FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- quiz_questions ----------
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  session_id uuid REFERENCES public.live_sessions(id) ON DELETE SET NULL,
  title text,
  question text NOT NULL,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  correct_answer text NOT NULL,
  explanation text,
  mode text NOT NULL DEFAULT 'manual',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own questions" ON public.quiz_questions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- quiz_answers ----------
CREATE TABLE public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  username text NOT NULL,
  answer text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, username)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_answers TO authenticated;
GRANT ALL ON public.quiz_answers TO service_role;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own answers" ON public.quiz_answers FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- ai_responses ----------
CREATE TABLE public.ai_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  session_id uuid REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.live_events(id) ON DELETE SET NULL,
  username text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_responses TO authenticated;
GRANT ALL ON public.ai_responses TO service_role;
ALTER TABLE public.ai_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai responses" ON public.ai_responses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- system_logs ----------
CREATE TABLE public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  session_id uuid REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'INFO',
  source text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_logs TO authenticated;
GRANT ALL ON public.system_logs TO service_role;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own logs" ON public.system_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- gift_config (shared catalog) ----------
CREATE TABLE public.gift_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id text NOT NULL UNIQUE,
  gift_name text NOT NULL,
  gift_alias text,
  coins integer NOT NULL DEFAULT 1,
  category text NOT NULL DEFAULT 'Normal',
  vip_level integer NOT NULL DEFAULT 1,
  points integer NOT NULL DEFAULT 1,
  multiplier numeric NOT NULL DEFAULT 1,
  animation text NOT NULL DEFAULT 'Small',
  animation_duration integer NOT NULL DEFAULT 2500,
  icon_url text,
  emoji text,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_config TO authenticated;
GRANT ALL ON public.gift_config TO service_role;
ALTER TABLE public.gift_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gift catalog readable" ON public.gift_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "gift catalog writable" ON public.gift_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "gift catalog updatable" ON public.gift_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "gift catalog deletable" ON public.gift_config FOR DELETE TO authenticated USING (true);

-- ---------- ai_settings (per user) ----------
CREATE TABLE public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid(),
  provider text NOT NULL DEFAULT 'lovable',
  base_url text,
  model text NOT NULL DEFAULT 'openai/gpt-6-astra',
  has_api_key boolean NOT NULL DEFAULT false,
  encrypted_api_key text,
  system_prompt text NOT NULL DEFAULT 'Anda adalah AI assistant untuk TikTok LIVE. Jawab komentar penonton secara singkat, ramah, jelas, dan natural seperti host LIVE. Prioritaskan pertanyaan dan soal. Jangan mengarang informasi yang tidak diketahui. Jika komentar bukan pertanyaan, berikan respons singkat yang relevan. Jangan memberikan jawaban terlalu panjang.',
  temperature numeric NOT NULL DEFAULT 0.7,
  max_tokens integer NOT NULL DEFAULT 200,
  max_requests_per_minute integer NOT NULL DEFAULT 20,
  cooldown_seconds integer NOT NULL DEFAULT 15,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_settings TO service_role;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai settings" ON public.ai_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- app_settings (scoring + general, per user) ----------
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid(),
  point_comment integer NOT NULL DEFAULT 1,
  point_follow integer NOT NULL DEFAULT 5,
  point_correct_answer integer NOT NULL DEFAULT 10,
  coin_to_point numeric NOT NULL DEFAULT 1,
  min_coins_popup integer NOT NULL DEFAULT 10,
  tts_enabled boolean NOT NULL DEFAULT false,
  tts_voice text,
  tts_rate numeric NOT NULL DEFAULT 1,
  tts_pitch numeric NOT NULL DEFAULT 1,
  tts_volume numeric NOT NULL DEFAULT 1,
  tts_auto_read boolean NOT NULL DEFAULT true,
  ai_enabled boolean NOT NULL DEFAULT true,
  provider_name text NOT NULL DEFAULT 'demo',
  provider_endpoint text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own app settings" ON public.app_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- realtime ----------
ALTER TABLE public.live_events REPLICA IDENTITY FULL;
ALTER TABLE public.participants REPLICA IDENTITY FULL;
ALTER TABLE public.ai_responses REPLICA IDENTITY FULL;
ALTER TABLE public.system_logs REPLICA IDENTITY FULL;
ALTER TABLE public.live_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.quiz_questions REPLICA IDENTITY FULL;
ALTER TABLE public.quiz_answers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_answers;

-- ---------- seed gift catalog ----------
INSERT INTO public.gift_config (gift_id, gift_name, coins, category, vip_level, points, animation, animation_duration, emoji)
SELECT
  g.gift_id,
  g.gift_name,
  g.coins,
  CASE
    WHEN g.coins <= 10 THEN 'Normal'
    WHEN g.coins <= 99 THEN 'Special'
    WHEN g.coins <= 999 THEN 'VIP'
    WHEN g.coins <= 29999 THEN 'Super VIP'
    ELSE 'Ultra VIP'
  END,
  CASE
    WHEN g.coins <= 10 THEN 1
    WHEN g.coins <= 99 THEN 2
    WHEN g.coins <= 999 THEN 3
    WHEN g.coins <= 29999 THEN 4
    ELSE 5
  END,
  g.coins,
  CASE
    WHEN g.coins <= 10 THEN 'Small'
    WHEN g.coins <= 99 THEN 'Medium'
    WHEN g.coins <= 999 THEN 'Large'
    WHEN g.coins <= 29999 THEN 'Huge'
    ELSE 'Massive'
  END,
  CASE
    WHEN g.coins <= 10 THEN 2000
    WHEN g.coins <= 99 THEN 2500
    WHEN g.coins <= 999 THEN 3500
    WHEN g.coins <= 29999 THEN 5000
    ELSE 6500
  END,
  g.emoji
FROM (VALUES
  ('rose','Rose',1,'🌹'),
  ('heart_me','Heart Me',1,'💗'),
  ('tiktok','TikTok',1,'🎵'),
  ('gg','GG',1,'🎮'),
  ('coffee','Coffee',1,'☕'),
  ('ice_cream_cone','Ice Cream Cone',1,'🍦'),
  ('finger_heart','Finger Heart',5,'🫰'),
  ('rosa','Rosa',10,'🌷'),
  ('friendship_necklace','Friendship Necklace',10,'📿'),
  ('i_love_you','I Love You',10,'🤟'),
  ('perfume','Perfume',20,'🧴'),
  ('doughnut','Doughnut',30,'🍩'),
  ('takoyaki','Takoyaki',88,'🍢'),
  ('little_crown','Little Crown',99,'👑'),
  ('bubble_gum','Bubble Gum',99,'🍬'),
  ('heart','Heart',100,'❤️'),
  ('kiss','Kiss',150,'💋'),
  ('butterfly','Butterfly',169,'🦋'),
  ('hearts','Hearts',199,'💕'),
  ('sunglasses','Sunglasses',199,'🕶️'),
  ('corgi','Corgi',299,'🐶'),
  ('rock_n_roll','Rock ''n'' Roll',299,'🤘'),
  ('diamond_ring','Diamond Ring',300,'💍'),
  ('forever_rosa','Forever Rosa',399,'🌹'),
  ('coral','Coral',499,'🪸'),
  ('money_gun','Money Gun',500,'💸'),
  ('swan','Swan',699,'🦢'),
  ('cute_cat','Cute Cat',799,'🐱'),
  ('train','Train',899,'🚂'),
  ('airdrop_box','Airdrop Box',999,'📦'),
  ('galaxy','Galaxy',1000,'🌌'),
  ('diamond_tree','Diamond Tree',1088,'🌲'),
  ('fireworks','Fireworks',1088,'🎆'),
  ('champion','Champion',1500,'🏆'),
  ('mystery_fireworks','Mystery Fireworks',1999,'🎇'),
  ('diving_whale','Diving Whale',2150,'🐋'),
  ('elephant','Elephant',2500,'🐘'),
  ('magic_stage','Magic Stage',2599,'🪄'),
  ('ferris_wheel','Ferris Wheel',3000,'🎡'),
  ('sakura_train','Sakura Train',3999,'🚄'),
  ('jet','Jet',5000,'✈️'),
  ('interstellar','Interstellar',10000,'🛰️'),
  ('eagle','Eagle',10999,'🦅'),
  ('theme_park','Theme Park',17000,'🎠'),
  ('spaceship','Spaceship',20000,'🚀'),
  ('dragon_flame','Dragon Flame',26999,'🐉'),
  ('lion','Lion',29999,'🦁'),
  ('sam_the_whale','Sam the Whale',30000,'🐳'),
  ('leon_and_lion','Leon and Lion',34000,'🦁'),
  ('tiktok_stars','TikTok Stars',39999,'⭐'),
  ('tiktok_universe','TikTok Universe',44999,'🌌')
) AS g(gift_id, gift_name, coins, emoji)
ON CONFLICT (gift_id) DO NOTHING;