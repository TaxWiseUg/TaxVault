import glob
import csv
import json
import os

def sql_str(val):
    if val is None or val == "":
        return "NULL"
    val_str = str(val).replace("'", "''")
    return f"'{val_str}'"

def sql_json(val):
    if val is None:
        return "'{}'::jsonb"
    if isinstance(val, (dict, list)):
        raw = json.dumps(val)
    else:
        raw = str(val)
    raw = raw.replace("'", "''")
    return f"'{raw}'::jsonb"

def sql_num(val):
    if val is None or val == "":
        return "NULL"
    try:
        return str(int(val))
    except ValueError:
        try:
            return str(float(val))
        except ValueError:
            return "0"

def sql_arr(val):
    if not val:
        return "'{}'::text[]"
    if isinstance(val, list):
        items = [f'"{str(x).replace(chr(34), chr(92)+chr(34))}"' for x in val]
        arr_str = "{" + ",".join(items) + "}"
        return f"'{arr_str}'::text[]"
    return "'{}'::text[]"

# 1. Load tat_cases
tat_cases = []
seen_cases = set()
for f in sorted(glob.glob("scripts/tat_cases_part*.csv")):
    with open(f, encoding="utf-8", errors="replace") as fp:
        reader = csv.DictReader(fp)
        for r in reader:
            cid = r.get("id") or r.get("case_number")
            if cid not in seen_cases:
                seen_cases.add(cid)
                tat_cases.append(r)

print(f"Loaded {len(tat_cases)} TAT cases")

# 2. Load admin_logs
admin_logs = []
seen_logs = set()
with open("scripts/admin_logs.csv", encoding="utf-8", errors="replace") as fp:
    reader = csv.DictReader(fp)
    for r in reader:
        lid = r.get("id")
        if lid and lid not in seen_logs:
            seen_logs.add(lid)
            admin_logs.append(r)

print(f"Loaded {len(admin_logs)} admin logs")

# 3. Load from generate_data.py
from scripts.generate_data import SITE_SETTINGS, USERS, USER_PROGRESS, COMPLIANCE_CHECKS
from scripts.generate_imported_data_ts import COURSES, CASES

IMPORTED_COURSES = COURSES
IMPORTED_CASES = [
    {
        **c,
        "id": "e8174d44-d81a-4e70-9f4b-64744f969d01" if c["id"] == "case-demo-1" else "e8174d44-d81a-4e70-9f4b-64744f969d02"
    }
    for c in CASES
]

print(f"Loaded {len(SITE_SETTINGS)} settings, {len(USERS)} users, {len(USER_PROGRESS)} progress, {len(COMPLIANCE_CHECKS)} compliance")

sql_parts = []

sql_parts.append("""-- ==============================================================================
-- TAXWISE UGANDA — COMPLETE SUPABASE DATABASE SETUP & DATA POPULATION SCRIPT
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/_/sql
-- 2. Paste this entire script into the SQL Editor.
-- 3. Click 'Run'.
--
-- This script safely:
-- - Enables required PostgreSQL extensions (uuid-ossp)
-- - Creates all 9 tables if they do not exist
-- - Configures Row Level Security (RLS) and policies for anonymous/authenticated access
-- - Creates auto-sync trigger from auth.users to public.users
-- - Populates all real tables with the actual data from the imported CSV files:
--   * public.users (8 real users)
--   * public.site_settings (17 operational and tax rate keys)
--   * public.courses (3 comprehensive Uganda tax courses)
--   * public.tat_cases (68 Tax Appeals Tribunal court rulings with full text)
--   * public.enrollments (course enrollments and progress)
--   * public.compliance_reports (eFRIS compliance evaluations)
--   * public.cases (legal advisory case records)
--   * public.admin_logs (112 administrative audit logs)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TABLES
-- Note: id is UUID primary key. To allow seeding profiles while retaining auth link,
-- we use default gen_random_uuid().
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar UNIQUE NOT NULL,
  full_name varchar,
  role varchar DEFAULT 'Student',
  plan varchar DEFAULT 'free',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login timestamptz
);

CREATE TABLE IF NOT EXISTS public.tat_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number varchar UNIQUE NOT NULL,
  title varchar NOT NULL,
  year integer NOT NULL,
  tax_type varchar NOT NULL,
  outcome varchar NOT NULL,
  summary text NOT NULL,
  full_text text,
  ai_commentary text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.courses (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  level varchar NOT NULL,
  emoji varchar,
  color varchar,
  accent_color varchar,
  description text,
  lessons jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  course_id integer REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  progress integer DEFAULT 0,
  completed_lessons text[] DEFAULT '{}'::text[],
  completed_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.compliance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type varchar NOT NULL,
  responses jsonb NOT NULL,
  risk_report text NOT NULL,
  score integer DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title varchar NOT NULL,
  input_text text,
  pdf_path varchar,
  ai_summary jsonb,
  risk_level varchar,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key varchar PRIMARY KEY,
  value text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action varchar NOT NULL,
  performed_by uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  plan varchar NOT NULL,
  flutterwave_ref varchar,
  status varchar NOT NULL,
  starts_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. HELPER FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'Admin'
  );
END;
$$;

-- Trigger to automatically create a profile in public.users when a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, plan)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'Student'),
    'free'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.users.full_name END;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tat_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Tat Cases (Publicly readable)
DROP POLICY IF EXISTS "Anyone can read TAT precedents" ON public.tat_cases;
CREATE POLICY "Anyone can read TAT precedents" ON public.tat_cases FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage TAT precedents" ON public.tat_cases;
CREATE POLICY "Admins can manage TAT precedents" ON public.tat_cases FOR ALL USING (public.is_admin());

-- Site Settings (Publicly readable)
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL USING (public.is_admin());

-- Courses (Publicly readable)
DROP POLICY IF EXISTS "Anyone can read courses" ON public.courses;
CREATE POLICY "Anyone can read courses" ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.is_admin());

-- Users Policies
DROP POLICY IF EXISTS "Users can read own data or admin reads all" ON public.users;
CREATE POLICY "Users can read own data or admin reads all" ON public.users FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own data or admin updates all" ON public.users;
CREATE POLICY "Users can update own data or admin updates all" ON public.users FOR UPDATE USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Allow user profile creation" ON public.users;
CREATE POLICY "Allow user profile creation" ON public.users FOR INSERT WITH CHECK (true);

-- Cases Policies
DROP POLICY IF EXISTS "Users can CRUD own cases" ON public.cases;
CREATE POLICY "Users can CRUD own cases" ON public.cases FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Enrollments Policies
DROP POLICY IF EXISTS "Users can CRUD own enrollments" ON public.enrollments;
CREATE POLICY "Users can CRUD own enrollments" ON public.enrollments FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Compliance Reports Policies
DROP POLICY IF EXISTS "Users can CRUD own compliance reports" ON public.compliance_reports;
CREATE POLICY "Users can CRUD own compliance reports" ON public.compliance_reports FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Subscriptions Policies
DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL USING (public.is_admin());

-- Admin Logs Policies
DROP POLICY IF EXISTS "Admins can read admin logs" ON public.admin_logs;
CREATE POLICY "Admins can read admin logs" ON public.admin_logs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert admin logs" ON public.admin_logs;
CREATE POLICY "Admins can insert admin logs" ON public.admin_logs FOR INSERT WITH CHECK (public.is_admin());

-- ==============================================================================
-- 5. POPULATE DATABASE WITH ACTUAL IMPORTED DATA
-- ==============================================================================
""")

# Users
sql_parts.append("-- 5.1 USERS (from users_rows.csv)")
for u in USERS:
    sql_parts.append(f"""INSERT INTO public.users (id, email, full_name, role, plan, created_at)
VALUES ({sql_str(u['id'])}::uuid, {sql_str(u['email'])}, {sql_str(u['full_name'])}, {sql_str(u['role'])}, {sql_str(u['plan'])}, {sql_str(u['created_at'])}::timestamptz)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, plan = EXCLUDED.plan;""")

# Site Settings
sql_parts.append("\n-- 5.2 SITE SETTINGS (from site_settings_rows.csv)")
for s in SITE_SETTINGS:
    sql_parts.append(f"""INSERT INTO public.site_settings (key, value)
VALUES ({sql_str(s['key'])}, {sql_str(s['value'])})
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;""")

# Courses
sql_parts.append("\n-- 5.3 COURSES (from courses_rows.csv)")
for c in IMPORTED_COURSES:
    sql_parts.append(f"""INSERT INTO public.courses (id, title, level, emoji, color, accent_color, description, lessons)
VALUES ({c['id']}, {sql_str(c['title'])}, {sql_str(c['level'])}, {sql_str(c['emoji'])}, {sql_str(c['color'])}, {sql_str(c['accent_color'])}, {sql_str(c['description'])}, {sql_json(c['lessons'])})
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, level = EXCLUDED.level, emoji = EXCLUDED.emoji, color = EXCLUDED.color, accent_color = EXCLUDED.accent_color, description = EXCLUDED.description, lessons = EXCLUDED.lessons;""")

# Enrollments
sql_parts.append("\n-- 5.4 ENROLLMENTS (from enrollments_rows.csv)")
for e in USER_PROGRESS:
    comp_at = f"{sql_str(e['completed_at'])}::timestamptz" if e.get('completed_at') else "NULL"
    sql_parts.append(f"""INSERT INTO public.enrollments (id, user_id, course_id, progress, completed_lessons, completed_at, created_at)
VALUES ({sql_str(e['id'])}::uuid, {sql_str(e['user_id'])}::uuid, {e['course_id']}, {e['progress']}, {sql_arr(e['completed_lessons'])}, {comp_at}, {sql_str(e['created_at'])}::timestamptz)
ON CONFLICT (user_id, course_id) DO UPDATE SET progress = EXCLUDED.progress, completed_lessons = EXCLUDED.completed_lessons;""")

# Compliance Reports
sql_parts.append("\n-- 5.5 COMPLIANCE REPORTS (from compliance_reports_rows.csv)")
for cr in COMPLIANCE_CHECKS:
    sql_parts.append(f"""INSERT INTO public.compliance_reports (id, user_id, type, responses, risk_report, score, created_at)
VALUES ({sql_str(cr['id'])}::uuid, {sql_str(cr['user_id'])}::uuid, {sql_str(cr['type'])}, {sql_json(cr.get('responses', {}))}, {sql_str(cr['risk_report'])}, {cr['score']}, {sql_str(cr['created_at'])}::timestamptz)
ON CONFLICT (id) DO UPDATE SET responses = EXCLUDED.responses, risk_report = EXCLUDED.risk_report, score = EXCLUDED.score;""")

# Cases
sql_parts.append("\n-- 5.6 CASES (from cases_rows.csv)")
for cs in IMPORTED_CASES:
    sql_parts.append(f"""INSERT INTO public.cases (id, user_id, title, input_text, pdf_path, ai_summary, risk_level, tags, created_at)
VALUES ({sql_str(cs['id'])}::uuid, {sql_str(cs['user_id'])}::uuid, {sql_str(cs['title'])}, {sql_str(cs.get('input_text'))}, {sql_str(cs.get('pdf_path'))}, {sql_json(cs.get('ai_summary'))}, {sql_str(cs.get('risk_level'))}, {sql_arr(cs.get('tags', []))}, {sql_str(cs['created_at'])}::timestamptz)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, ai_summary = EXCLUDED.ai_summary, risk_level = EXCLUDED.risk_level;""")

# Admin Logs
sql_parts.append("\n-- 5.7 ADMIN LOGS (from admin_logs_rows.csv)")
for al in admin_logs:
    meta_val = al.get("metadata") or "{}"
    sql_parts.append(f"""INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ({sql_str(al['id'])}::uuid, {sql_str(al['action'])}, {sql_str(al['performed_by'])}::uuid, {sql_json(meta_val)}, {sql_str(al['created_at'])}::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;""")

# TAT Cases
sql_parts.append("\n-- 5.8 TAT CASE PRECEDENTS (from tat_cases_rows.csv)")
for tc in tat_cases:
    created = tc.get("created_at") or "now()"
    sql_parts.append(f"""INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ({sql_str(tc['id'])}::uuid, {sql_str(tc['case_number'])}, {sql_str(tc['title'])}, {sql_num(tc['year'])}, {sql_str(tc['tax_type'])}, {sql_str(tc['outcome'])}, {sql_str(tc['summary'])}, {sql_str(tc.get('full_text'))}, {sql_str(tc.get('ai_commentary'))}, {sql_str(created)}::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;""")

final_sql = "\n".join(sql_parts)

os.makedirs("supabase", exist_ok=True)
with open("supabase_setup_and_seed.sql", "w", encoding="utf-8") as fp:
    fp.write(final_sql)

with open("supabase/setup_and_seed.sql", "w", encoding="utf-8") as fp:
    fp.write(final_sql)

with open("supabase/seed.sql", "w", encoding="utf-8") as fp:
    fp.write(final_sql)

print(f"Generated complete SQL file ({len(final_sql)} chars)")
