-- ==============================================================================
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

-- 5.1 USERS (from users_rows.csv)
INSERT INTO public.users (id, email, full_name, role, plan, created_at)
VALUES ('0ef2a671-722d-465b-bb01-6baba1c94690'::uuid, 'nexoshealthai@gmail.com', 'Nexos', 'Tax Consultant', 'free', '2026-07-07 08:22:27.659493+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, plan = EXCLUDED.plan;
INSERT INTO public.users (id, email, full_name, role, plan, created_at)
VALUES ('2659af7a-7132-426d-a1fb-a3fbe5a12848'::uuid, 'princefredkent@gmail.com', 'Fred Kent', 'Admin', 'free', '2026-06-15 06:23:29.093788+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, plan = EXCLUDED.plan;
INSERT INTO public.users (id, email, full_name, role, plan, created_at)
VALUES ('46b4e1df-8bee-4dee-bfcc-24b8614999fd'::uuid, 'ec632145@gmail.com', 'Eric', 'Tax Consultant', 'free', '2026-10-07 19:31:02.448999+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, plan = EXCLUDED.plan;
INSERT INTO public.users (id, email, full_name, role, plan, created_at)
VALUES ('5882774d-39e0-4b2e-a7a1-90551ebbd4dd'::uuid, 'test69@gmail.com', 'Test 69', 'Tax Consultant', 'free', '2026-07-09 07:31:27.301119+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, plan = EXCLUDED.plan;
INSERT INTO public.users (id, email, full_name, role, plan, created_at)
VALUES ('67c34b59-ac3e-487a-9601-712af19c14f4'::uuid, 'princefattahkent@gmail.com', 'Tester', 'Tax Consultant', 'free', '2026-06-20 06:30:22.183942+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, plan = EXCLUDED.plan;
INSERT INTO public.users (id, email, full_name, role, plan, created_at)
VALUES ('8f1022eb-171c-4845-9910-f097fe54657d'::uuid, 'geraldmuwanguzi50@gmail.com', 'Muwanguzi Gerald', 'Tax Consultant', 'free', '2026-07-11 18:00:15.555553+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, plan = EXCLUDED.plan;
INSERT INTO public.users (id, email, full_name, role, plan, created_at)
VALUES ('a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, 'bakulumpagieric99@gmail.com', 'ERIC', 'Admin', 'free', '2026-07-04 13:51:00.943779+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, plan = EXCLUDED.plan;
INSERT INTO public.users (id, email, full_name, role, plan, created_at)
VALUES ('f8174d44-d81a-4e70-9f4b-64744f969d09'::uuid, 'taxwiseplatform@gmail.com', 'Tester123', 'Tax Consultant', 'free', '2026-07-04 11:36:52.408438+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, plan = EXCLUDED.plan;

-- 5.2 SITE SETTINGS (from site_settings_rows.csv)
INSERT INTO public.site_settings (key, value)
VALUES ('calc_corporate_rate', '30')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('calc_import_rate', '43')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('calc_paye_rate', '12')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('calc_vat_rate', '18')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('calc_wht_rate', '6')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('hero_badge_text', 'Built for Uganda Tax & Customs Professionals')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('hero_subtitle', 'AI case analysis, TAT precedent research, live tax & import calculators, and compliance checking tools — purpose-built for Uganda''s tax ecosystem.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('hero_title_line1', 'The tax intelligence')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('hero_title_line2', 'platform your practice')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('hero_title_line3', 'actually needs')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('pesapal_ipn_id_production', '556a236c-3976-40da-8305-da35dcc97ba4')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('stat_calculators', '6')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('stat_cases', '1,200+')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('stat_practitioners', '350+')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('stat_time_saved', '85%')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('topbar_email', 'hello@taxwise.cloud')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO public.site_settings (key, value)
VALUES ('topbar_text', '🇺🇬 Engineered for Uganda''s Tax & Customs Ecosystem')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 5.3 COURSES (from courses_rows.csv)
INSERT INTO public.courses (id, title, level, emoji, color, accent_color, description, lessons)
VALUES (1, 'Uganda Tax Fundamentals', 'Beginner', '📘', '#E6F5F2', '#1A7B6B', 'Master Income Tax, VAT, PAYE, and withholding tax from scratch. Built for new business owners and accounting students.', '[{"id": "1a", "title": "Introduction to Uganda''s Tax System", "duration": "15 min", "content": "Uganda''s tax system is administered by the Uganda Revenue Authority (URA), established under the Uganda Revenue Authority Act, Cap 196. The main taxes include: **Income Tax** (governed by the Income Tax Act, Cap 340), **Value Added Tax** (VAT Act, Cap 349), **Pay As You Earn** (PAYE \u2014 a form of Income Tax), **Withholding Tax**, and **Excise Duty**.\n\nThe URA is divided into the Domestic Taxes Department (handling income tax, VAT, PAYE) and the Customs Department (handling import/export duties).\n\n**Key Principle:** Tax is a legal obligation. Every person earning income above the threshold, every registered business, and every employer must comply with Uganda''s tax laws or face penalties and interest."}, {"id": "1b", "title": "Income Tax \u2014 Who Pays & How Much", "duration": "20 min", "content": "**Individual Income Tax** applies to all income earned by residents and non-residents from Ugandan sources. Rates for individuals (2024/25):\n\n- Income up to UGX 2,820,000/year: **0% (exempt)**\n- UGX 2,820,001 \u2013 4,920,000: **10%**\n- UGX 4,920,001 \u2013 120,000,000: **20%**\n- Above UGX 120,000,000: **30%**\n\n**Corporate Tax** is charged at **30%** of chargeable income for resident companies. Agribusiness companies enjoy a reduced rate of **25%**.\n\n**Filing:** Individual tax returns are due by **30 June** each year. Corporate returns are due **6 months** after the end of the accounting period."}, {"id": "1c", "title": "VAT \u2014 Registration, Rates & Filing", "duration": "25 min", "content": "**VAT Registration** is mandatory when taxable turnover exceeds **UGX 150 million** in any 12-month period. Voluntary registration is allowed below this threshold.\n\n**VAT Rates:**\n- Standard rate: **18%** on most goods and services\n- Zero-rated (0%): Exports, some foodstuffs, educational materials\n- Exempt: Medical services, financial services, residential accommodation\n\n**Input VAT:** Registered taxpayers can claim back VAT paid on business purchases (input tax) against VAT collected on sales (output tax). The difference is either paid to URA or refunded.\n\n**Filing:** VAT returns are due on the **15th of the following month**. Late filing attracts a penalty of **2% per month** on the outstanding tax."}, {"id": "1d", "title": "PAYE \u2014 Employer Obligations", "duration": "20 min", "content": "**PAYE (Pay As You Earn)** requires every employer to deduct income tax from employees'' salaries and remit to URA by the **15th of the following month**.\n\n**Employer Duties:**\n1. Register with URA as an employer\n2. Obtain Tax Identification Numbers (TINs) for all employees\n3. Calculate tax on gross pay minus allowable deductions\n4. Deduct NSSF (10% employee, 10% employer)\n5. File PAYE return and pay by the 15th\n\n**Key Risk:** Failure to deduct and remit PAYE makes the **employer personally liable** for the tax plus 2% monthly interest plus penalties up to 20% of the tax due."}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, level = EXCLUDED.level, emoji = EXCLUDED.emoji, color = EXCLUDED.color, accent_color = EXCLUDED.accent_color, description = EXCLUDED.description, lessons = EXCLUDED.lessons;
INSERT INTO public.courses (id, title, level, emoji, color, accent_color, description, lessons)
VALUES (2, 'TAT Appeals: Process & Strategy', 'Intermediate', '⚖️', '#FEF3CD', '#C8922A', 'Master the Tax Appeals Tribunal process — from objections to appeals, jurisdiction rules, and building a winning case.', '[{"id": "2a", "title": "The TAT \u2014 Structure & Jurisdiction", "duration": "20 min", "content": "The **Tax Appeals Tribunal (TAT)** was established under the Tax Appeals Tribunal Act, Cap 345. It provides an independent forum for taxpayers to challenge URA decisions without going to the High Court first.\n\n**Jurisdiction:** The TAT hears appeals against:\n- URA assessments and amended assessments\n- Refusal to grant refunds\n- Penalties and interest charges\n- Decisions on objections\n\n**Composition:** The TAT consists of a Chairperson (must be an advocate of 10+ years), Deputy Chairperson, and members appointed by the Minister of Finance.\n\n**Critical Limitation:** The TAT **cannot** hear matters where no objection was first filed with URA, or where the 30-day filing window has lapsed."}, {"id": "2b", "title": "The 30-Day Rule \u2014 Uganda''s Most Critical Tax Deadline", "duration": "25 min", "content": "**Section 14 of the TAT Act** requires that any appeal must be filed **within 30 days** of receiving URA''s objection decision.\n\n**This is the most litigated issue in Uganda tax law.** Missing this deadline means:\n1. The TAT has **no jurisdiction** to hear your appeal\n2. The case will be **dismissed** regardless of its merits\n3. You lose the right to challenge the assessment at TAT level\n\n**Case Study \u2014 Edward Mwanje v URA (TAT No. 145/2025):** The taxpayer filed 45 days after receiving URA''s objection decision. The TAT dismissed the appeal for lack of jurisdiction. The merits of the case were never considered.\n\n**Practical Tips:**\n- Diarise the deadline the day you receive URA''s decision\n- File even a basic notice of appeal to preserve jurisdiction\n- Always request an acknowledgement of receipt from TAT"}, {"id": "2c", "title": "Filing an Objection with URA", "duration": "20 min", "content": "Before going to TAT, you must first file an **objection with URA**. This is a mandatory pre-condition.\n\n**Objection Requirements (Section 101, Income Tax Act):**\n- Filed within **45 days** of receiving the assessment\n- Must state the **grounds of objection** in detail\n- Must be in **writing** addressed to the Commissioner\n- Must include all supporting documents\n\n**URA''s Response:** URA must issue an objection decision within **90 days**. If they fail to respond within 90 days, the taxpayer may proceed directly to TAT treating the silence as a deemed refusal.\n\n**Deposit Requirement:** Where the assessment is above UGX 50 million, URA may require a deposit of **30% of the disputed tax** before the objection is heard."}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, level = EXCLUDED.level, emoji = EXCLUDED.emoji, color = EXCLUDED.color, accent_color = EXCLUDED.accent_color, description = EXCLUDED.description, lessons = EXCLUDED.lessons;
INSERT INTO public.courses (id, title, level, emoji, color, accent_color, description, lessons)
VALUES (3, 'URA eFRIS Mastery', 'Professional', '🖥️', '#E8EDF5', '#0F2044', 'Complete compliance guide for Uganda''s Electronic Fiscal Receipting & Invoicing System. For tax agents and business owners.', '[{"id": "3a", "title": "What is eFRIS and Who Must Use It", "duration": "15 min", "content": "**eFRIS (Electronic Fiscal Receipting and Invoicing Solution)** is URA''s system requiring businesses to issue electronic receipts for all taxable sales. It was rolled out in phases starting 2021.\n\n**Who Must Comply:**\n- All VAT-registered taxpayers\n- Businesses with turnover above UGX 50 million\n- Hotels, supermarkets, fuel stations, pharmacies (regardless of turnover)\n- Any business directed by URA to adopt eFRIS\n\n**How It Works:** A fiscal device (Electronic Receipting Device \u2014 ERD) is connected to your point of sale. Every sale is transmitted in real-time to URA''s central server and a QR-coded fiscal receipt is issued to the customer.\n\n**Non-Compliance Penalties:** Failure to issue fiscal receipts attracts a penalty of **UGX 2 million per day** of non-compliance."}, {"id": "3b", "title": "eFRIS Registration & Setup", "duration": "20 min", "content": "**Step-by-Step eFRIS Registration:**\n\n1. Log in to URA''s TaxPro system (efris.ura.go.ug)\n2. Navigate to eFRIS \u2192 Business Registration\n3. Enter your TIN, business name, and branch details\n4. Select your ERD type (integrated VSDC or web-based)\n5. Submit and await URA approval (typically 2-5 business days)\n6. Collect or configure your fiscal device\n7. Test with URA before going live\n\n**Device Types:**\n- **VSDC (Virtual Sales Data Controller):** Software installed on your POS system\n- **Physical ERD:** Hardware device for businesses without POS software\n- **Web-based eFRIS:** Direct web interface for low-volume businesses\n\n**Important:** All devices must be activated by URA before first use. Do not issue receipts on unactivated devices."}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, level = EXCLUDED.level, emoji = EXCLUDED.emoji, color = EXCLUDED.color, accent_color = EXCLUDED.accent_color, description = EXCLUDED.description, lessons = EXCLUDED.lessons;

-- 5.4 ENROLLMENTS (from enrollments_rows.csv)
INSERT INTO public.enrollments (id, user_id, course_id, progress, completed_lessons, completed_at, created_at)
VALUES ('14360c7a-eb63-444f-92c6-9c5c2880e886'::uuid, '2659af7a-7132-426d-a1fb-a3fbe5a12848'::uuid, 1, 0, '{}'::text[], NULL, '2026-06-15 07:49:06.881828+00'::timestamptz)
ON CONFLICT (user_id, course_id) DO UPDATE SET progress = EXCLUDED.progress, completed_lessons = EXCLUDED.completed_lessons;
INSERT INTO public.enrollments (id, user_id, course_id, progress, completed_lessons, completed_at, created_at)
VALUES ('7f172271-2a1d-42ac-95b6-e9984d624d93'::uuid, 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, 2, 0, '{}'::text[], NULL, '2026-07-04 16:02:00.149399+00'::timestamptz)
ON CONFLICT (user_id, course_id) DO UPDATE SET progress = EXCLUDED.progress, completed_lessons = EXCLUDED.completed_lessons;

-- 5.5 COMPLIANCE REPORTS (from compliance_reports_rows.csv)
INSERT INTO public.compliance_reports (id, user_id, type, responses, risk_report, score, created_at)
VALUES ('1cbdf1d3-142f-4eb4-812c-4d9b5715557d'::uuid, 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, 'efris', '{}'::jsonb, '# EFRIS Compliance Risk Report

## Overall Risk Assessment

**Current Compliance Score: 0%**

The current compliance score of 0% indicates a **critical level of non-compliance** with Uganda Revenue Authority eFRIS requirements.', 0, '2026-07-15 10:58:30.235823+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET responses = EXCLUDED.responses, risk_report = EXCLUDED.risk_report, score = EXCLUDED.score;
INSERT INTO public.compliance_reports (id, user_id, type, responses, risk_report, score, created_at)
VALUES ('e0aa48fc-971c-472c-8ef8-af2402bc7af3'::uuid, 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, 'efris', '{}'::jsonb, '## Risk Report: eFRIS Compliance Assessment

**Date:** October 26, 2023

---

### 1. Overall Risk Assessment

**Current Compliance Score:** 0%
**Threat Level:** Critical

The current compliance score of 0% indicates a complete and systemic failure to adhere to the Electronic Fiscal Receipting and Invoicing System (eFRIS) requirements as mandated by the Uganda Revenue Authority', 0, '2026-07-06 07:12:43.790615+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET responses = EXCLUDED.responses, risk_report = EXCLUDED.risk_report, score = EXCLUDED.score;

-- 5.6 CASES (from cases_rows.csv)
INSERT INTO public.cases (id, user_id, title, input_text, pdf_path, ai_summary, risk_level, tags, created_at)
VALUES ('e8174d44-d81a-4e70-9f4b-64744f969d01'::uuid, 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, 'Uganda Clays VAT Input Audit Assessment', 'Taxpayer disputed disallowed input tax on industrial machinery purchased in 2024.', NULL, '{"summary": "Assessment of VAT input credit eligibility on imported capital equipment.", "keyIssues": ["Input VAT deductibility", "Customs clearance documentation", "Statutory time limits"], "verdict": "High probability of success on appeal", "risk": "low", "riskNote": "Valid bills of entry and custom receipts exist.", "tags": ["VAT", "Input Tax", "Machinery"], "advice": "Proceed with formal objection under Section 24 of Tax Procedures Code Act.", "applicableLaw": ["VAT Act Section 28", "Tax Procedures Code Act Section 24"]}'::jsonb, 'low', '{"VAT","Input Tax","Machinery"}'::text[], '2026-07-05 14:10:00+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, ai_summary = EXCLUDED.ai_summary, risk_level = EXCLUDED.risk_level;
INSERT INTO public.cases (id, user_id, title, input_text, pdf_path, ai_summary, risk_level, tags, created_at)
VALUES ('e8174d44-d81a-4e70-9f4b-64744f969d02'::uuid, '2659af7a-7132-426d-a1fb-a3fbe5a12848'::uuid, 'Mukwano Industries PAYE Casual Workers Review', 'Audit regarding tax treatment of seasonal agricultural labor.', NULL, '{"summary": "Review of casual laborers classification under Income Tax Act Section 19.", "keyIssues": ["Employee vs Independent Contractor", "Withholding tax obligation", "Penalty mitigation"], "verdict": "Medium risk of partial liability", "risk": "medium", "riskNote": "Some seasonal workers work consistently across planting cycles.", "tags": ["PAYE", "Employment Taxes", "Agriculture"], "advice": "Apply precedent in Kiboga Farmers Cooperative v URA (TAT No. 033/2023) for penalty waiver.", "applicableLaw": ["Income Tax Act Section 19", "Tax Procedures Code Act Section 52"]}'::jsonb, 'medium', '{"PAYE","Employment Taxes","Agriculture"}'::text[], '2026-07-06 09:30:00+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, ai_summary = EXCLUDED.ai_summary, risk_level = EXCLUDED.risk_level;

-- 5.7 ADMIN LOGS (from admin_logs_rows.csv)
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('00ba8ec4-26bb-4f6e-af7b-4ac3ea9b4887'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 207 of 2024"}'::jsonb, '2026-07-06 11:21:56.065154+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('0459aa6d-9f46-423b-b863-9cbde66262b5'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 68 of 2024"}'::jsonb, '2026-07-04 20:00:36.539188+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('05853743-9cdd-4fe6-a4df-9a95b9df1797'::uuid, 'precedent_deleted', '2659af7a-7132-426d-a1fb-a3fbe5a12848'::uuid, '{"case_number":"APPLICATION NO. 73 Of 2026","precedent_id":"06254497-99c9-4e76-8120-2971eb3cf8af"}'::jsonb, '2026-07-04 14:53:13.849755+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('0b7cc3c2-7c73-42fe-b50a-425f088a954c'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 54 OF 2022"}'::jsonb, '2026-07-04 19:59:22.66663+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('0f8b9034-9bf0-4e9d-a60a-e3963e0f16c6'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 98 OF 2025"}'::jsonb, '2026-07-04 16:57:07.964657+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('10188540-1dfd-4900-a4d5-f8f3d9434ac1'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"MISC. APPLICATION NO.72/2024 (ARISING FROM TAT NO. 135/2023)"}'::jsonb, '2026-07-06 11:18:50.284515+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('144d59ad-883c-41fe-ab15-b1dbb3df3765'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 36 OF 2020"}'::jsonb, '2026-07-04 15:35:55.925471+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('161e3230-ebcc-4095-a325-4885fad178a3'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 113 of 2025"}'::jsonb, '2026-07-04 21:31:01.710612+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('1c5ed3e4-2d32-4da7-9098-962ebc4e2cb8'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 251 OF 2022"}'::jsonb, '2026-07-04 16:18:26.230405+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('20be0b54-3f24-4208-b7c5-e5cf555befd8'::uuid, 'precedent_created', '2659af7a-7132-426d-a1fb-a3fbe5a12848'::uuid, '{"case_number":"TAT No. 185 of 2025"}'::jsonb, '2026-07-04 09:41:19.748459+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('24119c36-d4c6-42a2-befa-512f59d1d443'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"MISC APPLICATION NO. 82 & 97 OF 2025 (ARISING FROM TAT APPLICATION NO. 118 & 131 OF 2025)"}'::jsonb, '2026-07-07 16:59:37.129032+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('25b617de-2d6f-4a8e-b1a2-ffb9f41967ed'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 381 OF 2024"}'::jsonb, '2026-07-04 17:00:52.060776+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('2ddfb1b8-2f23-4a65-be06-3aa7bf571a1b'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 276 OF 2024"}'::jsonb, '2026-07-04 21:29:28.137528+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('2e5a0e0b-164e-4bb0-a62c-d84d35e8f933'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 128 OF 2025"}'::jsonb, '2026-07-04 16:08:02.124039+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('2fd94b3f-b861-4992-ab70-ebde39041e21'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 366 OF 2024"}'::jsonb, '2026-07-04 16:58:59.212689+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('2ff3f5e5-4778-4ae5-a807-989aa8e1fe80'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 004 of 2024"}'::jsonb, '2026-07-06 18:11:48.34424+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('317a740d-24e7-4a9c-bb56-407412d918a8'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO.193 OF 2024"}'::jsonb, '2026-07-04 15:24:01.329645+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('3326be69-d24a-4588-b0bc-05e1444369b1'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APLICATION NO. 259 OF 2022"}'::jsonb, '2026-07-04 15:50:05.330903+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('348444a9-efc7-4801-8136-fd0f9a6eadd8'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 93 of 2022"}'::jsonb, '2026-07-04 15:19:03.225426+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('360d9825-699f-4ef9-b543-5bf6dd8370d9'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT ARU NO. 002 OF 2024"}'::jsonb, '2026-07-04 15:48:18.48643+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('38cf6a9a-b5f0-45dc-911f-8fda75cf31e7'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 005 of 2024"}'::jsonb, '2026-07-04 20:09:37.505525+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('3abd0d6d-c789-4cd0-a116-0b41202344c7'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 300 OF 2024"}'::jsonb, '2026-07-04 21:30:19.425498+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('3c369700-cbe1-4015-85de-01eb2fe38a7a'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO.57 OF 2023"}'::jsonb, '2026-07-04 15:59:44.221284+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('41c63145-9519-4454-bce1-af5f0c3762c6'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 331 OF 2024"}'::jsonb, '2026-07-04 20:08:20.327684+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('41ca14bf-76ad-4b8d-ab30-29ef04f96516'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 274 OF 2025"}'::jsonb, '2026-07-06 18:10:37.643779+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('41da55fb-c0f3-4802-bc9c-dd3f1e3fe26d'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 303 OF 2024"}'::jsonb, '2026-07-08 10:00:05.573078+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('42dc8276-694a-4f81-bfdf-4560310f9eca'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 10 OF 2024"}'::jsonb, '2026-07-04 15:58:38.84677+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('43bba7ab-4532-4a65-8983-b1f193f229e2'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"MISCELLANEOUS APPLICATION NO. 130 OF 2024 (ARISING OUT OF TAT APPLICATION NO.227 OF 2022)"}'::jsonb, '2026-07-06 17:57:01.738371+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('4441d95c-81ae-4bab-8aa2-b90b5caf27fb'::uuid, 'precedent_created', '2659af7a-7132-426d-a1fb-a3fbe5a12848'::uuid, '{"case_number":"APPLICATION NO. 73 Of 2026"}'::jsonb, '2026-07-04 15:12:49.675243+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('448ccdb0-c2db-46ee-bd87-b306dad3199b'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 008 of 2023"}'::jsonb, '2026-07-04 15:46:05.396627+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('494bcf7f-eda1-4dfd-842d-3a45262066e2'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":""}'::jsonb, '2026-07-04 15:22:33.019728+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('4e9f2ea5-20f2-4463-bc08-dc9cc2a5417e'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 207 OF 2023"}'::jsonb, '2026-07-04 16:22:49.361563+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('4f157430-2230-42f1-956e-4ad8ac8a3bca'::uuid, 'course_updated', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"title":"TAT Appeals: Process & Strategy","course_id":2}'::jsonb, '2026-07-04 15:08:11.028585+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('50fca810-3309-410a-b7c5-f0bccc8ea757'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 242 OF 2022"}'::jsonb, '2026-07-04 22:05:38.926302+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('541a9d45-186f-4808-acfb-112887760488'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 182 of 2024"}'::jsonb, '2026-07-04 16:16:51.121735+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('54f0beda-54c9-4dd0-9590-0afbd7224329'::uuid, 'precedent_created', '2659af7a-7132-426d-a1fb-a3fbe5a12848'::uuid, '{"case_number":"APPLICATION NO. 73 Of 2026"}'::jsonb, '2026-07-04 14:53:44.775604+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('56e7b2c0-3ef1-4a24-be4a-06d1a01a4968'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 63 OF 2024"}'::jsonb, '2026-07-06 11:21:11.345902+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('5b38f3e9-564d-412a-b05e-d1c69276b548'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 183 OF 2024"}'::jsonb, '2026-07-04 20:04:11.256718+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('5cab29ce-faeb-4a29-9b04-a9da3dbc47c8'::uuid, 'user_deleted', '2659af7a-7132-426d-a1fb-a3fbe5a12848'::uuid, '{"email":"princefattahkent@gmail.com","user_id":"67c34b59-ac3e-487a-9601-712af19c14f4"}'::jsonb, '2026-06-20 10:26:48.810701+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('5ecc16fb-f4cd-4aa1-8a2b-0943d67b9cdc'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 29 OF 2024"}'::jsonb, '2026-07-04 15:46:38.955816+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('60fe818e-f586-4630-b9d3-a0b8c13fcce5'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 249 OF 2022"}'::jsonb, '2026-07-04 16:00:47.986649+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('630e262b-6814-4f7e-b9b3-7f4eaee474b2'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 81 OF 2024"}'::jsonb, '2026-07-04 20:21:13.851517+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('6509cc14-3d3a-4b07-83f4-160a709ee369'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATIONS NO. 139, 144, 240, 270 & 330, 274, 304, 312, 332, 342, 380 OF 2024"}'::jsonb, '2026-07-04 16:23:53.314577+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('67506740-b261-4f5e-bf2e-2ff9f19c4566'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 238 OF 2024"}'::jsonb, '2026-07-04 16:45:29.985566+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('6b2d300a-38a1-4984-84e1-108792bf7ea4'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 063 of 2023"}'::jsonb, '2026-07-04 15:21:34.912651+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('6c62e450-f923-4d59-8c06-56339867c93b'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 220 of 2025"}'::jsonb, '2026-07-06 18:16:08.379965+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('6c9cc418-27db-463d-b6b1-6915c5e200d1'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 021 of 2025"}'::jsonb, '2026-07-04 20:10:24.504086+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('6cb1f6d4-b541-4aed-b798-cae64099fb49'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"MISCELLANEOUS APPLICATION NO.213 OF 2025 (ARISING FROM TAT APPLICATIONS NO 169 OF 2024)"}'::jsonb, '2026-07-06 18:05:07.717139+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('70fe95e5-3263-4f97-a4a5-3e5fdcb96831'::uuid, 'precedent_deleted', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"","precedent_id":"fc64b353-fdfe-4e96-9de7-c4ef7d31deb7"}'::jsonb, '2026-07-04 15:45:02.749438+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('714073b5-b9f1-4b63-a412-3f68149cc810'::uuid, 'precedent_created', '2659af7a-7132-426d-a1fb-a3fbe5a12848'::uuid, '{"case_number":"APPLICATION NO. 73 Of 2026"}'::jsonb, '2026-07-04 15:02:50.600626+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('78262304-d4c1-46c8-9ab0-e9d3a1c59e76'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 188 OF 2024"}'::jsonb, '2026-07-04 20:25:54.443196+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('78dcb2a6-d16c-4087-afb1-00effe516bec'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 228 of 2022"}'::jsonb, '2026-07-04 15:18:21.517291+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('80906da1-7380-4eb2-b885-5ac85bded03d'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 12 OF 2024"}'::jsonb, '2026-07-04 21:39:36.572116+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('82eae7a2-a3f9-4dda-bb91-3f0190f65eb8'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 59 of 2023"}'::jsonb, '2026-07-04 16:44:38.171497+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('88482f27-f744-44c1-b7ea-c32d382a4878'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 219 OF 2023"}'::jsonb, '2026-07-04 19:59:55.171648+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('896e80f2-d806-4a5f-93d5-fce1ef1924bc'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 170 of 2023"}'::jsonb, '2026-07-04 16:09:06.020298+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('8b52c898-d35f-45ea-923d-80008d7064ab'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 378 of 2024"}'::jsonb, '2026-07-04 20:19:41.970962+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('8d8b3695-e914-4da2-883a-d74ff4bd6259'::uuid, 'user_updated', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"user_id":"a9e5e811-1a15-4c68-be82-faa5ce05bc24","new_plan":"professional","new_role":"Admin"}'::jsonb, '2026-07-04 20:32:52.849619+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('914dd381-237a-4080-986d-f63634fb1a1b'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 164 OF 2022"}'::jsonb, '2026-07-04 16:16:08.000132+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('9c72e896-dfed-4fc6-ab10-c1ed5cfaaf91'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 131 OF 2022"}'::jsonb, '2026-07-04 20:03:37.67493+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('a1c0af30-c314-4f3c-918d-888fbd6f75e2'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 348 OF 2024"}'::jsonb, '2026-07-04 20:22:03.606616+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('a22e771e-7f7d-4e90-912c-121cb7258873'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 293 OF 2024"}'::jsonb, '2026-07-04 21:40:32.380157+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('a47bf9dd-9132-4892-9561-3e9efa2fc627'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 82 OF 2023"}'::jsonb, '2026-07-04 21:33:44.627306+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('abb16ab2-5c26-4fc8-bf4a-86face242dca'::uuid, 'precedent_deleted', '2659af7a-7132-426d-a1fb-a3fbe5a12848'::uuid, '{"case_number":"APPLICATION NO. 73 Of 2026","precedent_id":"dada4fe4-9fc1-4927-965d-c5b358f30864"}'::jsonb, '2026-07-04 15:12:27.615878+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('ac2b8233-cf41-4cc9-8b70-c72132d22cc8'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 107 of 2023"}'::jsonb, '2026-07-04 16:55:36.661006+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('ad806a1b-9381-408b-82d8-d76656f5bffc'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 16 OF 2024"}'::jsonb, '2026-07-04 15:22:14.142622+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('aefd16d9-d502-4fd2-9a8b-084ef3435e7c'::uuid, 'user_updated', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"user_id":"a9e5e811-1a15-4c68-be82-faa5ce05bc24","new_plan":"free","new_role":"Admin"}'::jsonb, '2026-07-04 20:34:00.769809+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('af94b799-c72e-4838-bdf2-4fd66b08e3fd'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 103 OF 2022"}'::jsonb, '2026-07-04 15:24:41.381626+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('b12604ee-d84d-4df8-85d2-9f51fb42a217'::uuid, 'course_updated', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"title":"URA eFRIS Mastery","course_id":3}'::jsonb, '2026-07-04 15:33:41.94555+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('b332867b-4d4f-4221-8c40-13bc1395101d'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 90 OF 2025"}'::jsonb, '2026-07-04 21:31:52.486068+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('b3f8042c-f1c3-4b72-9ce1-f5a69358351b'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 179 OF 2025."}'::jsonb, '2026-07-04 15:54:11.157472+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('b67be1bf-0edf-4e62-8a89-b8016a979b45'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 36 OF 2025"}'::jsonb, '2026-07-04 16:52:37.804587+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('b7f41cad-32fa-49a9-ba97-08df0e42e673'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 282 OF 2025"}'::jsonb, '2026-07-04 21:34:30.803543+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('b806cb61-7554-44e9-92c3-c1703f97a5b7'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 69 OF 2023"}'::jsonb, '2026-07-04 15:35:04.876913+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('b8a462d7-5084-4dcf-9735-7fab59a6fff3'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 94 OF 2025"}'::jsonb, '2026-07-04 16:05:45.139008+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('bb0bcd7b-e8e9-4e59-ac2f-01a00c2adb10'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 359 OF 2024"}'::jsonb, '2026-07-04 21:28:02.747735+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('be408cc9-67e8-40c1-89c5-f537d19656c7'::uuid, 'user_updated', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"user_id":"2659af7a-7132-426d-a1fb-a3fbe5a12848","new_plan":"free","new_role":"Admin"}'::jsonb, '2026-07-04 20:34:07.230075+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('c47eaef8-40b3-4f07-92fb-08d91a06d6fb'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 130 OF 2025"}'::jsonb, '2026-07-04 20:20:33.795278+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('c6039252-e4ac-4b3f-9e8b-921945b704d7'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 40 OF 2023"}'::jsonb, '2026-07-06 18:05:47.746829+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('c6d8f0b0-7fc2-4f57-b3cd-08b6747a7077'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 259 of 2024"}'::jsonb, '2026-07-04 16:50:38.153893+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('c7578853-e8bb-4f5b-83d1-a2fc77f7c9b1'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"MISCELLANEOUS APPLICATION NO. 33 OF 2025"}'::jsonb, '2026-07-06 18:17:20.40985+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('c7bb15d0-1097-49c3-843a-5e30ce32abc5'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 73 OF 2023"}'::jsonb, '2026-07-04 15:55:01.578752+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('c846353a-615f-46f5-87cc-c880cda52141'::uuid, 'precedent_created', '2659af7a-7132-426d-a1fb-a3fbe5a12848'::uuid, '{"case_number":"APPLICATION NO. 73 Of 2026"}'::jsonb, '2026-07-04 08:42:54.246299+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('c95623de-549e-47ca-b59f-8a78d692550d'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 111 OF 2024"}'::jsonb, '2026-07-04 14:32:24.679115+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('ca94109d-4bd8-4ae6-84f2-f8233b6208c5'::uuid, 'site_settings_updated', '2659af7a-7132-426d-a1fb-a3fbe5a12848'::uuid, '{}'::jsonb, '2026-07-06 13:03:08.700891+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('cdb86678-7d02-4c2f-9eeb-6ca1d3323a7e'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"HCT-00-CV-CS-0352-2020"}'::jsonb, '2026-07-18 17:01:16.185044+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('d034ccb1-e793-4d8f-bdbb-79ee6b9fb952'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 60 of 2020"}'::jsonb, '2026-07-07 17:03:15.047864+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('d1878e35-e889-4084-b1a8-70612d2acbf1'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"MISC APPLICATION NO. 06 OF 2025"}'::jsonb, '2026-07-06 17:57:45.426755+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('d196c6b0-70a0-44e2-a7ea-d1416dc2d4cd'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 36 of 2024"}'::jsonb, '2026-07-04 21:38:40.372814+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('d1f4a6ef-9dff-47a2-89f2-21a91e61685e'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 261 of 2022"}'::jsonb, '2026-07-06 11:19:26.555877+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('d29db119-a3bd-4ce3-a203-a96d8bf20a2c'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 218 OF 2022"}'::jsonb, '2026-07-04 16:17:38.290911+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('d4acc59a-b47e-45cd-abc6-134705f77c74'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 41 of 2023"}'::jsonb, '2026-07-04 16:43:42.963454+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('d4f07099-9edd-4fc1-8c80-24bfd5561aca'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 215 OF 2024"}'::jsonb, '2026-07-04 21:36:46.579265+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('d5290667-a18a-418b-842b-c714e8b45e14'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APLICATION NO. 41 OF 2024"}'::jsonb, '2026-07-04 20:27:24.023116+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('d674400b-feee-4fb6-8c45-4ca7f25d07f2'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"MISC. APPLICATION NO. 181 OF 2023"}'::jsonb, '2026-07-06 18:02:47.652327+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('d7286ca2-5232-4c86-8019-91ca37b5813c'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 17 of 2024"}'::jsonb, '2026-07-06 11:20:08.873904+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('d7d10c12-78c8-443a-9faa-d68e5e7768eb'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 08 OF 2024"}'::jsonb, '2026-07-04 15:17:48.463624+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('da48774c-9529-4b8f-8335-c28c98465a7a'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 004 OF 2025"}'::jsonb, '2026-07-04 15:23:13.270784+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('de5f7a90-0afd-4b23-818e-053f1e3d402d'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"MISCELLANEOUS CAUSE NO. 84 OF 2025"}'::jsonb, '2026-07-06 18:14:45.149535+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('e2077a9c-4a1f-484c-8aa1-48ce62d2c63c'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 89 of 2023"}'::jsonb, '2026-07-04 16:56:29.113726+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('e31b0b43-e9a0-4894-9d87-7dfcb764a275'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT APPLICATION NO. 276 OF 2025"}'::jsonb, '2026-07-06 11:20:44.928801+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('e4452e21-01bc-4af5-ba9b-97e1cc16d9f4'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 197 of 2023"}'::jsonb, '2026-07-04 15:53:04.518717+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('e60d22ab-eb64-4a9c-a2af-12329c05f541'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO. 145 OF 2025"}'::jsonb, '2026-07-04 20:18:29.997418+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('e8667619-022b-4834-af7f-6e002d290c2b'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 139 OF 2023"}'::jsonb, '2026-07-06 17:56:16.913427+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('e9773c2e-5e22-4789-aea7-b4d0a7577218'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 103 of 2025"}'::jsonb, '2026-07-06 18:04:33.354732+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('f2adce2c-1208-4401-ab1f-0c7131f93e82'::uuid, 'precedent_deleted', '2659af7a-7132-426d-a1fb-a3fbe5a12848'::uuid, '{"case_number":"APPLICATION NO. 73 Of 2026","precedent_id":"da966f8d-793c-42bd-9340-643fe429e137"}'::jsonb, '2026-07-04 15:01:15.656763+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('f69688bc-9118-43a1-8126-94cde7f859ea'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"APPLICATION NO.91 OF 2023"}'::jsonb, '2026-07-04 15:49:18.868852+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('f9ec731b-22a8-4376-9a2e-0a73d2be3345'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"MISC APPLICATIONS NO. 149, 151, 153,155 (ARISING FROM TAT APPLICATIONS NO. 189, 194, 195, 193)"}'::jsonb, '2026-07-06 18:04:00.260736+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('fb487aaf-fea9-422e-b19b-f5ae2c841299'::uuid, 'user_updated', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"user_id":"a9e5e811-1a15-4c68-be82-faa5ce05bc24","new_plan":"free","new_role":"Admin"}'::jsonb, '2026-07-04 13:58:52.809193+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('fbaa7803-ed56-4e5d-9c4b-5f0e452c8116'::uuid, 'precedent_created', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{"case_number":"TAT No. 028 OF 2025"}'::jsonb, '2026-07-04 22:06:38.252937+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('fc019047-b6d4-45e3-88be-2656106faaa3'::uuid, 'site_settings_updated', 'a9e5e811-1a15-4c68-be82-faa5ce05bc24'::uuid, '{}'::jsonb, '2026-07-04 15:16:55.221044+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;
INSERT INTO public.admin_logs (id, action, performed_by, metadata, created_at)
VALUES ('fd0ed9ae-f400-41ad-894a-9d6b6ddd3af9'::uuid, 'user_updated', '2659af7a-7132-426d-a1fb-a3fbe5a12848'::uuid, '{"user_id":"2659af7a-7132-426d-a1fb-a3fbe5a12848","new_plan":"professional","new_role":"Admin"}'::jsonb, '2026-06-20 08:14:34.01615+00'::timestamptz)
ON CONFLICT (id) DO UPDATE SET action = EXCLUDED.action, metadata = EXCLUDED.metadata;

-- 5.8 TAT CASE PRECEDENTS (from tat_cases_rows.csv)
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('00411650-31ab-49b2-bcc9-68a12b8d850c'::uuid, 'APPLICATION NO. 274 OF 2025', 'ASAFALI WISSANJI v UGANDA REVENUE AUTHORITY', 2026, 'Income Tax', 'Allowed', 'The Applicant challenged URA''s decision to subject the sale of undeveloped land to Capital Gains Tax and Withholding Tax, arguing it was a personal asset, not a business asset. The Tribunal found that the land was undeveloped, unused, and not integrated into any business activity, despite a commercial user clause in the lease. The Tribunal ruled that the gain from disposal was not taxable business income and therefore not subject to withholding tax, allowing the application.', '1. This ruling is in respect of an application filed by the Applicant challenging the decision of the Respondent to subject the sale of undeveloped land to Capital Gains Tax and Withholding Tax on the basis that the land constituted a business asset. The application seeks a review and reversal of the Respondent''s objection decision issued pursuant to the Income Tax Act.
...
13. The main issue for determination is whether the land disposed of by the Applicant constituted a business asset at the time of disposal, so as to render any gain derived therefrom taxable under the Income Tax Act.
...
79. Upon a careful evaluation of the law, evidence, and submissions of the parties, the Tribunal is not satisfied that the Respondent established a sufficient nexus between the disputed land and any identifiable business activity of the Applicant. While the Respondent relied on the commercial user clause in the lease agreement, the Applicant''s rental-related economic activity, and the withholding treatment at acquisition, those factors, without further evidence of actual or intended business deployment of the land, are insufficient to satisfy the statutory definition of a business asset under section 2 of the Income Tax Act.
80. In the absence of evidence that the land was used in, held ready for use in, or held for sale in a business within the meaning of S.2 of the Income Tax Act, the Tribunal finds that the land did not constitute a business asset at the time of disposal. Consequently, any gain arising from its disposal did not constitute taxable business income under S.18(1)(a).
...
95. Accordingly, the Tribunal finds that the Respondent failed to demonstrate that the land was used in, or held ready for use in, any identifiable business of the Applicant within the meaning of S.2 of the Income Tax Act. The Respondent''s reliance on the lease restriction, general economic activity, and prior withholding treatment was insufficient to satisfy that statutory threshold. It follows that the gain arising from the disposal did not fall within business income under S.18(1)(a) of the ITA, and the consequent imposition of capital gains tax and withholding tax was unfounded.
96. In the circumstances, the Tribunal orders as follows;
(i) This Application is allowed.
(ii) The Respondent''s objection decision is set aside.
(iii) The gain arising from the disposal does not constitute taxable business income under section 18(1)(a) of the Income Tax Act.
(iv) The transaction is not subject to WHT under S.130 (2) of the Income Tax Act.
(v) Any tax paid pursuant to the impugned assessment or withholding treatment shall be dealt with in accordance with the applicable refund procedures under the law.
(vi) Costs are awarded to the Applicant.', 'This ruling reinforces the critical distinction between personal capital assets and business assets for income tax purposes in Uganda. Tax practitioners should note that the mere existence of a commercial user clause in a lease agreement or prior withholding tax treatment on acquisition does not automatically convert undeveloped land into a ''business asset'' under Section 2 of the Income Tax Act. The Tribunal emphasized that classification must be based on actual evidence of business activity or readiness for use in a business, not mere inference or contractual labels. This case provides a clear precedent against URA''s tendency to broaden the definition of ''business asset'' beyond its statutory terms, highlighting the importance of factual nexus between the asset and a business.

Key practical lessons:
* **Factual Basis is Paramount:** The actual use or readiness for use of an asset in a business is crucial, not just its potential commercial capability or historical ownership.
* **Strict Construction of Tax Statutes:** Tax statutes, especially definitions like ''business asset'' under Section 2 of the Income Tax Act, must be construed strictly.
* **Precedent Value:** Tribunal decisions, even if appealed, remain binding unless stayed or set aside, and URA''s disregard of such precedents is untenable.', '2026-07-06 18:10:37.372833+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('00a30ff3-e670-41d3-9e1e-8f4e73483c01'::uuid, 'TAT No. 68 of 2024', 'Amos Dairies Limited v Uganda Revenue Authority', 2026, 'Income Tax', 'Dismissed', 'The Applicant challenged an additional income tax assessment arising from over-claimed interest deductions, arguing that carried-forward losses incurred before 2018 should not be included in the computation of tax EBITDA under Section 25(3) of the Income Tax Act, and that such inclusion constituted retrospective application of the law. The Tribunal ruled that assessed losses, including those incurred prior to 2018, are allowable deductions for computing tax EBITDA under Sections 25(3) and 25(5) of the Income Tax Act, and that this application was not retrospective. The application was dismissed, and the assessment upheld.', 'This application was brought under section 25(3) of the Income Tax Act seeking orders that:
(i) Section 25(3) cannot be applied retrospectively to losses accrued prior to 2018, and the Respondent''s inclusion of the losses incurred before 2018 is erroneous and unjustified.
(ii) Carried-forward losses are not deductions for the purposes of computing tax EBITDA, and their inclusion in EBITDA calculations under Section 25(3) is incorrect.
(iii) The additional assessment of Shs. 1,080,511,066 be set aside.
(iv) The Respondent recomputes the Applicant''s maximum allowable interest deduction for 2019-2022, excluding the losses that were incurred prior to 2018, in accordance with the law.
...
40. The Applicant argued that carried-forward losses are merely offsets against chargeable income and should not be treated as deductions for purposes of computing tax EBITDA. The Respondent contended that section 36(1) of the Income Tax Act expressly categorises assessed losses as allowable deductions and that such losses must therefore be taken into account when determining tax EBITDA under section 25(5).
41. Section 25(5) defines tax EBITDA as:
"gross income less allowable deductions, excluding interest."
Section 36(1) is explicit that an assessed loss is "allowed as a deduction" in determining chargeable income in a subsequent year. The language of the statute is clear and unambiguous.
...
57. In light of the above, the Tribunal finds as follows:
(i) Assessed losses carried forward, including those incurred prior to 2018, are allowable deductions for purposes of computing tax EBITDA under sections 25(3) and 25(5) of the Income Tax Act.
(ii) The application of section 25(3) in the computation of the Applicant''s deductible interest for the years of income 2019 to 2022 did not amount to retrospective application of the law.
(iii) The additional income tax assessment of Shs. 1,080,511,066 issued by the Respondent was lawful and is hereby upheld.
58. Accordingly, the application is dismissed, and costs are hereby awarded to the Respondent.', 'This ruling clarifies a critical aspect of interest deductibility under Uganda''s Income Tax Act, particularly concerning the treatment of carried-forward losses in EBITDA calculations. The Tribunal''s emphasis on the prospective application of Section 25(3) of the Income Tax Act, Cap 340, while still allowing pre-2018 losses to be factored into current year EBITDA calculations, sets a clear precedent. Tax practitioners should note that the Tribunal distinguished between retrospective imposition of liability and the application of an existing computational rule to a current year of income, citing Section 36(1) of the ITA which treats carried-forward losses as current-year deductions. The main risk for taxpayers is misinterpreting the non-retrospective nature of the law to exclude historical losses from current EBITDA computations, potentially leading to disallowed interest deductions and additional assessments.
*   Carried-forward losses are considered ''allowable deductions'' for tax EBITDA computation.
*   Section 25(3) of the ITA applies prospectively but considers historical losses when utilized in current years.
*   Strict interpretation of tax statutes, adhering to plain meaning, is paramount.', '2026-07-04 20:00:36.084199+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('02446b04-2740-4a5e-bb50-a90a5c1f4a66'::uuid, 'MISCELLANEOUS CAUSE NO. 84 OF 2025', 'CHASSER (U) LIMITED v UGANDA REVENUE AUTHORITY', 2025, 'Income Tax', 'Allowed', 'The Applicant sought an extension of time to apply for review of an income tax objection decision, citing the tax consultant''s mistake and the director''s illness as reasons for delay. The Respondent argued that the application was unduly delayed and lacked sufficient grounds. The Tribunal found that the director''s illness, supported by medical receipts, constituted sufficient cause for the delay, and also noted that the rejection of an Alternative Dispute Resolution (ADR) application constituted a new taxation decision, extending the relevant timeline. Consequently, the application for extension of time was allowed.', '1. This application was brought under section 98 of the Civil Procedure Act and Order 52 of the Civil Procedure Rules seeking orders that:
(i) The time within which to apply to review the Respondent''s objection decision is extended.
(ii) Costs of the application be provided for.

2. The grounds of this application are laid out in the affidavit in support of the application deponed by Mr. John Sekimpi, the Director of the Applicant, sworn on 17 October 2025, stating as follows:
(i) On 13 March 2024, the Respondent issued the Applicant with an income tax assessment of Shs. 114, 577,130 for the period 2020-2021.
(ii) On 7 June 2024, the Applicant objected to the assessments, and on 14 June 2024 and 3 July 2024, the Applicant requested documents, which included bank statements, sales, and purchase ledgers.
(iii) On 19 August 2024, the Respondent issued objection decisions partially allowing the objections to the extent of revenue and expenses verified. On 6 September 2024, the Applicant applied to have the matter reviewed using Alternative Dispute Resolution, and on 3 April 2025, the Respondent rejected the Applicant''s application.
(iv) The delay in applying to the Tribunal was a mistake of the tax consultant, and the unavailability of the Director of the Applicant due to illness.
(v) This application has been made without inordinate delay as the same has been filed within six months from the time the objection decision notices were issued.
(vi) Therefore, it is just and equitable and in the interest of justice that the application be granted.

33. In Egis Road Operation Ltd v Uganda Revenue Authority, TAT Misc. Cause 85 of 2025, the Tribunal held that an ADR decision is a taxation decision. Therefore, for purposes of this application, the ADR decision date of 3 April 2025 is the taxation decision and not 19 August 2024, the date of the objection decision. Therefore, going by the ADR decision date, the delay on the Applicant''s part was 6 months.

34. We have already established that illness is a sufficient cause of delay, and indeed, as at August 2025, the Applicant''s director was undergoing medical treatment. This sufficiently explains the Applicant''s delay in applying for review of the Respondent''s taxation decision.

35. In the circumstances, we are satisfied that the Applicant has demonstrated sufficient cause. Therefore, this application is allowed, and each party will bear its own costs.', 'This ruling is a crucial reminder for Uganda tax practitioners regarding the discretionary power of the Tax Appeals Tribunal (TAT) to extend time for filing applications. It reinforces that ''sufficient cause'' for delay, as outlined in Section 16(2) of the Tax Appeals Tribunal Act and Rule 11 of the TAT (Procedure) Rules, can include illness, especially when substantiated with evidence. The Tribunal''s interpretation that an ADR rejection constitutes a new ''taxation decision'' for the purpose of calculating appeal timelines is a significant precedent, potentially offering taxpayers more leeway in complex cases. Practitioners should advise clients to document all communications and medical conditions diligently, and to consider ADR as a formal step that can reset appeal timelines if rejected. The case highlights the Tribunal''s commitment to substantive justice over strict technicalities, provided there is no dilatory conduct.
*   Illness, with evidence, can be sufficient cause for delay.
*   ADR rejection can reset the appeal timeline.
*   Prompt action is still required once impediments are removed.', '2026-07-06 18:14:44.879738+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('042acd2e-51ba-4e2b-ae0a-57cab34e358e'::uuid, 'TAT APPLICATION NO. 004 OF 2025', 'FARMINPUTS CARE CENTRE (FICA) LIMITED VERSUS UGANDA REVENUE AUTHORITY', 2025, 'VAT', 'Dismissed', 'The Applicant challenged a VAT assessment and an Income Tax assessment. The Respondent raised preliminary objections, arguing that the application was time-barred and that the Applicant had not paid the mandatory 30% of the tax in dispute. The Tribunal found that the application for review of the VAT assessment was filed five months beyond the statutory 30-day period and that the Applicant failed to formally seek an extension of time. The Tribunal also noted the Applicant''s concession regarding the non-payment of the 30% deposit. Consequently, the Tribunal sustained the preliminary objections and dismissed the application as time-barred.', 'This ruling is in respect of preliminary objections raised by the Respondent that the present application is time barred and that the Applicant has not paid 30% percent of the tax in dispute or that part of the assessed tax not in dispute, whichever is greater.

1. Background Facts
The Applicant deals in agriculture, forestry and fishing. It filed an application before this Honourable Tribunal seeking to review a Value Added Tax (VAT) assessment of She. 118,951,614 for the period of 2022. On 25 April 2024 and 15 May 2024, the Respondent issued the Applicant with VAT Assessment of Shs. 118,951,614 based on unjustified movement in non-current assets and additional Income Tax Assessment disallowing unsupported expenses.

The Applicant lodged two objections one for VAT Assessment vide Ref no. DO022400390870 for the period 2022 on ground that the Applicant''s obsolete assets were erroneously removed from the asset register, not in line with International Financial Reporting Standards (IFRS) 5 and the assets are still held at the company premises. The second objection was in respect of the income tax assessment Ref no. DO022400389235 for the period of 2021 on ground that the Applicant''s returns were not aligned to include balances brought down from different periods.

The Respondent issued two objection decisions on 21 August 2024 for VAT upholding the Assessment of Shs. 118,951,614/= on ground that the assets reduced and were not accounted for disposal as per the accounting principles and on 28th November 2024 for Income Tax partially allowing the objection on ground that the asset movement related to obsolete assets which was erroneously omitted from the return.

On 14 January 2025 the Applicant lodged this application for review of the objection decision on Value Added Tax (VAT) assessment of She. 118,951,614.

2. Issues for determination
The issues for determination by the Tribunal are:
(i) Whether this application is out of time?
(ii) Whether the Applicant has paid the 30% of the tax in dispute or that part assessed not in dispute, whichever is greater as required by S.15 of the Tax Appeals Tribunal Act?
(iii) What remedies are available to the parties?

... (further text detailing submissions and determination)

In light of the above, the Tribunal orders as follows;
(1) The respondent''s preliminary objections on the legality of the application and the non-payment of the 30% of the tax in dispute are sustained.
(2) The main application for review that was filed without seeking leave is struck out for being time barred.
(3) Costs are awarded to the Respondent.', 'This ruling serves as a critical reminder for Uganda tax practitioners regarding the strict adherence to statutory timelines and procedural requirements in tax appeals. The Tribunal emphasized that timelines set by statutes are matters of substantive law and not mere technicalities, citing precedents like *Uganda Revenue Authority vs. Uganda Consolidated Properties Ltd*. A key takeaway is that separate objection decisions for different tax types (e.g., VAT and Income Tax) must be pursued distinctly within their respective timelines. Relying on Civil Procedure Rules to extend statutory limitation periods for tax appeals is generally not permissible, as procedural rules cannot override substantive legislation. Furthermore, the mandatory 30% deposit of the tax in dispute (or the undisputed portion) under Section 15 of the Tax Appeals Tribunal Act remains a non-negotiable prerequisite for lodging an appeal.

*   **Strict Timelines:** Always adhere to the 30-day period for lodging an application for review after an objection decision, as per Section 16(1)(c) of the Tax Appeals Tribunal Act.
*   **Separate Appeals:** Treat distinct objection decisions for different tax types as separate matters, each with its own filing deadline.
*   **Mandatory Deposit:** Ensure the 30% tax deposit (or undisputed amount) is paid before filing an application for review, as per Section 15 of the Tax Appeals Tribunal Act.', '2026-07-04 15:23:13.046123+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('0484e971-4dd7-4343-86a3-56b574367fac'::uuid, 'TAT APPLICATION NO. 16 OF 2024', 'EAST AFRICAN MARINE TRANSPORT COMPANY LIMITED v UGANDA REVENUE AUTHORITY', 2025, 'VAT', 'Allowed', 'The Applicant, a marine logistics company, sought VAT exemption for the design, building, and delivery of a roll-on, roll-off freight ferry, citing Paragraph 1(ae) of Schedule 3 of the VAT Act. The Uganda Revenue Authority (URA) denied the exemption, arguing the ferry was not ''machinery or equipment'' and that the Applicant''s business did not fall under ''logistics and warehousing'' as required. The Tribunal ruled that the ferry qualifies as machinery or equipment, the Applicant''s business is indeed logistics, and the contract should not be artificially split. The Tribunal allowed the application, granting the VAT exemption and ordering a refund of paid VAT.', 'This ruling is in respect of an application brought under Sections 16 & 18 of the Tax Appeals Tribunal Act and under Rule 10 of the Tax Appeals Tribunal (Procedure) Rules 2012 seeking for the following orders:
(i) A declaration that the supply of services of design, building, and delivery of a ferry is exempt from VAT under paragraph 1(ae) of Schedule 3 of the VAT Act; and
(ii) Costs of the application.

1. Background Facts
The Applicant is engaged in the business of marine transportation between inland water ports on Lake Victoria. The Applicant challenges the Respondent''s refusal to confirm a Value Added Tax (VAT) exemption provided for under Paragraph 1(a)(e) of the Third Schedule to the VAT Act for the supply of a roll-on, roll-off freight ferry ("the Ferry"). The Applicant contracted Seco Marine (U) Ltd to design, build, and deliver a roll-on, roll-off freight ferry at a consideration of USD 14,997,762. The ferry was for use between Mwanza (Tanzania) and Port Bell (Uganda). On 6 July 2023, the Applicant wrote to the Respondent seeking confirmation of eligibility for tax exemptions under Section 21(1)(a)(f) of the Income Tax Act and Paragraph 1(a)(e) of the Third Schedule to the VAT Act.
By letter dated 20 November 2023, the Respondent confirmed the income tax exemption but declined to confirm the VAT exemption for the supply of the ferry, arguing that it was neither machinery nor equipment. On 27 November 2023, the Applicant objected to the Respondent''s decision, explaining that the ferry qualifies as machinery or equipment for VAT exemption purposes and that the Respondent unjustifiably fragmented the supply of the ferry into distinct services of design, building, and delivery, contrary to the law.
In a letter dated 29 December 2023, the Respondent partially allowed the objection by confirming the VAT exemption for design services but declined the exemption for building and delivery services, stating that these were not covered by the VAT Act.', 'This ruling provides crucial clarity on the interpretation of ''machinery or equipment'' and ''logistics and warehousing'' for VAT exemption purposes under Paragraph 1(ae) of Schedule 3 of the VAT Act. Tax practitioners should note the Tribunal''s emphasis on the ordinary and literal meaning of terms not explicitly defined in the Act, and its rejection of artificial contract splitting. The decision reinforces the principle that tax incentives in strategic sectors, like transport infrastructure, should be interpreted in alignment with government policy. This case sets a precedent for similar investments in Uganda''s maritime and logistics sectors, potentially reducing the cost of capital for such projects.

*   **Key Takeaway:** Ferries and similar transport vessels can qualify as ''machinery or equipment'' for VAT exemption if integral to a qualifying business.
*   **Main Risk/Precedent:** URA''s tendency to narrowly interpret exemption provisions and artificially split contracts was rejected.
*   **Relevant Act/Section:** Paragraph 1(ae) of Schedule 3 of the VAT Act, Section 12(1) of the VAT Act (on single vs. multiple supplies).
*   **Practical Lessons:**
    *   Ensure clear documentation of the primary purpose of contracts involving multiple services.
    *   Be prepared to argue for a broad, ordinary meaning of undefined statutory terms.
    *   Highlight alignment with national development policies when seeking tax incentives.', '2026-07-04 15:22:13.918597+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('07ad5a7e-32c5-4651-8a4f-1fb7509c04fb'::uuid, 'APPLICATION NO.91 OF 2023', 'MOBI-TEX ENGINEERING CO. WORKS LIMITED v UGANDA REVENUE AUTHOURITY', 2024, 'VAT', 'Dismissed', 'The Applicant challenged VAT assessments for various periods. The Respondent raised a preliminary objection, arguing that the Tribunal lacked jurisdiction because the Applicant had not filed an objection decision with the Respondent for two of the three assessments, which is a statutory prerequisite for appealing to the Tribunal. The Tribunal upheld the preliminary objection, ruling that without an objection decision from the Respondent, it had no jurisdiction to review the matter, and dismissed the application with costs.', 'This ruling is in respect of a preliminary objection that the tribunal has no jurisdiction to entertain an application in respect of which no objection decision was issued by the Respondent.

1. Background Facts.
Between the years 2016 and 2019, the Respondent issued the Applicant with Administrative Additional VAT Assessments of Shs. 31,599,805 for the period November 2013, Shs. 6,985,470 for the period June 2017 and Shs. 10,201,092 for the period June 2018. The assessments in question were raised as a result of variances between Income tax and VAT sales for the periods July 2016 to June 2017 and July 2017 to June 2018. The assessment for November 2013 was issued for non-filing of returns.
The Applicant filed the instant application on 7th June 2023. On 27th June 2024, when the matter came up for scheduling, the Respondent raised a preliminary objection to the effect that the tribunal has no jurisdiction over the matter as the instant Application was not filed consequent to an objection decision. The tribunal directed the parties to file written submissions in respect of the preliminary objection raised by the Respondent.

4. Respondent''s Submissions
The Respondent submitted that while the Applicant seeks for a decision of the tribunal in respect of the assessments of Shs. 6,985,470 for June 2017 and Shs. 10,201,092 for June 2018, no objection decision was filed by the Applicant in respect of these assessments. The Respondent cited Ss. 14(1) and 16 of the Tax Appeals Tribunal Act and S. 27(1) of the Tax Procedures Code Act (TPCA). The Respondent submitted that the above provisions make the issuance of an objection decision by the Respondent a condition precedent to the filing of an Application for review before the tribunal.

The Respondent submitted that in the absence of objection decisions in respect of the above assessments the tribunal has no jurisdiction to hear the matter. The Respondent submitted that the first step to be taken by a person dissatisfied by a taxation decision is to lodge a valid objection against the decision as required by S.27 of the TPCA. The Respondent submitted that in the instant case there was no objection decision being referred to the tribunal. The Respondent submitted that the instant application is therefore improperly before the tribunal. The Respondent prayed that the application be dismissed with costs.

6. Determination of the Application by the Tribunal
The jurisdiction of the tribunal to review decisions of the Respondent is provided for under S. 14 of the Tax Appeals Tribunal Act. S.14 provides as follows;
(1) Any person who is aggrieved by a decision made under a taxing Act by the Uganda Revenue Authority may apply to the tribunal for a review of the decision.

S. 27(1) of the TPCA provides for the review of Objection decisions made by the Respondent. S. 27(1) states as follows:
(1) A person dissatisfied with an objection decision may, within 30 days after being served with a notice of the objection decision, lodge an application with the Tax Appeals Tribunal for review of the objection decision.

The above provisions show that the jurisdiction granted to the tribunal to review decisions of the Respondent only arise where a tax payer is aggrieved by a decision made by the Respondent under a taxing Act or by an objection decision issued by the Respondent. In the absence of a decision by the Respondent the tribunal has nothing to review.

In the instant case the Respondent issued assessments against the Applicant. It is not in dispute that out of the three assessments issued against the Applicant by the Respondent the Applicant only chose to object to one of them. The Applicant did not object to the other two assessments. These two assessments in respect of which the Applicant did not object form the basis of the instant application.

For the reason that the Applicant did not file any objections against the said assessments the Respondent did not file any objection decisions. In the absence of an objection decision the Applicant has no locus to appear before the tribunal nor does the tribunal have jurisdiction to entertain any such matter.

The reason given by the Applicant for not filing the objections in question is that it was not well versed with the law. It is trite that ignorance of the law is no defence. This doctrine is set out in the following Latin maxim;
Ignorantia juris non excusat (ignorance of the law excuses not).

The rationale of this doctrine is that if ignorance were an excuse, every person omitting to comply with a law would escape liability by simply pleading ignorance. In the instant case the Applicant ought to have known that no applications can be filed by it before the tribunal in the absence of an objection decision.

The preliminary objection is accordingly sustained. The instant application is dismissed with costs.', 'This ruling serves as a critical reminder for Uganda tax practitioners regarding the strict procedural requirements for appealing tax assessments. The clear takeaway is that an objection decision from the Uganda Revenue Authority (URA) is a non-negotiable condition precedent for the Tax Appeals Tribunal (TAT) to assume jurisdiction. The main risk highlighted is the dismissal of an appeal, regardless of its merits, if the taxpayer fails to follow the statutory objection process outlined in the Tax Procedures Code Act (TPCA). Practitioners must ensure their clients exhaust the administrative objection process under Section 27(1) of the TPCA before lodging an application with the TAT under Section 14(1) of the Tax Appeals Tribunal Act.

*   Always file a valid objection with URA against an assessment.
*   Obtain an objection decision from URA before appealing to TAT.
*   Ignorance of the law (Ignorantia juris non excusat) is not a valid excuse for procedural non-compliance.', '2026-07-04 15:49:18.652896+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('0a42f041-0de2-49ca-9769-eb15b523d8e8'::uuid, 'TAT APPLICATION NO. 276 OF 2025', 'KANSAI PLASCON UGANDA LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'Customs', 'Partial', 'The Applicant challenged a tax assessment of Shs. 4,888,082,915 related to the reclassification of imported styrene acrylic emulsions and polymers, penalties for misclassification, and failure to file quarterly returns. The Tribunal found that some products were correctly classified under HS Code 3903.90.00 (0% import duty) due to styrene predominance, while others lacked sufficient evidence and were classified under HS Code 3906.90.00 (10% import duty). The Tribunal also ruled that the Applicant was entitled to COMESA preferential treatment for certain imports and that penalties for misclassification and failure to file returns were unlawfully imposed without prior conviction. The Respondent was ordered to recompute the assessment and refund the 30% deposit.', 'The Applicant challenges a tax assessment of Shs. 4,888,082,915 arising from the Respondent''s reclassification of the Applicant''s imported styrene acrylic emulsions and polymers used in paint manufacturing. The Respondent contends that the products were wrongly declared under HS Code 3903.90.00, which attracts a 0% import duty, rather than HS Code 3906.90.00, which attracts a 10% import duty, resulting in additional tax liabilities and penalties.

The Applicant submitted that according to Chapter Note 4, and subheading note 1(4) of Chapter 39, polymers are to be classified in the subheading, covering polymers of that monomer unit which predominates by weight over every other single comonomer unit. The determination of which HS Code the imports fall under is dependent on which monomer unit, styrene or acrylic monomer, predominates by weight.

From the evidence on record, the Tribunal finds that the following products were properly classifiable under heading 3903.90.00, as the documentation demonstrates that styrene predominates by weight:
a) Revacryl AE 4620 JA
b) C-Eagle (SA72/50)
c) Bondex 5295D
d) Bondex AMCA S46-2

The Tribunal further finds that there was no conclusive and reliable evidence to prove the dominant monomer in the following products.
a) Prokil S330 AF Styrene Acrylic Emulsion
b) Orgawhite 2000
c) Bondex variants without full composition data (e.g; Bondex 5299, Bondex AA261P, Bondex P711G and Bondex Opex92).

Accordingly, the Respondent shall reassess the Applicant''s tax liability in line with this decision and delete all duties, penalties, and interest attributable to products found to be correctly classifiable under HS Code 3903.90.00.

Whether the penalties for misclassification were lawfully imposed
The Respondent imposed penalties totaling USD 12,000 pursuant to Section 203 of the EACCMA on the grounds that the Applicant misclassified 120 consignments. The Applicant argued that Section 203 creates a criminal offence punishable "upon conviction" and therefore the Respondent lacked authority to administratively impose the penalty without prosecution before a competent court or tribunal.

Section 203 of the EACCMA expressly provides that a person who makes a false or incorrect declaration commits an offence and shall be liable "on conviction" to imprisonment or a fine not exceeding ten thousand dollars. In this case, the Respondent cannot impose a criminal fine without following due process. The Tribunal therefore finds that the penalty for misclassification was unlawfully imposed since there is no evidence of any conviction. The penalty assessment of USD 12,000 for alleged misclassification is unlawful and is hereby set aside.

Whether the penalties for failure to file quarterly returns were lawful
The Respondent imposed penalties totalling USD 38,000 for failure to file quarterly returns.
Regulation 7 of the East African Community Customs (Duty Remission) Regulations provides:
"(1) A manufacturer of goods for export shall –
(a) pay duty on any imported goods that are not used in the manufacture of goods for export or where the goods so manufactured are not exported;
(b) Submit returns quarterly to the Commissioner, giving relevant information as the Commissioner may require.
Furthermore, regulation (4) of the same provides:
"A person who fails to submit returns as required under this regulation commits an offence and shall be liable on conviction to a fine of two thousand dollars."

The Regulation does not expressly provide for cumulative penalties for every quarter of default. Furthermore, the Respondent lacks the authority to impose criminal penalties without a conviction. The penalty assessment of USD 38,000 for failure to file quarterly returns was unlawfully imposed and is hereby set aside.', 'This ruling provides crucial clarity on customs classification for mixed polymer products and the procedural requirements for imposing penalties under Ugandan tax law. The key takeaway is the emphasis on robust technical documentation to support HS code declarations, particularly for products with multiple monomer units. Tax practitioners should advise clients to maintain detailed product formulae and manufacturer declarations to substantiate their classifications, especially when seeking preferential tariff treatment or duty remission. The Tribunal''s strict interpretation of penalty imposition, requiring conviction for criminal offenses, sets a significant precedent against administrative penalties without due process.

Key practical lessons:
* **Documentation is paramount:** Ensure comprehensive technical data sheets and manufacturer declarations for imported goods.
* **Sequential application of GIRs:** Follow the General Interpretative Rules (GIRs) strictly, especially Chapter 39 Note 4 for polymer classification.
* **Penalties require conviction:** Administrative penalties for offenses under EACCMA Section 203 and Duty Remission Regulation 7(4) are unlawful without a prior conviction.', '2026-07-06 11:20:44.699189+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('0aa7b83a-2fca-4d26-ba21-a95379f7eaed'::uuid, 'TAT No. 170 of 2023', 'Tinasah Investments Limited v Uganda Revenue Authority', 2025, 'VAT', 'Dismissed', 'The Applicant claimed input VAT credit on purchases from three suppliers, but the Respondent disallowed it, alleging invoice trading and fictitious transactions. The Tribunal found that the Applicant failed to provide sufficient evidence to prove the legitimacy of the purchases, such as supplier addresses, cash payment receipts, delivery notes, or corroborating testimony. The Tribunal dismissed the application, holding that the Applicant did not discharge its burden of proof to show that the underlying transactions for the e-invoices actually occurred.', 'THE REPUBLIC OF UGANDA
IN THE TAX APPEALS TRIBUNAL OF UGANDA AT KAMPALA
APPLICATION NO. 170 OF 2023.
TINASAH INVESTMENTS LIMITED................................................APPLICANT
VERSUS
UGANDA REVENUE AUTHORITY..................................................RESPONDENT

BEFORE: MS. CRYSTAL KABAJWARA, MS. KABAKUMBA MASIKO, MS. GRACE SAFI.

RULING
This ruling is in respect of VAT assessment of Shs. 86,607,469 issued by the
Respondent after the Respondent denied the Applicant''s claim for input tax credit on
the grounds that the Applicant was engaged in invoice trading.

1. Background Facts
The Applicant company deals in the business of supplying stationery, printed materials
and other general supplies. The Respondent queried the Applicant''s claim for input
VAT on purchases made from three companies, namely- Arnau Trading Company-
SMC Ltd, TIN 1016755961, Chasteen Stationeries SMC Ltd, TIN 1016755954, and
Huthart Enterprises -SMC Ltd, TIN 1016758829, on the grounds of invoice trading.

The Respondent disallowed the input VAT and issued assessments of Shs.
86,607,469 which the Applicant objected to, arguing that the disallowed input credit
related to legitimate transactions. The Respondent disallowed the objection on
grounds that the Applicant failed to prove the purchases from the suppliers.

2. Issues for determination
The issues for determination by the Tribunal are as follows:
(i) Whether the Applicant is liable to pay the tax assessed?
(ii) What remedies are available to the parties?

Section 28 (1) of the VAT Act allows a taxable person a credit for the tax payable in
respect of all taxable supplies made to that person during the tax period.

Further, Section 28 (4) of the VAT Act stipulates:
"A taxable person who is allowed a tax credit on purchases of goods and services from a
supplier who is designated to use the e-invoicing system, shall only claim a tax credit on
expenses supported by e-invoices or e-receipts."

A reading of the above provisions indicates that for one to claim a credit for input VAT:
(i) Taxable supplies should have been made to that person during the tax period;
(ii) There should have been a purchase of goods or services to support the claim for
input VAT; and
(iii) The person should be issued with an e-invoice or receipt where goods have been
purchased from a person using the e-invoicing system.

Point (iii) is not in contention as both the Applicant and Respondent are in agreement
that e-invoices were issued by the suppliers.

The Respondent, however, disputes whether there were really ever any underlying
purchases made, or taxable supplies received in respect of the e-invoices which the
Applicant adduced as evidence of purchase.

Section 28 (4) clearly states that a "taxable person who is allowed a tax credit on purchases
of goods and services."

Therefore, a purchase must precede a claim for input VAT. This means that it is
incumbent on the Applicant to prove that a purchase did in fact happen in respect of
the e-invoice presented to the Respondent.

To claim credit for input VAT, one must prove that the transactions/purchases
genuinely took place. A substance over form approach must be adopted for
transactions such as this and it would be very dangerous for this Tribunal to choose
form over substance.

In the present case, the Applicant:

(i) Could not name a single individual from any of the suppliers they interacted with
– not any director, employee, shopkeeper, cashier etc. None.
(ii) Did not know the suppliers'' addresses;
(iii) Did not have any receipt showing proof of cash purchases;
(iv) Did not have any delivery notes to prove the delivery of goods by the suppliers;
(v) Could not even bring one person to corroborate the sole witness'' testimony that
purchases were made. For example, the Applicant''s witness claimed that
deliveries were made using "boda boda" cyclists – not even a single cyclist was
presented as a witness.
(vi) Claimed that all purchases were made by a one, the Late Stanislous Muwonge.
The Applicant claimed that this person, was their Accountant. The Applicant did
not adduce any evidence of having employed or contracted the Late Muwonge
in any capacity.

It is also worth mentioning that the amounts involved in said "purchases” were
significant. It beggars belief that one can purchase goods approximating worth Shs.
481,152,606 without any of the above corroborative evidence. According to the
Respondent''s witness testimony, some of the single transactions were for items worth
of Shs. 25,488,000. There was no single piece of corroborative evidence adduced by
the Applicant to demonstrate that the purchases shown on the e-invoices were in fact
made by the three suppliers.

It is incredulous!

The Applicant''s witness testified that her former Accountant, who is now deceased
made all the purchases. How convenient!

Consequently, the testimony of the Applicant''s witness and the absence of any
corroborative evidence cast doubt on the veracity of the Applicant'' claim.

The mandate of the Uganda Revenue Authority is to administer and collect the nation''s
taxes. However, taxpayers are not just bystanders – they are active participants in this
effort.

Therefore, taxpayers should put themselves in the shoes of the tax authority.

This Tribunal finds that the Applicant failed in their duty to furnish the Respondent with
the requisite information to prove that the purchases did in fact occur.

Further, the Applicant failed to satisfy this Tribunal that the purchases underlying the
e-invoices were made from the three suppliers.

In the circumstances, we make the following orders:
(i) This Application is dismissed, and the Applicant is liable to pay the assessed tax
of Shs. 86,607,469.
(ii) The Applicant is not entitled to the input tax credit.
(iii) Costs are hereby awarded to the Respondent.

Dated at Kampala this. 17th day of January 2025.

CRYSTAL KABAJWARA
CHAIRPERSON

KABAKUMBA MASIKO
MEMBER

GRACE SAFI
MEMBER', 'This ruling underscores the critical importance for Ugandan tax practitioners to advise clients on maintaining robust documentation for all transactions, especially when claiming input VAT. The Tribunal''s emphasis on ''substance over form'' means that merely possessing EFRIS invoices is insufficient if the underlying transactions cannot be substantiated. The risk highlighted is that URA will disallow input VAT claims where the supply chain is incomplete or suppliers are untraceable, even if EFRIS invoices exist. Taxpayers must actively participate in tax compliance by providing accurate and verifiable information, as per Section 28 of the VAT Act and Section 26 of the Tax Procedures Code Act.
*   **Document Everything:** Beyond EFRIS invoices, retain delivery notes, proof of payment (bank statements, detailed cash payment records), and supplier contact information.
*   **Verify Suppliers:** Conduct due diligence on suppliers, especially new ones, to ensure their legitimacy and physical existence.
*   **Burden of Proof:** The onus is on the taxpayer to prove the legitimacy of transactions, particularly in cases flagged for invoice trading.', '2026-07-04 16:09:05.802258+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('128aa112-1309-430b-ba78-8a8a8bd82bb0'::uuid, 'TAT APPLICATION NO. 08 OF 2024', 'BETA HEALTHCARE UGANDA LIMITED v UGANDA REVENUE AUTHORITY', 2025, 'Customs', 'Dismissed', 'The Applicant challenged the customs classification of Cofta tablets and Cofta Syrup, arguing they are medicaments (HS Code 3004.90.00) and not sugar confectionery (HS Code 1704.90.00). The Uganda Revenue Authority (URA) maintained that despite having medicinal properties, the products are essentially composed of sugar and flavouring agents, thus falling under sugar confectionery. The Tribunal, relying on Explanatory Notes to the EAC CET and WCO rulings, dismissed the application, agreeing with URA''s classification.', 'This is a ruling in respect of an application challenging the customs classification of Cofta tablets and Cofta Syrup by the Respondent as sugar confectionary falling under the Harmonized Commodity Description and Coding system (HSC) 1704.90.00.

1. Background Facts
The Applicant deals in the importation and distribution of pharmaceutical and medical products. The Respondent carried out a customs post-clearance audit on the Applicant covering the period January 2018 to December 2022 and issued VAT assessments of Shs. 808,805,239 due to alleged misclassification of Cofta tablets and Cofta syrup sales under HS Code 3004.90.00 as a medicament instead of HS Code 1704.90.00 as a sugar confectionary. The Applicant objected and the Respondent issued its objection decision maintaining its position and informed the Applicant that Shs. 743,757,269 assessed on the Cofta tablets was due and payable.

2. Issues for determination
The issue for determination is whether the Applicant''s products are medicaments falling under heading 30.04 or sugar confectionary, falling under heading 17.04.

3. Representation
The Applicant was represented by Mr. Fahad Kizito and Ms. Rhoda Nakanwagi while the Respondent was represented by Ms. Charlotte Katuutu and Mr. Kenan Aruho.

...

Therefore, we are in agreement with the Respondent''s classification of the cofta tablets as sugar confectionary falling under heading 17.04 and not medicaments falling under heading 30.04.

In view of the above, the application is dismissed with costs to the Respondent.', 'This ruling underscores the critical importance of Harmonized System (HS) classification for customs purposes in Uganda. Even if a product has medicinal properties and is regulated by the National Drug Authority (NDA) as a drug, its classification for customs duty and VAT purposes will primarily depend on its essential character as defined by the East African Community Common External Tariff (EAC CET) and its Explanatory Notes. The Tribunal emphasized that the NDA''s classification does not dictate customs classification. Tax practitioners should note that products with dual purposes (medicinal and flavouring/sweetening) are likely to be classified based on their predominant character, especially if they consist essentially of sugars and flavouring agents, as per HS Code 1704.00. This case highlights the persuasive, though not binding, authority of WCO rulings in interpreting the HS. 

Key practical lessons:
* Customs classification is distinct from NDA drug classification.
* The ''essential character'' of a product, particularly its primary composition (e.g., sugar and flavouring agents), is paramount.
* Explanatory Notes to the EAC CET and WCO rulings are crucial interpretive tools.', '2026-07-04 15:17:48.229254+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('12914e80-44d3-4a05-94cf-cde134fd8b47'::uuid, 'TAT APPLICATION NO. 293 OF 2024', 'SAPIENT FEATHERS(U) LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'Income Tax', 'Dismissed', 'The Applicant challenged an income tax assessment after engaging in Alternative Dispute Resolution (ADR) with the Uganda Revenue Authority (URA). The URA raised preliminary objections, arguing that the application was filed out of time, improperly appealed an ADR settlement, and that the mandatory 30% deposit was not paid. The Tribunal upheld the preliminary objections, finding that the application was indeed filed out of time and that it lacked jurisdiction to hear an appeal against a binding ADR settlement agreement, which Regulation 12(2) of the Tax Procedure Code Act (ADR Procedure) Act, 2023 expressly prohibits.', 'RULING

I. Introduction
1. This ruling is in respect of preliminary objections raised by the Respondent relating to the propriety of the instant application before the Tribunal.

II. Background Facts
2. The Applicant was issued with an income tax assessment of Shs. 113,229,046 (BW012200291093) for the period 01/07/2019 to 30/06/2020 which the Respondent upheld on 15/06/2022 in response to the Applicant''s objection filed against the same on 17/03/2022. The Applicant then sought for Alternative Dispute Resolution (ADR) on 14/12/2022.

3. The Application for ADR was reviewed by the Respondent''s ADR Unit and on 1st March 2023, the Respondent communicated its decision maintaining the tax assessment at Shs. 113,229,046. On 6th June, 2024 the Respondent'' s ADR unit revised tax assessment from Shs. 113,229,046 to Shs.38,209,952. On 6 August 2024, the Respondent''s ADR unit declined to review its above stated decision which revised the tax assessment from Shs. 113,229,046 to Shs.38,209,952. At hearing of the Application, the Respondent raised three Preliminary Objections;

4. The Applicant filed this Application out of time.
The Application is improperly before the tribunal because it constitutes an appeal from the decision of the Respondent''s ADR unit contrary to Regulation 12(2) of the Tax Procedure Code Act (ADR Procedure) Act, 2023. The Applicant has not paid the 30%.

IV. Issues for Determination
6. The issues for determination by the Tribunal are;
i. Whether the Applicant filed this Application out of time?
ii. Whether the Application is properly before the tribunal?
iii. Whether the Applicant paid the 30%.?

VII. Determination by the Tribunal
Having carefully considered the submissions of both parties, this is the ruling of the Tribunal.

33. The issues for determination are the following;
i. Whether the Applicant filed this Application out of time?
ii. Whether the Application is properly before the tribunal?
iii. Whether the Applicant paid the 30%.?

We will proceed to resolve each of them in turn

Section 14 of the Tax Appeals Tribunal Act clearly provides that:
(1) A person aggrieved by a decision made under a taxing Act by the Uganda Revenue Authority may apply to the Tribunal for a review of the decision.
(2) The Tribunal has the power to review any taxation decision in respect of which an application is properly made.

Section 16 of the Tax Appeals Tribunal Act provides that:
(1) An application to a tribunal for review of a taxation decision shall-
(c) be lodged with the tribunal within thirty days after the person making the application has been served with a notice of the decision.
(7) An application for review of a taxation decision shall be made within six months after the date of the taxation decision.

34. From the evidence on record, the Applicant was issued with an Income Tax assessment of Shs. 113,229,046 (BW01220091093) for the period 01/07/2019 to 30/06/2020. The Applicant objected to that assessment and the Respondent issued an objection decision on 15/06/2022, disallowing the objection. The Applicant only filed an application for review of the said objection decision before the Tribunal on 16th October 2024. This was clearly outside the limitation period provided for under Section 16(1)(c) and (7) of the Tax Appeals Tribunal Act.

35. The Applicant has not filed for an application for extension of time within which to file an application for review of the objection decision. In the premises we find this application was filed out of time. The Second issue for determination by the Tribunal is;

Whether the Application is properly before the tribunal?

36. The following Regulations of the Tax Procedures Code (Alternative Dispute Resolution Procedure) Regulations, 2023 provide

Regulation 11: Where the Commissioner General and the taxpayer agree to settle the tax dispute using ADR procedure, the issues agreed upon shall be set out in a settlement agreement which shall be signed by the Commissioner General and the taxpayer or by persons authorised to sign on their behalf.

Regulation 12(2) provides that the altered or amended tax assessment shall not be subject to objection or appeal.

Regulation 13: A settlement agreement shall be recognised as binding and enforceable against the Commissioner General or taxpayer.

Regulation 14 Where the Commissioner General or Taxpayer fails to comply with or violates a settlement, the taxpayer or Commissioner General may apply to Court to enforce the settlement agreement.

37. On the 6th day of June 2024 following proceedings before the Respondnet''s ADR Unit the Applicant and Respondent entered into an Alternative Dispute Resolution Settlement Agreement. This agreement amended the amount in dispute from Shs 113,229,047 to shs.38,209,952. From the facts at hand, it is clear that the assessment in dispute was amended as a result of the Alternative Dispute Resolution Settlement Agreement. The instant Application amounts to an appeal against the settlement agreement executed by the parties. Regulation 12(2) expressly prohibits such an appeal. Such an appeal amounts to an illegality which the tribunal cannot condone.

38. Further the Tribunal has no jurisdiction to entertain an appeal from decisions of the Respondent''s ADR Unit.
It is trite law that appellate jurisdiction must be expressly conferred by statute. In Attorney General v Shah (No. 4) [1971] 1 EA 50, the Court of Appeal held that:

"Appellate jurisdiction springs from statute. There is no such thing as inherent appellate jurisdiction."

Similarly, in Baku Raphael Obudra & Another v Attorney General, SCCA No. 1 of 2005, Odoki CJ reiterated that, “appellate jurisdiction must be specifically created by law and cannot be inferred or implied."

39. The Tribunal reaffirmed this position in Africa Global Logistics Uganda Ltd v Uganda Revenue Authority, holding that, "a statutory provision conferring appellate jurisdiction must expressly state the right to appeal from a particular body. Anything less amounts to an impermissible inference of jurisdiction.”

40. There is no provision under the Tax Appeals Tribunal Act, Cap 341 that grants the Tribunal jurisdiction to hear appeals arising from decisions or alleged decisions of the ADR Committee of the Respondent.

We accordingly find that this Application is not properly before the tribunal.
Having determined as above there is no need to resolve the remaining issue.

The preliminary objections are accordingly upheld. This Application is hereby dismissed with costs.', 'This ruling serves as a critical reminder for Uganda tax practitioners regarding the finality of Alternative Dispute Resolution (ADR) agreements and strict adherence to statutory timelines for appealing tax decisions. The key takeaway is that once a binding ADR settlement is reached, it generally cannot be appealed to the Tax Appeals Tribunal (TAT), as explicitly stated in Regulation 12(2) of the Tax Procedure Code (ADR Procedure) Regulations, 2023. The main risk highlighted is the potential loss of the right to appeal if a taxpayer attempts to challenge an ADR outcome at the TAT, as the Tribunal lacks the jurisdiction to entertain such appeals. Furthermore, the case underscores the importance of filing applications for review within the prescribed 30-day period from the ''taxation decision'' as per Section 16(1)(c) of the Tax Appeals Tribunal Act, Cap 341, and seeking an extension of time with sufficient cause if necessary.

*   **ADR Finality:** ADR settlement agreements are binding and generally not subject to appeal at the TAT.
*   **Strict Timelines:** Adhere to the 30-day statutory period for filing applications for review of taxation decisions.
*   **Jurisdiction:** The TAT''s jurisdiction is statutory; it cannot hear appeals from binding ADR decisions unless expressly provided by law.', '2026-07-04 21:40:31.975791+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('1503e376-8be9-4641-b5d4-27c36b1c937f'::uuid, 'TAT No. 59 of 2023', 'INTERNATIONAL FOOD POLICY RESEARCH INSTITUTE v UGANDA REVENUE AUTHORITY', 2024, 'Income Tax', 'Allowed', 'The Applicant, a research organization, hired individuals as data collectors and enumerators, treating them as independent contractors and withholding tax at 6%. The Respondent assessed PAYE and WHT, arguing these individuals were employees. The Tribunal, applying common law tests (control, integration, multiple tests), found that the data collectors were not employees due to the short duration of engagement and lack of sufficient control by the Applicant. The Tribunal ruled that the Applicant was not liable for PAYE on these individuals.', 'THE REPUBLIC OF UGANDA
IN THE TAX APPEALS TRIBUNAL AT KAMPALA
TAX APPLICATION NO.59 OF 2023
INTERNATIONAL FOOD POLICY RESEARCH INSTITUTE.................. APPLICANT
VERSUS
UGANDA REVENUE AUTHORITY................................................... RESPONDENT
BEFORE: MR. SIRAJ ALI, MS. KABAKUMBA MASIKO, MS. SAFI GRACE.
RULING
This ruling is in respect of an Application challenging an assessment by the Respondent
on the ground that persons hired by the Applicant for the provision of certain services
were not employees but independent contractors.
1. Background facts
The Applicant is a research-based organization. The Applicant provides research-
based policy solutions for the alleviation of hunger and poverty in developing countries
including Uganda. The Applicant entered into short-term field office service
agreements with various individuals to collect data on various aspects of the
Applicant''s business. These individuals included contractors (Data collectors and
enumerators). The Applicant treated these individuals as independent contractors and
withheld tax at 6% on all payments made to them and remitted the same to the
Respondent.
The Respondent conducted a tax audit upon the Applicant and established a tax
liability of PAYE amounting to Shs. 171,983,080 and Withholding Tax of Shs.
19,349,080. The Applicant objected to the assessments as a whole on grounds that
these individuals were independent contractors whose pay had been subjected to 6%
withholding tax and WHT on suppliers had been wrongly computed. The Respondent
partially allowed the objection by reducing the tax assessed (Withholding tax on
payments to suppliers) from Shs. 19,349,082 to Shs. 12,282,628. The Respondent
rejected the PAYE objection and maintained the assessment of Shs. 171,983,902.
1
Dissatisfied with the Respondent''s objection decision, the Applicant filed this
Application.
2. Representation
At the hearing of this application, Mr. Joseph Luswata and Mr. Winston Churchill
Ruhayana appeared for the Applicant while Mr. Sam Kwerit and Ms. Charlotte Katuutu
appeared for the Respondent.
3. The issues for determination
At scheduling the following issues were set down for hearing;
i) Whether the Applicant is liable to pay the PAYE as assessed?
ii) Whether the Applicant is liable to pay the Withholding tax as assessed?
iii) Remedies available?
Before the hearing of the matter, the Applicant conceded that the assessment in
respect of WHT on suppliers in the sum of Shs. 12,282,628 was due and payable.
Accordingly the matter left for the tribunal''s determination is whether the Applicant
is liable to pay the PAYE as assessed.
4. Submissions of the Applicant
The Applicant led evidence through Mr. Edward Kato, its Senior Research Analyst. Mr.
Kato testified about the work and the terms of service of the contractors. He stated that
the Applicant and each enumerator signed a standard agreement stating the terms under
which the service is to be granted, each research project is given a name to ensure that
enumerators understand what to collect. Data collectors are given questionnaires, I- pads
or tablets that are returned to the Applicant at the end of the project.
The Applicant submitted that Workers'' compensation cover is only provided if the project
fund is sufficient to cover the same but this is not provided all the time.
The Applicant''s Counsel cited Section 1 of the Employment Act Cap 226 which defines
an employee as any person who has entered into a contract of service or an
apprenticeship contract. The Applicant went ahead to cite Section 2(x) of the Income Tax
Act which defines an employee as an individual engaged in employment.
2
In order to determine whether a contract for service or a contract of service exists, the
Applicant submitted that common law tests have to be applied and these include the
control test, integration test, multiple tests, and the parties'' own characterization.
In its submissions, the Applicant defined the control test, as a test used to measure the
level of control an employer has over an employee. The Applicant made reference to the
case of Ready Mixed Concrete V Minister of Pensions and National Insurance {1968}
2 QB 497, where the court noted that control includes the power of deciding the things to
be done, how it shall be done, the means to be employed in doing it, the time and place
for it to be done.
Accordingly, the Applicant submitted that the individuals were engaged for a very short
period which shows that the employers had no control over them as stated in the case of
Infectious Diseases Institute (IDI) V Uganda Revenue Authority TAT APP No.
15/2019.
The Applicant also made reference to the integration test as one that is used to determine
if the person is integrated in the Applicant''s business so as to be regarded as an
employee. The Applicant relied on the book Managing Taxation in Uganda, 2nd Edition
by Christine Mugume on Page 8/6 wherein the learned author stated that, in
determining that one is an employee or independent contractor, the question will be
whether the person hired is engaged on a continuous basis, the services are performed
particularly at the hirer''s business, the hirer provided the working tools, plant and other
relevant facilities for the person hired to do his or her work and the hirer controls the timing
and scheduling of work.
The Applicant submitted that the courts have used the Multiple test because they have
recognized that not a single infallible test can be used to determine whether one is an
employee or not. In the case of Workmen of Nilgiri Cooperative Marketing Society Ltd
V Tamil Nadu, (2004) 3 SCC 514 court stated that, "No single test- be it control, be it
organization or any other test has to be the determinative factor for determining the jural
relationship of employer and employee".
The Applicant submitted on the third test, namely, the parties'' own characterization which
means that the label the parties have given their relationship will be respected unless the
terms of the contract are inconsistent with that label.
3
The Applicant submitted that in order for the Tribunal to determine the nature of service,
the facts of the case should be applied to the statutory definition of employee and
employment along with the common law tests.
5. Submissions of the Respondent
The Respondent submitted that the burden of proof lies upon the Applicant to prove that
the assessment is incorrect or erroneous as provided for under Section 26 of the Tax
Procedures Code Act 2014 and was reechoed in the Tanzanian case of Williamson
Diamonds LTD V Commissioner General (2008) 4 TTLR 67 where the Tax Revenue
Appeals Tribunal of Tanzania held that;
"..... burden of proving that the assessment issued by the Respondent is excessive or
erroneous lies on the tax payer and in no way it be shifted to the Respondent..."
The Counsel for the Respondent submitted that the Applicant is liable to pay the PAYE
assessment issued against it and that in determining liability, the Tribunal ought to
examine the character of the data collectors/enumerators to determine whether they are
employees or independent contractors.
In relation to the above, Counsel for the Respondent made reference to the testimony by
its witness Ms. Priscilla Nambuba, an officer in the Objections Unit of Domestic Taxes
Department. The witness testified that the data collectors/enumerators were classified as
employees because the roles performed by them formed an integral part of the business
of the Applicant. In this regard, the Respondent added that the Applicant provided them
with tools of trade in the form of tablets used for data collection. The Respondent noted
that this particular statement was uncontroverted during the hearing of this case.
The Respondent also cited the Ready Mixed Concrete case (supra), where the court
while elaborating on the above test stated that: "There must be a wage or other
remuneration. Otherwise there will be no consideration, and without consideration no
contract of any kind. The servant must be obliged to provide his own work and skill.
Freedom to do a job either by one''s own hands or by another''s is inconsistent with a
contract of service".
4
6. The Applicant''s submissions in rejoinder
In response to the Respondent''s submissions, that evidence of its witness Ms. Priscilla
Nambuba on characterization of Data Collectors/Enumerators, as employees was
uncontroverted, the Applicant submitted that the same had been submitted by the
Respondent in error. The Applicant stated that the testimony of Mr. Edward Kato
extensively demonstrated that the Data Collectors were not employees but independent
contractors.
7. Resolution of the application by the Tribunal
Having studied the evidence and submissions made by the parties, the following is the
ruling of the Tribunal.
PAYE is a form of withholding tax which employers are required to deduct and remit to
the Respondent from payments due to employees. This requirement is provided for under
S. 126 of the Income Tax Act.
The Applicant submitted that the enumerators or data collectors constituted more than
80% of the contractors and that the rest were exhibitors, a consultant, field extension
workers and vine inspectors. The Applicant submitted that in the case of the exhibitors,
consultant, field extension workers and the vine inspectors, there was no reason to
interfere with the characterization which the parties had themselves given to their
relationship. The Respondent on the other hand submitted that the exhibitors, consultant,
field extension workers and vine inspectors, formed neither part of the objection nor the
objection review process. The Respondent submitted further that the Application is based
primarily on the issue of PAYE on the data collectors/enumerators and WHT on payments
made to suppliers. This the Respondent submitted amounted to the introduction by the
Applicant of a new cause of action.
A perusal of the Application filed on 18th April 2023, makes no mention of exhibitors,
consultant, field extension workers or vine inspectors. It is trite that parties ought not to
depart from their pleadings. The tribunal will accordingly disregard the distinction made
by the Applicant between data collectors/enumerators on the one hand and exhibitors,
consultant, field extension workers and vine inspectors, on the other.
5
In resolving the issue as to whether the Applicant is liable to pay PAYE as assessed, we
must determine whether the individuals in question were employees or independent
contractors.
S.2 of the Employment Act, defines an employee as: -
"Any person who has entered a contract of service or an apprenticeship contract
including, without limitation, any person who is employed by the Government of Uganda,
including the Uganda Public Service, a local authority or a parastatal organization but
excludes a member of the Uganda Peoples Defence Forces."
An employee is defined in Black''s Law Dictionary 8th Edition p.564 as a "person who
works in the service of another person (the employer) under an express or implied
contract of hire, under which the employer has the right to control the details of work
performance."
An independent contractor on the other hand is defined in The Black''s Law Dictionary
8th Edition page 888 as: "One who is entrusted to undertake a specific project but who
is left free to do the assigned work and to choose the method for accomplishing it."
The above authorities disclose a distinction between a contact of service and a contract
for service. Employees are deemed to enter a contract of service while independent
contractors are deemed to have entered a contract for service. In Ready Mixed Concrete
(South East Ltd) v Minister of Pensions and National Insurance [1968] 2 QB 496 it
was stated that:
"A contract of service exists if these three conditions are fulfilled.
(i)
The servant agrees that, in consideration of a wage or other remuneration, he will
provide his own work and skill in the performance of some service for his own
master.
(ii)
He agrees, expressly or impliedly, that in the performance of that service he will
be subject to the other''s control in a sufficient degree to make that other master.
(iii) The other provisions of the contract are consistent with its being a contract of
service."
From the above, it is not difficult to discern that the element of control is important in
determining whether a person is an employee or an independent contractor.
6
The term "control" has been defined in Black''s Law Dictionary 8th Edition p. 403 as:
"The direct or indirect power to govern the management and policies of a person or entity,
whether through ownership of voting securities, by contract or otherwise, the power or
authority to manage, direct, or oversee."
In Ready Mixed Concrete v Minister of Pensions & National Insurance (supra) the
court noted that: "Control includes the power of deciding the thing to be done, the way in
which it shall be done, the means to be employed in doing it, the time when and the place
where it shall be done". All these aspects of control must be considered in deciding
whether the right exists in a sufficient degree to make one party the master and the other
his servant.
"In Meera Investments Ltd v Andreas Wipfler t/a Wipfler Designers and Co. Ltd. MA
163 of 2009 the Court cited the following definition of an `independent contractor'' in
Black''s Law Dictionary 9th Edition.
"One who is entrusted to undertake a specific project but who is left free to do the
assigned work and to choose the method for accomplishing it."
The Court cited with approval the following test laid down in Market Investigations vs.
Minister of Social Security [1969] 2 GB 173.
"... the fundamental test to be applied is this: "is the person who has engaged himself to
perform these services performing them as a person in business on his own account?" If
the answer to that question is "yes", then the contract is a contract for services." "No
exhaustive list has been compiled and perhaps no exhaustive list can be compiled of
considerations that are relevant in determining that question, nor can strict rules be laid
down as to the relevant weight which the various considerations should carry in particular
cases. The most that can be said is that control will no doubt always have to be
considered, although it can no longer be regarded as the sole determining factor; and that
factors, which may be of importance, are such matters as whether the man performing
the services provides his own equipment, whether he hires his own helpers, what degree
of financial risk (he) takes, what degree of responsibility for investment and management
he has, and whether and how far he has an opportunity of profiting from sound
management in the performance of his task."
7
The tests and definitions enumerated under the Common law above, have been codified
in the Income Tax Act, under the definitions of the terms "employee" and "employment".
S.2 of the Income Tax Act, defines an employee as an individual engaged in employment
while employment is defined under the same section as follows;
"(i) the position of an individual in the employment of another person.
(ii) A directorship of a company.
(iii) A position entitling the holder to a fixed or ascertainable remuneration; or
(iv) The holding or acting in any public office;"
We will look at each of the above definitions of "employment" to determine whether the
enumerators were employees of the Applicant or independent contractors. The first
definition, namely, the position of an individual in the employment of another person
envisages a situation where it is acknowledged that a person is an employee of another,
whether under a formal contract of service or otherwise. However in the instant case there
is no such acknowledgement from the evidence before us.
The second and fourth definitions do not apply to the instant case, as they are specific to
persons holding the office of a director in a company or persons holding or acting in any
public office. The evidence before us shows that none of the enumerators were either
directors in the Applicant, or were holders of public office in any capacity.
The third definition is in respect of a position entitling the holder to a fixed or ascertainable
remuneration. This definition formed the basis of the decision of the tribunal in Infectious
Diseases Institute (IDI) V Uganda Revenue Authority TAT APP No. 15/2019.
Excerpts from the above decision are reproduced below:
"Any person who receives a fixed or ascertainable remuneration is considered as an
employee under the Income Tax Act, but this may not be the case under the Employment
Act. ...The word `ascertainable'' would refer to income that is certain. Therefore, if an
individual receives income that is constant and certain, he or she is deemed an employee
for purposes of taxation. The tribunal uses the word "or" to imply that either "constant" or
"certain" may do".
"It is debatable whether a person who receives remuneration for a short period may be
considered as one who obtains fixed or ascertainable income. For the avoidance of doubt
8
the Tribunal will hold that a person who receives remuneration for less than two months
cannot be considered as receiving fixed or ascertainable income. A taxpayer is entitled
to the benefit of doubt".
The Applicant''s witness Edward Kato testified that the working period for each contract
for the enumerators or data collectors ranged between five (5) and thirty-four (34) days
at the very maximum.
This evidence was uncontroverted. The period ranging between five to thirty five days is
too short to form the basis of a determination that a person obtained a fixed or
ascertainable income. Applying the decision of the tribunal in the Infectious Diseases
Institute case, we find that owing to the very short period of their engagement, the data
collectors cannot be considered as having received a fixed or ascertainable income.
Accordingly they cannot be considered as employees of the Applicant. This being the
case, the Applicant is not liable to pay the PAYE as assessed in respect of the
enumerators.
As part of the remedies sought the Applicant prayed that the Respondent be ordered to
refund to the Applicant the sum of Shs. 51,595,164 paid by the Applicant as 30% of the
tax in dispute with interest at 2% from the date of payment until the date of refund.
S.22(6) of the Tax Appeals Tribunals Act provides that the tribunal may make an order
as to damages, interest or any other remedy against any party, and the order shall be
enforceable in the same manner as an order of the High Court.
The use of the word `may'' above shows that discretion is granted to the tribunal to award
damages, interest or other remedies. It is settled law that discretion must be exercised
judiciously. In Kirilisa vs. Attorney General & Another (1990-1994) 1 EA 258 (SCU),
Manyindo DCJ, stated as follows:
"In my opinion discretion simply means the faculty of deciding or determining in
accordance with circumstances and what seems just, fair, right, equitable and reasonable
in those circumstances".
9
In the instant case the Applicant paid Shs.51, 595,164/- as 30% of the tax in dispute as
required under S.15 (1) of the Tax Appeals Tribunals Act. Having found that the
Applicant is not liable to pay the tax as assessed. It is only fair and just that the money
paid by the Applicant in order to access the tribunal be refunded to it. It is also fair and
just that this money be paid with interest of 2% per month from the date of payment until
the date of refund, as the Applicant has been deprived of the use of this money from the
time it was paid.
We accordingly order as follows;
1. The Application is allowed with costs to the Applicant.
2. The Respondent is ordered to refund to the Applicant the sum of Shs. 51,595,164/-
paid by the Applicant as 30% of the tax in dispute with interest at 2% per month from
the date of payment until the date of refund.
Dated at Kampala this 6th day of September 2024.
MR. SIRAJ ALI
CHAIRPERSON
MS. KABAKUMBA MASIKO
MEMBER
MS. SAFI GRACE
MEMBER
10', 'This ruling provides crucial clarity for Ugandan tax practitioners on distinguishing between employees and independent contractors, particularly for project-based engagements. The Tribunal''s reliance on common law tests, such as the ''control test'' and ''integration test,'' as well as the duration of engagement, is a key takeaway. The precedent set here emphasizes that the label given by the parties (e.g., ''contractor'') is not determinative if the actual working relationship indicates otherwise, but short-term engagements with limited control lean towards independent contractor status. This case highlights the importance of carefully structuring contracts and operational relationships to align with the intended tax treatment, especially concerning PAYE obligations under Section 126 of the Income Tax Act.

*   **Key Practical Lessons:**
*   The ''control test'' remains paramount in determining employment status.
*   Short-term, project-specific engagements with limited employer control are less likely to be deemed employment.
*   Documenting the terms of engagement clearly is vital for tax compliance.', '2026-07-04 16:44:37.87693+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('151d2888-706c-4471-b67d-1f74ecddc1aa'::uuid, 'MISC. APPLICATION NO.72/2024 (ARISING FROM TAT NO. 135/2023)', 'AIRTEL UGANDA LIMITED v UGANDA REVENUE AUTHORITY', 2024, 'Excise Duty', 'Dismissed', 'Airtel Uganda Limited sought to join Global Voice Group (GVG) as a second respondent in a tax appeal concerning excise duty assessments on OTT services. Airtel argued that GVG provided the data forming the basis of the assessments and was crucial for explaining them. The Tribunal dismissed the application, holding that GVG''s presence was not necessary for the effectual and complete settlement of the questions involved, as the orders sought would not legally affect GVG''s interests, and GVG could be summoned as a witness if needed.', 'This ruling is in respect of an application brought under Section 22(3) of the Tax Appeals Tribunal Act and Rule 30 of the Tax Appeals Tribunal (Procedure) Rules and O.1r.10(2), (13) and O. 52 r.1 and 3 of the Civil Procedure Rules. The application seeks the following orders;

Global Voice Group (GVG) be added as the 2nd respondent in TAT Application No. 135 of 2023.
Costs of the application be provided for.

1. Background facts
The application is supported by the affidavit of Mr. Hudson Katumba, the legal officer of the applicant which briefly states as follows:
(i) Sometime in the year 2018, an amendment to the Excise Duty Act introduced a Local Excise Duty (LED) tax on OTT services. The Tax was provided for under paragraph 13(b) of the Second Schedule of the Excise Duty Act 2018(as amended) and it imposed a Local Excise Duty tax of Shs. 200 per user per day of access.
(ii) The Applicant, alongside other telecommunication companies, Uganda Communication Commission (UCC), and the Respondent, came to the realization that there existed no established system for tax accountability or collection from users. Consequently, they reached a consensus that each telecommunication entity should implement distinct technologies and system configurations within their respective network.
(iii) The Applicant implemented a successful system, filed returns, set up Online Virtual Accounts and remitted the amounts collected from each user of OTT services to the Respondent.
(iv) The Applicant made monthly Local Excise Duty declarations through the adjusted monthly tax returns and attached accompanying accounting explanation of the money on the Respondent''s OVA Account. This was necessary because the users are hosted and identified on the telecom system network.
(v) For the period March 2020 to June 2021, the Applicant collected Local Excise duty on OTT services and remitted the same to the Respondent.
(vi) The Applicant remitted all monies collected from each user who paid the OTT tax to access the OTT services and filed all returns and reconciliations satisfactorily.
(vii) In 2022, the Respondent commenced a comprehensive tax audit on the Applicant for all tax heads from July 2019 to June 2022.
(viii) During the pendency of the audit, the Respondent issued additional administrative assessments for Excise duty on OTT services between 31st March 2023 and 14th April 2023, in the sum of Shs. 17,653,137,002, for the period March 2020 to June 2021.
(ix) Additional administrative assessments were issued based on information received by the Respondent from Global Voice Group (GVG), which purported to show that the Applicant permitted users to access OTT services without paying the OTT tax.
(x) The Applicant objected to the assessments and applied for review of the objection decision.
(xi) GVG, as the party, which provided the Respondent with the information forming the basis of the Assessments is instrumental in this matter and consequently the decision of the tribunal in TAT Application No.135 of 2023 would be of legal interest to GVG.
(xii) The interests of justice demanded the joinder of GVG as the second Respondent for the purpose of settling all the questions in and that it is in the interest of Justice for the Honorable Tribunal to join GVG as the 2nd Respondent for settling the questions involved in TAT Application No.135 of 2023.

The Respondent''s position was set out in its affidavit in reply deponed by Grace Aine Ngabirano, the Respondent''s Acting Manager, Special Projects. The affidavit which opposed the application stated as follows;
(i) The dispute in TAT Application No.135 of 2023, which relates to unremitted Local Excise Duty arising from OTT access to users, is unique to the Applicant.
(ii) The orders sought by the Applicant in TAT Application No.135 of 2023 will in no way directly or legally affect the GVG, nor is it likely to result in a multiplicity of suits, nor is the presence of GVG necessary for the adjudication of TAT Application No. 135 of 2023.
(iii) The Applicant has not demonstrated any interest that the GVG has in this matter.
(iv) The information used by the Respondent was obtained from a Government of Uganda owned Telecom Management Information System (TIMS) and DMS and it belongs to the Government of Uganda.
(v) The Respondent intends to call employees of the GVG as witnesses in this matter and the Applicant will have the opportunity to cross examine the said witnesses consequently, GVG does not need to be party to TAT Application No. 135 of 2023.
(vi) The failure to grant this Application shall not render the main application before the Honorable Tribunal nugatory nor will it prejudice the Applicant in any way.

6. Resolution of the application by the tribunal
We have carefully read and considered the affidavits on record and submissions of both parties. We have also perused the authorities provided by the parties.

This application has been brought under O. 1. Rule 10 (2) of the Civil Procedure Rules. It states as follows;

"(2) The court may at any stage of the proceedings either upon or without the application of either party, and on such terms as may appear to the court to be just, order that the name of any party improperly joined, whether as plaintiff or defendant, be struck out, and that the name of any person who ought to have been joined, whether as plaintiff or defendant, or whose presence before the court may be necessary in order to enable the court effectually and completely to adjudicate upon and settle all questions involved in the suit, be added."

It is clear from the submissions before us that the main thrust of the Applicant''s case is that GVG''s presence before the Tribunal is necessary to enable the Tribunal effectually and completely adjudicate upon and settle all questions involved in TAT Application No. 135 of 2023.

The criteria for determining whether the presence of a person is necessary under O.1 r.10 (2) of the Civil Procedure Rules was set out by Mulenga J.S.C, in Departed Asians Property Custodian Board v Jaffer Brothers Limited (supra). A relevant excerpt from his ruling is reproduced here below;

``However taking a leaf from authorities in other jurisdictions having similar, and even identical rules of procedure, I would summarize the position as follows: For a person to be joined on the ground that his presence in the suit is necessary for effectual and complete settlement of all questions involved in the suit, one of two things has to be shown. Either it has to be shown that the orders, which the plaintiff seeks in the suit would legally affect the interests of that person, and that it is desirable, for avoidance of multiplicity of suits, to have such person joined so that he is bound by the decision of the court in that suit. Alternatively, a person qualifies, (on application of a defendant) to be joined as a co-defendant, where it is shown that the defendant cannot effectually set up a defence he desires to set up unless that person is joined in it, or unless the order to be made is to bind that person. (See Mulla on the Code of Civil Procedure of India) 14th Ed. By J.M. Shelat, Vol.11 pp. 858 and 864-5 and Amon vs. Raphael Tuck & Sons Ltd (1956) 1 All ER 273 at p.290).

The criteria for determining whether the presence of a person is necessary under O.1 r.10 (2) of the Civil Procedure Rules, are, firstly, that the orders which the plaintiff seeks in the suit would legally affect the interests of that person, and that it is desirable, for avoidance of multiplicity of suits, to have such person joined so that he or she is bound by the decision of the court in that suit.

Alternatively, a person qualifies (on application of a defendant) to be joined as a co-defendant, where it is shown that the defendant cannot effectually set up a defence he desires to set up unless that person is joined in it, or unless the order to be made is to bind that person.

In this case, the orders sought by the applicant will not legally affect the interests of GVG. The applicant''s primary reason for adding GVG to these proceedings is that GVG provided the data, which was relied on by the Respondent, in issuing the additional assessments against the Applicant. (See paragraph 12 of the affidavit in support of the application by Hudson Katumba). It is apparent therefore that the Applicant seeks to add GVG as a party not because the orders sought by the Applicant in TAT 135 of 2023 will legally affect the interests of GVG but because the Applicant considers that GVG being the party which provided the Respondent with the information used in arriving at the additional assessments, is best placed to explain how it came up with the information, which it provided to the Respondent and which in turn formed the basis of the additional assessments.

The alternative condition only applies where a defendant seeks another party to be joined as a co-defendant, so that the defendant can effectually set up a defence, which it would not be able to set up, without that person being added to the suit as a co-defendant or unless the order to be made is to bind that person added as a co-defendant. In the present case, although the Applicant is defending an assessment issued against it by the Respondent, which places it in the position of a defendant, it does not seek to join GVG as a co-defendant for the purpose of setting up its defence, rather it seeks to join GVG as the party best placed to explain the basis of the additional assessments issued by the Respondent. The term ''co-defendant'' implies persons sued in the same litigation or charged with the same crime Apart from providing the information which gave rise to the Additional Assessment, GVG has no connection whatsoever with the assessment or with the Applicant, which would place it in the position of a co-defendant. GVG, in our opinion, does not come within the ambit of the criteria set out above.

The scope and purpose of O.1.R 10(2) of the Indian Code of Civil Procedure which is in pari materia with O.1. R.10 (2) of our Civil Procedure Rules was explained as follows in the Indian decision of Ramesh Hira Chand Kundan Mittal Mal v. Municipal Corporation of Greater Bombay, AIR (1992) SCW 846:

``It cannot be said that the main object of the rule is to prevent multiplicity of actions though it may incidentally have that effect. But that appears to be a desirable consequence of the rule rather than its main objective. The person to be joined must be one whose presence is necessary as a party. What makes a person a necessary party is not merely that he has relevant evidence to give on some questions involved; that would only make him a necessary witness. It is not merely that he has an interest in the correct solution of some question involved and has thought of relevant arguments to advance. The only reason which makes it necessary to make a person a party to an action is so that he should be bound by the result of the action and the question to be settled, therefore, must be a question in the action which cannot be effectually and completely settled unless he is a party. The line has been drawn on a wider construction of the rule between the direct interest or the legal interest and commercial interest. It is, therefore, necessary that the person must be directly or legally interested in the action in the answer, that is, he can say that the litigation may lead to a result which will affect him legally that is by curtailing his legal rights''''. (Emphasis Added) (See Mulla, The Code of Civil Procedure 18th Edition Vol.2 p.1525).

In the present case, the Applicant seeks to join GVG to TAT 135 of 2023 because it believes that GVG has relevant evidence to give in respect of the information that it provided to the Respondent. Applying the above decision to the facts of our case, such a situation would only make GVG a necessary witness and not a necessary party.

We believe that the proper course of action for the Applicant is to apply to the tribunal, at the appropriate time, under S. 21(2) (a) of the Tax Appeals Tribunals Act, for the tribunal to summon GVG to appear before it to give evidence. The above provision gives the tribunal the powers of the High Court to summon a person to appear before it to give evidence or to produce books, documents or things in the possession, custody or control of the person named in the summons.

The decision in Uganda Revenue Authority vs. ILISO Consulting (PTY) Ltd and Another, Misc. Application No. 34 of 2023, is distinguishable from the present case. In the ILISO case, the Applicant, ILISO Consulting, objected to the assessment issued against it by the Respondent on the grounds that it had been issued against the wrong party and that the correct party was ILISO South Africa. Uganda Revenue Authority sought to join ILISO South Africa, as a necessary party because the orders sought by ILISO Consulting would affect the legal interests of ILISO South Africa as it would be required to pay the taxes assessed. The ILISO case therefore fell squarely within the criteria set out in the Jaffer Brothers case. In this case, however, the orders sought will not legally affect the interests of GVG as its presence is only required for giving evidence.

The statement by Kanyeihamba, J.S.C, in the Jaffer Brothers case, to the effect that a party may be joined in a suit, not because there is a cause of action against it, but because that party''s presence is necessary in order to enable the court effectually and completely adjudicate upon and settle all the questions involved in the cause or matter, is of no help to the Applicant''s case, as it is merely a reiteration of the position of the law, as explained in detail by Mulenga J.S.C, in the same decision and on the basis of which the conclusions in this matter have been reached.

For the above reasons we find that the conditions to add GVG as the Second Respondent to these proceedings have not been met. This application is accordingly dismissed with costs.', 'This ruling clarifies the criteria for joining a party to a tax appeal before the Tax Appeals Tribunal in Uganda, particularly under O.1 Rule 10(2) of the Civil Procedure Rules. The key takeaway is that a party will only be joined if their presence is necessary for the effectual and complete settlement of all questions involved, meaning the orders sought would legally affect their interests, or to avoid multiplicity of suits. Simply having relevant evidence or providing data for an assessment is not sufficient; such a party can be called as a witness under Section 21(2)(a) of the Tax Appeals Tribunal Act. Tax practitioners should note that the Tribunal emphasizes the legal effect of the orders on the proposed party, rather than their evidentiary value alone.

*   **Key Takeaway:** Evidentiary relevance alone is insufficient for joining a party; a direct legal impact from the Tribunal''s orders is required.
*   **Main Risk/Precedent:** The ruling reinforces that the TAT will strictly apply the criteria for joinder, preventing parties from being added merely to assist in explaining assessments.
*   **Relevant Acts/Sections:** Tax Appeals Tribunal Act, Section 21(2)(a); Civil Procedure Rules, O.1 Rule 10(2).
*   **Practical Lessons:**
    *   Ensure the proposed party''s legal interests are directly affected by the appeal''s outcome.
    *   Consider summoning parties as witnesses if their role is primarily evidentiary.
    *   Focus on the necessity for complete adjudication, not just convenience.
    *   Refer to established precedents like *Departed Asians Property Custodian Board v Jaffer Brothers Limited* for joinder criteria.', '2026-07-06 11:18:49.924148+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('1854e649-a36f-4453-b5a9-8aa7996daca5'::uuid, 'TAT APPLICATION NO. 63 OF 2024', 'LACOSTE ENTERPRISES (U) LTD. v UGANDA REVENUE AUTHORITY', 2026, 'Customs', 'Allowed', 'The Applicant challenged a customs duty assessment, the seizure and auction of its vehicle, and the deactivation of its TIN. The Tribunal found that the customs liability for the imported Landcruiser had been settled by the subsequent owner, Eva Senyonga, and that the Respondent wrongfully impounded and sold another of the Applicant''s vehicles (Toyota Alex UBD 254B) for a non-existent liability. The Tribunal also ruled that the deactivation of the Applicant''s TIN was unlawful as it is not a prescribed enforcement measure.', 'THE REPUBLIC OF UGANDA
IN THE TAX APPEALS TRIBUNAL AT KAMPALA
TAT APLICATION NO. 63 OF 2024
LACOSTE ENTERPRISES (U) LTD................................................APPLICANT
VERSUS
UGANDA REVENUE AUTHORITY................................................RESPONDENT
BEFORE: HON. CRYSTAL KABAJWARA, MR. SIRAJ ALI,
HON. KABAKUMBA MASIKO
RULING
I. Introduction
1. This ruling arises from an application challenging a tax liability arising from an alleged under-declaration of customs duties on an imported vehicle.
II. Background
2. The Applicant is in the business of importing and clearing goods. On 20 March 2018, the Applicant imported a Toyota Landcruiser which was registered under motor vehicle Registration Number UBD 748E.
3. Subsequently, on 20 April 2018, the Applicant sold the said vehicle duty-free to Eva Senyonga of Christian Life Church, who then paid the applicable customs duties. Upon payment, the vehicle was registered in her name and released to her.
4. On 29 October 2019, the Respondent conducted a system audit and issued a demand notice to the Applicant, alleging that the Applicant had underdeclared import duty by Shs. 26,602,101. This was the result of a misdeclaration of the vehicle as used rather than new.
...
66. In view of the above, the Honourable Tribunal makes the following orders:
(i) The Respondent is ordered to pay to the Applicant the proceeds from the sale of Motor vehicle UBD 254B;
(ii) The Respondent shall pay interest on the proceeds at a rate of 2% per month from the date that the vehicle was sold up to the date of payment of the proceeds to the Applicant;
(iii) General damages are hereby awarded to the Applicant in the amount of Shs. 15,000,000;
(iv) The Respondent should immediately re-activate the Applicant''s Tax Identification Number; and
(v) Costs of this application are hereby awarded to the Applicant.
Dated at Kampala this 5th day of March 2026.', 'This ruling provides crucial clarity on the enforcement powers of the Uganda Revenue Authority (URA), particularly concerning customs duties and the use of Tax Identification Numbers (TINs). The Tribunal''s emphasis on Section 130 of the East African Community Customs Management Act (EACCMA), 2004, highlights that customs duty is primarily charged on the goods themselves and payable by the owner at the time of assessment. The decision reinforces that the URA cannot arbitrarily deactivate a taxpayer''s TIN as an enforcement measure, as this is not provided for under any taxing act, including the Tax Procedure Code Act (TPCA). This case sets a significant precedent against the URA''s overreach in enforcement actions and underscores the importance of due process and adherence to statutory provisions.

Key practical lessons:
* URA''s enforcement actions must strictly adhere to statutory provisions.
* TIN deactivation is not a lawful tax enforcement measure.
* Customs duty liability primarily rests with the owner of the goods at the time of assessment.', '2026-07-06 11:21:11.008141+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('19af78c7-4fae-40cf-9432-731635898033'::uuid, 'APPLICATION NO. 36 OF 2020', 'Kasese Cobalt Company Limited v Uganda Revenue Authority', 2025, 'Income Tax', 'Partial', 'The Applicant challenged PAYE assessments for 2016-2019, claiming its expatriate employees were tax-exempt under a 1992 Project Development Agreement (PDA) and subsequent ministerial confirmations, and that the 2016 assessment was time-barred. The Tribunal found that the PDA did not create a statutory exemption and the ministerial confirmations did not validly extend the exemption beyond 2015 under the Income Tax Act, 1997. However, the Tribunal ruled that the 2016 assessment was time-barred as URA failed to prove new information, but upheld the assessments for 2017-2019.', 'This ruling is in respect of an application challenging the Respondent''s additional PAYE assessments for the period 2016–2019 amounting to UGX 1,919,169,379 on the grounds that the Applicant''s expatriate employees were tax-exempt under the 1992 Kasese Cobalt Project Development Agreement, as preserved by section 166(26)(b) of the Income Tax Act, 1997, and that the 2016 assessment is time-barred.

Clause 20.2(c) of the PDA provides that non-Ugandan employees, consultants, contractors and sub-contractors engaged in the project shall receive "fees, salaries, bonuses or other emoluments without liability to Ugandan tax." The Applicant has consistently relied on this clause as the basis for its treatment of expatriate employees for tax purposes.

Following the enactment of the Income Tax Act, 1997, which commenced on 1 July 1997 and repealed the 1974 Decree, transitional provisions were introduced under section 166(26)(b). That provision required ministerial concurrence in writing by 31 December 1997 in order for agreement-based exemptions to continue to have effect under the new Act.

In Civil Appeal No. 4 of 2020, Kasese Cobalt Company Limited v URA, the High Court set aside this Tribunal''s decision in TAT Application No. 28 of 2018 which considered similar facts for an earlier period. The High Court held that the Applicant was exempt from PAYE for the years 2009-2015.

We find that the 2002 letter was already too late for Section 166 (26)(b), and it cannot, even in principle, validate years beyond those the Court addressed. Even if treated as evidencing Cabinet policy, it cannot override a statutory cut-off date, as administrative correspondence cannot revive a statutory exemption after the deadline.

80. The doctrine of stare decisis requires this Tribunal to follow the binding ratio decidendi of the High Court in HCCA No. 4 of 2020. That ratio may be summarised as:
a. the PDA does not itself create a statutory exemption;
b. any agreement-based exemption had to be validated by concurrence under section 166(26)(b) by 31 December 1997;
c. tax exemption and statutory timelines in tax law must be strictly construed; and
d. on the evidence before it, the Court recognised an exemption only for the years 2009-2015.

81. We note that the High Court did not hold that the Applicant was exempt for all future years. Its deliberate limitation of relief to the years 2009–2015, coupled with its express rejection of perpetual exemptions, must be taken as intentional.

91. We therefore find that the Respondent has not discharged the burden of proving fraud, gross or wilful neglect, or the discovery of new information to justify issuing an additional assessment for 2016 outside the three year limitation period. The additional assessment for 2016 was issued outside the statutory period and is accordingly time-barred. The assessments for 2017–2019, having been issued within the ordinary limitation period, are not affected by this finding.

94. Accordingly, the Tribunal orders as follows:
(i) The PAYE assessment for the year 2016 is set aside as time-barred.
(ii) The additional PAYE assessments for the years 2017, 2018 and 2019 are upheld.
(iii) Each party shall bear its own costs of this application.', 'This ruling underscores the critical importance of strict compliance with statutory requirements for tax exemptions in Uganda. The Tribunal''s adherence to the principle of *strictissimi juris* for tax exemptions, as well as the mandatory nature of statutory deadlines, is a key takeaway. Tax practitioners should note that administrative assurances or contractual agreements, even with ministerial correspondence, cannot override clear legislative provisions, particularly Section 166(26)(b) (now Section 153(22)(b)) of the Income Tax Act, 1997, regarding the validation of pre-existing exemptions. Furthermore, the ruling clarifies that a mere change in legal interpretation by URA officers does not constitute ''new information'' to circumvent the three-year limitation period for additional assessments under Section 25(2) of the Tax Procedures Code Act.

*   **Key Takeaway:** Tax exemptions must have a clear statutory basis and strict compliance with all conditions, including deadlines for validation.
*   **Main Risk/Precedent:** Reliance on contractual clauses or administrative letters without explicit statutory backing for tax exemptions is highly risky and unlikely to succeed in court for periods beyond those explicitly validated or recognized.
*   **Practical Lessons:**
    *   Always verify the statutory authority for any claimed tax exemption.
    *   Ensure all conditions for transitional provisions, like those in the ITA, are met within the stipulated timelines.
    *   A change in URA''s legal interpretation is generally not ''new information'' to extend assessment limitation periods.', '2026-07-04 15:35:55.672659+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('1d994be3-0769-4de5-a310-b9eaff2d5b0e'::uuid, 'TAT No. 145 of 2025 (PGU8)', 'Edward Mwanje vs Commissioner General, Uganda Revenue Authority', 2026, 'PAYE', 'Dismissed', 'Edward Mwanje, a retired teacher, sought a refund of UGX 5 billion for alleged PAYE overpayments from June 2000 to May 2020, claiming URA failed to apply proper exemptions and deductions. URA rejected the claim and raised a preliminary objection that the application to the Tax Appeals Tribunal was filed approximately eight months out of time.', '[Scanned PDF sent to Gemini for OCR: Edward Mwanje v Uganda Revenue Authority TAT 145 Of 2025.(7th May, 2026).pdf]

[File Uploaded: Edward Mwanje v Uganda Revenue Authority TAT 145 Of 2025.(7th May, 2026).pdf]

This file is ready for analysis. The server will parse the document text or use OCR/vision where needed for scanned PDFs and images.

You can also add custom notes or paste additional excerpts here if you''d like to combine them with the document.', 'Taxpayers must strictly adhere to statutory timelines for filing objections and appeals to avoid their cases being dismissed on procedural grounds. Always seek an extension of time with a valid explanation if the deadline cannot be met, and ensure all claims are supported by sufficient evidence.', '2026-07-09 18:13:05.849391+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('1e5cea07-f87c-4cb5-8dd5-16dfd0424c8b'::uuid, 'TAT APPLICATION NO. 303 OF 2024', 'QUALITY CHEMICAL INDUSTRIES LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'Income Tax', 'Dismissed', 'The Applicant challenged a Capital Gains Tax assessment arising from a substantial change in its ownership structure, arguing that it did not dispose of shares or derive income from the transaction, and that Double Taxation Agreements (DTAs) precluded Uganda''s taxing rights. The Tribunal dismissed the application, holding that Sections 74(2) and 78(h) of the Income Tax Act create a statutory fiction of deemed realization of assets and liabilities by the resident entity upon a qualifying ownership change, irrespective of actual proceeds received by the company. The Tribunal also found that DTAs do not override domestic deeming provisions for resident entities and that the Applicant failed to discharge the burden of proving the assessment was excessive.', 'This ruling is in respect of an application challenging the Respondent''s assessment of Capital Gains Tax amounting to Shs. 4,777,121,735 following a substantial change in the Applicant''s ownership structure after the disposal of shares by non-resident shareholders. The dispute centers on whether the resulting transaction triggered the deeming provisions under sections 74(2) and 78(h) of the Income Tax Act, thereby rendering the Applicant liable to tax on a deemed realization of its assets and liabilities, and whether the applicable Double Taxation Agreements restrict Uganda''s taxing rights in respect of the transaction.

Section 78(h) of the Income Tax Act provides as follows:
"Income is derived from sources in Uganda to the extent to which it is—
(h) derived from the direct or indirect change of ownership by fifty percent or more of a person other than an individual, a government, a political subdivision of a government and a listed institution located in Uganda."

Section 74(2) of the Income Tax Act further provides that:
"For the purposes of section 78(h), a person other than an individual, a government, a political subdivision of a government, or a listed institution that changes its ownership by fifty percent or more within a period of three years shall be treated as-
(a) realising all its assets and liabilities immediately before the change;
(b) having parted with ownership of each asset and deriving an amount in respect of the realisation equal to the market value of the asset at the time of the realisation;
(c) re-acquiring the asset and incurring expenditure of the amount referred to in paragraph (b) for the acquisition;
(d) realising each liability and being deemed to have spent the amount equal to the market value of that liability at the time of the realisation; and
(e) re-stating the liability for the amount referred to in paragraph (d)."

Section 78(h) therefore is a source rule. It identifies income as derived from sources in Uganda where it is derived from a direct or indirect change of ownership by fifty percent or more of a person, other than an individual, government, political subdivision of government or listed institution, located in Uganda. Section 74(2) is the operative provision which gives tax effect to that source rule. It prescribes the legal consequences that follow once the qualifying ownership-change threshold is met.

The two provisions must therefore be read together. Section 78(h) identifies the Ugandan source nexus; section 74(2) creates the statutory realization event. It would be an error to read section 78(h) in isolation, or to treat section 74(2) as merely procedural. Section 74(2) is substantive. It directs that the resident entity whose ownership has changed shall be treated as having realized all its assets and liabilities immediately before the change. The Tribunal must interpret the provisions harmoniously and in a manner that gives effect to every enacted word of Parliament. An interpretation which renders any statutory language redundant is ordinarily to be avoided.

The words "shall be treated as" are deliberate. They create a statutory fiction. Once Parliament creates such a fiction, the Tribunal is bound to carry it to its logical statutory conclusion, but no further than the Act permits. The fiction is not that the shareholder''s proceeds were received by the company. The fiction is that the company realized its own assets and liabilities at market value immediately before the qualifying ownership change.

Accordingly, the Applicant''s reliance on separate legal personality is correct as a statement of company law, but insufficient as an answer to section 74(2). A company is separate from its shareholders. However, that principle does not prevent Parliament from attaching tax consequences to a material change in the economic ownership of that company. Section 74(2) does not collapse the company into its shareholders; rather, it taxes the company precisely because it remains the resident person whose ownership has undergone a qualifying statutory change.

The taxable event under section 74(2) is therefore distinct from the shareholders'' disposal of shares. The shareholders disposed of shares. The Applicant, by force of statute, is deemed to have realized its assets and liabilities. Those are not the same event, even if both arise from the same commercial transaction.

This approach is consistent with Kuku Foods Uganda Limited v Uganda Revenue Authority TAT Application No. 54 OF 2025, where the Tribunal held that section 74(2) creates a separate deemed realization by the resident entity, and that liability does not depend on whether the resident company received the shareholder''s consideration.

In the present case, the evidence shows that Meditab Holdings Limited disposed of 51.05% of the Applicant and Cipla EU Limited disposed of 0.13%, producing an aggregate ownership change of 51.18% between 13th and 14 March 2023. That threshold exceeds the statutory requirement under section 74(2).

The Tribunal therefore finds that the statutory trigger was met. From that point, section 74(2) operated by force of law. The absence of actual proceeds in the hands of the Applicant does not defeat the assessment, because the Act taxes the deemed realization of the Applicant''s assets, not the actual receipt of the shareholders'' sale proceeds.

The Applicant''s argument also requires the Tribunal to consider whether the transaction should instead be treated solely as a shareholder disposal. We do not accept that approach. The Income Tax Act may attach different consequences to different persons arising from one commercial arrangement. A share sale may produce consequences for the seller under one provision, while the same transaction may trigger a deemed realization by the resident entity under section 74(2), if the statutory threshold is crossed.

We also note that Section 78(h) is not confined to indirect transfers. Its text refers to "direct or indirect" change of ownership. The inclusion of both words must be given effect. A construction that confines section 78(h) to indirect offshore transfers would render the word "direct" redundant.

The Tribunal in Kuku Foods treated section 78(h) as capable of applying to direct ownership changes falling outside section 78(g), and explained that section 74(2) operationalizes the consequences of such qualifying changes. That reasoning applies in the present case.

The Tribunal further notes that section 78(g) addresses gains derived from the disposal of interests in entities whose value is principally attributable to immovable property situated in Uganda. The present dispute does not concern such an entity, nor was evidence led demonstrating that the Applicant falls within that statutory category. The Tribunal therefore considers section 78(h) to be the applicable charging provision governing the qualifying change in ownership established on the evidence before it.

The Applicant additionally argued that, in any case, the resulting gain is exempt under Section 21(1)(j) of the Income Tax Act because it constitutes a capital gain not included in business income. The Tribunal has considered that argument together with Sections 2 and 18 of the Act. Section 18(1)(a) includes within business income any gain arising from the disposal of a business asset, while Section 2 defines a business asset as an asset held or used in the production of income. The Applicant is a commercial entity engaged in the manufacture and sale of pharmaceutical products for profit. Its assets therefore constitute business assets within the meaning of the Act.

Accordingly, once Section 74(2) deems the Applicant to have realized its assets at market value, the resulting gain constitutes business income by operation of law and cannot fall within the exemption contemplated under Section 21(1)(j).

Computation of the taxable gain

We now turn to computation. Section 74(2) does not authorize an arbitrary or commercially convenient computation. It prescribes the architecture of the calculation. The resident entity is deemed to have realized each asset and each liability at market value immediately before the ownership change. The computation must therefore begin with the statutory question: what was the market value of the Applicant''s assets and liabilities immediately before the qualifying change?

The Tribunal emphasizes that the purchase price for shares may be relevant evidence, but it is not itself the statutory measure. Share price, enterprise value, equity value, net book value, and written down value are related but distinct concepts. Section 74(2) speaks of assets and liabilities at market value. It does not speak of enterprise value, shareholder consideration, or accounting convenience.

In Kuku Foods, this Tribunal cautioned that the computation under section 74(2) must remain faithful to the statutory language. It held that the inquiry is not whether one valuation method is commercially preferable, but whether the valuation exercise sufficiently addresses the statutory requirement to determine the market value of the company''s assets and liabilities at the effective date of the ownership change.

The Respondent initially adopted a transaction value of USD 30 million. The Applicant challenged that figure and demonstrated that the transaction consideration was USD 25 million. The Respondent accepted that objection and revised the assessment. That history is important because it shows that the initial computation was not beyond correction and that the Applicant did successfully displace one component of the assessment.

The subsequent question is whether the final amended assessment of Shs. 4,777,121,735 was shown to be excessive or erroneous. The evidence shows that after further review the Respondent revised its computation from net book value to written down value and issued the amended assessment. Written down value may properly be relevant to the cost base of depreciable assets, especially where capital allowances have already been claimed. However, written down value is not necessarily identical to market value.

The statutory phrase "market value" remains controlling. A computation under section 74(2) must therefore distinguish between the market value of the deemed realization proceeds and the cost base or tax written down value used to determine the resulting gain.

In the present case, the Applicant did not place before the Tribunal an independent valuation, expert report, or alternative statutory computation demonstrating that the Respondent''s final assessment was excessive. Nor did the Applicant provide a competing valuation of the Applicant''s assets and liabilities immediately before the March 2023 ownership change. Its case remained principally legal rather than evidential on computation.

The burden of proof is material. Under section 28 of the Tax Procedures Code Act and section 19 of the Tax Appeals Tribunal Act, the taxpayer bears the burden of proving that an assessment is excessive or erroneous. That burden is not discharged merely by showing that an earlier computation was wrong. It must be discharged against the assessment before the Tribunal.

The Tribunal therefore holds that although the Respondent''s computation must always be measured against the statutory command of market value, the Applicant has not discharged the burden of proving that the amended assessment of Shs. 4,777,121,735 is excessive or erroneous. The assessment is accordingly upheld, not because written down value is synonymous with market value, but because the Applicant failed to adduce sufficient evidence to displace the final computation.

For emphasis, the Tribunal''s conclusion should not be understood as judicial approval of written down value as a substitute for market value under section 74(2). Rather, the Tribunal''s conclusion is confined to the evidential posture of this case, where the Applicant failed to adduce sufficient expert or valuation evidence capable of displacing the Respondent''s amended assessment.

Applicability of Double Tax Agreements

The Applicant also relies on the Uganda-Mauritius and Uganda-United Kingdom Double Taxation Agreements. Its argument is that gains from the disposal of shares are taxable only in the residence state of the disposing shareholder, and that Uganda is thereby precluded from imposing the disputed assessment.

That argument would have force if the assessment before us were imposed on Meditab Holdings Limited or Cipla EU Limited in respect of their shareholder gains. It is not. The assessment is imposed on the Applicant, a Ugandan resident company, in respect of a deemed realization of its assets and liabilities under section 74(2).

The distinction is not formalistic. It is fundamental. The treaties address allocation of taxing rights over particular classes of income derived by particular persons. The income alleged to arise to the non-resident shareholders from their disposal of shares is not the same juridical income as the deemed gain attributed by domestic law to the resident company upon a qualifying ownership change.

Section 88(2) of the Income Tax Act gives treaty provisions priority where there is inconsistency between the treaty and domestic law. The Tribunal finds no such inconsistency here. The treaty may restrict Uganda''s right to tax a non-resident shareholder on share-disposal gains. It does not, on the wording relied upon by the Applicant, prohibit Uganda from taxing its own resident company on a separate deemed realization created by domestic law.

The Applicant''s treaty argument therefore conflates economic connection with juridical identity. One commercial transaction may generate more than one tax consequence. Treaty protection available to one taxpayer in respect of one item of income is not automatically transferred to another taxpayer in respect of a different statutory item of income.

The Tribunal is guided in this conclusion by the reasoning in Fowler v Commissioners for Her Majesty''s Revenue and Customs, where the court recognized that domestic deeming provisions may create consequences for domestic tax purposes, although such deeming must be carefully confined to its statutory purpose. In the present case, section 74(2) creates a domestic deemed realization by a resident entity. The treaties relied upon do not extinguish that event.

Effective date of change of ownership

The Tribunal also considers the effective date of the ownership change. Section 74(2) operates immediately before the change in ownership. The date of that change is therefore not a mere administrative detail. It fixes the valuation point for the deemed realization.

In cases involving share transfers, the Tribunal must distinguish between an agreement to transfer shares, the fulfilment of conditions precedent, beneficial ownership, legal title, and registration formalities. The effective date for section 74(2) purposes is the date on which the ownership change legally and beneficially crystallizes, unless the evidence shows that beneficial ownership passed earlier.

In Kuku Foods, the Tribunal held that execution of a share purchase agreement alone does not necessarily effect a change in ownership where the agreement remains subject to conditions precedent and company-law transfer formalities. In the present case, the parties'' evidence and Joint Scheduling Memorandum point to an aggregate change of 51.18% between 13th and 14th March 2023. The Tribunal therefore treats that period as the effective ownership-change date for purposes of section 74(2). The relevant valuation point is immediately before that change.

Taxation of notional income

The Applicant further contends that the assessment taxes notional income which was neither received nor receivable. That submission is understandable as a commercial grievance, but it cannot prevail against the enacted language of section 74(2).

A statutory fiction is not defeated merely because the deemed state of affairs did not occur in fact. Its purpose is to require the decision-maker to treat the deemed event as having occurred for the purposes specified by Parliament. Here, Parliament specified that upon a qualifying ownership change, the resident entity is treated as having realized all its assets and liabilities at market value immediately before the change.

The Tribunal must, however, apply the fiction carefully. Section 74(2) does not deem the company to have received the shareholders'' sale proceeds. It deems the company to have realized its own assets and liabilities. That distinction preserves both the integrity of separate legal personality and the statutory purpose of taxing gains embedded in Ugandan resident entities whose ownership changes substantially.

The result may create cash-flow difficulty for a taxpayer, but hardship is not a basis for refusing to apply a clear charging mechanism. Where Parliament has chosen a deemed realization rule, the Tribunal''s duty is to give effect to it, provided the assessment remains within the limits of the statute.

Constitutionality of the assessed tax

The Applicant additionally raised constitutional objections under Article 26 of the Constitution and argued that the impugned assessment amounted to compulsory deprivation of property. The Tribunal however agrees with the Respondent that under Article 137 of the Constitution, jurisdiction to determine the constitutionality of Acts of Parliament is vested exclusively in the Constitutional Court. This Tribunal, being a statutory tribunal established under the Tax Appeals Tribunal Act, lacks jurisdiction to declare Section 74(2) unconstitutional or to disregard its application. In any event, taxation imposed pursuant to an express Act of Parliament is constitutionally sanctioned under Article 152(1) of the Constitution provided the relevant statutory procedure is followed.

For the reasons above, the Tribunal finds that the Respondent lawfully assessed Capital Gains Tax against the Applicant pursuant to Sections 74(2) and 78(h) of the Income Tax Act. Issue 1 is therefore resolved in the affirmative.

Issue 2: What remedies are available to the parties?

Having found that the Respondent lawfully issued the impugned assessment, the Applicant''s prayers seeking to set aside the assessment cannot succeed.

With regard to costs, although the Respondent has substantially succeeded, the dispute raised important questions concerning the scope of Sections 74(2) and 78(h) of the ITA, valuation under deemed realization rules, and the interaction between domestic law and Double Taxation Agreements. Given that the relevant amendments to the ITA are fairly new, the Tribunal considers this an appropriate case for each party to bear its own costs.

VIII. Orders

The Tribunal accordingly makes the following orders:

i. The Application is dismissed.

ii. The Respondent''s amended assessment dated 2 October 2024 assessing Capital Gains Tax amounting to Shs. 4,777,121,735 against the Applicant is hereby upheld.

iii. Each party shall bear its own costs.

It is so ordered.

Dated at Kampala this 29th day of May 2026', 'This ruling reinforces the Uganda Revenue Authority''s (URA) position on the application of deemed realization provisions under Sections 74(2) and 78(h) of the Income Tax Act (ITA) in cases of substantial ownership changes. Tax practitioners must be acutely aware that a change in the ownership of a resident company by 50% or more within three years triggers a deemed disposal of all its assets and liabilities at market value, creating a tax liability for the company itself, distinct from any capital gains tax on the shareholders. The Tribunal''s emphasis on the ''statutory fiction'' means that the actual receipt of proceeds by the company is irrelevant for this specific tax. Furthermore, the ruling clarifies that DTAs, while potentially protecting non-resident shareholders from tax on share disposals, do not prevent Uganda from taxing its own resident entities on deemed realizations under domestic law. The burden of proof remains firmly on the taxpayer to demonstrate that the URA''s market value assessment is erroneous, requiring robust independent valuations.

*   **Key Takeaway:** Deemed realization under ITA Sections 74(2) and 78(h) creates a distinct tax liability for the resident company, separate from shareholder gains.
*   **Main Risk/Precedent:** Companies undergoing significant ownership changes (50% or more within 3 years) must proactively assess and plan for potential deemed Capital Gains Tax on their assets, even if they do not directly receive sale proceeds.
*   **Relevant Acts/Sections:** Income Tax Act, Sections 74(2), 78(h), 18(1)(a), 21(1)(j), 88; Tax Procedures Code Act, Section 28.
*   **Practical Lessons:**
    *   Always consider the impact of ownership changes on the resident entity''s tax position, not just the shareholders.
    *   Be prepared with independent valuations to challenge URA''s market value assessments.
    *   DTAs may not shield resident companies from domestic deemed realization rules.', '2026-07-08 10:00:05.254506+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('1f76a9fd-a569-470a-8134-93bc005f9d5d'::uuid, 'TAT No. 113 of 2025', 'Lion of Judah Limited v Uganda Revenue Authority', 2026, 'Income Tax', 'Dismissed', 'The Applicant challenged an income tax assessment on an unsupported loan, which it claimed was a related-party loan converted into share capital. The Tribunal found that the Applicant failed to provide sufficient evidence to prove the existence of a genuine loan or its disbursement. The Tribunal concluded that the URA was justified in recharacterizing the amounts as unexplained income under Section 117 of the Income Tax Act and dismissed the application, maintaining the income tax assessments.', 'This application challenges an additional income assessment amounting to Shs. 116,779,982 issued by the Respondent on the grounds of an unsupported loan. The Applicant seeks the following orders:
(i) A declaration that the Applicant is not liable to pay the tax assessed.
(ii) Costs of this Application be provided for.

Background facts
2. The Applicant is a duly incorporated company dealing in the business of radio broadcasting in Mbarara District. On 18 November 2019 and 29 November 2023, the Applicant was issued with an additional Income tax assessment of Shs. 116,779,982 on grounds of an unsupported loan. On 23 January 2020 and 31 May 2024, the Applicant objected to the said assessment on the grounds that it had obtained a related-party loan, which was converted into share capital.

Issues for determination
5. The key issue to be determined is whether the Applicant is liable to pay the tax assessed

50. In the premises, the issue now falling for determination is whether the Applicant is liable to pay the total assessed tax of Shs. 116,779,982. At the centre of this dispute is whether the related-party loan subsequently converted to share capital constitutes taxable income under the Income Tax Act.

51. Section 4 of the Income Tax Act (ITA) imposes income tax on every person who has a chargeable income for the year of income. This means that income tax is charged on income earned, not on capital or money invested to earn income. We must therefore determine whether the Applicant received funds that constituted a loan.

Whether the Applicant has proved the existence of the disputed loan
52. A loan does not constitute income in the hands of a borrower. Accordingly, where a taxpayer contends that amounts treated by the Commissioner General as taxable income are in fact loan proceeds, the taxpayer bears the burden of proving, through credible and concurrent evidence, that a genuine debtor-creditor relationship existed and that the funds were actually advanced.

53. In the present matter, the Applicant has argued that it obtained an interest-free shareholder loan of Shs. 407,305,333 pursuant to a loan agreement dated 1 May 2017. In support of this contention, the Applicant relied on three principal documents: the loan agreement, a church collection ledger, and a board resolution dated 12 January 2024 increasing the company''s issued share capital from Shs. 1,000,000 to Shs. 407,000,000 following the alleged conversion of the loan into equity.

54. However, the existence of a written loan agreement, without more, is insufficient to establish that funds were in fact advanced. As was emphasised in Explorer (U) Ltd v Uganda Revenue Authority, TAT Application No. 87 of 2023, documentary assertions of indebtedness must be supported by objective financial records demonstrating that the amounts were received, recorded, and consistently treated as liabilities in the taxpayer''s accounts. For example, we would have expected the Applicant, beyond the loan agreement itself, to produce credible coexistent financial evidence demonstrating the actual disbursement of the alleged loan, such as bank statements or a cash book. The Applicant could have provided a loan movement schedule, but this was not provided either.

59. In the present case, no such comparable evidence has been provided; therefore, we find that the Applicant has failed to discharge the burden of proving that the alleged shareholder loan was ever disbursed or that a genuine debtor-creditor relationship came into existence.

65. Section 117 of the Income Tax Act is a general anti-avoidance provision designed to counter arrangements that lack economic substance or are artificially structured to defeat the purpose of the Act. The provision empowers the Respondent to disregard the legal form of a transaction and to recharacterise it according to its true substance where the surrounding circumstances demonstrate that the arrangement does not reflect genuine commercial reality.

69. The Tribunal therefore finds that the Respondent properly invoked section 117 of the Income Tax Act to recharacterise the disputed amounts of Shs. 116,779,882 as unexplained income and to assess tax accordingly.

70. Consequently, we find that the Applicant has not discharged the burden of proving the existence of the alleged shareholder loan and has not established that the subsequent conversion into equity evidences a valid underlying debt. Therefore, the Respondent was justified, pursuant to Section 117 of the Income Tax Act, in treating the loan as unexplained income.

71. In the circumstances, the Tribunal dismisses this application and makes the following orders:
(i) The income tax assessments are hereby maintained
(ii) Costs of this application are awarded to the Respondent.', 'This ruling underscores the critical importance of robust and contemporaneous documentation for all financial transactions, especially related-party loans and subsequent conversions to equity. Tax practitioners in Uganda must advise clients that mere contractual agreements or belated board resolutions are insufficient without verifiable financial records (e.g., bank statements, ledger entries, audited financial statements) demonstrating the actual movement of funds and consistent accounting treatment. The Tribunal''s reliance on Section 117 of the Income Tax Act highlights URA''s power to disregard the form of a transaction if its substance does not reflect genuine commercial reality, particularly in anti-avoidance scenarios. This case sets a precedent that taxpayers bear a heavy burden of proof to substantiate the nature of funds, and failure to do so will likely result in recharacterization as taxable income.

*   **Key Takeaway:** Substance over form is paramount; documentation must reflect actual financial flows.
*   **Main Risk/Precedent:** Unsubstantiated related-party loans or capital conversions will be treated as taxable income.
*   **Relevant Act/Section:** Section 117 of the Income Tax Act (Cap 340) empowers URA to recharacterize transactions lacking economic substance.
*   **Practical Lessons:**
    *   Maintain comprehensive and contemporaneous financial records for all transactions.
    *   Ensure related-party agreements are supported by actual fund disbursements and accounting entries.
    *   Be prepared to demonstrate the commercial reality and economic substance of transactions.', '2026-07-04 21:31:01.317162+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('218ab3a2-486a-4697-a7cd-3e3c3d35f0c5'::uuid, 'APPLICATION NO.193 OF 2024', 'INTERNATIONAL HOSPITAL KAMPALA LIMITED v UGANDA REVENUE AUTHORITY', 2024, 'VAT | Income Tax', 'Partial', 'The Tribunal ruled on two main issues: VAT on meals for inpatients and deductibility of bad debts. It found that meals provided to inpatients are incidental to medical services and thus exempt from VAT, setting aside the VAT assessment. For bad debts, the Tribunal allowed the deduction for individual patient debts where reasonable recovery steps were taken but disallowed the deduction for debts from insurance companies due to the Applicant''s failure to meet contractual conditions, which extinguished the legal right to payment.', 'I. Introduction
1. This is an application challenging the Respondent''s assessment of income tax and Value Added Tax (VAT) arising from the Respondent''s treatment of meals supplied to in-patient clients as taxable supplies and the disallowance of a deduction for bad debts.

II. Background Facts
2. The Applicant is a multi-specialty hospital that provides advanced medical care. On 8 September 2023, the Respondent conducted an audit of the Applicant for the period July 2018 to June 2022 and raised an assessment of Shs. 1,963,022,706, comprising:
(i) Income tax of Shs. 1,289,287,222 on the basis that the Applicant did not take all reasonable steps to recover the bad debts.
(ii) VAT of Shs. 356,508,843 on the grounds that the provision of meals to inpatients is taxable.
(iii) WHT of Shs. 317,226, 641, which was subsequently settled.

III. Issues
5. The following are the issues for determination.
i. Whether the Applicant is liable to pay the assessed income tax and VAT?
ii. What remedies are available to the parties?

VIII. The determination
73. Having considered the pleadings, affidavits, and submissions of both parties, this is the ruling of the Tribunal.

(i) Whether Meals Provided to Inpatients are incidental to Supply of Medical Services or not?
78. VAT is imposed on every taxable supply made in Uganda by a taxable person under sections 4 and 18 of the VAT Act, Cap. 344, unless the supply is expressly exempt. Section 19(1) of the VAT Act states:
"A supply of goods or service is an exempt supply if it is specified in Schedule 3 to this Act."
79. Paragraph 1(h) of Schedule 3 to the VAT Act expressly lists the supply of veterinary, medical, dental and nursing services as exempt. Further, Section 12 of the VAT specifies for mixed supplies as:
"(1) A supply of services, incidental to the supply of goods is part of the supply of goods.
(2)A supply of goods is incidental to the supply of services is part of the supply of services.
(3) A supply of services incidental to the import of goods is part of the import of goods.
(4) Regulations made under Section 51 may provide that a supply is a supply of goods or services."

91. Accordingly, the Tribunal finds that the Applicant has discharged its burden of proving that meals supplied to inpatients constitute an exempt composite supply within the meaning of section 19 and Schedule 3 to the VAT Act. The VAT assessment of Shs. 356,508,843 is therefore set aside.

B. Whether the Applicant Is Entitled to Deduct Bad Debts
92. Deductions for bad debts are governed by section 24 of the Income Tax Act, which is a specific provision overriding the general deduction rule under section 22(1)(a). Under section 24(3), a deductible bad debt must:
a) constitute a debt claim (a legally enforceable right to payment); and
b) be one in respect of which the taxpayer has taken all reasonable steps to pursue recovery and reasonably believes it will not be satisfied.

96. The Tribunal therefore finds that the Applicant took all reasonable steps to recover individual patient debts. The income tax assessment relating to Shs. 246,023,217 is set aside.

Debts in respect of insured patients - Shs. 667,367,056
97. The evidence is materially different. The Applicant admitted that claims were rejected due to:
(i) Late submission beyond contractual timelines;
(ii) The lack of pre-authorization;
(iii) Submission of excluded services;
(iv) Incomplete documentation.

98. Based on the above, claims were rejected not due to an inability on the part of the insurance companies to pay, but due to a failure by the Applicant to meet certain pre-conditions for payment as required by the contractual arrangements between the Applicant and the insurance companies. Therefore, where contractual conditions are not satisfied, no legally enforceable right to payment arises. As held in Standard Chartered Bank (U) Ltd v URA, a debt that is not legally enforceable cannot qualify as a "debt claim" under section 24

99. Administrative inefficiencies and manual systems, while unfortunate, cannot convert a non-existent legal right into a deductible bad debt. The disallowance of Shs. 667,367,056 relating to insurance companies is therefore upheld.

100. In the circumstances, this Tribunal orders as follows:
(i) The VAT assessment of Shs. 356,508,843 is set aside.
(ii) The income tax assessment relating to individual patient bad debts of Shs. 246,023,217 is set aside.
(iii) The income tax assessment relating to insurance company debts of Shs. 667,367,056 is upheld.
(iv) The uncontested income tax assessment of Shs. 248,155,648 remains payable.
(v) Each party shall bear its own costs.

Dated at Kampala this 10th day of April 2026.', 'This ruling provides crucial clarity for healthcare providers in Uganda regarding the VAT treatment of inpatient meals and the deductibility of bad debts. The Tribunal''s emphasis on the ''incidental'' nature of meals to the principal medical supply, irrespective of patient category, is a significant precedent. However, the strict interpretation of ''legally enforceable claim'' for bad debts, particularly concerning insurance companies, highlights the importance of meticulous adherence to contractual terms and robust documentation of recovery efforts. Tax practitioners should advise clients to review their billing practices and debt recovery procedures to align with these principles, especially concerning insurance claims.

*   Meals for inpatients are VAT exempt as incidental to medical services.
*   Reasonable steps for bad debt recovery are essential for deductibility.
*   Contractual breaches can invalidate a ''debt claim'' for tax purposes.', '2026-07-04 15:24:01.09914+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('23e33333-3865-4108-9f32-f40b105edf35'::uuid, 'TAT No. 220 of 2025', 'CHESTNUT UGANDA LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'VAT | Income Tax', 'Allowed', 'Chestnut Uganda Limited sought a temporary injunction to restrain the Uganda Revenue Authority (URA) from enforcing tax collection measures for assessed VAT and rental income tax, totaling Shs. 1,726,795,702, pending the determination of its substantive appeal. The Tribunal found that Chestnut had substantially complied with the 30% deposit requirement by applying to offset it against a VAT credit held by URA. The Tribunal further determined that Chestnut had established a prima facie case with triable issues, would suffer irreparable injury from enforcement, and that the balance of convenience favored granting the injunction. Therefore, the temporary injunction was granted.', 'THE REPUBLIC OF UGANDA
IN THE TAX APPEALS TRIBUNAL AT KAMPALA
MISCELLANEOUS APPLICATION NO. 220 OF 2025
(ARISING FROM TAT APPLICATION NO. 283 OF 2025)
CHESTNUT UGANDA LIMITED................................................................APPLICANT
VERSUS
UGANDA REVENUE AUTHORITY...........................................................RESPONDENT
BEFORE: HON. PROSCOVIA REBECCA NAMBI, HON. KABAKUMBA MASIKO,
MS. CHRISTINE KATWE
RULING
I. Introduction
1. This application was brought under Section 98 of the Civil Procedure Act, Order
41 rule 1 & 9 Section 31(1) of the Tax Appeals Tribunal Act, and Rule 30 of the
Tax Appeals Tribunal Rules, seeking a temporary injunction restraining the
Respondent from enforcing tax collection measures in respect of tax assessed
totalling Shs. 1,726,795,702 pending determination of the substantive appeal
before the Tribunal.
II. Background Facts
2. The Applicant is a Ugandan company engaged in real estate and property
development. The Respondent commenced an audit of the Applicant covering
January 2019 to December 2022. Thereafter, on 28 March 2025, the
Respondent issued additional assessments for VAT of Shs. 370,800,600 and
rental income tax of Shs. 410,540,917, and also issued a management letter
dated 31 March 2025 indicating an overall tax exposure of Shs. 781,341,517.48.
The Applicant objected to the assessments on 17 June 2025 electronically and
on 19 June 2025 manually. The Applicant''s case is that notwithstanding the
objection, the Respondent continued to issue demand notices, prompting the
filing of the substantive TAT Application No. 283 of 2025.
3. On 19 September 2025 an interim order was granted restraining enforcement,
subject to payment of 30% of the tax in dispute. The Respondent''s position is
that the Applicant has not complied with that condition. The Applicant''s position
is that it sought to satisfy that requirement through offset against an admitted
VAT refund credit of Shs. 6,861,016,520 and filed a refund application on 17
October 2025, but the Respondent did not act on it. The Applicant further states
that, notwithstanding the interim order, agency notices were later issued to its
bankers.
III. Issues
The central issue for determination is whether the Applicant has satisfied the legal
requirements for the grant of a temporary injunction pending determination of the main
application.
VIII. The Determination of the Tribunal
43. Having carefully considered the pleadings, affidavits on record, the submissions
of both parties, and the authorities cited, the Tribunal now determines whether
the Applicant has satisfied the conditions for the grant of a temporary injunction
restraining the Respondent from enforcing the disputed tax assessments
pending determination of the main application.
Compliance with the 30% Deposit Requirement
44. Section 15(1) of the Tax Appeals Tribunal Act provides that:
"A taxpayer who has lodged a notice of objection to an assessment shall, pending final
resolution of the objection, pay 30 percent of the tax assessed or part of the tax
assessed not in dispute, whichever is greater."
45. The provision establishes a mandatory statutory requirement intended to secure
part of the revenue while a tax dispute is being resolved. In the present matter,
the interim order of 19 September 2025 expressly conditioned the continuation
of interim protection on the Applicant''s compliance with this requirement. The
Respondent contends that the Applicant has failed to comply with this statutory
obligation. The Applicant, however, maintains that it has substantially satisfied
the requirement by applying its VAT credit of Shs. 6,861,016,520 to offset the
30% deposit required under the law.
46. The Applicant has demonstrated that it formally applied to the Respondent for
the offset and has relied on authorities including Tata Uganda Ltd v URA Misc.
Application No. 64 of 2023 and Red Chilli Hideaway Ltd v URA TAT
Application No. 38 of 2018. In Tata Uganda the Tribunal held that a VAT refund
constitutes liquidity belonging to the taxpayer and that refusal to allow offset of
such credit where it is already held by the Respondent may be irrational. The
Tribunal stated that:
"A refund is monies held by the Respondent due to the taxpayer. It is liquidity that has
crystallized. Where a refund is not paid, interest accrues. Where a taxpayer requests
for an offset, the Respondent is relieved from paying interest. Therefore, the refusal by
the Respondent to allow the Applicant to use the refund was irrational."
47. Similarly, in Red Chilli Hideaway, the Tribunal observed that where excess tax
exists, the Commissioner ought to apply such excess tax to reduce the
taxpayer''s outstanding tax liability.
48. Applying those principles to the present case, the Tribunal notes that the
Respondent currently holds funds belonging to the Applicant in the form of a
VAT credit substantially exceeding the amount required to satisfy the 30%
statutory deposit. Requiring the Applicant to make a further cash payment while
the Respondent simultaneously retains the Applicant''s funds would serve no
practical revenue purpose.
49. Although the Respondent raised concerns regarding verification of the credit,
the existence of the credit itself has not been materially disputed. The Applicant
has applied for the offset and the Respondent has had adequate opportunity to
process and verify the application.
50. We are guided by the Tribunal''s reasoning in SICPA Uganda Limited v
Uganda Revenue Authority Misc. Application No. 246 of 2025, where it was
held that Section 15 should not operate mechanically to defeat a genuine
dispute where a taxpayer has already remitted substantial sums connected to
the contested tax base. Accordingly, we find that the Applicant has substantially
complied with the 30% deposit requirement through its application to offset the
deposit against its VAT credit, without prejudice to the Respondent''s right to
complete verification of the credit in accordance with the law.
Whether the Applicant has satisfied the conditions for grant of a temporary
injunction
51. The principles governing the grant of temporary injunctions are well established.
As reiterated by this Tribunal in Kobo 360 Inc v Uganda Revenue Authority
MC No. 041 of 2025, and derived from authorities such as Kiyimba Kaggwa v
Hajji Abdu Nasser Katende [1985] HCB 43 and American Cyanamid Co Ltd
v Ethicon Ltd [1975] AC 396, an Applicant must demonstrate:
1. A prima facie case with a likelihood of success
2. That the Applicant would suffer Irreparable injury not adequately
compensable by damages
3. That the balance of convenience favours the Applicant.
The Tribunal will examine each of these conditions in turn.
(i) Prima Facie Case with a Likelihood of Success
52. A prima facie case does not require the Applicant to demonstrate that it will
ultimately succeed in the main application. As stated in Imelda Gertrude
Basudde v Tereza Mwewulize & Another Misc. Application No. 402 of 2003, the
requirement is satisfied where the Applicant establishes the existence of a
genuine triable issue.
53. Similarly, in SICPA Uganda Ltd v URA Misc. Application No. 246 of 2025,
the Tribunal clarified that a prima facie case arises where a serious question
requiring judicial determination is disclosed.
54. In the present case, from the affidavit evidence before us, the dispute between
the parties arises from additional tax assessments issued by the Respondent
following an audit covering the period January 2019 to December 2022. The
Respondent issued additional assessments for VAT amounting to SHS.
370,800,600.48 and rental income tax of SHS. 410,540,917, together with
subsequent demand notices threatening enforcement measures. The Applicant
has raised several substantial issues in the main appeal, including:
• whether deferred rent incentives constituted discounts not subject to VAT;
• whether the Respondent improperly capped the Applicant''s carried-forward
losses following a legislative amendment;
• whether the Respondent''s rental income assessment of Shs. 1,059,799,415
properly reflects the Applicant''s actual lease arrangements and tax position.
55. At this stage, the Tribunal is not required to determine the correctness of the tax
assessment. The question is only whether the appeal raises genuine questions
of law and fact requiring adjudication.
56. In our view, the questions raised concerning the treatment of deferred rent
incentives for VAT purposes, the application of amendments relating to carried-
forward losses, and the accuracy of the rental income assessment are not
frivolous. They raise matters of statutory interpretation and factual accounting
which must properly be determined at the hearing of the main appeal.
57. We are therefore satisfied that the Applicant has established the existence of
serious triable issues before this Tribunal.
(ii) Irreparable Injury
58. The second requirement is that the Applicant must demonstrate that it will suffer
injury which cannot adequately be compensated by damages if the injunction is
not granted.
59. The Applicant states that the Respondent has issued several demand notices
and agency notices to financial institutions in order to enforce the tax
assessments. The Applicant contends that such enforcement measures would
disrupt its operations, impair its creditworthiness, and interfere with its
contractual relationships. The Respondent, on the other hand, argues that the
Applicant''s alleged harm is purely financial and therefore compensable by
damages. Relying on Bullion Refinery Ltd & Others v Attorney General &
URA HCMA No. 0132 of 2023, they argue that the Applicant has not
demonstrated irreparable injury.
60. We agree that tax disputes ordinarily involve monetary liabilities and that
payment of money, by itself, does not necessarily amount to irreparable injury.
However, the evidence before us indicates that the Respondent has issued
third-party agency notices to the Applicant''s banks for substantial sums of
money. Such enforcement measures can have significant commercial
consequences beyond the mere payment of tax, particularly where they
interfere with banking arrangements and business operations. In Luwalulwa
Investments Ltd v Uganda Revenue Authority HCMA No. 1336 of 2022, the
High Court recognised that enforcement actions affecting a business''s cash flow
may cause substantial commercial harm.
61. We are therefore satisfied that enforcement of the disputed assessments before
determination of the appeal may expose the Applicant to significant commercial
disruption which may not be compensable.
(iii) Balance of Convenience
62. Where doubt exists regarding irreparable injury, the court must determine where
the balance of convenience lies. In Water & Environment Media Network (U)
Ltd v National Environment Management Authority Misc. Application No. 509 of
2020, the court held that the balance of convenience favours the party likely to
suffer greater prejudice if the injunction is not granted.
63. In the present case, the Respondent argues that granting the injunction would
undermine its statutory mandate to collect revenue and the public interest in
revenue mobilisation. However, we note that the Respondent already retains
the Applicant''s funds in the form of the VAT credit claimed. Consequently,
granting an injunction does not deprive the public treasury of secured funds but
merely preserves the status quo pending resolution of the dispute.
64. Conversely, if enforcement proceeds immediately, the Applicant may suffer
disruption to its business operations before the legality of the disputed
assessments is determined. The Tribunal therefore finds that the balance of
convenience tilts in favour of the Applicant.
65. In conclusion, having considered all the circumstances of the case, we find that:
1. The Applicant has established a prima facie case with serious triable issues
in the main application.
2. The enforcement measures undertaken by the Respondent may cause
substantial commercial disruption to the Applicant before the dispute is
determined.
3. The balance of convenience favours maintaining the status quo, particularly
given that the Respondent already holds funds belonging to the Applicant
pending a VAT refund claim.
66. Accordingly, the Tribunal finds that the Applicant has satisfied the threshold for
the grant of a temporary injunction pending determination of the main
application. This application therefore succeeds.
Orders:
1. A temporary injunction is hereby granted restraining the Respondent, its
servants, agents and employees from enforcing or collecting the disputed tax
assessments in TAT Application No. 283 of 2025 pending determination of the
main application.
2. Costs shall be in the cause.
It is so ordered.
Dated at Kampala this 13th day of March 2026.', 'This ruling reinforces the principle that taxpayers can obtain temporary injunctions against URA enforcement actions if they meet the established criteria, even when the URA holds a statutory mandate to collect revenue. A key takeaway is the Tribunal''s recognition that a VAT refund credit held by URA can be used to satisfy the mandatory 30% deposit under Section 15(1) of the Tax Appeals Tribunal Act, especially when URA''s refusal to allow such an offset is deemed irrational. This sets a significant precedent for taxpayers with outstanding refunds. The main risk for URA is that this decision could lead to more taxpayers seeking injunctions based on existing credits, potentially delaying revenue collection. Practitioners should advise clients to formally apply for offsets of VAT credits against disputed tax liabilities to satisfy the 30% deposit requirement.

*   **Key Practical Lessons:**
*   Taxpayers can use existing VAT refund credits to satisfy the 30% deposit for appeals.
*   Enforcement actions causing significant commercial disruption can constitute irreparable injury.
*   The balance of convenience often favors the taxpayer when URA holds their funds.', '2026-07-06 18:16:08.103981+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('27e4da6f-081a-441a-a32a-47e7e23c2322'::uuid, 'TAT No. 005 of 2024', 'Dr. Amos Nzeyi v Uganda Revenue Authority', 2025, 'Income Tax', 'Allowed', 'The Applicant sold land and was assessed income tax by URA, which argued the land was a business asset based on the Applicant''s tax profile indicating real estate activities. The Applicant contended it was a personal asset, not a business asset, and therefore exempt from income tax. The Tribunal ruled in favor of the Applicant, finding no evidence of repeated transactions, short holding period, or improvements indicative of trading activity, and that a tax profile alone is not conclusive proof of business activity.', 'This ruling is in respect of an administrative additional income tax assessment of Shs. 1,820,867,049.20 on income earned by the Applicant from the sale of land.

The Respondent issued the Applicant with an assessment of Shs. 2,186,824,000 arising from the sale of approximately 42 acres of land that the Applicant sold to Crown Beverages Limited in 2019 for a price of Shs. 6,500,000,000.

The Applicant objected to the assessment on the grounds that this supply comprised of sale of undeveloped private land which is not a business asset and is exempt from income tax. The Respondent then issued a revised assessment of Shs. 1,820,867,049.20.

Dissatisfied with the Respondent''s objection decision, the Applicant filed this application for review of the decision.

The issue for determination is whether the Applicant is liable to pay the tax assessed?

The Applicant submitted that the land held by the Applicant was not a business asset held in any business. The land was held in the Applicant''s personal capacity which he then sold to Crown Beverages.

The Applicant submitted that a "business asset" has been defined in Makerere University Retirement Benefits Scheme v. Uganda Revenue Authority (TAT Application No. 17 of 2021), wherein the Tribunal noted that:
".... the addition of the word ''business'' on the word ''asset'' for purposes of defining a ''business asset'' meant that not all assets attract WHT....... there are ''business assets'' and ''assets of the business'', Assets of the business, usually put in the balance sheet of the financial statement as assets of the company is what is referred to as ''business assets'' while items or goods used for trading purposes, merchandise or ordinary course of business known as stock in trade though used in a business but are not owned by the business in strict sense of ownership do not comprise assets in a business assets in a business......... that business assets and stock in trade comprise assets in a business however only business assets belonging to the business and not stock in trade attract WHT".

The Applicant submitted that the land that was disposed of was not a business asset to the Applicant since it was not an asset of a business, or one held ready for use in a business. It was a personal asset that the Applicant had owned for nine years, and it had grown to become a bush before its disposal.

The Applicant further argued that the land sold was not trading stock disposed of that could have attracted any tax. The Applicant prayed that the Tribunal finds that the land sold to Crown Beverages is not a business asset and therefore exempt from withholding tax in accordance with Section 21(j) of the ITA which exempts any capital gain that is not included in business income from taxation.

The Applicant prayed that the objection decision is quashed, and the Tribunal declares that Shs. 1,820, 867,049.20 is not payable by the Applicant.', 'This ruling provides crucial clarity for Uganda tax practitioners regarding the distinction between personal asset disposal and business income from land sales. The key takeaway is that URA cannot solely rely on a taxpayer''s registered tax profile to classify an asset as a ''business asset'' for income tax purposes. The Tribunal emphasized the ''badges of trade'' test, requiring evidence of repeated transactions, short holding periods, and asset modifications to establish a business venture. This sets a precedent that mere registration of a business activity on a tax profile is insufficient without corroborating evidence of actual trading. Practitioners should advise clients to maintain clear documentation distinguishing personal investments from business assets and to ensure their tax profiles accurately reflect their actual business activities.
*   Tax profiles are not conclusive proof of business activity.
*   ''Badges of trade'' (frequency, intention, modifications, holding period) are critical for determining business income from asset sales.
*   Capital gains on personal assets, not included in business income, are exempt under Section 21(1)(j) of the Income Tax Act.', '2026-07-04 20:09:37.152946+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('28153d44-02be-41ef-b880-f89dd6618beb'::uuid, 'MISCELLANEOUS APPLICATION NO. 33 OF 2025', 'COCA-COLA BEVERAGES UGANDA LTD. v UGANDA REVENUE AUTHORITY', 2025, 'Excise Duty', 'Allowed', 'The Applicant sought orders for discovery of digital tax stamp coding machine reports, forensic inspection of the machines, and joinder of SICPA Uganda Limited (the operator of the machines) as a respondent in the main application. The Applicant argued that unstamped bottles were due to DTS machine malfunction, which SICPA exclusively controls. The Tribunal found that SICPA''s presence was necessary for a complete adjudication of the matter, as a finding against the DTS machine''s functionality would legally affect SICPA and have far-reaching consequences for the Tax Procedure Code (Tax Stamps) Regulations, 2018. The application was allowed with costs.', 'This application seeks the following orders;
1. Discovery on oath be ordered for the Respondent to produce the digital tax stamps coding machine reports for 1st February 2024 batch of 300ml Novida Pineapple and 17th January 2024 batch of 2 litre sprite bottles.
2. SICPA Uganda Limited, an entity contracted to operate the Digital Tax Stamps coding machine be joined as a Respondent to the suit on account of being a necessary party to enable the proper and complete adjudication of the matter.
3. The Applicant be granted access to carry out a forensic inspection of the Digital Tax Stamps coding machines on line 2 and line 3 manned by SICPA Uganda Limited officials to verify their functionality and ensure transparency in their operation.
4. Costs of the application be provided for.

1. Background Facts
The application is supported by the affidavit of Prossie Jjumba, the Applicant''s tax manager. The affidavit in support states as follows;
The Tax Procedure Code (Tax Stamps) Regulations, 2018 requires all manufactured goods to be affixed with a tax stamp.
The Commissioner specified the mode of management of the tax stamps by taxpayers through a notice in the Gazette. This notice required the Applicant to acquire and install a digital tax stamp coding machine on its production line which would be manned and controlled by SICPA Uganda Limited (SICPA), an agent of the Respondent.
In order to fulfil its obligations under the above law, the Applicant did the following;
i. Its bulk paid for digital stamps prior to their use by the SICPA agent on the manufactured bottles.
ii. The Applicant provided space on all its production lines allowing for an integration of the DTS machine into its production process.
iii. The Applicant acquired a stamp applicator used by SICPA to ensure that all its products were stamped before they entered the market.
iv. The Applicant acquired and paid for the rejector functionality as a safeguard to reject unstamped bottles manned by SICPA.
v. The Applicant made provision for a clean power source for all DTS equipment elements.
vi. The Applicant provided a secure server room, network cabling within the factory to enable the DTS equipment on each line to transmit production data to the DTS master server in the Respondent''s server room.
vii. The Applicant provided broadband internet connection with a dedicated IP Address to enable the DTS master server to transmit production data to the DTS central database at the Respondent''s premises.
The digital tax stamps are affixed by a digital tax stamps coding machine installed on the Applicant''s production lines which is fully integrated with the packaging and labeling systems. This cost of purchasing this machine is borne by the Applicant although it is owned by the Respondent and operated exclusively by SICPA, an agent of the Respondent.
The DTS coding machine which is indispensable to the production process is fully operated by SICPA without any operational input from the Applicant. This makes it impossible for production to take place without the machine.
On 12th February, 2024, 20 unstamped Novida Pineapple (NPA) 300ml bottles produced on 1st February 2024 were found on a truck at the Coca-Cola depot in Gayaza. On 15th February 2024, six unstamped 2 litre bottles of Sprite produced on 17th January 2024 were seized in Kayunga.
On 13th and 19th February 2024, following these discoveries, the Respondent issued assessments against the Applicant for the 20 Novida Pineapple 300 ml bottles and the 2 litre bottles of Sprite, totaling to Shs. 100,000,000.
The Applicant''s production reports on the dates of production showed that a total of 189,408 Novida Pineapple 300 ml bottles were produced. No issue was reported with the DTS coding machine which would have led to any of the bottles going unstamped. The entire production line stops when there is an issue with the DTS machine. No such issue was reported.
The configuration of the production line ensures that bottles flow directly from the bottle filler and crowning machine to the DTS machine and then to the date coding machine. The confiscated unstamped products all have date codes thereby eliminating any possible out of the norm incidence which would have led to the bottles going unstamped besides the technical failure of the DTS machine.
Invitations by the Applicant to SICPA officials were not honored. SICPA has exclusive control of the digital tax stamps coding machine and the all records of interruptions, malfunctions and other operational issues.
The DTS coding machine malfunction reports are confidential between SICPA and the Respondent which makes it impossible for the Applicant to determine the root cause of the failure to affix the digital stamp.
The DTS machine makes errors which may go undetected causing bottles to go unstamped.
In reply to the application, the Respondent filed an affidavit deponed by Mr. Edmond Agaba, a supervisor in the Respondent''s Legal and Board Affairs department.
Mr. Agaba deponed that on 10th, 12th and 15th February, the Respondent examined the Applicant''s trucks at different locations and established that some bottles of the beverages being sold by the Applicant were unstamped and did not bear the digital tax stamps.
Further on 13th and 19th February 2024, the Respondent issued a penalty of Shs. 100,000,000 for the periods 1/1/2024 – 31/1/2024 and informed the Applicant by a letter dated 20th February 2024.
The Applicant objected to this penalty. The Respondent''s review team visited the enforcement stores and confirmed that the products in question had not been stamped. The penalty reversal requests by the Applicant were rejected by the Respondent.
Mr. Agaba deponed that a DTS malfunction report has already been shared with the Respondent, that there was no need to add SICPA as a party as it is only a nominal party contracted by the Respondent to manage the system.
The Respondent prayed for the dismissal of the Application.
2. Issues
i. Whether SICPA Uganda Limited, an entity contracted to operate the Digital Tax Stamps coding machine be joined as a respondent to the application?
ii. Whether the discovery and inspection orders being sought by the Applicant should be granted by this Tribunal?
3. Representation
The Applicant was represented by Mr. Ronal Kalema while the Respondent was represented by Ms. Diana Mulira, Mr. Goerge Ssenyomo and Ms. Doreen Amutuhaire.
4. Submissions of the Applicant.
The Applicant submitted that the joinder of SICPA is necessary for the effective and complete adjudication of the core issue in dispute namely whether the Applicant is liable for the penalty imposed.
In support of the above the Applicant relied on Order 1 Rule 10(2) of the Civil Procedure Rules and on the decisions in Departed Asians Property Custodian Board v Jaffer Brothers Ltd Civil Appeal No. 9 of 1998 and on the decision of the tribunal in Uganda Revenue Authority vs. Illiso Consulting (PTY) Ltd and Anor, Miscellaneous Application Bo. 34 of 2023.
The Applicant submitted that it was necessary for SICPA to be joined as a party so as to provide clarity on how the DTS machine functions and address how the manufactured date coded bottles went unstamped yet the DTS machine comes before the date coding machine in the stamping sequence.
The Applicant submitted that in order to ensure transparency and accountability it was necessary that it should be granted access to conduct a forensic inspection of the DTS Coding machines on the production lines 2 and 3 operated by SICPA.
The Applicant submitted that SICPA maintains exclusive control over the digital stamps coding machines installed on the Applicant''s production lines. No employee of the Applicant operates, services, or monitors these machines. The Applicant submitted further that the design of the production line confirms that products move sequentially from the bottle filler and crowner through the DTS machine and then to the date coding unit. The Applicant submitted that the seized bottles all bear valid date codes. The Applicant submitted that the sequencing eliminates any plausible explanation for unstamped bottles other than a failure of the DTS system itself which falls entirely under SICPA''s control.
The Applicant submitted that its liability to the penalty imposed by the Respondent hinges on whether the DTS machine functioned as required at the material time which fact cannot be established in the absence of SICPA. The Applicant submitted further that the Respondent has not shown that it will suffer any prejudice from the joinder of SICPA.
The Applicant submitted that the circumstances of the case clearly establish that the report sought is both relevant and material to the issues in dispute, is not protected by any claim of privilege, is within the control of the Respondents and that prior efforts by the Applicant to obtain it voluntarily have been unsuccessful. The Applicant submitted that given the significance in determining whether the alleged unstamped products can justifiably be attributed to the Applicant, the report is essential for the fair and just resolution of this matter.
In support of the above submissions the Applicant cited the provisions of S. 22(a) of the Civil Procedure Act, Order 10 of the Civil Procedure Rules and the decision in Bemanyisa Adonija v Mujuni Richard and Anor, Misc. Application No. 3858 of 2023. The Applicant also relied on the decision in Simbamanyo Estates Ltd and Peter Kamya vs. Equity Bank Uganda Ltd and 4 others.
5. Submissions of the Respondent
The Respondent submitted that SICPA does not have to be joined as a party to these proceedings for it to provide evidence. The Respondent submitted that SICPA can be called as a witness instead of being joined as a witness. The Respondent submitted that the Applicant has not demonstrated what interest SICPA has in the Applicant''s assessment of Local Excise Duty issued by the Respondent.
The Respondent submitted that it was highly improbable that the addition of SICPA as a party would lead to the avoidance of a multiplicity of suits.
The Respondent submitted that for a matter to be brought to the tribunal, the Applicant should have an objection decision which they seek to review. The Respondent submitted that subsequent suits would require that subsequent Applicants have objection decisions with which they are dissatisfied. The Respondent submitted that tax assessments are unique to each taxpayer.
The Respondent objected to the prayer for discovery on the ground that the application was a mere fishing expedition. The Respondent submitted on the authority of the decision in Mutesi vs. Attorney General, Misc. Application No. 912 of 2016, that courts have a duty to deny applications for discovery which seem to be fishing expeditions.
Relying on the decisions in Karuhanga and Anor vs. Attorney General and 2 others, Misc. Cause No. 060 of 2015 and Gale vs. Denman Picture Houses Ltd [1930] KB 588, 590, the Respondent submitted that an application for discovery should not be used by a plaintiff merely to determine if they have a case. Instead, a plaintiff must already understand their claim before seeking supporting documents from the opposing side. Where an application is driven by the hope that something will emerge which may form the basis of or support the Applicant''s claim, then it is a fishing expedition.
6. Submissions of the Applicant rejoinder.
In rejoinder the Applicant reiterated its earlier submissions and stated that the proposition by the Respondent that SICPA may simply be called as a witness rather than being joined as a party, misconceives both the nature of the dispute and the procedural safeguards necessary for a fair hearing. The Applicant stated that the instant case was not one where SICPA`s evidence is merely ancillary on the contrary, SICPA is at the centre of the controversy. The Applicant stated that its entire defence rests on the claim that any failure to affix digital stamps was due to the malfunction or omission of the SICPA system and not the Applicant''s conduct.
The Applicant rejoined that it does not merely seek SICPA''s testimony but also challenges the functionality and reliability of a system that is fully controlled and operated by SICPA. The Applicant stated that the outcome of the Application turns on whether the DTS machine failed or not, and SICPA is the only party with the operational knowledge, system, records, diagnostic reports and accountability to speak to the issues in question meaningfully.
The Applicant stated that as a mere witness, SICPA cannot be compelled to make full disclosure, nor can it be bound by the tribunal''s findings. The Applicant stated further that SICPA enjoys a right not to implicate itself as a broader part of the right to a fair hearing. In support of this argument the Applicant cited the decision in Sserunkuuma George William and Anor vs. Attorney General Misc. Cause No. 102 of 2021.
The Applicant rejoined that it cannot be expected to rebut allegations tied to a system it neither owns, controls, nor can interrogate without the cooperation of the entity accused of the failure.
The Applicant rejoined further that if SICPA remains outside these proceedings, there is a real risk that the tribunal will be called upon to make findings that implicate SICPA`s conduct or systems without giving it the opportunity to defend itself. This the Applicant stated would offend the rules of natural justice and undermine the integrity of the process. The Applicant stated that joinder ensures that SICPA can respond fully to the allegations, disclose relevant evidence, and be bound by the outcome which avoids the injustice of findings being made in its absence.
The Applicant stated that to determine whether the Applicant failed to affix stamps without SICPA''s participation, is to adjudicate the matter with a missing piece of the puzzle. The Applicant rejoined that a fair and effectual resolution of this matter is not possible without SICPA''s joinder. The Applicant stated further that SICPA having already refused to file a response despite having been served in the instant application cannot be expected to voluntarily assist as a witness.
The Applicant stated further that the instant application seeks to avoid multiplicity of suits. The Applicant stated that in the event that the failure to affix the digital stamps was found to be due to the malfunction or negligence of the DTS system, the Applicant would ordinarily have a cause of action against the Respondents in tort for negligence. The Applicant stated that excluding SICPA from the present proceedings would compel the Applicant to institute a separate suit thereby fragmenting what is essentially a single controversy.
7. Determination of the Application
Having carefully read and considered the affidavits on record and the submissions of both parties, the following is the ruling of the tribunal.
This application seeks the following orders;
1. Discovery on oath be ordered for the Respondent to produce the digital tax stamps coding machine reports for 1st February 2024 batch of 300ml Novida Pineapple and 17th January 2024 batch of 2 litre sprite bottles.
2. SICPA Uganda Limited, an entity contracted to operate the Digital Tax Stamps coding machine be joined as a Respondent to the suit on account of being a necessary party to enable the proper and complete adjudication of the matter.
3. The Applicant be granted access to carry out a forensic inspection of the Digital Tax Stamps coding machines on line 2 and line 3 manned by SICPA Uganda Limited officials to verify their functionality and ensure transparency in their operation.
4. Costs of the application be provided for.
Discovery is provided for under S. 22 of the Civil Procedure Act, which states as follows:
"Subject to such conditions and limitations as may be prescribed, the court may, at any time, either of its own motion or on the application of any party;
a) Make such orders as may be necessary or reasonable in all matters relating to the delivery and answering of interrogatories, the admission of documents and facts and the discovery, inspection, production, impounding and return of documents or material objects producible as evidence;
b) Issue summons to persons whose attendance is required either to give evidence or to produce documents or such other objects as aforesaid;
c) Order any fact to be proved by affidavit.
In Simbamanyo Estates Limited and Another vs. Equity Bank Uganda Ltd and 4 Others, Misc. Application No. 0583 of 2022, the court stated that in order for an applicant to succeed on an application for discovery, it must show that there is a sufficient prima facie basis for believing the evidence sought exists and that it is material and relevant to the issues at trial.
In the instant case, the evidence sought by the Applicant are the digital tax stamps coding machine reports for 1st February 2024 batch of 300ml Novida Pineapple and the digital tax stamps coding machine reports for 17th January 2024 batch of 2 litre sprite bottles.
There is no indication from the affidavit in reply deponed by Mr. Edmond Agaba on behalf of the Respondent that the above reports do not exist. Paragraph 14 of the affidavit in support of the Application deponed by Prossie Jjumba states that the DTS malfunction reports are confidential between SICPA and the Respondent. This piece of evidence establishes a prima facie basis for believing that the reports sought by the Applicant exist.
The main issue at the trial is whether the failure to stamp the bottles in question were as a result of an omission by the Applicant or a malfunction of the DTS machine?
The reports sought by the Applicant are both material and relevant to the determination of the above issue because they seek to determine whether there was an error in the machine which affected its functionality on the dates in question.
Closely related to the above is the application to carry out a forensic inspection of the DTS machine on production lines 2 and 3. The reason given for this application is the need for transparency and accountability.
We note that SICPA has exclusive control of the digital tax stamps coding machine, its personnel are solely responsible for operating, servicing and monitoring the efficacy of the DTS machine and records of interruptions, malfunctions and other operational issues are in their exclusive possession.
Given the allegations made by the Applicant under paragraph 15 of the affidavit in support of the application deponed by Prossie Jjumba to the effect that the DTS machine is not 100% perfect and that it makes errors which may go undetected causing bottles to go unstamped, we take the position that the forensic inspection of the DTS machine sought by the Applicant will help the tribunal in determining whether the failure to stamp the bottles in question were as a result of an omission by the Applicant or a malfunction of the DTS machine.
Joinder of parties to a suit is provided for under O. 1. Rule 10 (2) of the Civil Procedure Rules. It states as follows;
"(2) The court may at any stage of the proceedings either upon or without the application of either party, and on such terms as may appear to the court to be just, order that the name of any party improperly joined, whether as plaintiff or defendant, be struck out, and that the name of any person who ought to have been joined, whether as plaintiff or defendant, or whose presence before the court may be necessary in order to enable the court effectually and completely to adjudicate upon and settle all questions involved in the suit, be added."
The Applicant''s argument is that SICPA`s presence before the tribunal is necessary in order to enable the tribunal effectually and completely adjudicate upon and settle all questions involved in TAT Application No. 90 of 2024; Coca-Cola Beverages Uganda Ltd vs. URA.
The criteria for determining whether the presence of a person is necessary under 0.1 r.10 (2) of the Civil Procedure Rules was set out by Mulenga J.S.C, in Departed Asians Property Custodian Board v Jaffer Brothers Limited (supra). A relevant excerpt from his ruling is reproduced here below;
"However, taking a leaf from authorities in other jurisdictions having similar, and even identical rules of procedure, I would summarize the position as follows: For a person to be joined on the ground that his presence in the suit is necessary for effectual and complete settlement of all questions involved in the suit one of two things has to be shown. Either it has to be shown that the orders, which the plaintiff seeks in the suit would legally affect the interests of that person, and that it is desirable, for avoidance of multiplicity of suits, to have such person joined so that he is bound by the decision of the court in that suit. Alternatively, a person qualifies, (on application of a defendant) to be joined as a co-defendant, where it is shown that the defendant cannot effectually set up a defence he desires to set up unless that person is joined in it, or unless the order to be made is to bind that person. (See Mulla on the Code of Civil Procedure of India) 14th Ed. By J.M. Shelat, Vol.11 pp. 858 and 864-5 and Amon vs. Raphael Tuck & Sons Ltd (1956) 1 All ER 273 at p.290)."
The criteria for determining whether the presence of a person is necessary under 0.1 r.10 (2) of the Civil Procedure Rules, are, firstly, that the orders which the plaintiff seeks in the suit would legally affect the interests of that person, and that it is desirable, for avoidance of multiplicity of suits, to have such person joined so that he or she is bound by the decision of the court in that suit.
Alternatively, a person qualifies, (on application of a defendant) to be joined as a co-defendant, where it is shown that the defendant cannot effectually set up a defence he desires to set up unless that person is joined in it, or unless the order to be made is to bind that person.
The scope and purpose of O.1.R 10(2) of the Indian Code of Civil Procedure which is in pari materia with O.1. R.10 (2) of our Civil Procedure Rules was explained as follows in the Indian decision of Ramesh Hira Chand Kundan Mittal Mal v. Municipal Corporation of Greater Bombay, AIR (1992) SCW 846:
"It cannot be said that the main object of the rule is to prevent multiplicity of actions though it may incidentally have that effect. But that appears to be a desirable consequence of the rule rather than its main objective. The person to be joined must be one whose presence is necessary as a party. What makes a person a necessary party is not merely that he has relevant evidence to give on some questions involved; that would only make him a necessary witness. It is not merely that he has an interest in the correct solution of some question involved and has thought of relevant arguments to advance. The only reason which makes it necessary to make a person a party to an action is so that he should be bound by the result of the action and the question to be settled, therefore, must be a question in the action which cannot be effectually and completely settled unless he is a party. The line has been drawn on a wider construction of the rule between the direct interest or the legal interest and commercial interest. It is, therefore, necessary that the person must be directly or legally interested in the action in the answer, that is, he can say that the litigation may lead to a result which will affect him legally that is by curtailing his legal rights``.
(Emphasis Added) (See Mulla, The Code of Civil Procedure 18th Edition Vol. 2 p.1525)."
Applying the reasoning of the above authorities to the facts of the instant case, in order for the Applicant to succeed on the application to join SICPA as a party, it must show that the litigation may lead to a result which will affect SICPA legally.
From the Applicant''s submissions it is clear that the Applicant''s entire case rests on the claim that any failure to affix digital stamps was due to the malfunction or omission of the SICPA system and not the Applicant''s conduct.
The question which the tribunal must answer, given the arguments made by the Applicant, about the functionality of the SICPA system, is whether litigation in the main Application may lead to a result which may affect SICPA legally?
The resolution of this question is important given the allegation by the Applicant that the DTS system occasionally malfunctions. It is of the utmost importance that SICPA is part of the proceedings in the main Application in order to defend itself against these allegations. A finding by the tribunal that the omission to stamp the beverages in question was due to a fault with the DTS machine will not only affect SICPA`s reputation but will have far-reaching consequences in the implementation of the Tax Procedure Code (Tax Stamps) Regulations, 2018.
Our answer to the above question is that it is possible that litigation of the Applicant''s defence in the main Application could lead to a result which could affect SICPA legally.
We accordingly find that SICPA`s presence before the tribunal is necessary in order to enable the tribunal effectually and completely adjudicate upon and settle all questions involved in TAT Application No. 90 of 2024; Coca-Cola Beverages Uganda Ltd vs. URA.
In the result, this Application is allowed with the following orders:
1. The Respondent is ordered to submit the digital tax stamps coding machine reports for 1st February 2024 batch of 300ml Novida Pineapple and 17th January 2024 batch of 2 litre sprite bottles to the tribunal by close of business on 21st November 2025.
2. The Respondent and SICPA Uganda Limited will grant access to the Applicant to carry out a forensic inspection of the Digital Tax Stamps coding machines on line 2 and line 3 at the Applicant''s factory. The inspection will be conducted in the presence of officials from the Respondent and from SICPA Uganda Limited.
3. SICPA Uganda Limited is hereby joined as a Respondent to the main Application. SICPA Uganda Limited will file a response to the allegations made by the Applicant against it in the affidavit in support of the Application, by close of business on 24th November, 2025.
4. The Applicant is awarded the costs of this application.
This Application is accordingly allowed with costs.
Dated at Kampala this 10th day of November 2025.', 'This ruling is a significant development for taxpayers dealing with Digital Tax Stamps (DTS) issues in Uganda, particularly regarding penalties for unstamped goods. The key takeaway is that the Tax Appeals Tribunal (TAT) recognizes the critical role of the DTS system operator (SICPA) in disputes concerning machine malfunctions. This precedent allows taxpayers to compel the involvement of SICPA and access crucial evidence, shifting the burden of proof beyond merely demonstrating unstamped products. Practitioners should note the Tribunal''s emphasis on the necessity of joining parties whose legal interests may be affected by the outcome, as per Order 1 Rule 10(2) of the Civil Procedure Rules and the Tax Procedure Code (Tax Stamps) Regulations, 2018.

*   Taxpayers can now more effectively challenge penalties related to DTS malfunctions by involving SICPA.
*   The ruling underscores the importance of discovery and forensic inspection in complex technical tax disputes.
*   It highlights the Tribunal''s commitment to ensuring fair hearings and complete adjudication by including all necessary parties.', '2026-07-06 18:17:20.161775+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('29d41d64-c401-44ce-84c1-fc7947feb41d'::uuid, 'TAT APPLICATION NO. 130 OF 2025', 'ESERIA PROPERTIES LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'Income Tax', 'Allowed', 'The Applicant challenged URA''s recharacterization of Shs. 4,362,511,638, recorded as ''Due to related parties'' and later ''Capital Reserve'', into taxable income, leading to rental income tax and VAT assessments. The Tribunal found that the Applicant''s explanation of the amount as shareholder capitalisation was more likely true, and URA failed to demonstrate how it constituted taxable income. The Tribunal also noted that URA''s audit covered a period beyond the statutory record retention timeline without exceptional circumstances. Consequently, the application was allowed, and the assessments were set aside.', 'The ruling is in respect of an application challenging the Respondents recharacterization of the Shs. 4,362,511,638 into taxable income.

The Applicant is a company duly incorporated in Uganda, carrying on the business of real estate, hotel business, and fuel dealership. The grounds of this application are laid out in the affidavit in support of the application deponed by Mr. Joseph Sanjula Lutwama, director in the Applicant company and sworn on 6 March 2026, stating as follows:
(i) The Applicant is a private limited company duly incorporated under the laws of Uganda on 15 December 1969. The Applicant commenced business in the 1970''s and carried on several businesses, including real estate, a hotel business, a fuel dealership under Shell Uganda (later VIVO Energy), and agricultural ventures, specifically tree planting and maize farming.

(iv) Instead, Mr. Yakobo Ntate Mayanja, the Applicant''s majority shareholder, continuously injected funds into the Applicant indirectly by channelling proceeds from his other businesses into the Applicant by financing the construction of the Applicant''s assets (e.g., buildings on Entebbe Road, Plots 19 and 22/23) and the purchase of trucks used in the fuel (LPG) business.

(vi) The Respondent carried out the initial audit of the Applicant in 2014 for the period 2012 to 2013. During a tax audit by Uganda Revenue Authority (URA), Shs. 4,362,511,638 was disallowed and added back to income, leading to an additional tax assessment of Shs. 1,377,030,809.

(xiv) The Respondent accordingly recharacterized the figure of Shs 4,362,511,638 into income and charged VAT and Income Tax.

52. The dispute arises from the Respondent''s decision to recharacterize the sum of Shs. 4,362,511,638 reflected in the Applicant''s books as "Due to related parties" into taxable income, resulting in rental income tax assessments of Shs. 1,308,753,491 and VAT assessments of Shs. 785,252,094.84 for the period July 2022 to June 2023.

53. The Applicant contends that the impugned amount represented shareholder capitalisation accumulated over several years and not income, while the Respondent maintains that the amount constituted unsupported related party loans which were lawfully recharacterized into income pursuant to Section 117 of the Income Tax Act.

57. Section 19 of the Tax Appeals Tribunal Act places the burden upon the Applicant to prove that an assessment is excessive or erroneous. However, whereas the initial burden lies upon the taxpayer, once prima facie evidence is adduced explaining the disputed transaction, the evidential burden shifts to the Respondent to justify the assessment raised. The Tribunal must therefore examine whether the Applicant provided a plausible explanation regarding the impugned amount and whether the Respondent justified the decision to recharacterize the same into taxable income.

62. This section empowers the Commissioner General to recharacterize transactions whose form does not reflect their substance. The Tribunal agrees that these powers are statutory and lawfully exercisable where circumstances justify such intervention. However, those powers must be exercised judiciously, rationally and upon sufficient evidential basis. This position was affirmed in Explorer (U) Ltd v Uganda Revenue Authority TAT No. 87 of 2023 where the Tribunal held that the Respondent''s powers to recharacterize transactions must be exercised judiciously and rationally.

64. It should be noted that the standard of proof that is applied in tax matters is the balance of probabilities. This means that a claim or fact is more likely than not to be true. On the whole, the Applicant''s explanation and evidence suggest that it is more likely than not that the contested transactions were capital injections. Having established that, the evidential burden shifts to the Respondent.

65. The mere absence of supporting documentation does not automatically convert a transaction into taxable rental income. The Respondent is still required to demonstrate how the impugned amount constitutes income within the meaning of Sections 15 and 17 of the Income Tax Act.

69. It should also be noted that Section 15(1)(c) of the TPCA limits record retention obligations to five years, save for exceptional circumstances. The Respondent did not demonstrate exceptional circumstances warranting reliance on transactions dating back more than a decade.

76. Therefore, the Applicant''s inability to furnish extensive documentation is reasonably explained by the passage of time from the date such documentation may have been created to the time the Respondent requested it. On the other hand, the Respondent equally failed to establish, on a balance of probabilities, that the impugned amount constituted taxable rental income or any other form of chargeable income under Sections 15 and 17 of the Income Tax Act.

78. In the circumstances, the Tribunal makes the following orders:
(i) The application is allowed, and the assessment set is hereby set aside.
(ii) The Respondent is ordered to refund the 30% deposit that was paid by the Applicant.
(iii) Costs are hereby awarded to the Applicant', 'This ruling reinforces the principle that while URA has powers to recharacterize transactions under Section 117 of the Income Tax Act, these powers must be exercised judiciously, rationally, and with sufficient evidential basis. The Tribunal emphasized that the mere absence of supporting documentation does not automatically convert a transaction into taxable income, and URA must demonstrate how the recharacterized amount falls within the statutory definition of income. Crucially, the case highlights the importance of statutory timelines for record retention (Section 15(1)(c) of the Tax Procedures Code Act, which is five years) and cautions against requiring taxpayers to produce records beyond this period without exceptional circumstances. This provides a significant safeguard for taxpayers against protracted audits on historical transactions.

*   URA must provide clear evidence for recharacterization, not just rely on lack of taxpayer documentation.
*   Taxpayers are generally protected by the five-year record retention limit under the Tax Procedures Code Act.
*   Shareholder capitalisation, if adequately explained, should not be automatically recharacterized as taxable income.', '2026-07-04 20:20:33.388119+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('2a53c9f5-c473-42da-b055-ebe748a2ab0e'::uuid, 'MISCELLANEOUS APPLICATION NO.213 OF 2025 (ARISING FROM TAT APPLICATIONS NO 169 OF 2024)', 'ALLIED BEVERAGES COMPANY LTD. v UGANDA REVENUE AUTHORITY', 2025, 'VAT', 'Dismissed', 'The Applicant sought a stay of proceedings in TAT Application No. 169 of 2024, arguing that the issues were identical to those in Civil Appeal No. 0062 of 2025 pending before the High Court, which concerned the VAT treatment of marketing, promotion, and research services. The Tribunal dismissed the application for stay, finding that while there was an overlap in legal issues, the assessment periods and some tax heads differed. The Tribunal emphasized its statutory duty to hear disputes efficiently and noted that the Applicant''s interests were protected by the right of appeal, with a refund of the 30% deposit with interest if successful.', 'I. Introduction
1. This ruling is in respect of an application brought under Section 23(4) of the Tax Appeals Tribunal Act, Cap 341, Rule 31 of the Tax Appeals Tribunal (Procedure) Rules and Section 98 of the Civil Procedure Act, Cap 282, Cap 16 Order 52 rule 1 and 3 of the Civil Procedure Rules as well as Section 33 of the Judicature Act, seeking:
(i) An order that the proceedings in TAT Application No. 169 of 2024, Allied Beverages Company Limited vs Uganda Revenue Authority, be stayed pending the disposal of the Civil Appeal No.0062 of 2025(Arising from TAT Application No.11 of 2023).

II. Background facts
2. The grounds upon which this application is premised are laid out in the notice of motion and the supporting affidavit deponed by Mr. Arthur Akankwasa, a Director of the Applicant. The grounds are that:
(i) The Applicant was contracted by the Coca-Cola Export Corporation (TCCEC), a company resident in Atlanta, United States to provide brand marketing, market research and related services.
(ii) Between 2018 to 2021, the Respondent carried out an audit on the Applicant for the period August 2018 to November 2020 and established that the Applicant treated sales to TCCEC as exports and thus zero-rated for VAT purposes instead of local supplies, which are subject to VAT at the standard rate of 18%.
(iii) The Applicant filed TAT Applications Nos. 01 of 2019 and 40 of 2021, challenging the reclassification of the services as local supplies.
(iv) On 3 August 2022, the Tax Appeals Tribunal issued a ruling in TAT Application No. 01 of 2019 and No. Application 40 of 2021: Allied Beverages Limited (ABCL) vs. URA, in which it found that the Applicant misclassified sales of marketing research and promotion services it made to TCCEC as exports and found that the sales were locally consumed. The Tax Appeals Tribunal thus maintained VAT assessments issued against ABCL for the period August 2018 to November 2020.
(v) The Applicant appealed the decision of TAT to the High Court vide Civil Appeal No. 0039 of 2022.
(vi) Whilst the Appeal was pending, the Respondent issued further VAT assessments for the periods December 2020 to August 2022 arising from the same issue of purported misclassified exports to TCCEC. The Respondent based its assessments on the decision of the Tax Appeals Tribunal in TAT Application No.01 of 2019 and TAT Application No.40 of 2021 and maintained the assessments. The Applicant then filed TAT Application No.11 of 2023 to review the decision of the Respondent.
(vii) While TAT Application No. 11 of 2023 and Civil Appeal No. 0039 of 2022 were pending determination, the Respondent issued further VAT assessments for purported misclassified exports to the Applicant for the period October 2022 to August 2023. The Applicant objected to the assessments and on 17 June 2024, the assessments were maintained on the same basis as the previous objection decisions.
(viii) In July 2024, the Applicant filed TAT Application No. 169 of 2024 challenging the Respondent''s objection decisions.
(ix) While TAT Application No. 11 of 2023 and TAT Application No. 169 of 2024 were pending, on 27th September 2024, the High Court issued Judgment in Civil Appeal No. 0039 of 2022 overturning the decision of the TAT in TAT Application No.01 of 2019 and TAT Application No.40 of 2021. The High Court ruled that the services supplied by the Applicant of marketing, research and promotion under the agreement between the Applicant and TCCEC were consumed by TCCEC in the United States of America and thus zero-rated. Consequently, the High Court vacated the VAT Assessments for the period 2018 to 2020.
(x) While TAT Application No. 169 of 2024 was pending, on 30 May 2025, the Tax Appeals Tribunal delivered its ruling in TAT Application No. 11 of 2023, dismissing the Application. The Tax Appeals Tribunal maintained the VAT assessments for the period December 2021 to August 2022 on the grounds that the services provided by the Applicant to TCCEC were consumed in Uganda.
(xi) On 1st June 2025, the Applicant filed Civil Appeal No. 0062 of 2025 against part of the decision of the Tax Appeals Tribunal TAT Application No. 11 of 2023, particularly the decision to maintain the VAT assessments on purported misclassified sales.
(xii) That whilst Civil Appeal No. 0062 of 2025 is pending hearing and final determination, TAT Application No. 169 of 2024 is yet to be heard and determined.
(xiii) It is in the interests of justice and equity that TAT Application No. 169 of 2024 is stayed pending the determination of the Appeal in Civil Appeal No.0062 of 2025. The Appeal raises serious questions of law which will likely impact the decision of the Tax Appeals Tribunal in TAT Application No. 169 of 2024. The decision of the High Court on Appeal would thus materially dispose of TAT Application No.169 of 2024 and avoid conflicting decisions of TAT and the High Court.

VI. The determination by the Tribunal
28. Having considered the submissions of the parties, this is the ruling of the Tribunal.
29. The Applicant seeks a stay of proceedings in TAT No. 169 of 2024 pending determination of Civil Appeal No. 0062 of 2025, on the ground that the issues before this Tribunal are identical in fact and law to those pending before the High Court.
30. We have examined the pleadings and have established that both matters involve the same parties—Allied Beverages Company Ltd and Uganda Revenue Authority—and raise substantially similar issues concerning the VAT treatment of marketing, promotion, and research services rendered by the Applicant to The Coca-Cola Export Corporation (TCCEC). However, it is also evident that TAT Application No. 169 of 2024 covers a different assessment period (October 2022 – August 2023) and includes additional tax heads such as income tax and input VAT, which are not directly the subject of Civil Appeal No 0062 of 2025.
31. While the issues of law overlap, the Tribunal is mindful of its statutory duty under Section 14 of the Tax Appeals Tribunal Act to hear and determine tax disputes at first instance, and of the fact that its decisions are appealable to the High Court under Section 28 of the same Act. It is well established that the existence of a pending appeal in another forum does not automatically bar the Tribunal from exercising its jurisdiction as was held in Nile Breweries Ltd v URA, TAT Misc. Application No. 169 of 2025.
32. The Tribunal further notes that in the Allied Beverages series of disputes, the Applicant has previously pursued parallel proceedings before the Tribunal and the High Court without seeking a stay. The Tribunal therefore finds that the present application is not premised on new or exceptional circumstances warranting departure from that established practice.
33. On the issue of prejudice, the Respondent stands to suffer substantial revenue delay if proceedings are stayed, given the significant tax amount in dispute (Shs 10 billion). Conversely, the Applicant''s interests are safeguarded by the statutory right of appeal. Regarding the 30% deposit, should the Applicant''s appeal succeed at whatever level, the Applicant will be entitled to a refund of the 30% deposit with interest. We are also mindful of the likelihood of the appeal becoming protracted as the parties have the right of appeal all the way to the Supreme Court. This could take several years and given the commercial importance of resolving tax disputes quickly, both for taxpayers and the government, it is important that disputes that are before this Tribunal are resolved as efficiently as possible.
34. In National Housing and Construction Corporation v Kampala District Land Board & Anor Civil Application No.6 of 2002 it was emphasized stated:
"A stay of proceedings is a discretionary remedy to be exercised sparingly and only where proceeding would result in injustice or abuse of process."
35. The above decision also stated that the stay mechanism exists to prevent injustice not to delay the lawful exercise of jurisdiction by a competent forum but only to avert clear injustice or where proceeding would render a pending appeal nugatory.
36. Balancing all the above factors, the Tribunal finds that it would not be in the interest of justice or commercial expediency to grant the Applicant''s request for a stay of proceedings. In the circumstances, the application to stay the proceeding in TAT Application no. 169 of 2024 is denied. Costs shall abide in the main cause.', 'This ruling underscores the Uganda Tax Appeals Tribunal''s reluctance to grant stays of proceedings, even when similar issues are pending before higher courts. The Tribunal prioritizes its statutory mandate to resolve tax disputes efficiently, as outlined in Section 14 of the Tax Appeals Tribunal Act, Cap 341. Practitioners should note that the existence of parallel proceedings or pending appeals does not automatically warrant a stay, especially if the assessment periods or specific tax heads differ. The Tribunal also highlighted that the right of appeal, coupled with the refund of the 30% deposit with interest, sufficiently safeguards a taxpayer''s interests. This case sets a precedent for the Tribunal''s commitment to expeditious dispute resolution and its cautious approach to discretionary remedies like stays.

*   **Key Takeaway:** Stays of proceedings are discretionary and granted sparingly by the TAT.
*   **Main Risk/Precedent:** Parallel litigation on similar but not identical issues may not be sufficient grounds for a stay.
*   **Relevant Act/Section:** Section 14 and Section 28 of the Tax Appeals Tribunal Act, Cap 341.', '2026-07-06 18:05:07.494151+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('2a836d13-ecf9-4587-ba77-c19ed451eb78'::uuid, 'TAT APPLICATION NO. 81 OF 2024', 'ETA ENGINEERING WORKS & SUPPLY CO. UG LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'Income Tax', 'Dismissed', 'The Applicant, a construction company, challenged an Income Tax assessment of Shs. 69,745,707 by the Uganda Revenue Authority (URA) for the period 2021-2022. The URA identified a variance between IFMIS payments and declared income, and an unsupported loan which was added back as income. The Applicant failed to provide supporting documentation or file submissions, leading the Tribunal to uphold the URA''s assessment.', 'The central issue for determination, arising from the Respondent''s findings of a variance between IFMIS payments and declared income, as well as an unsupported loan added back as income, is whether the Applicant is liable to pay the Income Tax assessment of Shs. 69,745,707 issued for the period 01/07/2021 to 30/06/2022

Section 19 of the Tax Appeals Tribunal Act places the burden of proving that an assessment is excessive or erroneous upon the taxpayer, and it states:

"In a proceeding before a Tribunal for review of a taxation decision, the Applicant has the burden of proving that;

(a) Where the taxation decision is an objection decision in relation to an assessment, the assessment is excessive; or

(b) In any other case, the taxation decision should not have been made or should have been made differently."

The Tribunal notes, however, that the Applicant in this matter filed an objection without supporting evidence, failed to provide documentation when requested by the Respondent, as indicated in the Objection Decision Notice dated 7 October, 2024 and also failed to file written submissions despite Tribunal directions.

In Pathways Advocates v URA, TAT Application No. 014 of 2026, the Tribunal held that failure to file submissions deprives the Tribunal of material necessary to evaluate the Applicant''s claim and leaves the Respondent''s position wholly unchallenged. The Tribunal emphasised that where a party defaults on submissions, the Tribunal is entitled to resolve the matter based solely on the Respondent''s record.

Applying that principle, the Applicant''s failure to prosecute its own case meant that the Respondent''s account remained uncontested, and the burden had not been discharged. The Respondent submitted that the Applicant was liable to pay Shs. 69,745,707, the total assessed Income Tax. The Respondent argued that the assessment was premised on:

(i) A clearly established variance between IFMIS payments and declared income;

(ii) An unsupported loan added back as income.

The Respondent contended that although the Applicant asserted the use of the accrual method, it failed to provide any documentary evidence. The Respondent submitted that its objection decision was appropriately issued on 29 June 2024 due to a lack of supporting documents.', 'This ruling underscores the critical importance for taxpayers to actively participate in tax dispute resolution processes, from the initial assessment and objection stages through to the Tribunal hearings. The burden of proof lies squarely with the taxpayer to demonstrate that an assessment is excessive or erroneous, as stipulated in Section 17 of the Tax Appeals Tribunal Act. Failure to provide supporting documentation or file submissions, as seen in this case, will almost certainly lead to the Tribunal upholding the tax authority''s position. Tax practitioners should advise clients that unsupported loans or unexplained variances between declared income and payment records are highly susceptible to re-characterisation as taxable income under Section 117(1) of the Income Tax Act, especially when lacking commercial substance and proper documentation.

*   **Key Takeaway:** Active participation and robust documentation are non-negotiable in tax disputes.
*   **Main Risk/Precedent:** Unsubstantiated transactions (e.g., loans) will be treated as income if not adequately proven.
*   **Relevant Acts/Sections:** Section 17 of the Tax Appeals Tribunal Act (burden of proof), Section 117(1) of the Income Tax Act (re-characterisation of transactions).', '2026-07-04 20:21:13.53076+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('2a87802d-122f-4971-b20d-5e75825ef631'::uuid, 'TAT APPLICATION NO. 128 OF 2025', 'THE REGISTERED TRUSTEES OF ENTEBBE GOLF CLUB v UGANDA REVENUE AUTHORITY', 2026, 'VAT', 'Allowed', 'The Tax Appeals Tribunal (TAT) ruled that subscription and membership fees collected by The Registered Trustees of Entebbe Golf Club do not constitute consideration for a taxable supply under Sections 4 and 18 of the VAT Act. The Tribunal found that the club operates as a non-profit, member-based association, and the fees are collective contributions for maintenance and governance, not payments for specific services. The TAT was bound by a High Court decision in a similar case (Kampala Club Limited v URA) and also found the URA''s assessment methodology flawed due to lack of evidence on actual consideration.', '105. For the foregoing reasons, the Tribunal finds that the subscription and membership fees collected by the Applicant do not constitute consideration for a taxable supply under Sections 4 and 18 of the VAT Act. The assessments are therefore erroneous in law, and the Applicant is not liable to pay the tax assessed.

Issue (ii): What remedies are available to the parties?

106. Having found that the assessments are unlawful:

(i) The administrative additional VAT assessments totalling Shs. 598,435,868 for the tax periods 2019 to 2024 are set aside.
(ii) The objection decisions upholding those assessments are vacated.
(iii) Any tax deposit paid pursuant to Section 15(1) of the Tax Appeals Tribunal Act shall be refunded in accordance with the applicable provisions of the Tax Procedures Code Act, together with statutory interest.
(iv) Costs are awarded to the Applicant.

It is so ordered.

Dated at Kampala this 6th day of March 2026.', 'This ruling provides crucial clarity for non-profit member-based organizations in Uganda regarding their VAT obligations on subscription and membership fees. The key takeaway is that such fees, when structured as collective contributions for maintenance and governance within a mutual association and not as consideration for specific services, are unlikely to attract VAT. The Tribunal''s reliance on the High Court''s precedent in *Kampala Club Limited v URA* (HCCA No. 115 of 2023/2024) reinforces the principle that a direct and identifiable link (quid pro quo) between payment and a taxable supply in the course of business is essential for VAT liability under Sections 4 and 18 of the VAT Act, Cap 344. The main risk for tax practitioners is mischaracterizing membership fees as commercial consideration, which could lead to incorrect VAT assessments. This case highlights the importance of clearly defining the nature of fees and the club''s operational model.

*   **Clear Nexus:** VAT requires a direct and identifiable link between payment and a specific service or good supplied.
*   **Non-Commercial Character:** Subscription fees for non-profit, member-based associations are generally seen as cost-sharing, not commercial transactions.
*   **Precedent:** High Court decisions on similar matters are binding on the Tax Appeals Tribunal.', '2026-07-04 16:08:01.830656+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('2db0703a-9b70-48e5-b294-435a4865d38e'::uuid, 'APPLICATION NO. 249 OF 2022', 'SUNDAY PLASTICS UGANDA LIMITED v UGANDA REVENUE AUTHORITY', 2024, 'VAT', 'Dismissed', 'The Applicant challenged a VAT assessment on booking fees received for future supply of imported goods. The Uganda Revenue Authority (URA) argued that these booking fees constituted part payment for goods, creating a tax point under Section 14(1)(c)(ii) of the VAT Act, even before the goods were imported or delivered. The Tribunal ruled that the booking fees were indeed part of the final consideration for the goods and thus created a tax point upon receipt, dismissing the Applicant''s challenge.', 'This Ruling is in Respect of an application challenging a VAT assessment issued on booking fees.

1. Background Facts
The Applicant imports raisin, a raw material used in the manufacture of plastics. The Respondent examined the Applicant''s VAT returns and records for the period 1 July 2021 to 30 June 2022 and purportedly established that there was a variance between the bank credits and VAT returns of Shs. 7,488,038,731.
On the 25 March 2022, the Respondent issued the Applicant with additional administrative assessments totaling to Shs. 2,477,914,367 for the period 15 July 2021 to 28 February 2022. On the 28 April 2022, the Applicant objected. On the 26 October 2022, the Respondent disallowed the objection.

3. Issues for determination
The parties framed the following issues for determination by the Tribunal:
(i) Whether the Applicant is liable to pay the tax assessed?
(ii) What remedies are available?

Ms. Joanitah Nakaboga the Applicant''s Tax Supervisor, in her witness statement stated that Applicant gather orders from a sizable number of clients. This is aimed at meeting the minimum quantity for manufacturing and the manufacturer''s conditions for minimum order quantity and booking deposit before manufacturing can commence.
She further stated that after a reasonable number of clients have confirmed their orders, the Applicant places an order to the manufacturer in China and makes a payment deposit. The manufacturer upon receiving the deposit starts manufacturing the PET. The goods are then shipped to Mombasa, and VAT input taxes paid. The customers would then pay for the goods and the Applicant pays output VAT.
Ms. Joanitah Nakaboga stated that they started receiving booking orders from July 2021 up to June 2022, and received its first goods in October 2021, the second consignment of goods in November 2021, the third in December 2021, the fourth consignment was received in January 2021 and the rest of the five consignments were received in February 2021. The Respondent issued tax assessments from July to October 2021, a period in which the Applicant had not yet received the goods.

Mr. Chark Benson Muhumuza, a Domestic Taxes Officer of the Respondent in his witness statement stated that on examining the Applicant''s sales ledger, bank statements and VAT returns for the period of 1 July 2021 to 30 June 2022, the Respondent established that there were unexplained variances between the bank credits and VAT sales declared and issued the Applicant with administrative assessments totaling to Shs. 2,277,914,367.55 from 1 July 2021 to 28 February 2022. Further, the witness stated that by the Applicant''s own admission, the bank credits were advance payments by the Applicant''s customers for the supplies, thus constitute a payment within the definition of the law. He also stated that the bank deposits amounted to partial payment for the goods and thus the Applicant should have invoiced and charged VAT.

4. Submissions by the Applicant
4.1 Whether the Applicant is liable to pay the taxes as assessed by the Respondent?
The Applicant framed three sub-issues to answer the first issue.
a) Whether the Respondent can charge VAT on bank deposits?
b) Whether booking fees amounts to payment for the Raisins?
c) Whether the Respondent can charge VAT on goods that are not yet imported into the country?

The Applicant submitted that VAT cannot be charged on bank deposits, regardless of the purpose of the deposit until a product is sourced and a purchase payment made on it. He quoted Section 4 of the Value Added Tax Act that states;
"A tax, to be known as a value added tax, shall be charged in accordance with this Act on every taxable supply made by a taxable person, on every import of goods other than an exempt import and the supply of imported services, other than an exempt service, by any person".

The Applicant submitted that Section 14 (1) (b) of the VAT Act states that;
"Except as otherwise provided under this Act, a supply of goods or services occurs, in any other case, on the earliest of the date on which
(i) the goods are delivered or made available, or the performance of the service is completed;
(ii) payment for the goods or services is made; or
(iii) a tax invoice is issued"

The Applicant submitted that from the above mentioned three taxing points, there was no supply of goods at the time when the Respondent raised assessments against the Applicant for VAT.
The Applicant submitted that the first taxing point of when the goods are delivered or made available cannot be met as the goods were only delivered in October of 2021. Regarding payment, the Applicant submitted that payments were received from the clients after the Raisins were delivered in Uganda in October of 2021. Regarding a tax invoice, the Applicant submitted that it was issued after the purchase and eventual sales in October of 2021. The amount of money in the account at the time when the Respondent raised the assessments could not have amounted to taxable sales.

The Tribunal finds that the Applicant should have accounted for VAT upon receipt of the booking fees as it was part of the payment.
On the issue of charging VAT on the goods that were not yet received or supplied, the Applicant contended that the Respondent should not have charged VAT for period where the Applicant had not yet imported the goods into Uganda. The Applicant in her submissions stated that the goods were first made available in October 2021.
We note that the assessment period was July 2021 to February 2022 which covers the period between October 2021 and February 2022, when the Applicant made her importations into the country.
It is not in dispute that there was a supply and booking fees/deposit/partial consideration was received. Therefore, VAT should have been accounted for at that time.
In the circumstances, this application is dismissed. Costs are hereby awarded to the Respondent.', 'This ruling clarifies a critical aspect of VAT liability for businesses in Uganda, particularly those involved in importing goods based on customer orders and advance payments. The key takeaway is that ''booking fees'' or ''deposits'' received for future supplies, if they form part of the final consideration, trigger a VAT tax point at the time of receipt, regardless of whether the goods have been imported or delivered. This aligns with Section 14(1)(c)(ii) of the VAT Act, which establishes payment as one of the earliest tax points. Tax practitioners should advise clients to carefully review their contractual arrangements and accounting practices for advance payments to ensure timely VAT remittance, as failure to do so can lead to significant assessments and penalties.

*   Advance payments (booking fees, deposits) for goods constitute a VAT tax point.
*   The timing of VAT liability is determined by the earliest of delivery, payment, or invoice issuance (Section 14(1)(c) of the VAT Act).
*   Proper accounting for such receipts as deferred income is crucial to support arguments against immediate VAT liability.', '2026-07-04 16:00:47.747615+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('3097819e-9545-48e7-9bc5-dea76a7c6968'::uuid, 'MISC APPLICATIONS NO. 149, 151, 153,155 (ARISING FROM TAT APPLICATIONS NO. 189, 194, 195, 193)', 'AG INVESTMENTS FINANCE LTD & OTHERS v UGANDA REVENUE AUTHORITY', 2025, 'WHT', 'Partial', 'The applicants sought a temporary injunction to restrain URA from collecting withholding tax on imported agricultural produce, release consignments, allow goods into the country without WHT, and unblock WHT exemption codes and TINs. The Tribunal dismissed the application for a temporary injunction and the prayer to unblock WHT exemption codes, finding no proof of goods at the border or irreparable injury. However, the Tribunal directed URA to unblock the applicants'' Tax Identification Numbers (TINs), deeming the blocking of TINs an abuse of discretion.', 'THE REPUBLIC OF UGANDA
IN THE TAX APPEALS TRIBUNAL AT KAMPALA
MISC APPLICATIONS NO. 149, 151, 153,155
(ARISING FROM TAT APPLICATIONS NO. 189, 194, 195, 193)

1. AG INVESTMENTS FINANCE LTD (149)
2. AGLERT ENT CO. LTD (151)
3. AGAMO COMMODITIES (153)
4. BIGAAGA IMPORTERS & EXPORTERS UG LTD (155).................APPLICANTS

VERSUS

UGANDA REVENUE AUTHORITY................................................RESPONDENT

BEFORE: MS. CRYSTAL KABAJWARA, MS. GRACE SAFI,
MR. WILLY NANGOSYAH

RULING

These applications are brought under Section 98 of the Civil Procedure Act, Rule 30 Tax
Appeals Tribunal Procedure Rules, Order 41 Rule 1 (2) & Order 52 Rule 1 & 3 of the Civil
Procedure Rules for orders that:

(i) A temporary injunction be issued restraining the Respondent, her agents/servants,
assignee, employees, or any other person who may be acting on their behalf from
collecting withholding tax in respect to the Applicants'' consignments some of which
contain rice, groundnuts, maize held at Mutukula, Malaba and Busia Boarder points
pending the hearing and final disposal of the main applications.

(ii) That the Respondent unconditionally releases the Applicant''s consignments
pending the hearing and final disposal of the main applications.

(iii) An order be issued to allow the Applicants'' goods into the country without imposing
and demanding withholding tax until the final disposal of the main applications.

(iv) That the Respondent unblocks the Applicants'' withholding tax exemption codes and
Tax Identification Number to enable the importers to complete the clearing process.

(i) The Applicants'' application for a temporary injunction is hereby dismissed;
(ii) The Applicants'' prayer for the Respondent to unblock the withholding tax exemption
codes is hereby denied;
(iii) The Respondent is directed to unblock the Applicants'' tax identification numbers;
and
(iv) Costs of this application shall abide in the main cause.

Dated at Kampala this 29th day of October 2025.', 'This ruling highlights the stringent requirements for obtaining temporary injunctions against the Uganda Revenue Authority (URA) and clarifies the Tribunal''s stance on the blocking of Tax Identification Numbers (TINs). Practitioners should note that proving the physical existence of goods and actual irreparable harm is crucial for injunctions. The Tribunal emphasized that while URA has powers to enforce tax compliance, blocking a taxpayer''s TIN for a dispute over tax payable is an abuse of discretion, as a TIN is fundamental to a taxpayer''s ability to transact. This decision provides a significant precedent regarding the limits of URA''s enforcement powers concerning TINs, particularly in cases where the underlying tax liability is still in dispute.
*   **Key Takeaway:** Blocking a taxpayer''s TIN by URA for a tax dispute is an abuse of power.
*   **Risk/Precedent:** URA''s discretion in enforcement actions, particularly regarding TINs, is subject to judicial oversight.
*   **Relevant Acts/Sections:** Section 136(3) & (5) of the Income Tax Act (ITA) regarding WHT exemption on agricultural produce; Civil Procedure Act and Tax Appeals Tribunal Procedure Rules for injunctions.', '2026-07-06 18:03:59.967027+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('33e7fd9d-700c-4d1a-90be-d39ccf48f26a'::uuid, 'APPLICATION NO. 300 OF 2024', 'LAKE VICTORIA HOTEL LIMITED v UGANDA REVENUE AUTHORITY', 2025, 'Income Tax', 'Dismissed', 'The Applicant, a hotel establishment, leased its hotel facility to another company. The Uganda Revenue Authority (URA) assessed the income from this lease as rental income, leading to an income tax assessment of Shs. 118,460,942. The Applicant contended that the income was business income, arguing that the entire hotel business, including goodwill and inventory, was transferred. The Tribunal, however, found that the primary purpose of the transaction was to grant the lessee the right to use and occupy the property, and the consideration was a fixed annual lease amount, not a share of business earnings. Therefore, the Tribunal upheld the URA''s assessment, categorizing the income as rental income.', 'This ruling is in respect of an application challenging an administrative income tax assessment of Shs. 118,460,942 for the years 2021 and 2022, categorizing income earned from leasing of the Applicant''s hotel facility as rental income.

1. Background Facts
The Applicant is a hotel establishment engaged in the hospitality industry in Uganda. Its primary objectives include operating hotels, restaurants, cafes, conference centers, lodging houses and safari lodges as well as operating as a refreshment contractor, refreshment room proprietor, caterer, travel agent, dry cleaner, theatre operator and manager, tourist agent, and contractor among other activities.

The Applicant entered into a lease agreement dated 21 December 2020 and leased the hotel facility and its establishments to Granada Hotels Uganda Limited, a company under the Granada Hotel Group. The lease facility agreement was executed with an annual amount of USD 850,000.

On 20 March 2024, the Respondent issued an administrative income tax assessment of Shs. 810,470,298 for the years 2021 and 2022, arising out of the undeclared rental income of Shs. 2,701,567,662. On 5 July 2024, the Applicant objected to the assessment because the Hotel business, including goodwill and inventory, had been transferred to Granada Hotel Limited and the income charged constituted business income and not rental income.

The Respondent made an objection decision disallowing the objection and maintaining the assessment of Shs. 118,460,942 based on the characterization of the income received from leased properties as rental income.

2. Issues for determination
The parties agreed upon the following issues for determination:
(i) Whether the income received by the Applicant is Business income or Rental Income?
(ii) What are the remedies available to the parties?

7. The determination by the Tribunal
Therefore, the dispute hinges on the characterization of the Applicant''s income from the lease of the hotel establishment, that is, whether it is rental or business income.

Section 4 of the ITA imposes income tax on every person who has chargeable income for a year of income.

Chargeable income is defined by section 15 of the ITA to mean the gross income of a person for a year of income less total deductions allowed under the ITA for the year.

Section 17 of the ITA defines the term gross income to be the sum total of business income, employment income and property income derived during the year by a person.

Section 18(1) of the Income Tax Act defines business income as follows:
"Business income means any income derived by a person in carrying on a business and includes the following amounts, whether of a revenue or capital nature-

a) the amount of any amount of any gain, as determined under Part VI of this Act which deals with gains and losses on disposal of assets, derived by a person on the disposal of a business asset, or on the satisfaction or cancellation of a business debt, whether or not the asset or debt was on revenue or capital account,

b) any amount derived by a person as consideration for accepting a restriction on the person''s capacity to carry on business".

However, the ITA contains a special regime for the taxation of rental income which the ITA treats differently to other gross income.

Section 5 of the ITA imposes tax on any person who has rental income for the year of income.
Further, section 5 (3) of the ITA categorically states that rental tax is separate from the tax imposed under section 4 (see above) and is not to be included in the gross income of the person that is subject to tax for any year of income.

In other words, the ITA ringfences rental income from other kinds of business income that would ordinarily have been taxed under section 4 had it not been for the exclusion under section 5 (3) of the ITA.

Having stated the above legal framework, the pertinent question that one ought to ask is, what is rental income?

Section 2 of the ITA, defines the term rent as:
"Any payment, including a premium or like amount, made as consideration for use or occupation of, or the right to use or occupy, land or buildings".

Therefore, for an item of income to qualify as rent, it must have been made in consideration for the use of occupation of land or buildings.

We must now turn to the transaction between the Applicant and Granada Hotels and determine whether the payments arising therefrom are consideration for the use or occupation of land or buildings.

Analysis
The Tribunal examined the lease agreement dated 21 December 2020, which transferred the hotel facility and its establishments to Granada Hotels Uganda Limited.

Clause 2 of the agreement headed "Grant of Rights" states:
"2.1 ...the Lessor shall subject to clause 8 and 9 herein lease the Hotel to Lessee for the duration of the term.
2.2 The Hotel comprises of

132 hotel rooms
8 Junior suites
3 ministerial suites
1 presidential suite
4 conference rooms
1 restaurant
3 bars
10 shops, etc"

In addition to the above, clause 3.1 of the agreement states:
"...the Lessor mandates the lessee to take the Hotel in its current condition, to fully operate it as a hotel under its own name, logo, trademarks and get up for the duration of the term..."

Further, clause 3.2 states:
"...the Lessee shall have quiet possession of the Hotel establishment and shall ensure that all outgoings including telephone line, internet, electricity and water on the hotel are properly and punctually paid for."

It is unequivocally clear from the above provisions that the main purpose of the transaction involving the lease of the hotel establishment was to grant the Lessee rights to use the buildings comprising the various rooms listed in clause 2.2 of the agreement.

This is further confirmed by the fact that the Lessee was under no obligation to continue operating the business of the Applicant under its trademark. Instead, the Lessee was allowed to operate the hotel under its own name, logo and trademarks. Clause 5 of the agreement permitted the Lessee to change the trading name of the hotel, subject to the Applicant''s written approval.

While the lease entitled the Applicant to have a team of not less than 10 designated employees to look after the Applicant''s interests (clause 6), this did not amount to and cannot be interpreted as a transfer of an entire business.

We have taken note of the Applicant''s submissions that certain obligations were imposed upon the Lessee, such as the obligation to maintain the hotel at the current 4-star standard (Clause 11.1), the termination in case of bad services (Clause 24.3), maintaining designated employees to monitor the activities and ensure the standards of the hotel are met. The Applicant argued that these conditions all point to the fact that the Applicant transferred a business rather than renting property.

We disagree with the Applicant. The obligations imposed upon the Lessee are no different from conditions precedent to a property lease arrangement, such as restrictions on the use of the property.

In addition, the mode of remuneration for the transaction is telling. Clause 8 of the Agreement provides that the agreed annual lease amount shall be USD 850,000, exclusive of all applicable taxes.

If the Applicant intended to let a business and not a property, the consideration would have reflected such intention, for example, a share of the earnings generated by the Lessor from operating the hotel business.

However, this was not the case. We have also taken note of Clause 7 of the agreement, which mandated the Lessee to collect and remit proceeds from existing receivables to the Applicant. This further confirms the finding that the transaction was not a transfer or lease of a business but the letting of buildings in consideration for rent.

Therefore, having studied the agreement in its entirety, we have concluded that the consideration received by the Applicant was for the right to use and occupy the property, which falls squarely within the statutory definition of rental income. Although the agreement included operational obligations for the lessee, these were incidental to the main purpose of granting possession and use of the property.

In the circumstances, the Application is dismissed and the Tribunal orders as follows:
(i) The assessment of Shs. 118,460,942 is upheld.
(ii) Costs are awarded to the Respondent.', 'This ruling from the Tax Appeals Tribunal (TAT) provides crucial clarity on the distinction between business income and rental income, particularly for entities whose primary business involves operating properties. The key takeaway is that the nature of the income is determined by the substance of the transaction and the intention of the parties, not merely the description in the agreement or the taxpayer''s primary business objectives. The Tribunal emphasized that for income to be classified as rental income under Section 2 of the Income Tax Act (ITA), it must be consideration for the use or occupation of land or buildings. The risk for tax practitioners is mischaracterizing income from property leases, especially when operational elements are included, which could lead to incorrect tax assessments and penalties. The precedent set here reinforces that a fixed annual payment for the use of a facility, even with operational obligations on the lessee, will likely be treated as rental income if the core purpose is property occupation.

*   **Key Practical Lessons:**
*   Carefully draft lease agreements to reflect the true nature of the transaction (property lease vs. business transfer).
*   Consider the mode of remuneration: fixed payments for property use typically indicate rental income.
*   Understand that operational obligations on a lessee may be incidental to a property lease and not automatically convert income to business income.', '2026-07-04 21:30:19.008894+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('36da773c-fd89-47be-bec2-69626ed3571e'::uuid, 'TAT APPLICATION NO. 242 OF 2022', 'ZEE INVESTMENTS LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'Income Tax', 'Partial', 'The Applicant challenged income tax assessments based on understated purchases and PAYE assessments for understated salaries. The Tribunal upheld the income tax assessment, finding the Applicant failed to discharge the burden of proof regarding purchase variances. However, the PAYE assessment was set aside because it was based on assumed salaries rather than actual payments, despite the Respondent''s arguments about minimum wage guidelines and an unregistered MoU for directors'' salaries. The Tribunal awarded the Respondent 80% of the costs.', '56. PAYE cannot be imposed on income that was never received. In the absence of proof of higher payments by the Applicant, the Respondent cannot assess PAYE based on assumed salaries. The PAYE assessment arising from the adjustment of directors'' remuneration is untenable.

57. Having considered all the facts and evidence concerning this dispute, the Tribunal makes the following findings:
a) The income tax assessment arising from variances in purchases is upheld as the Applicant has not discharged the burden of proof.
b) The PAYE assessment is hereby set aside, as it was based on assumptions rather than actual salary payments.
c) The Respondent is awarded 80% of the costs of this application.

Dated at Kampala this 20th day of January, 2026.

HON. CRYSTAL KABAJWARA
CHAIRPERSON

HON. GRACE SAFI
MEMBER

I have had the benefit of perusing the ruling. While I agree with upholding on the income tax assessment, I do not agree with setting aside the PAYE assessments because of the following:

1. The Applicant contended that the Respondent used assumed salaries instead of the actual contractual salaries paid to employees. The Applicant attached employment contracts that indicate the salary as Shs. 800,000 for pharmacists working in shifts from 9:00 AM to 1:00 pm and from 1:00 pm to 5:00 pm.

2. Furthermore, according to the minutes on page 133,134 of the Joint Trial Bundle, it was established that the Applicant paid the director Shs. 1,000,000 that runs at all branches. However, according to the Respondent, on considering the Applicant''s operations and responsibilities the Applicant under declared salaries of its Directors, Pharmacists, and the Finance manager.', 'This ruling highlights the critical importance of maintaining robust and verifiable financial records for Ugandan tax practitioners. While the Tribunal acknowledged the URA''s power to assess based on best judgment where evidence is lacking (citing Section 49 of the Tax Procedure Code Act), it firmly rejected assessments based on ''assumed'' income for PAYE purposes, emphasizing that tax is levied on actual income received, not what ''ought'' to have been paid. This provides a clear precedent against speculative PAYE assessments. Taxpayers must be diligent in proving their declared income and expenses, as the burden of proof lies with them under Section 19 of the Tax Appeals Tribunal Act.

Key practical lessons:
* Maintain comprehensive and verifiable financial records for all transactions.
* Ensure employment contracts align with actual salary payments and supporting documentation.
* Be prepared to substantiate all declared income and expenses with corroborative evidence during audits.', '2026-07-04 22:05:38.565327+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('3a559dac-90a5-46ab-afe4-7dc1d45772e9'::uuid, 'TAT No. 261 of 2022', 'Vegol Limited v Uganda Revenue Authority', 2025, 'Excise Duty', 'Allowed', 'Vegol Limited challenged an excise duty assessment of Shs. 482,998,573 by the Uganda Revenue Authority (URA), arguing that its product, ''Best Fry Cooking Fat 18kg,'' was wrongly classified as cooking oil instead of cooking fat. The Tribunal found that based on scientific tests (iodine value and cloud point temperature), physical characteristics (solid at room temperature, sold in kilograms), and the fractionation manufacturing process, the product was indeed cooking fat and not cooking oil. Since only cooking oil is subject to excise duty under Schedule 2, Item 18 of the Excise Duty Act, the Tribunal set aside the assessment.', 'This ruling is in respect of an application challenging an assessment of Shs. 482,998,573 on the grounds that the Respondent wrongly classified cooking fat as cooking oil for excise duty purposes.

1. Background Facts
The Applicant manufactures vegetable cooking oil and soap. The Applicant also produces a product called 18kg bakers fat that is used in baking. The Respondent carried out an audit of the Applicant for the period of July 2019 to June 2021 and classified "cooking fat" as "cooking oil" and assessed local excise duty (LED) of Shs. 482,998,573. On 9 August 2022, the Applicant objected to the additional assessments and the Respondent made a decision on 7 November 2022 maintaining the tax liability.

2. Issues to be determined
The issue for determination is whether the Applicant is liable to pay the tax assessed.

4. The Submissions of the Applicant
The Applicant submitted that they are not liable to pay the tax assessed because the product, Best Fry Cooking Fat, is a cooking fat and not cooking oil. They added that only cooking oil is taxable under the Excise Duty Act (EDA).
Section 3(1) of the Excise Duty Act provides:
"Subject to this Act, the excisable goods and excisable services in Schedule 2 to this Act shall be chargeable with the excise duty specified in that Schedule."
The Applicant submitted that under Schedule 2, Item 18 of the EDA, cooking oil is charged with an excise duty of Shs. 200 per litre. Cooking fat is not listed as an excisable good under the EDA.

The Applicant distinguished “cooking oil” from "cooking fat" as follows:
a) The physical test
According to the Oxford Advanced Learner''s Dictionary, 10 Edition, the term oil is defined as "a smooth thick liquid that is made from plants or animals and is used in cooking".
Whereas "fat" is defined as:
"a solid substance from animals or plants, treated so that it becomes pure for use in cooking".
The Applicant submitted that a sample of its product presented in evidence, is categorized and sold as cooking fat, which at room temperature has a solid state. A sample of cooking oil was also presented in a liquid state at room temperature qualifying as cooking oil.
The Applicant submitted that its product is not subject to excise duty because it is fat at room temperature and sold in kilograms. They added that this is unlike cooking oil which is liquid at room temperature and is sold in litres due to its liquid state.

b) The scientific test
The Applicant submitted that its product is cooking fat and not cooking oil because scientifically, it has an iodine value (IV) of 42-45 and its Cloud Point Temperature (CPT) is above 13.

In sum, based on the all the evidence adduced, we find that the Applicant has on the balance of probabilities, discharged the burden of proof. On the other hand, the Respondent has not presented any real evidence, scientific or otherwise, to support their conclusion that the Applicant''s product was cooking oil and not cooking fat.
In the circumstances the Tribunal hereby allows the application and makes the following orders:
(i) The assessment of Shs. 482,998,575 is hereby set aside.
(ii) Costs are awarded to the Applicant.', 'This ruling provides crucial clarity on the distinction between ''cooking oil'' and ''cooking fat'' for excise duty purposes in Uganda, emphasizing the importance of scientific and physical characteristics over mere reclassification by the tax authority. The Tribunal''s decision highlights that the burden of proof, while initially on the applicant, requires the Respondent (URA) to provide substantive evidence for reclassification. Tax practitioners should note the Tribunal''s reliance on internationally recognized standards (iodine value, cloud point temperature) and the actual manufacturing process (fractionation vs. hydrogenation) to differentiate products. The case also underscores the procedural requirement for URA to properly collect samples during audits, as their failure to do so weakened their case.

Key practical lessons:
*   **Product Classification:** Scientific and physical properties are paramount in determining product classification for tax purposes.
*   **Burden of Proof:** While taxpayers bear the initial burden, URA must provide robust evidence for reclassifications.
*   **Audit Procedures:** URA''s failure to follow proper sample collection procedures can undermine their assessments.', '2026-07-06 11:19:26.333937+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('3a6df95b-8ec4-4832-b100-d95ba707c142'::uuid, 'TAT No. 378 of 2024', 'ENVIROSERV (U) LTD v UGANDA REVENUE AUTHORITY', 2025, 'Income Tax', 'Partial', 'The case concerns an additional income tax assessment of Shs. 9,267,550,780 on Enviroserv (U) Ltd, arising from a purported gain due to an indirect change in its ownership. The Uganda Revenue Authority (URA) applied Sections 74(2) and 78(h) of the Income Tax Act (ITA), deeming a capital gain on the Ugandan resident company following an offshore share sale by its ultimate non-resident shareholders. The Tax Appeals Tribunal (TAT) ruled that the transaction is taxable under Sections 74(2) and 78(h) of the ITA, and that the Uganda-South Africa Double Taxation Agreement (DTA) does not apply as the tax is levied on a Ugandan resident. However, the TAT set aside URA''s assessment due to inaccuracies in the calculation of the deemed capital gain, specifically regarding the apportionment of the cost base, and remitted the matter for re-computation.', 'This ruling is in respect of an administrative additional income tax assessment of Shs. 9,267,550,780 in respect of a purported gain arising from the indirect change in the Applicant''s ownership.

1. Background facts
The Applicant, a company incorporated in Uganda, is in the business of waste management. It operates landfills for industrial and hazardous waste management and treatment in Hoima.

The Applicant''s shareholders are EnviroServ Waste Management Proprietary Limited a South African Company (EWM), which holds 52% of the shares and Green Albertine Limited (GAL), a Ugandan Company holding 48%.

In 2019, Rockwood Fund 1 (the Seller), a private equity investor, commenced the divestment of its interest in the EnviroServ Group. Rockwood Fund was the majority ultimate shareholder, with a shareholding of 92% and the rest was held by minority shareholders. In 2022, Rockwood Fund 1 concluded a Share Purchase Agreement which became effective on 30 September 2022. The effect of the SPA was that Rockwood Fund 1 and the other shareholders sold their shares in the EnviroServ Group to a consortium comprising of Suez International, Royal Bafokeng (Pty) Ltd, and The IDEA Infrastructure 1 Partnership. The consortium now owns 100% of the shares in the group through a South Africa based special purpose vehicle, Umzwilili Environmental Solutions.

The above activities led to the changes in the indirect ownership of the Applicant. While the immediate shareholding of the Applicant did not change, at group level, there was a change in the ownership following the divestment by Rockwood Fund 1.

Following the above, the Respondent, having determined that there was an indirect change in the ownership of the Applicant, deemed capital gain on the Applicant pursuant to Section 74(2) read together with 78 (h) of the Income Tax Act (ITA).

The Respondent consequently issued the Applicant with administrative additional income tax assessment of Shs. 9,267,550,780 in respect of deemed capital gain arising from the change of ownership.

On 6 September 2024, the Applicant objected to the assessment on the grounds that:
(i) The basis of the assessment notice issued is not supported by law.
(ii) Section 74(2) Income Tax Act relied on for the assessment does not deem a disposal of assets in Uganda where a person does not change its ownership within 3 years.
(iii) That even if Section 74 (2) was applicable, the way the deemed capital gain was determined is erroneous to the extent that the would-be eligible assets, their cost base, and the deemed consideration, was wrongly computed.

The Respondent disallowed the Applicant''s objection, hence this application.

2. Issue for determination
The issue for determination is whether the Applicant is liable to pay the tax assessed.

[...] 

In conclusion, we have determined that section 78(h) of the ITA read together with section 74 (2) are applicable to the transaction as there was a change in the ownership of the Applicant by more than 50% within a three year period. Further, the Uganda South Africa DTA does not apply to the present case and as a result, the Applicant is subject to tax in Uganda in accordance with the above provisions of the DTA.

However, the Respondent''s calculation of the tax payable was incorrect in as far as the Respondent sought to apportion the cost base. Further, the calculation did not follow the correct steps as set out in section 74 (2) of the ITA for purposes of determining the gain or loss subject to tax. It is important that the gain or loss is accurately calculated in order to determine the correct tax payable.

In view of the above, the Tribunal makes the following orders:
(i) The transaction is taxable under section 74 (2) of the ITA and the tax should be determined within the parameters set by the provision;
(ii) Owing to the inaccuracies in the Respondent''s calculation, the tax assessed is hereby set aside;
(iii) The matter is hereby remitted to the Respondent for the re-computation of the tax payable in line with section 74 (2) of the ITA;
(iv) The revised calculation should be completed by 25 June 2025;
(v) Each party should bear their own costs.', 'This ruling from the Tax Appeals Tribunal (TAT) in Uganda provides crucial clarity on the application of indirect transfer provisions under the Income Tax Act (ITA), particularly Sections 74(2) and 78(h), and their interaction with Double Taxation Agreements (DTAs). The key takeaway for tax practitioners is that Uganda''s domestic law on indirect transfers, which deems the resident entity as the taxpayer, can override DTA provisions that might otherwise allocate taxing rights to the residence state of the alienator. This case reinforces the principle that DTAs do not impose taxes but rather allocate taxing rights, and domestic law governs the taxation of residents. The main risk or precedent is the TAT''s interpretation that Section 74(2) deems *all* assets and liabilities of the Ugandan resident company to have been realized at market value, without apportionment based on the percentage of indirect ownership change, which significantly impacts the calculation of the deemed gain. Practitioners should be aware of the potential for substantial tax liabilities on Ugandan resident entities following indirect ownership changes, even if the direct shareholding remains unchanged.

*   **Key Practical Lessons:**
*   Indirect transfers of shares in non-resident entities that derive value from Ugandan assets can trigger tax liabilities for the Ugandan resident entity under Sections 74(2) and 78(h) of the ITA.
*   The ''three-year period'' in Section 74(2) is an anti-avoidance measure for gradual ownership changes, not applicable to immediate changes exceeding 50%.
*   The DTA with South Africa was held not to apply because the tax is imposed on the Ugandan resident entity, not the non-resident sellers, thus avoiding a treaty override.', '2026-07-04 20:19:41.582689+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('3a7606eb-14aa-4179-a888-c5010c966fc9'::uuid, 'TAT APPLICATION NO. 36 OF 2025', 'RWENZORI COMMODITIES LIMITED. VERSUS UGANDA REVENUE AUTHORITY', 2025, 'WHT', 'Dismissed', 'The Applicant, a tea producer and exporter, challenged a withholding tax assessment on brokerage and subscription fees paid to non-resident brokers and trade associations in Kenya. The Tribunal dismissed the application, holding that the fees constituted Uganda-sourced income under Section 78(d)(ii) of the Income Tax Act, Cap 338, as they were paid by a resident person for services functionally connected to the Applicant''s Ugandan business activities, irrespective of where the services were physically rendered. The Tribunal emphasized the literal interpretation of tax statutes and the legislative intent to expand the scope of WHT.', '1. This ruling is in respect to an application challenging the Respondent''s assessment of withholding tax on brokerage fees and commissions paid by the Applicant to non-resident brokers and trade associations in Kenya.

II. Background Facts
2. The Applicant is in the business of growing, processing, and selling tea.
3. The Respondent conducted a customs post-clearance audit into the tax affairs of the Applicant for the period January 2019-December 2023 to assess the Applicant''s compliance with its customs-related obligations. On 27 November 2024, the Respondent issued an audit management letter and stated that the Applicant did not withhold tax on brokerage and subscription fees paid to tea brokers and the tea association in Kenya.
4. Therefore, the Respondent assessed Shs. 95,007,270 as withholding tax ("WHT") at the non-resident rate of 15%. On 20 December 2024, the Applicant objected to the WHT assessment on the following grounds:
(i) The brokerage and subscription fees are paid to non-resident persons for services physically conducted in Mombasa, Kenya, without any connection to Uganda.
(ii) The Withholding tax is not applicable on the brokerage fees since the services are not rendered in Uganda and the income is not sourced from Uganda.
5. On 17 January 2025, the Respondent disallowed the objection, maintaining that the brokerage and subscription fees attract withholding tax at a rate of 15% under Section 78(d)(ii) and 84 of the Income Tax Act Cap 338.
6. The Applicant filed this application before this Tribunal for the review of the Respondent''s objection decision.
III. Issues for determination
7. The main issue for determination is whether the Applicant is liable to pay the tax assessed.

57. The Applicant produces and exports tea and utilize the services of brokers and trade associations in Kenya to market and promote the tea and to participate in the tea auction in Mombasa. It is our considered view that there is a direct nexus between the services performed and the Applicant''s economic activities happening in Uganda. Therefore, the brokerage and commission fees paid by the Applicant facilitate the sale of Ugandan tea, and without them, the Applicant''s products would not reach the export markets.
58. Consequently, the Applicant''s argument that the services rendered by the non-resident brokers have no connection to Uganda is incorrect.

The impossibility of the withholding obligation
59. The Applicant submitted that it was practically impossible for them to withhold tax from the brokerage fees and commissions because they did not have control of the funds. Section 78 (d) (ii) refers to a "fee for the provision of services paid by a resident person." This requires the following questions:
Is the Applicant charged a fee for the provision of the services? Yes. They are charged brokerage and commission fees.
Are the fees paid by a resident person? Yes. They are paid by the Applicant, who is a resident in Uganda for tax purposes.
60. Furthermore, at the conferencing session with the parties, the Applicant confirmed that the fees are expensed in the Applicant''s financial statements. It should also be noted that while the Applicant did not have physical custody of the funds from which the brokerage fees were deducted, the funds at all material times belonged to the Applicant, who had control over them as they arose from the sale of its tea. The economic reality or true essence of a transaction is more important than its legal or superficial appearance. In other words, the Tribunal shall consider the substance of the transaction over its form. Therefore, how the Applicant chooses to settle its obligations with the brokers, whether by a direct cash payment or offset, does not dispense with its withholding tax obligations.
61. Section 137 of the ITA requires any person making a payment of the kind referred to in Section 82, 84 or 85 of the ITA to withhold from the payment the tax levied under the relevant Section. Having established that the payments fall under section 84 of the ITA, the Applicant was obliged to withhold tax and account for it. Further, section 142 of the ITA provides that a withholding agent who fails to withhold tax is personally liable to pay to the Commissioner General the amount of tax which has not been withheld. However, the withholding agent is entitled to recover this amount from the payee. In the present case, the Applicant did not withhold the tax and is therefore liable to pay the tax to the Respondent.
62. In the circumstances, the application fails and is hereby dismissed. The Tribunal makes the following orders:
(i) The assessment of Shs. 95,007,270 is hereby maintained; and', 'This ruling from the Tax Appeals Tribunal (TAT) in Uganda provides crucial clarity on the interpretation of ''Uganda-sourced income'' for withholding tax (WHT) purposes, particularly concerning services rendered by non-residents abroad. The Tribunal''s emphasis on the ''substance over form'' principle and the direct economic nexus to Ugandan business operations, even when services are physically performed outside Uganda, sets a significant precedent. Tax practitioners should note the expanded scope of Section 78(d)(ii) of the Income Tax Act (ITA), Cap 338, following the 2015 amendment, which now captures payments for services rendered anywhere, as long as they are paid by a resident person and are functionally connected to Uganda''s economy. The ruling also reinforces that the inability to physically control funds does not absolve a withholding agent of their statutory obligation.

Key practical lessons:
* **Source Rule Interpretation:** The TAT adopts a broad interpretation of ''Uganda-sourced income'' under Section 78(d)(ii) ITA.
* **Economic Nexus:** Services performed abroad for a resident Ugandan entity, if functionally connected to its Ugandan business, can attract WHT.
* **Withholding Obligation:** The payer''s contractual arrangements or lack of physical custody of funds do not negate the WHT obligation.', '2026-07-04 16:52:37.518611+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('3b51e92c-11f2-4721-9cbb-1fce81917ad9'::uuid, 'TAT APPLICATION NO. 69 OF 2023', 'Kampala Hospitality Development Limited v Uganda Revenue Authority', 2025, 'VAT', 'Dismissed', 'The Applicant, a hospitality services provider, was assessed for VAT on imported services for the period May 2015 to August 2021. The Applicant argued that the assessments for May 2015 to December 2019 were time-barred under Section 25(2)(b) of the Tax Procedure Code Act, as the information was available to URA through filed withholding tax returns. The Tribunal found that the Applicant''s failure to account for VAT on imported services, despite accounting for corresponding withholding tax, amounted to willful neglect, thus falling under an exception to the three-year limitation period. The application was dismissed.', 'This ruling addresses the question whether the Respondent''s assessments are time barred under the provisions of section 25 (formerly section 23) of the Tax Procedure Code Act ("TPСА").

1. Background facts
The Applicant is a limited liability company whose principal business is the provision of hospitality services. On 6 January 2023, the Respondent issued two VAT administrative assessments for the periods May 2015 to August 2021 as follows:
a) Administrative default assessment amounting to Shs. 202,467,166.38 in respect of VAT for the period 1 May 2015 to 31 August 2021; and
b) Consolidated VAT assessment of Shs1,347,704,955.62 for the tax period 1 May 2015 to 31 August 2015.

The Applicant objected to the above assessments on the ground that the period May 2015 to December 2019 were barred by law under section 23 (2) (b) of the Tax Procedure Code Act (as it when was, now section 25 (2) (b)).

The Respondent maintained the assessments amounting to Shs. 306,960,700 in respect of the tax periods May 2015 – December 2019 on the ground that the Respondent reviewed information available in the Applicant''s withholding tax returns, which it alleged to amount to "discovery of new information".

The Applicant applied for review of the objection decision on the grounds that the assessments for the period May 2015 – December 2019 are time barred.

3. Issues for determination
The main issue for determination by this Tribunal is whether the assessments for the period May 2015 – December 2019 are time barred.

The Applicant''s first witness was Mr. Ntare Augustine, a Financial Controller of the Applicant. He testified that the Respondent issued an administrative default assessment against the Applicant amounting to Shs. 202,467,166.38 for the tax period of October 2015. The default assessment arose from non-declaration of VAT on imported services.

He stated that at objection, the Respondent vacated assessments for July 2018 to August, 2021 on the grounds that the services to which the assessments relate are exempt from VAT. However, the Respondent upheld the assessments for the tax period May 2015 – June 2018 on the ground that the Respondent had powers to issue assessments beyond the three year limitation period if they discover new information.

The witness testified that the Respondent, in their objection decision, stated thar the "review of information available in the Applicant''s withholding tax returns gives rise to new information." The witness further testified that all the necessary information to conclude a review of the Applicant''s VAT affairs, within three years as prescribed by law, was always in the withholding tax returns which had been filed by the Applicant and was in the custody of the Respondent.

Ms. Diana Zalwango, an officer of the Respondent was the Respondent''s sole witness. She testified that the Respondent carried out an audit of the Applicant covering the period 2015-2021. The Respondent issued assessments amounting to Shs. 1,347,704,955 on the basis that the Applicant made payments for imported services without charging VAT.

The Respondent partially allowed the Applicant''s objection, leaving an outstanding tax liability of Shs. 303,543,126. The witness testified that when the Respondent reviewed the Applicant''s withholding tax returns, it obtained new information which formed the basis of the assessments outside the three year period. Therefore, the tax was lawfully assessed.

4. The Submissions of the Applicant
The Applicant cited section 25 (2) which provides as follows:
"An additional assessment under subsection (1) may be made-
(a) at any time if fraud or any gross or willful neglect has been committed by or on behalf of the taxpayer, or new information has been discovered in relation to the tax payable by the taxpayer for a tax period;
(b) in the case of an additional assessment, within three years from the date service of the notice of the additional assessment; or
(c) in any other case, within three years after the date-
(i) the taxpayer furnished the self-assessment return to which the original assessment relates, or
(ii) the Commissioner served notice of the original assessment on the tax payer".

The Applicant submitted that following a strict interpretation of the provision, the determining factors for an additional assessment to be issued by the Respondent are:
(i) The Respondent discovered new information; and
(ii) The additional assessment was issued within three years from the date of service of the notice of the additional assessment.

"Within three years"
The Applicant submitted the above timelines, as provided for under section 25(2) (b) must be strictly adhered to. The Applicant cited the case of Cable Corporation V Commissioner General & Uganda Revenue Authority Civil Appeal 1 of 2011, in which case the learned Hon. Justice Christopher Madrama opined:
"Statutory time limits should be strictly adhered to in tax matters."

The Applicant submitted that on 10 January 2023, the Respondent issued as assessment for the period May 2015 to December 2019. This period spans over an eight year from 10 January 2023, which is the date of the assessment notice.

Discovery of new information
The Applicant cited the case of Langham V Veltema [2004] STC 544, which explains what qualifies as "new information" in tax matters. The case examined whether an officer of the Inland Revenue could issue an additional assessment based on new information discovered after the closure of an earlier inquiry. The court ruled:
"New information refers to any material change or additional facts that were unknown to the tax authority at the time of the original inquiry or decision."

The Applicant submitted that while the TPCA is silent on what amounts to "discovery of new information", the literal meaning should be applied. The Applicant cited the Black''s Law Dictionary, 9th edition at page 533 which defines the noun "discovery" to mean:
"The act or process of finding or learning something that was previously unknown".

The Applicant submitted that for new information to be discovered, such information must have been unknown before, missing or hidden from the Respondent. The Applicant stated that their tax returns were available to the Respondent between 2015 and the time when the additional assessments were issued. The Applicant submitted that during cross examination, the Respondent''s witness confirmed that no information was requested from the Applicant throughout the audit process but rather, all the information relied on was obtained from the Applicant''s tax returns in the Respondent''s e-system.

The withholding tax returns were in the custody of the Respondent and as such, the information was available to the Respondent and could not qualify as new information. Further, the Applicant submitted that the Respondent had three years to act or raise assessments based on this information, which it did not. The Applicant also submitted that the so called "new information" was never exhibited or presented before the Tribunal and that the Respondent did not provide any particulars of the new information at the hearing.

The Applicant cited Megha Industries Uganda Ltd V Uganda Revenue Authority, Application No. 32 of 2022, wherein the court held:
"In order for the tribunal to determine whether findings from an office the Auditor General (OAG) audit constituted new information, the audit report and findings must be presented before the tribunal... Only by reviewing this report could the tribunal assess whether the findings indeed amounted to new information."

The Applicant submitted that in the absence of such evidence, the Tribunal could not determine whether the additional assessment was issued in compliance with Section 25 (2) (a) of the TPCA. The Applicant therefore concluded by arguing that the assessments were unlawful and time barred and prayed that the assessment be set aside.

5. The Submissions of the Respondent
The Respondent submitted that it is not in dispute that the Applicant consumed imported services which attract VAT. The Applicant''s only contention is that the additional assessments were issued outside the three year limitation period provided for under section 25 (2) of the TPCA.

The Respondent submitted that the limitation period does not apply where there is fraud, gross or willful neglect or where there is discovery of new information. The Respondent further submitted that when they conducted an audit of the Applicant, they established that the Applicant only accounted for withholding tax on the imported services and grossly or willfully neglected or ignore to account for VAT.

The Respondent went on to submit that the audit carried out led to the discovery of the new information and the Applicant''s failure to account for VAT amounted to gross or willful neglect.

The Respondent cited the case of Uganda Electricity Transmission Co. Ltd v URA, Civil Suit No. 423 of 2010, where it was held that information discovered through an audit can qualify as "new information." The Applicant submitted that in the same case, the interpretation of "new information" is not restricted to what was not at the disposal of the Commissioner.

The Respondent submitted that whilst the Applicant filed withholding tax returns, the Respondent could only establish the fact of non-compliance by conducting an audit. The Respondent further submitted that the Applicant is responsible for correctly calculating their tax liability and that the Applicant''s failure to correctly account for the tax amounted to gross or willful negligence.

The Respondent relied on the Black''s Law Dictionary, 11th edition, which at page 1916 defines "willful" to mean voluntary and intentional. It also defines "neglect" at page 1244 to mean the failure to give proper attention to a person or thing, whether inadvertent, negligent or willful.

The Respondent submitted that by accounting for withholding tax and leaving out the corresponding VAT, the Applicant willfully neglected its compliance obligations. Therefore, the three year limitation period does not apply.

The Respondent relied on the case of Michael Ndichu v Commissioner, Domestic Taxes, [2023] KEHC 2594 where the Tax Appeals Tribunal of Kenya found that the taxpayer had willfully neglected to file its tax returns and as a result, it was lawful for the Kenya Revenue Authority to issue assessments outside the limitation period.

Regarding the Applicant''s submission that the Respondent did not produce evidence at the hearing pertaining to the new information, the Respondent submitted that the said withholding tax returns which the Respondent relied on were exhibited in the joint trial bundle on pages 25 – 78. The Respondent prayed that the application be dismissed with costs to the Respondent.

6. The Submissions of the Applicant in Rejoinder
In rejoinder, the Applicant challenged the Respondent''s reliance on Uganda Electricity Transmission Co. Ltd v Uganda Revenue Authority, Civil Suit No. 423 of 2010, whose facts the Applicant argues, are distinguishable from the current facts. The Applicant argued that in the above case, the defendant discovered new internal company documents which had not been provided by the plaintiff. The court held that the internal documents constituted new information. This is distinguishable from the present case as the Respondent was in possession of the Applicant''s tax returns and failed to review the returns within the statutory timelines.

The Applicant cited the case of Van Boeckel v Customs and Excise Commissioners [1981] STC 290, where Woolf J held:
"Tax authorities must exercise reasonable diligence in their investigations before issuing assessments. If the tax authority fails in this duty, whether through negligence or improper enforcement, the taxpayer cannot bear the consequences of that failure, provided the taxpayer has complied with disclosure requirements and acted in good faith."

The Applicant also cited Langham v Veltema [2004] STC 544 where the court clarified that "new information" must be:
"Something that was not previously disclosed or available to the tax authority at the relevant time"
The Applicant submitted that the Respondent had the duty to review the filed returns within a reasonable period of time and its failure amounted to negligence in exercising its mandate.

7. Determination by the Tribunal
Having read submissions from both parties, this is the decision of the Tribunal.

The Applicant is engaged in the provision on hospitality services including the provision of hotel accommodation, foods and beverages.

In 2015, while constructing hotel infrastructure, the Applicant consumed the services of non-resident persons, which constituted imported services. The services attract VAT at a rate of 18% and withholding tax at a rate of 15%. The Applicant only accounted for withholding tax and did not account for the VAT.

In 2023, the Respondent issued an additional assessment to the Applicant for the unaccounted-for VAT. The period of the assessment, 2015 – 2019, is outside the limitation period within which the Respondent can issue additional assessments. The limitation period is three years as prescribed by Section 25 (2) of the TPCA. In the present case, the period is 5-8 years, which is beyond the three-year limitation period.

The Applicant argues that the Respondent was time barred. The Respondent on the other hand argued that they were justified in assessing outside the three-year limited because they were within the exceptions to the three-year limitation period as provided for in Section 25 (2) (a). The exceptions include circumstances where the Respondent discovers new information or where the taxpayer is found to be fraudulent or grossly or wilfully negligent.

Section 25(2) of the TPCA provides as follows:
"An additional assessment under subsection (1) may be made-
(a) at any time if fraud or any gross or willful neglect has been committed by or on behalf of the taxpayer, or new information has been discovered in relation to the tax payable by the taxpayer for a tax period;
(b) in the case of an additional assessment, within three years from the date service of the notice of the additional assessment; or
(c) in any other case, within three years after the date-
(i) the taxpayer furnished the self-assessment return to which the original assessment relates, or
(ii) the Commissioner served notice of the original assessment on the tax payer".

Therefore, the question to be decided is whether, subject to the exceptions therein, the Respondent is barred from making a claim against the Applicant by the statute of limitation prescribed by section 25 of the TPCA.

What is a statute of limitations and what purpose does it serve?
A statute of limitation is the time period established by law during when the tax authority can review, analyze, and resolve a taxpayer''s tax-related issues.

The Black''s Law Dictionary, 10th Edition defines statute of limitation as a law that bars claims after a specified period.

Further, in an article "The Statute of Limitations in Tax Cases and Mistaken Advice by Officials", The Yale Law Journal, Vol. 61, No.7 (Nov., 1952) pp. 1214 – 1220, it is stated as follows:
"The statute of limitations on federal tax claims must balance conflicting equities of individual taxpayers and the public. Whenever the statute bars collection of a valid claim, the taxpayer receives a windfall at the public''s expense. On the other hand, if the government asserts tax claims many years after they arise, individuals who in good faith believed they owed no tax may suffer unreasonable hardship. Accordingly, congress has provided relatively short limitations period if the taxpayer files a proper return."

In other words, statutes of limitations, such as section 25 of the TPCA, are meant to restrict the period within which a tax authority may assert a claim against a taxpayer, who in good faith believed that they owed no tax.

In the present case, the TPCA restricts the Respondent''s ability to make such claims to within three years from the date the taxpayer filed their self-assessment return. In such cases, where a taxpayer has filed their tax return, the Respondent has until three years to make a claim against the taxpayer. The Respondent is not allowed to issue additional assessments beyond the 3 year limitation period except in exceptional circumstances which are set out in section 25 (2) of the TPCA.

The exceptional circumstances under which the tax authority may issue additional assessments beyond the three year limitation period
Section 25 (2) lists three circumstances under which the three year limitation period will be set aside:
(i) Where the tax authority discovers new information concerning the taxpayer''s declarations / tax position; or
(ii) If gross or willful neglect has been committed by the taxpayer; or
(iii) If fraud has been committed by the taxpayer;

Discovery of new information
The TPCA does not define the phrase "discovery of new information". Therefore, the phrase must be given its plain ordinary meaning as correctly stated by the Applicant (Crane Bank v Uganda Revenue Authority, Supra).

Further, one of the cardinal principles of interpretation of tax statutes is that tax statutes must be strictly interpreted. One has to look clearly at what is said and there is no room for intendment / assumptions (Cape Brandy Syndicates v CIR, 12 TC 366).

The Cambridge Online Dictionary defines the word "discover" to mean:
"to find information, a place, or an object, especially for the first time"

Further, it defines information to mean:
"facts about a situation, person, event, etc."

In effect, the phrase "discovery of new information" can be summed up to mean the finding of facts about a situation, a place or an object, especially for the first time.

The Applicant''s position is premised on the argument that the Respondent cannot allege to have discovered information when they were in possession of the Applicant''s withholding tax returns since 2015.

During cross examination, the Respondent''s witness testified that the Respondent did not request any information from the Applicant throughout the audit process. All the information that the Respondent relied on was obtained from the Applicant''s tax returns in the Respondent''s e-system.

The Applicant relied on the case of Langham V Veltema [2004] STC 544, which new information to mean:
"...any material change or additional facts that were unknown to the tax authority at the time of the original inquiry or decision."

On the other hand, the Respondent cited the case of Uganda Electricity Transmission Co. Ltd v URA, Civil Suit No. 423 of 2010 ("UETCL case"). In this case, the Plaintiff argued that the defendant can only lawfully exercise powers upon receipt of information which was not in its possession before revised assessments were issued.

However, the court rejected this argument and held that information discovered through an audit can qualify as "new information" and that "new information" is not restricted to what was not at the disposal of the Commissioner.

While, in principle, we agree with the above finding, it is important to distinguish the facts in the present case from the facts in the UETCL case.

In the UETCL case above, the Respondent carried out a comprehensive audit of the taxpayer and identified information contained in a third party document (the "connected thinking" document). In this case, several reconciliations had been happening in the background to ascertain the correct loss making position of the Applicant. At the time the third party report was submitted to the Defendant, the Applicant''s loss making position had not been defined with certainty.

The Hon. Justice Madrama stated:
"By February 2010, the issue of the tax affairs of the former Uganda Electricity Board and particularly the allocation of assets and losses remained pending.... The final conclusion on the issue was yet to be made. Secondly the "connected thinking" document required the issue to be finalised for all the three successor companies The "connected thinking document" clearly indicated that the issue of losses and allocation of assets was yet to be resolved by the defendant by August 2006.... the plaintiff cannot turn round and claim that the issue of losses or allocation of assets cannot be revisited by the defendant after its own proposal in the "connected thinking document" submitted after August 2006 to the defendant. The defendant could only have established all the material facts on losses and allocation of assets based on the "written down value of assets" after submission of the document dated August 2006, with ascertainment would be within time by August 2010".

On the other hand, in the present case, there was a definitive tax position filed by the Applicant as per their withholding tax returns. The returns had been in the Respondent''s position since 2015. The Respondent did not rely on any external or third party information as a basis for the assessment. They relied on information that was apparent from the Applicant''s filed withholding returns, which were available on the Respondent''s e-tax system. Section 25 places a duty on the Respondent to review taxpayers'' information and re-assess in a timely manner and not later than three years from the taxpayers'' self-assessment return.

Further, another distinction to make between the UETCL case and the current case is that in the UETCL case, the returns in question were for the period 2001 – 2004 before the Respondent introduced the e-tax portal. The tax portal was introduced in 2009 and It is now fourteen years since its introduction. The system which has been hailed as a success, having significantly eased the filing of returns by taxpayers and the review of the same by the Respondent.

The Respondent cannot now turn around and disown their own e- system that is used to store and access taxpayers'' returns and other information at the click of a button. It is not known why the Respondent took three years to review the Applicant''s withholding tax returns, which were at their disposal. However, it is the duty of the Respondent to ensure that tax is collected in a timely manner and where taxpayers have filed their tax returns, the review of the same should be done promptly, within the timelines set by the law.

Legislative intent regarding section 25 (2) of the TPCA
To further buttress the above, we found it necessary to consider the what the real intention of the Legislature was at the time when the TPCA was enacted. To this end, we turned to the Parliamentary Hansard to revisit the debate around section 25 (2).

The TPCA bill was extensively discussed and the extract below from the Hansard dated Tuesday, 16 September 2014 in respect of Section 25 (2).

"MR KAKOOZA: You know, when they are assessing taxpayers, for instance VAT for final year or VAT at the end of the financial year, they might not be able to find out the mistake you have caused at the beginning of the year so they give you a period of three years; URA can come back and say, please according to the details and the copies and the audited books of accounts and your importation documents, we are finding that there some additional assessments which we have to give you to pay taxes. That is why they have put it in three years which is B.

Then in sub clause 1 they are saying it might be you as a taxpayer; you did not give in the documents to verify that the tax assessments which are additional; you did it intentionally that is why they want to get you here. But what hon. Nandala-Mafabi is saying, if I gave you the documents and you did not do it, why should a penalty come to me when I gave you the documents. That is the question. So, the drafting should be different such that in case it was a not a problem from me as a taxpayer...

MR EKANYA: ... You see this clause is very serious. Sometimes ladies and gentlemen of URA make omissions, errors and negligence and then come back and say you did not furnish us the information and yet it is them who ignored it. They do sampling, and the error is as a result of their own omission. The taxpayer should not be penalised three years after. That is why they say, "You give me a bribe, I will ignore you tax liability". This causes bribery and fraud. We need a clause here to protect the taxpayer that if it was as a result of wilful negligence of a commissioner or a representative the taxpayer is protected from penal tax and interest.

MR NANDALA-MAFABI: Mr Chairman, there is what we call avoidance and evasion. Avoidance is legal; evasion is illegal. Here you have filed your returns very well giving all the information and you made your computation using the law. Now URA comes and says that they are issuing an additional assessment of Shs 60 million after 3 or 5 years. If this tax was due five years ago, you must pay interest and penal tax yet it was not wilful, fraud or anything like that. Also, you get somebody who is involved in fraud, wilful and is paying the same penal tax and interest. Why should you penalise me when you should have issued an additional assessment there and then and I pay the money...

THE DEPUTY CHAIRMAN: What about in a case where some information had been hidden and now has been discovered. I am talking about in this clause.

MR NANDALA-MAFABI: But Mr Chairman even with that we are making a mistake. The moment it is a fraud, it means there was information which was not declared.

THE DEPUTY CHAIRMAN: If it is not intentional, it is not fraud.

MR NANDALA-MAFABI: If you are saying it is not intentional then you cannot put it here.

THE DEPUTY CHAIRMAN: Yes, that is why it has to be here. It may not be intended that the information be kept away but it has just been discovered that we did not know about this and there is no fraud about that.

MR NANDALA-MAFABI: But, Mr Chairman, if you read very well this new information it is not segregating the one which is intentional and non-intentional. May be here the new information that has been discovered by the tax authority may not be intentional withheld.

MR KAKOOZA: Chair we need to redraft it because every taxpayer is registered and whatever importation you make, whatever goods and services you supply, are registered within the computers; all the documents you bring for assessment are known and you have them because that is your basis for tax assessment.

But you cannot come back after 3 years and say, “No I have discovered new information,” because you get all the documents from me. If it was your negligence, do not put a burden on me. For a business of three years, you know the computation and projection of profits that you have made. So, coming back in three years and say, "By the time I audited you, the documents I had...."

THE DEPUTY CHAIRMAN: Hon. Kakooza...the new information that they are talking about is the one that has been discovered in relation to the tax payable by the tax payer for the tax period and this means that the information was not with URA and they have just discovered it from the tax payer. Please.

MR KAKOOZA: If that is it, then for that period that you have discovered, do not put interest on me because I furnished all the documents with you and my projections in my documents are clear.

THE DEPUTY CHAIRMAN: You do not discover documents that are with you..."

The above extract from the Hansard shows that the intention of section 25 (2) of the TPCA was to:
(i) Ensure that the Respondent can raise a claim against taxpayers who withhold information from the Respondent or who are negligent or fraudulent;
(ii) Protect and not burden taxpayers who have been diligent in filing their returns and providing all the necessary information to the Respondent by capping the time within which an additional assessment can be raised to three years;
(iii) Place a duty on the Respondent to review taxpayers'' returns in a timely and efficient manner.

Therefore, with regard to exception concerning discovery of new information, we agree with the Applicant that in the circumstances, the Respondent did not discover any new information. The Respondent could not have "discovered" information that was apparent on the taxpayer''s returns since 2015. This information was not hidden or concealed from the Respondent. The Respondent ought to have reviewed the returns within the three year period and did not.

Gross or willful neglect
The second exception to the three year statute of limitation is cases where the taxpayer has committed gross or willful neglect. Willful neglect is a deliberate or intentional failure to perform a legal duty, essentially meaning someone knowingly chooses not to do something they are required to do.

The Black''s Law Dictionary, 10th Edition defines neglect as follows:
"neglect'' indicates...that a person has not done that which it was his duty to do"

It goes on to define willful neglect to mean:
"intentional or reckless failure to carry out a legal duty..."

Uganda operates a self-assessment regime. This places a legal duty on the taxpayer to ensure that their tax declarations are accurate and complete.

In the present case, the Applicant purchased services of non-resident persons during the construction of hotel premises. The Applicant only accounted for 15% withholding tax and did not account for 18% VAT on imported services. The question that we must address is whether this omission was intentional, reckless or was an honest / unwilful mistake.

The Applicant was assessed VAT consolidated VAT assessment of Shs. 1,347,704,955 for the tax period 1 May 2015 to 31 August 2015 which was reduced to Shs. 306,960,700. The VAT liability arose from the purchase of certain services from non-resident persons during the construction of a hotel.

We cannot determine with precision the value of entire investment in the hotel project. However, the assessed VAT amount of on imported services of Shs. 306,960,700 translates into a purchase price of Shs. 1.7 billion for the services that gave rise to the VAT liability. Therefore, one can reasonably conclude that the entire investment in the hotel construction project must have been quite significant, to the tune of several billion shillings.

Therefore, judging by the above value of the services and the level of investment, what level of care would a reasonable person have exercised under the circumstances?

In Commissioner of Domestic Taxes v Airtel Networks Kenya Limited (Income Tax Appeal E062 of 2022) [2023] KEHC 25059, the court observed:
"On what amounts to gross or wilful neglect, it would be instances where there is proof of an intentional gross deviation of what is reasonably accepted on the part of the taxpayer."

A reasonable person making such a significant investment in the construction of a hotel would have carried out financial modelling to determine the impact of taxes on the future profitability of the investment. In the present case, services from non-resident persons attract 15% withholding tax and 18% VAT, bringing the total impact of the two taxes to 34%. An investor in a hotel project of the kind constructed by the Applicant cannot claim ignorance of a tax impact of 34% on their investment. This impact is too large to be ignored. If the Applicant did not carry out a financial modelling, which is highly unlikely, then that was reckless of them.

The only inference that can be drawn from the above is that the Applicant had full knowledge of both their VAT and withholding tax obligations in respect to the hotel project and did not account for VAT, perhaps, in the hope that the discovery would never be made or would be late as is the case here. VAT on imported services goes hand in hand with withholding tax on payments to non-residents. However, withholding tax returns were filed without the corresponding VAT returns.

In the case of Michael Ndichu v Commissioner of Domestic Taxes, (Income Tax Appeal E064 of 2021) [2023] KEHC 2594 (KLR), the court found the taxpayer willfully negligent for having failed to file their tax returns. The court held that the taxpayer had an obligation to file their returns and their failure to file amounted to willful neglect.

Therefore, on the balance of probabilities, we are not convinced that the Applicant''s omission was an honest mistake. Consequently, we find that the Applicant''s failure to account for VAT on imported services, while accounting for the corresponding withholding tax amounted to willful neglect.

The Applicant is liable to pay the tax assessed and the application is dismissed with costs to the Respondent.

Dated at Kampala this 13th day of February 2025.', 'This ruling from the Tax Appeals Tribunal (TAT) in Uganda provides crucial clarity on the ''discovery of new information'' and ''willful neglect'' exceptions to the three-year tax assessment limitation period under Section 25(2)(a) of the Tax Procedure Code Act (TPCA). The key takeaway for tax practitioners is that simply filing withholding tax returns, even if they contain information that *could* lead to a VAT assessment, does not automatically protect a taxpayer from assessments beyond the three-year limit if there''s evidence of willful neglect in accounting for other related taxes. The Tribunal emphasized that URA has a duty to review returns timely, but taxpayers also have a duty to ensure accurate and complete declarations. The main risk highlighted is that a taxpayer''s omission of a significant tax liability, especially when a related tax (like WHT) was declared, can be construed as willful neglect, allowing URA to assess beyond the statutory period.

*   **Key Practical Lessons:**
*   Taxpayers must ensure comprehensive and accurate tax declarations across all tax types.
*   The ''discovery of new information'' exception requires information that was genuinely unknown or unavailable to URA.
*   ''Willful neglect'' can be inferred from significant omissions, particularly when related tax obligations are partially met.', '2026-07-04 15:35:04.586911+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('41324fa0-22c7-4dab-9de3-e48bb0bc7170'::uuid, 'APPLICATION NO. 218 OF 2022', 'VERMA COMPANY LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'VAT', 'Allowed', 'The Applicant challenged additional VAT assessments by URA, arguing that inter-branch stock transfers were wrongly treated as taxable sales. The Tribunal found that the Applicant provided sufficient evidence, including detailed stock movement records and FDN-linked e-invoices, to reconcile stock movements with declared sales. The Tribunal ruled that inter-branch transfers within a single legal entity are not taxable supplies and that EFRIS requirements for reporting stock transfers were not in force for the audit period. Consequently, the additional VAT assessments were set aside.', '55. On the other hand, the Applicant asserted that the assessments rested on a mischaracterisation of ''stock issued'' as sales. It maintained that those movements were inter-branch transfers within a single legal entity and that sales were recorded upon sale to customers. The Applicant went ahead to produce registers/GRNs, bike delivery registers with chassis/engine/registration numbers and FDNs, and sample invoices/delivery notes tracing items into VAT returns; and highlighted that, after Tribunal directed verification in 2025, the Respondent acknowledged the bikes presented as transfers were eventually sold and declared.
56. The Tribunal noted that, because the pleaded basis was ''undeclared sales'', the Respondent had to particularise transaction-level omissions for the review months. The post-audit pivot to ''expected sales'' and the late inclusion of spares, without segregation or reassessment, cannot retrospectively broaden the dispute beyond the objection decisions. On the record, the pleaded undeclared-sales basis was not maintained coherently through reconciliation.
57. During the hearing, the Tribunal asked the Applicant to demonstrate the applicability of closing stock and opening stock. Upon demonstration by the Applicant''s witness, the Tribunal noted that this issue, as alleged by the Applicant regarding the stock of motor bikes, was verifiable.
Inter-branch movements vs taxable supplies
58. The Respondent equated ''stock issued to branches'' to sales and argued that, in the absence of transfer traces in EFRIS for the period, these movements were not mere internal transfers. The Applicant''s centralised model and evidence (registers/GRNs, delivery notes, FDN-linked e-invoices) demonstrate that movement to a branch did not of itself effect a taxable supply; rather, VAT was declared upon sale to customers. A sample highlighted in testimony shows an invoice dated 29 Sep 2021 with delivery in Oct 2021, which explains the timing differences while remaining within the review period.
59. The Tribunal therefore notes that, inter-branch transfers within a single legal person are not taxable supplies. The Applicant''s primary records credibly link stock movements to later sales appearing in VAT returns. Critically, when pressed for bike-by-bike exceptions (chassis/FDN/registration) for Oct 2021 to Jan 2022, the Respondent''s counts oscillated, that is, from 11,603 missing bikes to 6,957 missing bikes and later to 115, and, after verification, it acknowledged the bikes presented as transfers were sold and declared. On a balance of probabilities, the undeclared-sales thesis is not sustained.
EFRIS obligations and timing
60. In a bid to resolve this, the Respondent invoked EFRIS expectations to question inter-branch transfers; however, URA''s own public communication that ran on 20 May 2022, on the Respondent''s website, places enforcement for domestic goods in transit and route sales from 1 June 2022. The review period in question ended in January 2022. The Tribunal does not retrospectively impose those expectations to re-characterise Oct 2021-Jan 2022 movements as taxable supplies.', 'This ruling provides crucial clarity for Uganda tax practitioners regarding the treatment of inter-branch stock transfers for VAT purposes. The key takeaway is that internal stock movements within a single legal entity are not considered taxable supplies until an actual sale to a customer occurs. This decision also highlights the importance of URA''s audit methodology being precise and consistent, and that taxpayers can discharge their burden of proof by providing verifiable primary records, even if the assessing authority struggles to produce a coherent transaction-level counter-schedule. Practitioners should note the Tribunal''s stance on the retrospective application of EFRIS requirements, emphasizing that compliance obligations are not imposed for periods before their effective date.

*   **Clear Takeaway:** Inter-branch stock transfers are generally not taxable supplies for VAT purposes.
*   **Main Risk/Precedent:** URA must demonstrate clear, transaction-level undeclared sales, not just ''expected sales'' variances, and cannot retroactively apply new compliance requirements.
*   **Relevant Acts/Sections:** Section 4(1) and Section 18 of the VAT Act (on taxable supplies), Section 26 of the Tax Procedures Code Act (burden of proof), Section 18 of the Tax Appeals Tribunal Act (burden of proof), Section 123 of the Income Tax Act (interest on refunds).', '2026-07-04 16:17:38.075512+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('4590a190-ed06-494d-b59b-ed7124eb57c7'::uuid, 'TAT APPLICATION NO. 73 OF 2023', 'PREMIER RECRUITMENT LIMITED VERSUS UGANDA REVENUE AUTHORITY', 2025, 'VAT', 'Allowed', 'The Applicant, a labour recruitment company, claimed a VAT refund for services provided to foreign clients, arguing these were zero-rated exports. The Uganda Revenue Authority (URA) reclassified these services as standard-rated domestic supplies, leading to a significant VAT assessment and rejection of the refund claim. The Tribunal ruled that the labour recruitment services were indeed exported services, consumed outside Uganda, and therefore zero-rated, setting aside the URA''s assessment and ordering the full refund of input tax credit.', 'This ruling, is in respect of an application, challenging the reclassification by the Respondent, of the supply of labour recruitment services by a Ugandan based company, to foreign based clients.

1. Background
The Applicant, a company, incorporated in Uganda, specializes in labour recruitment for local and foreign clients. In the year 2022, the Applicant made a claim for a VAT refund of Shs. 191,122,281. Pursuant to the above claim, the Respondent conducted an audit on the Applicant. Following the audit the Respondent reclassified the supply of labour recruitment services by the Applicant, to its foreign-based clients, from zero-rated exports to standard rated supplies and issued a VAT assessment of Shs. 1,225,954,437 which was later revised to Shs. 1,406,238,422.39. The Respondent also rejected the Applicant''s Input VAT refund claim and upon objection, the Respondent disallowed it on 27 April 2023. Hence this Application.

2. Issues
At the scheduling, the following issues were set down for hearing.
1. Whether the Applicant is entitled to the VAT refund claimed?
2. Whether the Applicant is liable to pay the tax assessed?
3. What remedies are available to the parties?

Applying the provisions of Paragraph 1(a) and 2(b) of Schedule 4 to the VAT Act, to the facts of our case, we find that the labour recruitment services were exported services and are for that reason, zero-rated.

It is hereby ORDERED as follows;
1. This Application is allowed with costs.
2. The assessment of Shs. 1,406,238,422.39 for the period 1/1/2018 to 31/07/2022 is hereby set aside.
3. The sum of Shs. 191,122,281 being the Applicant''s claim for input tax credit, made in the year 2022, will be paid in full by the Respondent.', 'This ruling is a significant win for Ugandan labour recruitment agencies serving foreign clients, clarifying the VAT treatment of their services. The Tribunal''s emphasis on the ''destination principle'' and the actual consumption of services abroad, as codified in Paragraph 2(b) of Schedule 4 of the VAT Act and Regulation 12 of the VAT Regulations, provides crucial guidance. Tax practitioners should advise clients in similar industries to meticulously document evidence of services being used or consumed outside Uganda to support zero-rating claims. The case also reinforces that URA''s business policy guidance cannot override statutory provisions.

Key practical lessons:
* Document foreign consumption: Ensure robust evidence that services are consumed outside Uganda.
* Challenge policy over law: URA policy guidance does not supersede the VAT Act.
* Burden of proof: While the taxpayer must provide initial evidence, the URA has a duty to verify third-party declarations.
* Input tax credit: URA cannot reject input tax credit solely because third parties have not remitted VAT, provided the taxpayer has proof of payment.', '2026-07-04 15:55:01.348351+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('45c248a0-edfa-4ffd-9cc2-3a7380ef399d'::uuid, 'TAT APPLICATION NO. 103 OF 2022', 'JAVA HOUSE COFFEE SHOP UGANDA LIMITED (JHCSUL) v UGANDA REVENUE AUTHORITY', 2026, 'Income Tax | VAT', 'Partial', 'The Applicant challenged URA''s reclassification of a shareholder loan of Shs. 3,163,834,930 as income and the denial of an input VAT claim. The Tribunal upheld URA''s recharacterization of the unsupported loans as income due to insufficient documentation from the Applicant regarding the loan''s authenticity and the transfer of liabilities from a predecessor company. However, the Tribunal allowed the input VAT claim for construction and refurbishment services, finding that the Applicant provided credible evidence of receiving and paying for these taxable supplies.', 'This ruling is in respect of an application challenging an assessment arising from the Respondent''s reclassification of a shareholder loan of Shs. 3,163,834,930 as income and a denied input VAT claim.

The Applicant is a subsidiary of Java House Mauritius and has been operating Java House Restaurants and Coffee Shops in Uganda since July 2014. The Respondent conducted an audit of the Applicant''s tax affairs for the period July 2014 to June 2020 and issued a VAT assessment totalling Shs. 2,643,988,314 arising from input credit disallowed and the undeclared income.

The Applicant incurred VAT on the construction and refurbishment of its branches at Grand Imperial, Shell Lugogo, Acacia Kisementi, Shell Jinja, Imperial Mall Entebbe, and Gapco Shop Kamwokya. The Contractor undertaking the construction was called Sarova International Builders Uganda Limited (SIBUL), which issued invoices marked AE16-AE22 of the Joint Trial Bundle.

6. According to the Applicant, after taking over Java Coffee and Tea Limited (JCTL) in 2015, it executed a shareholder loan agreement with the parent company in 2016 (AE8 of the Joint Trial Bundle). The total shareholder loan amounted to Shs. 16,506,644,639. During the audit, the Respondent verified Shs. 13,334,807,709 leaving Shs. 3,163,834,930 as unsupported, which the Respondent treated as undeclared sales.

7. According to the Respondent, the Applicant failed to adduce any documentation to illustrate how the purported loans were received, transferred, or utilised. However, after mediation, the tax liability was reduced to Shs. 935,250,774, which is the disputed amount before the Tribunal.

94. In the circumstances, the Tribunal orders as follows:
(i) The income tax and VAT assessments that arose from the treatment of the unsupported loans as income are hereby maintained.
(ii) The Respondent should refund the Applicant the input VAT of Shs. 237,369,865.
(iii) Interest on the refundable amount in (ii) above should be computed in accordance with the provisions of section 34 of the VAT Act.
(iv) 75% of the costs of this Application are hereby awarded to the Respondent.', 'This ruling underscores the critical importance of meticulous record-keeping and clear documentation for all financial transactions, especially inter-company loans and business transfers, to avoid adverse tax recharacterizations. Taxpayers, particularly multinational entities, are expected to maintain robust financial records to substantiate their tax positions. The Tribunal''s decision to uphold the recharacterization of unsupported loans as income highlights URA''s powers under Section 91 of the Income Tax Act and Section 47 of the Value Added Tax Act to recharacterize transactions where documentation is lacking. Conversely, the successful input VAT claim demonstrates that even with initial discrepancies, sufficient credible evidence can lead to a favorable outcome for taxpayers regarding VAT credits under Section 28 of the VAT Act.

Key practical lessons:
* Maintain comprehensive documentation for all loans, especially shareholder loans.
* Ensure clear agreements and resolutions for business transfers and liability assumptions.
* Reconcile payments with invoices meticulously to support input VAT claims.', '2026-07-04 15:24:41.096926+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('45efd14b-0048-4abc-84c9-4827e98ab305'::uuid, 'TAT No. 185 of 2025', 'ECOBANK UGANDA LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'Income Tax | VAT', 'Partial', 'Ecobank Uganda Limited challenged URA''s additional assessments for withholding tax and VAT on payments made to VISA International for payment processing services. The Tribunal found that the payments to VISA International were subject to withholding tax under Section 84 of the Income Tax Act as income derived from a Ugandan-source services contract, and that Ecobank was the payer. However, the Tribunal ruled that the services provided by VISA International, being integral to financial transactions, were exempt from VAT under Section 19(1) and Paragraph 2(b) of the Second Schedule to the VAT Act.', '1. This ruling is in respect of an application challenging the Respondent''s objection decision confirming additional assessments of withholding tax and Value Added Tax of Shs. 225,843,363.
...
55. Visa charges transaction fees for its payment facilitation services. It is these very fees that are at the heart of this dispute, specifically whether they are subject to withholding tax and VAT.
56. We shall address each tax head separately.
Withholding tax
57. The Applicant has argued that the transaction fees are outside the scope of withholding tax since they are neither management fees nor royalties under section 82 of the ITA. In addition, the Applicant stated that transaction fees are paid by its customers and that the bank is merely an intermediary. Therefore, the withholding tax obligation, if any, lies with the customers.
58. On the other hand, the Respondent has argued that the fees are taxable under section 84 of the ITA, which deals with income derived from a Uganda-source services contract.
...
72. It is clear from the above steps that at all material times, the Applicant is working together with Visa to settle the payments. At no point does the end customer interface with Visa. It is clear that the person paying the transactional fees for the purposes of S. 137(1) of the ITA is the Applicant, not the customer. Therefore, the Applicant was duty-bound to withhold tax, which they did not.
73. We therefore find that the Respondent was justified in assessing the additional tax.
Value Added Tax
74. The Respondent imposed VAT on the grounds that the transactional fees and charges are payments for imported services, which are liable to VAT in accordance with section 4 (2) of the VAT Act. The Respondent supports this assertion by citing Visa''s non-resident status, as it is a foreign-based entity.
75. On the other hand, the Applicant contends that the visa charges fall within the scope of financial services, which are exempt from VAT under section 19 of the VAT Act.
...
87. Consequently, the Applicant succeeds on the VAT point.
...
89. In the present case, the Tribunal''s finding is that:
(i) The withholding tax assessments were properly raised;
(ii) The VAT assessments are incorrect and cannot be sustained.
Orders
90. In view of the above, the Tribunal makes the following orders:
(i) The withholding tax assessment is upheld.
(ii) The VAT assessment is hereby set aside.
(iii) Each party shall bear their own costs.', 'This ruling clarifies the tax treatment of fees paid to international payment networks like VISA. Tax practitioners should note that while such payments are generally subject to withholding tax under Section 84 of the Income Tax Act as services sourced in Uganda, the associated services are likely exempt from VAT under Section 19(1) and Paragraph 2(b) of the VAT Act, provided they constitute integral financial services. The Tribunal emphasized the functional nature of financial services for VAT exemption, aligning with European Court of Justice precedents.', '2026-07-04 09:41:19.490453+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('46fcca74-7a7a-44d5-8c83-879f134f6f3a'::uuid, 'TAT APPLICATION NO. 10 OF 2024', 'SCOVIA GATETE SANYU v UGANDA REVENUE AUTHORITY', 2026, 'VAT', 'Dismissed', 'The Applicant, a landlord of commercial properties, claimed input VAT on utility bills (water and electricity) which the Respondent (URA) disallowed, arguing that the utilities were for the tenants'' businesses, not the landlord''s, and that third-party declarations could not be verified. The Tribunal dismissed the application, finding that the utilities were primarily for the tenants'' business use, even if the landlord paid the bills to avoid disconnections, and therefore the input tax credit was not allowable to the landlord.', 'The Tribunal notes that this dispute revolves around one issue; whether the utilities were put to business use by the Applicant or its tenants. The Applicant offers commercial property to many business men/women by dividing each floor into outlets to rent. The commercial building will have no value and remain with no value when not occupied. These rooms are rented and the business persons put in their merchandise for sell. The issue is who puts these utilities to use. The Landlord in this case the Applicant or the Tenants.

The Tribunal imagines who among the two will raise an alarm if the Tribunal walks into these buildings and puts off the lights or switches off the water of the building.

In the affidavit of Mr. Mukasa, he depones that the Respondent visited the buildings 2 times but in the Affidavit of Mr. Kisoro or the submissions of the Respondent, nothing is mentioned on any information on utilities from the Tenants.

International Standards on auditing guides auditors to do their work diligently and one of the key aspects is to circularize while doing their work for proper reporting. The Respondent visited the Applicant businesses twice where tenants carry out their businesses but only stopped at checking out the meter numbers and sequences without asking the tenants who operate the businesses there how they pay and who pays for the utilities. Both parties are silent on this crucial information from the horses'' mouth. If these rooms remain with no light, the public or buyers will not be attracted to the merchandise. So, the businessmen put in light to their satisfaction and decoration to attract buyers. If the business man does not attract the buyers, he or she will have no use to rent these rooms.

In "H" attached to the affidavit for Mr. Kyambadde, paragraph 1 reads: "that the land lord is the registered and lawful proprietor of the property comprised in Plot 24, Mackay Road, Kampala and all of the developments, fixtures and fittings there on the premises. The paragraph states that, "The land lord is desirous of letting the property of the premises to the tenant and the tenant is desirous of renting the same from the landlord up on the terms and conditions herein contained".

Paragraph 4 (d) provides:
"the tenant hereby covenants with the landlord to pay or cause to be paid and discharged all electricity charges incurred during the term hereby created and for any period over and above the said period during which the tenant remains in occupation of the premises whether with or without the landlord authority".

Paragraph 5 (a) states that "the landlord hereby covenants with the tenant as follows: To clear and or take responsibility for all the outstanding utility bills including as applicable but not limited to electricity, water and Sewage and telephone touching on the premises as let to the tenant that were incurred before the commencement of the term of this tenancy and that should there be a disconnection of the said utilities owing to non-payment by the landlord herein above obliged, the expense incurred upon re-connection of the same shall be borne by the landlord".

This is clear that the landlord will meet the unpaid bill of any utility should there be any disconnection of the utility due to non-payment. It is mentioned in the agreement that it happens when the tenant leaves the outlet with pending bills. No new tenant would take the outlet for business when electricity has been connected. The electricity and water (utility) used is for the use in the business of the tenant.

The landlord put up a commercial property and leaves the rest to the tenants and the tenants are the ones who put the light to use by putting light in their shops, so that the merchandise is seen by the shoppers and the shop keepers use the lights to decorate the shop to attract customers.

The tenants are the ones who use the water to clean their shops, and a toilet as a place of convenience for a nature call or that of their customers. The shop keepers sit all day in the shops, eat and drink thus using water for washing and convenience. In most times to access the toilet the user of these convenience places go through a person who collects money from them and this person would deny access to those who do not part with the coins. These people use the money to clean up the place and pay for the water. This money comes from the shop attendants, not the landlord.

So, whether the electricity or water may be paid for by the landlord or their managers who manage and supervise the building, this money is raised by the tenants and the tenants are the ones who put the supply of electricity and water to their business use.

In rejoinder, the applicant clarifies that in the present matter, the bills are borne and paid for by the Applicant/landlord. In so many commercial properties, the landlord charges service charge to the tenants which the landlord uses to pay for common area usage. The Applicant narrates that when it leaves the bills to the tenants to pay, the tenants never pay or pay on time which leads to disconnections and business interruptions. The Tribunal asks itself that whose business is interrupted, that of the landlord or the tenant? The landlord puts up a building and, in most cases, may be residing elsewhere when electricity is off, the land lord''s business of renting the outlet continues when the shop keeper''s (tenant''s) business is in darkness and no customer would enter his shop for failure to see the merchandise. So, the electricity is put to use by the shopkeeper. In so many commercial buildings and apartments, service charge and its treatment is mentioned in the tenancy agreement. In this present case, there was no service charge mentioned.

In the same rejoinder, the landlord states that it bills the tenants a consolidated amount which includes utility costs and rent. However, it is stated in paragraph 5(a) of the Tenancy Agreement that the landlord hereby covenants with the tenant to clear and or take responsibility for all outstanding utility bills including as applicable but not limited to electricity, water and sewerage and telephone touching on the premises as let to the tenant that were incurred before the commencement of the term of this tenancy AND THAT should there be disconnection of the said utilities owing to non-payment...... the expense incurred upon re-connection of the same shall be borne by the landlord.

This means that there are utility bills paid by the landlord (Applicant) before tenants'' occupancy of the building and utility bills unpaid by a tenant who has vacated the building or property.

The Applicant had a duty to separate such bills and to inform the Respondent when the Respondent visited the properties. This input tax credit ought to have been credited to the Applicant. Similarly, both parties did not mention the electricity that is incurred when the tenants/shopkeepers close their shops and go home at night and during holidays and weekends.

This the Tribunal is not to look into it since it was not raised by the Applicant on how it is treated and to whose benefit it is. This clearly shows that the utility bills are paid by the tenants. Paying through the bank does not show business use in this context. The agent of the landlord may collect the money for utilities and pay it into the bank.

The Applicant reiterated that the Respondent did not make any effort to verify with National Water and Sewerage Corporation or UMEME to ascertain whether the Applicant paid or never paid these utilities. The issue is not on payment, but business use. Who puts the utilities to business use in this case. It is the tenant not the landlord. Although some utility accounts remained in the previous owner''s name, this is merely a matter of form.

Our focus is on who put the utilities to business use. Even though the Utility companies declared the output tax, the corresponding input tax from the Applicant was not put to use by the Applicant. The Applicant accepted that some of its input tax was not in its name but in the names of Mr. Mabirizi the former landlord. The Applicant cannot claim the corresponding input tax to the output tax when the Applicant never put this input tax to its business use. The Applicant transferred the use in business when it contracted the tenant after putting up the property to use in form of rent but not operating the shop/outlet itself.

The Tribunal will allow input tax credit where:
(i) the supplier of goods or services was a VAT-registered person;
(ii) A registered person put to use the utility services whether used wholly or partly for business use.

The Tribunal would look at who uses the utilities of commercial properties before spacing for public use and who uses the utilities in conducting business after opening to public use and how the issue of common use is treated in the agreement/real use.

Taking the above in consideration, the Respondent was justified to deny the input tax credit of Shs. 171.868,138 to the Applicant. The Respondent was justified to raise the additional Assessment which has been reduced to this amount.

In the circumstances, I dismiss this application with costs to the Respondent.', 'This ruling underscores the ''use in business'' principle for input VAT claims under Section 28 of the VAT Act, Cap. 344. The key takeaway for tax practitioners is that merely paying for an expense, even if it facilitates one''s business (like a landlord paying utilities to prevent disconnections), does not automatically entitle one to input VAT credit if the ultimate ''business use'' is by a third party (the tenants). The Tribunal emphasized the ''substance over form'' principle, but in this case, it worked against the Applicant, as the economic benefit and direct use of the utilities were attributed to the tenants. This creates a significant risk for landlords who adopt all-inclusive rental models without clearly structuring the utility charges to reflect the landlord''s direct business use or ensuring proper documentation for input tax claims.

Key practical lessons:
*   **Direct Business Use:** Input VAT is creditable only if the goods/services are used wholly or partly in making the taxable person''s own taxable supplies.
*   **Substance Over Form:** While important, this principle can cut both ways; the Tribunal will look beyond who nominally pays to who actually benefits and uses the supply in their business.
*   **Documentation:** Even with proof of payment, the nexus between the expense and the claimant''s direct taxable supplies must be clearly established.', '2026-07-04 15:58:38.58124+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('54b65085-fd68-4dc7-baa3-eea4e54f65ac'::uuid, 'APPLICATION NO. 29 OF 2024', 'MADA HOLDINGS (U) LTD v UGANDA REVENUE AUTHORITY', 2025, 'VAT', 'Dismissed', 'The Applicant challenged a VAT assessment, but the Respondent raised a preliminary objection that the application was time-barred. The Tribunal found that the Applicant filed its application significantly beyond the 30-day statutory period from the objection decision date. The Tribunal dismissed the application, upholding the preliminary objection and ordering the Applicant to bear the costs.', 'This ruling is in respect of preliminary objection that the Application is time-barred

1. Background
On 18th November 2022, the Respondent issued an Administrative Additional
Assessment in respect of VAT for the period 01/10/2015 to 31/10/2015 amounting to Shs.
27,971,885. The Applicant objected to this assessment on 6th December 2022. On 25th
February 2023, the Respondent issued its objection decision disallowing the Applicant''s
objection. On 22nd February 2024, the Applicant lodged this application for review before
the Tax Appeals Tribunal, claiming to have received the Respondent''s objection decision
on 10th January 2024, although the same is dated 20th September 2023. The
Respondent contends that this Application has been lodged outside the statutory period
and is therefore time barred.

5. Respondent''s submissions on the preliminary objection
Counsel for the Respondent submitted that under Section 16(1)(c) of the Tax Appeals
Tribunal Act (TAT Act) an application for review of a taxation decision must be lodged
with the Tribunal within 30 days after being served with the notice of the Respondent''s
objection decision.

The Respondent referred the Tribunal to the decision in Uganda Revenue Authority v.
Uganda Consolidated Properties Ltd, Court of Appeal Civil Appeal No. 75, where it
was held that timelines set by statutes are matters of substantive law and must be strictly
complied with. Consequently, the application should be dismissed as being time-barred.

The Respondent submitted that objection decision in this case was issued on 25th
February 2023, and the Applicant had until 27th March 2023 to file an application. The
current application, lodged on 22nd February 2024, was, therefore, time-barred.

This Tribunal finds that the objection decision in this matter is set out in Objection Decision
Notice number 30582562 dated 25 February 2023. The Applicant''s claim that they
received the objection decision on 22nd February 2024 is based on their interpretation of
events, including a letter dated 20th September 2023 and sent on 10th January 2024.
Even in that letter itself, the Respondent maintained that the objection decision dated 25
February 2023 has not been varied. Besides since that letter is marked "Without
Prejudice" it is precluded from being presented as evidence in legal proceedings. A party
cannot rely on a letter marked "without prejudice" to support an application in the Tribunal.

Therefore, the Tribunal finds that 25 February 2023 is the correct date from which the
statutory timeline for the Applicant to file an application for review is calculated.
Consequently, the Applicant ought to have filed its application to the Tribunal by 27th
March 2023.

We concur with the Respondent''s submission that statutory timelines must be adhered to
strictly. Consequently, we determine that the Applicant''s application for review, filed on
February 22, 2024, is time-barred under Section 16(1)(c) of the TAT Act. The Tribunal is
unable to entertain an application submitted more than six months after the objection
decision.

In light of the foregoing considerations, the Tribunal rules as follows:
1. The preliminary objection raised by the Respondent is upheld.
2. The Applicant''s application for review is dismissed as being time-barred.
3. The Applicant shall bear the costs of the Respondent.', 'This ruling serves as a critical reminder for Uganda tax practitioners regarding strict adherence to statutory timelines for lodging applications with the Tax Appeals Tribunal. The Tribunal emphasized that timelines under Section 16(1)(c) of the Tax Appeals Tribunal Act are matters of substantive law and must be strictly complied with. The case also highlights the inadmissibility of ''Without Prejudice'' communications as evidence to support an application, reinforcing the importance of formal communication and clear record-keeping. Practitioners must ensure that clients understand the strict deadlines and the implications of late filings, as the Tribunal cannot entertain applications submitted more than six months after the objection decision.

*   Strictly adhere to the 30-day deadline for filing TAT applications from the date of receiving the objection decision.
*   ''Without Prejudice'' communications are generally inadmissible as evidence in legal proceedings.
*   Ensure clear and verifiable proof of the date of receipt of URA''s objection decision.', '2026-07-04 15:46:38.749261+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('5bd8ad0a-1af8-4d19-97d4-946032f8c35d'::uuid, 'TAT No. 021 of 2025', 'Ebenezer Nursery, Primary & Secondary School v Uganda Revenue Authority', 2025, 'Jurisdiction', 'Dismissed', 'The Applicant, Ebenezer Nursery, Primary & Secondary School, filed an application for review of an income tax assessment over four years after the objection decision was issued. The Respondent, Uganda Revenue Authority, raised a preliminary objection that the application was time-barred. The Applicant argued for an extension of time citing the COVID-19 pandemic, the director''s illness, and lack of guidance. The Tribunal dismissed the application, finding the delay inordinate and the reasons provided insufficient to justify the extreme delay, emphasizing strict adherence to statutory timelines.', 'THE REPUBLIC OF UGANDA
IN THE TAX APPEALS TRIBUNAL OF UGANDA
TAT APPLICATION NO. 021 OF 2025
EBENEZER NURSERY, PRIMARY & SECONDARY SCHOOL....................APPLICANT
VERSUS
UGANDA REVENUEA AUTHORITY.........................................................RESPONDENT
BEFORE: MS. CRYSTAL KABAJWARA, MS. PROSCOVIA REBECCA NAMBI,
MS. ROSEMARY NAJJEMBA
RULING
This ruling is in respect of a preliminary objection raised by the Respondent that the
Applicant filled this application out of time.
1. Background Facts
The Applicant is a provider of education services. On 29 January 2020, the Applicant was
issued with additional income tax assessments for the period July 2017 to June 2018
amounting to Shs. 677,385,918 on the basis of failure to support a related party loan of
Shs. 2,257,953,059.
The Applicant objected to the assessment on the ground that the Shs. 2,257,953,059 was
not a loan but accumulated retained earnings of the school since 2007 when it was
opened. On 1 May 2020, the Respondent requested the Applicant to submit supporting
documentation and on 23 July 2020, the Respondent issued its objection decision
maintaining the tax due to the failure to avail the supporting documents.
On 29 January 2025, the Applicant filed this application for review of the Respondent''s
objection decision. When the matter came up for conferencing on 26 August 2025, the
Respondent raised a preliminary objection that this application was out of time. The
parties were directed to file submissions for extension of time before determination of the
application could proceed.
2. Issues for determination
The main issue is whether the Applicant should be granted the extension of time.
Section 16 (1) (c) of the Tax Appeals Tribunals Act provides that:
"(1) An application to a Tribunal for review of a taxation decision shall-
(c) be lodged with the tribunal within 30 days after the person making the application has been
served with notice of the decision".
Section 16 (2) of the Tax Appeals Tribunals Act provides:
"A Tribunal may, upon application in writing, extend time for the making of application to the
Tribunal for a review of the taxation decision."
Further, Section 16(7) of the Tax Appeals Tribunals Act provides:
"An application for review of a taxation decision shall be made within six months after the date of
the taxation decision."
In the case of Uganda Revenue Authority V Consolidated Properties Ltd (Court of
Appeal Civil Appeal No. 31 of 2000), it was stated:
"That is why the Respondent filed a second application dated August 12 1999, which was thrown
out by the Tribunal for being time barred. Clearly, that application was filed after over 50 days
from June 17 1999 instead of within 30 days as required by the law. Time limits set by statutes
are matters of substantive law and not mere technicalities and must be strictly complied with."
In light of the above, the Tribunal finds that this application is fatally defective, having
been filed more than 4 years after the date of the objection decision. The Applicant was
issued with an objection decision on 23 July 2020 and filed this application on the 29
January 2025. It took the Applicant years to realize that they now intend to challenge the
Respondent''s decision. The delay is so inordinate that any reasonable court or tribunal
would be constrained to exercise its discretion in favour of the Applicant.
Furthermore, the Applicant alleged that the reason for the delay was the Covid 19
pandemic and illness of its director. The Applicant also alleged that he was he lacked
guidance which he should have got from the Respondent. These reasons do not stand
as the lockdown was lifted and operations went back to normal in 2022. The Applicant
could have sought redress from this Tribunal in the following year and did not. There was
more than ample time for the Applicant to consult and make the right decision but the
Applicant chose to sit on its rights.
Regarding the illness of its Director, the Applicant could not avail any evidence to support
the assertion. When did the illness start, when did it end?
In the circumstances, this application is hereby dismissed and costs are awarded to the
Respondent.
Dated at Kampala this............19th..........day of.........September.........2025.', 'This ruling serves as a critical reminder for Uganda tax practitioners regarding the strict adherence to statutory timelines for filing applications with the Tax Appeals Tribunal. The Tribunal reiterated that while it has discretion to extend time under Section 16(2) of the Tax Appeals Tribunals Act and Rule 12 of the TAT (Procedure) Rules, such discretion is not limitless, especially when the delay is inordinate (over four years in this case) and without sufficient justification. The case highlights the importance of timely action and the need for robust evidence when seeking an extension of time, particularly when relying on events like the COVID-19 pandemic, which the Tribunal noted was lifted in 2022. The precedent from *Uganda Revenue Authority V Consolidated Properties Ltd* (Court of Appeal Civil Appeal No. 31 of 2000) underscores that timelines are matters of substantive law, not mere technicalities.

Key practical lessons:
*   **Strict Timelines:** Adhere strictly to the 30-day window for filing applications to the TAT after an objection decision.
*   **Justifiable Delay:** Any request for extension of time must be supported by compelling and well-evidenced reasons.
*   **Prompt Action:** Do not ''sit on your rights''; seek redress promptly, even if administrative errors or external factors are present.', '2026-07-04 20:10:24.104769+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('5fe840ac-b305-44dd-8035-832959cc9c3e'::uuid, 'TAT APPLICATION NO. 94 OF 2025', 'TEZAMO & CO CERTIFIED PUBLIC ACCOUNTANTS v UGANDA REVENUE AUTHORITY', 2026, 'VAT', 'Allowed', 'The Applicant, an auditing firm, was assessed VAT on audit services provided to a donor-funded project (SIDA/Makerere University) for the period July 2014 to June 2016. The Applicant argued that under the funding agreement and Section 40A of the Tax Procedures Code (Amendment) Act, 2019, the Government of Uganda was liable for these taxes. The Tribunal found that Section 40A, particularly subsection (2) which writes off unpaid taxes as at 30th June 2019, applied retrospectively to the assessment, transferring the liability to the Government. The assessment was set aside.', '1. This ruling is in respect of an application challenging an assessment of Shs. 21,256,343 being VAT on audit services by the Applicant to a donor-funded project brought under Section 40A (1) of the Tax Procedure Code Act.
...
4. The Applicant objected to the assessment to the tune of Shs. 21,256,343 on the grounds that, as per the funding agreement between the Government of Uganda and the Swedish Government, the taxes were payable by the Government of Uganda, and that Makerere University had not paid the Applicant the VAT invoiced for the audit services provided.
...
9. The Applicant further submitted that under Article 152 of the Constitution of Uganda, the authority to impose, vary or waive taxes is placed on the Parliament of Uganda. In 2019, Parliament exercised that authority by enacting Section 40A (1) of the Tax Procedures Code (Amendment) Act, which provides as follows:
40A.Tax due and payable by the government.
(1) The Minister shall pay any tax due and payable by the Government, arising from a commitment made by the Government to pay tax on behalf of a person or owing from the Government as counterpart funding for aid-funded projects.
...
30. The disputed VAT assessment arose from works carried out by the Applicant for the period of July 2014 to June 2016. These works were performed under an aid-funded project governed by a 2010 funding agreement between the Government of Uganda and the government of Sweden. Crucially, the 2010 agreement contained an undertaking by the Government of Uganda not to charge any taxes or to pay any taxes arising from the project.
31. The general principle of law is that statutes are presumed to operate prospectively and not retrospectively, unless a clear intention to the contrary is shown. The question therefore, is whether Section 40A demonstrates such an intention.
32. Section 40A Tax Procedure Code Act 2014 states that;
(1) The Minister shall pay any tax due and payable by Government arising from a commitment made by Government to pay tax on behalf of a person or owing from Government as counterpart funding for aid funded projects.
(2) Notwithstanding subsection (1), all unpaid taxes by Government as at 30th June 2019 are written off.
...
36. Even more compelling is Section 40A (2), which unequivocally writes off "all unpaid taxes owed by Government as at 30th June 2019." The word write off is defined by Article 12 of Non-Performing Assets and write off Central Bank of UAE to mean;
"an accounting action reducing an asset''s value to zero, or removing it entirely from financial records, typically due to loss of economic value, obsolescence, or uncollectibility."
37. The tax in dispute was assessed for works performed in 2014 and 2016. It was by definition, an unpaid tax as of 30 June 2019 and it falls under the category of taxes the government had committed to pay. It is therefore, among the very liabilities Parliament explicitly intended to extinguish.
...
42. Consequently, the Tribunal finds that the assessed VAT is, by operation of law, a liability of the Government of Uganda and not of the Applicant.
43. The Tribunal orders as follows:
i. This Application is accordingly allowed.
ii. The VAT assessment of Shs. 21,256,343 is hereby set aside.
iii. Costs of this application are awarded to the Applicant.', 'This ruling is a significant win for taxpayers involved in donor-funded projects, particularly regarding the retrospective application of Section 40A of the Tax Procedures Code (Amendment) Act, 2019. The Tribunal''s interpretation clarifies that the government''s commitment to pay taxes on aid-funded projects, coupled with the ''write-off'' provision in Section 40A(2), extinguishes past tax liabilities up to June 30, 2019. This sets a clear precedent that such statutory provisions can have retrospective effect when they are curative or beneficial and address pre-existing government commitments. Tax practitioners should advise clients on donor-funded projects to meticulously review funding agreements for tax clauses and leverage Section 40A for assessments falling within the specified period.

*   **Key Takeaway:** Section 40A(2) TPC Act, 2019 has retrospective effect for unpaid taxes on aid-funded projects up to June 30, 2019.
*   **Main Risk/Precedent:** URA''s attempts to apply a purely prospective interpretation of tax laws, especially those designed to address historical commitments, may be challenged successfully.
*   **Relevant Acts/Sections:** Section 40A of the Tax Procedures Code (Amendment) Act, 2019; Article 5 of the funding agreement between the Government of Uganda and the Government of Sweden.
*   **Practical Lessons:**
    *   Thoroughly examine donor agreements for tax liability clauses.
    *   Understand the retrospective potential of curative tax legislation.
    *   Maintain detailed records of tax-exclusive invoicing for aid-funded projects.', '2026-07-04 16:05:44.855862+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('6005a90b-ab74-48e9-9a52-7253abf0b2e7'::uuid, 'APPLICATION NO. 331 OF 2024', 'CHANDARIA FOUNDATION REGISTERED TRUSTEES v UGANDA REVENUE AUTHORITY', 2025, 'Income Tax', 'Allowed', 'The Applicant, a charitable trust, sold shares in Uganda Baati Limited (a public limited company) and realized a capital gain. The Uganda Revenue Authority (URA) assessed income tax on this gain, arguing the shares were business assets. The Applicant contended the gain was exempt under Section 21(1)(j) of the Income Tax Act, as the shares were a long-term passive investment and not business assets. The Tribunal ruled in favor of the Applicant, finding the shares were not business assets and the capital gain was exempt from income tax, setting aside the URA''s assessment.', 'RULING
This ruling is in respect of an application seeking a declaration that the capital gain derived by the Applicant on the disposal of its shares in Uganda Baati limited, a public limited company is exempt from income tax.
1. Background Facts
The Applicant is a charitable trust duly registered and validly existing under the Laws of Uganda and is engaged in various charitable activities. On various dates between 1999 and 2002, the Applicant acquired shares in Uganda Baati Limited ("UBL"), a public limited liability company at a total cost of Shs. 49,084,320.
In 2021, the Applicant disposed of its entire shareholding in UBL to Safal Investments (Mauritius) Limited ("SAFAL") and Dr. Allan Shonubi for a total consideration of Shs. 2,454,250,000. The Applicant did not pay income tax on the capital gains arising from the disposal of its shares to SAFAL and Dr. Alan Shonubi on the basis that such capital gains are exempt from income tax pursuant to Section 21(1) (j) of the Income Tax Act.
In 2024, the Respondent investigated the Applicant''s tax affairs and raised an income tax additional assessment against the Applicant on 10 July 2024 for the period January 2021 to December 2021 amounting to Shs. 809,393,700 arising from the disposal of the Applicant''s shares in UBL. The Applicant objected to the assessment in respect of the sale of its shares in UBL on grounds that the capital gains made from the sale of its shares in UBL, a public limited liability company are exempt from income tax under Section 21 (1) (j) of the ITA.
The Respondent disallowed the Applicant''s objection on the basis that the income earned from the sale of the Applicant''s shares in UBL is taxable under the ITA. The Applicant was aggrieved with the objection decision and lodged this Application before this Honourable Tribunal for review of the Respondent''s objection decision.
...
Therefore, basing on the above, the gain that was realised by the Applicant from the disposal of its shares in UBL did not arise from the disposal of a business asset and therefore, could not have been included in the business income of the Applicant.
We now turn to Section 21 (j) of the ITA which exempts the following income from tax:
"Any capital gain that is not included in the business income, other than capital gains on the sale of shares in a private limited liability company or on the sale of a commercial building."
The above provision has the following elements
(i) the capital gain is not included in its business income – we have already established that the income ought not to be included because it did not arise from the disposal of a business asset; and
(ii) the capital gain was not derived from the sale of shares in a private limited liability company or from the sale of a commercial building – the shares were held in UBL, a public limited company.
In addition to the above, the use of the words "other than" presupposes that ordinarily, gains from the sale of shares do not form part of business income, hence the creation of an exception relating to shares held in a private limited company.
Consequently, the Applicant qualifies for the exemption under Section 21 (j) of the ITA.
In sum, the Applicant held the shares in UBL for over two decades, a holding period that is more characteristic of a long-term passive investment and not trading asset. Therefore, the shares could not be categorized as business assets without a corresponding business in which the Applicant used the shares or held them ready for use or sale.
...
In view of the above, the Tribunal makes the following orders:
(i) The capital gain arising from the disposal of the Uganda Baati Limited shares held by the Applicant is exempt under Section 21(1)(j) of the Income Tax Act and is not subject to income tax.
(ii) The assessment of Shs. 809,393,700 is hereby set aside.
(iii) The Respondent is ordered to refund to the Applicant the deposit of 30% of the assessed tax, with interest at 2% per month from the date of payment until the refund is made.
(iv) Costs are hereby awarded to the Applicant.', 'This ruling provides crucial clarity for Uganda tax practitioners regarding the taxation of capital gains from the disposal of shares, particularly for non-trading entities. The key takeaway is that capital gains from the sale of shares in a *public* limited company, held as a passive investment and not as part of a business, are exempt from income tax under Section 21(1)(j) of the Income Tax Act (ITA). The Tribunal emphasized that the definition of ''business asset'' is critical, and mere ownership of shares does not automatically classify them as such, especially for entities not engaged in share trading. This decision reinforces the importance of distinguishing between investment assets and business assets, and the specific exemption for public company shares. Practitioners should carefully review the nature of shareholdings and the taxpayer''s activities to determine taxability.

*   **Key Practical Lessons:**
    *   Capital gains from public company shares held as passive investments are exempt.
    *   The ''business asset'' definition under ITA Section 2(h) is central to determining taxability.
    *   Long-term holding periods (e.g., 22 years) strongly indicate investment, not trade.
    *   Proper indexation of cost base under Section 48(3) ITA is mandatory for taxable gains.', '2026-07-04 20:08:19.852319+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('6061b351-9c1d-4b24-8733-28f6b3bbc503'::uuid, 'APPLICATION NO. 73 Of 2026', 'MUNYANGA DEVELOPMENT LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'Income Tax', 'Allowed', 'Munyangwa Development Limited objected to a tax assessment by URA. When URA failed to issue an objection decision within the statutory 90-day period, Munyangwa elected to treat the objection as allowed under Section 26(7) of the Tax Procedures Code Act (TPCA). URA subsequently issued a partial objection decision and rejected the election. The Tribunal ruled that Munyangwa''s election was valid and that URA''s subsequent objection decision was unlawful and void, having been issued without jurisdiction after the election took effect.', '1. This ruling is in respect of an application to declare the validity of an election made by the Applicant under Section 26 (7) of the Tax Procedures Code Act to treat its objection as allowed. This arises from the Respondent''s alleged failure to issue an objection decision within the prescribed 90-day statutory period.
2. The applicant is in the business of tourist accommodation, trading as Mahogany Springs Luxury Resort, based in Kihihi, Kanungu District. On 22 November 2025, the Respondent issued a tax assessment of Shs. 2,600,873,388 for the period 2022 to 2024 on the grounds that the revenue reported in the audited financial statements did not match the credits reflected on the Applicant''s bank statements.
3. The Applicant objected to the tax amounting to Shs. 2,451,456,441 on 31 December 2025. On 31 March 2026, the Applicant accordingly issued an election notice to treat the objection as allowed in accordance with Sections 26(6) and 26 (7) of the Tax Procedure Code Act.
4. The Respondent had engagements with the Applicant on 5 February 2026, 16 March 2026 and 19 March 2026, where a number of documents were submitted by the Applicant for review by the Respondent.
5. On the same day at 18.11 hours, the Respondent issued a decision on the objection, partially allowing it in the sum of Shs. 792,248, 194 and disallowing the objection in the sum of Shs. 1,808,625,194. The Respondent also issued an election rejection notice on the same day.
6. The Applicant filed the application before the Tax Appeals Tribunal, challenging the Respondent''s actions.
7. The following are the issues for determination:
(i) Whether the election notice issued by the Applicant on 31 March 2026 to treat the objection made on 31 December 2025 as allowed is valid and within the ambit of Section 26 (7) of the Tax Procedure Code Act.
(ii) Whether objection decision issued by the Respondent on 31 March 2026 is lawful in accordance with Section 26 (7) of the Tax Procedure Code Act.
10. The Applicant cited Section 26 of the Tax Procedures Code Act ("TPCA"), which governs the objection process in tax matters and provides as follows;
1. "(1) A person who is dissatisfied with a tax decision may lodge an objection with the Commissioner General within forty-five days after receiving notice of the lire decision.
2. (5) The Commissioner General may make a decision on an objection-
3. to a tax assessment, affirming, reducing, increasing, or otherwise varying the assessment to which the objection relates; or
b) to any tax decision. Affirming, varying, or setting aside the decision.
4. (6) The Commissioner General shall serve notice of an objection decision on the person objecting within ninety days from the date of receipt of the objection
5. (7) Subject to Subsection (9), where an objection decision has not been served within the time specified under subsection (6), the person objecting may, by notice in writing to the Commissioner General, elect to treat the Commissioner General as having made a decision to allow the objection
6. (8) Where a person makes an election under Section (7), the person is treated as having been served with a notice of the direction decision on the date the person''s section is lodged with the Commissioner General"
11. The Applicant submitted that it objected on 31 December 2025 and that, according to Section 26 (6) of the TPCA, the Respondent was required to issue objection decisions within 90 days from the date of receipt of the objection. The 90 days begin to run from the date the Respondent receives the objection decision. The Respondent therefore had to serve the objection decision by 30 March 2026, which it did not.
12. The Applicant submitted that, as a result, the Applicant exercised its statutory right under Section 26(7) and lodged elections, thereby treating the objections as allowed.
15. The Applicant stated that the right of election under Section 26(7) is not discretionary and is not dependent on the Commissioner General''s approval or acceptance. Once the election is lodged, Section 26(8) automatically deems the taxpayer to have been served with an objection decision allowing the objection on the date of the election. Therefore, the Applicant legally exercised their statutory right under Section 26(7), and the election which took effect on 31 March 2026, is valid.
19. The objection decisions were issued after the expiry of the mandatory 90- day period under Section 26(6) of the TPCA, when the Applicant had already lodged a valid election under Section 26(7), hence lacked jurisdiction to issue further objection decisions in respect of the said objection.
23. The Applicant averred that the objection decision issued after a valid election was therefore unlawful, issued without jurisdiction, null and void ab initio, having been made in contravention of Section 26(7) and 26(8) of the TPCA.
25. Consequently, the Applicant prayed for the following remedies
I. A declaration that the Applicant''s election is valid
ii. A declaration that the Respondent''s objection decision issued after the election is unlawful and void
Ill. The assessment of Shs. 1,808,625,194 is set aside', 'This ruling reinforces the strict adherence to statutory timelines in tax objection processes in Uganda. The key takeaway for tax practitioners is that the 90-day period for the Commissioner General to issue an objection decision under Section 26(6) of the TPCA is mandatory. Failure to comply grants the taxpayer an automatic right to elect to treat their objection as allowed under Section 26(7) of the TPCA, effectively concluding the matter in their favor. Any subsequent decision by URA after a valid election is made will be deemed null and void for lack of jurisdiction, as highlighted by the Tribunal''s reliance on precedents like Kuku Foods V Uganda Revenue Authority. This case serves as a critical reminder for URA to manage its objection caseload efficiently and for taxpayers to be aware of and assert their rights under the TPCA.

*   **Strict Timelines:** The 90-day period for objection decisions is non-negotiable.
*   **Taxpayer''s Right to Elect:** Section 26(7) of the TPCA provides a powerful remedy for taxpayers.
*   **Jurisdiction:** URA loses jurisdiction to issue decisions once a valid election is made.', '2026-07-04 15:12:49.473832+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('6415bd20-14fe-46dd-b4b1-d45a8f32a3cb'::uuid, 'TAT APLICATION NO. 41 OF 2024', 'JK COUNTRY HOMES LIMITED v UGANDA REVENUE AUTHORITY', 2025, 'Income Tax', 'Dismissed', 'The Applicant, a real estate company, challenged an additional income tax assessment for rental income, arguing that the Uganda Revenue Authority (URA) wrongly applied a 75% expense cap, which they claimed only applied to individuals and partnerships, not companies. The URA disallowed expenses related to a shareholder''s personal loan used for property development, citing lack of documentation and the principle of separate legal personality. The Tribunal dismissed the application, finding that the property and loan belonged to the individual shareholder, not the company, and therefore the URA correctly applied the 75% expense cap for individuals.', 'This ruling arises from an application challenging an Administrative Additional Income Tax Assessment of Shs. 17,286,922, arising from disallowed expenses in the computation of rental income for the period 1 July 2021 to 30 June 2022.

1. Background facts
The Applicant deals in real estate. On 11 September 2023, the Respondent issued the Applicant an administrative additional income tax assessment amounting to Shs. 17,286,922 arising from disallowed expenses in respect to its declared rental income for the period from 1 July 2021 to 30 June 2022.

On 10 December 2023, the Applicant lodged an objection disputing the administrative additional tax assessment. On 9 January 2024, the Respondent disallowed the objection and upheld the assessment hence this application.

2. Issues for determination
The key issue is whether the Applicant is liable to pay the tax assessed.

Mr. Basudde George, the Applicant''s Accountant, was the sole witness of the Applicant. He testified that on 11 September 2023, the Respondent issued an additional income tax assessment of Shs, 17,286,922 for the 2021/2022 year on the grounds that the Applicant''s expenses exceeded 75% of its gross rental income.

The witness stated that the Applicant attempted to appeal through the Alternative Dispute Resolution Committee but was informed the application was late as it was filed outside the required seven-day window.

He argued that the assessment, which was made under section 24 of the Tax Procedures Code Act wrongly applied the 75% expense cap, which he claimed only applied to individuals and partnerships and not companies. At the time, corporate entities were permitted to deduct 100% of expenses related to rental income.

The witness further stated that, a key expense in dispute was a USD 90,000 shareholder loan used for land acquisition and property development. He further stated that this information was not available during the initial preparation of financial statements.

He concluded that the assessment was based on a misapplication of tax law and an incorrect classification of the company''s structure, affirming that his statements were truthful.

The Respondent''s sole witness was Ms. Filly Okori Acio, an officer in its Domestic Taxes Department. She testified that the Respondent issued the Applicant an Administrative Additional Income Tax Assessment amounting to Shs. 17,286,922 which was issued on 11 September 2023, covering the income year from 1July 2021 to 30 June 2022.

The witness stated that the Respondent disallowed certain expenses claimed by the company, which exceeded 75% of the Applicant''s gross rental income; further, the Applicant lacked sufficient supporting documentation.

She further testified that on 10 December 2023, the Applicant lodged an objection to the said assessment. Upon receipt of the objection, the Respondent formally requested the Applicant to furnish documentation to substantiate its claim, particularly regarding certain expenses including a purported loan. However, despite repeated reminders, the Applicant failed to provide the requested documentation.

Ms. Acio stated that the Respondent, after considering the objection and the Applicant''s failure to submit the required documentation, issued an objection decision on 9 January 2024 which upheld the earlier assessment.

According to her testimony, the Applicant''s failure to support its claimed expenses with appropriate documentation rendered the assessment proper and lawful within the meaning of the applicable tax laws. She maintained that, to date, the Applicant had never provided the said information.

The witness emphasized that the Respondent had acted within its statutory mandate and that the tax liability assessed against the Applicant was not only justified but also legally enforceable.

3. Submissions of the Applicant
The Applicant submitted it was not liable for the tax assessed. They further submitted that the Administrative Additional Assessment issued by the Respondent under Section 24 of the Tax Procedures Code Act, 2014, was irregular and based on an erroneous interpretation of the applicable law regarding deductions on rental income for corporate entities. The Applicant submitted that the nature of the Applicant''s business is the development and letting of residential and commercial rental property located on Plot 632 Bukasa, Kirinya, Wakiso District, registered in the name of Mr. John Kokas Omiat, who is a shareholder and director of the Applicant.

The Applicant argued that on 10 April 2015, Mr. Omiat obtained a loan of USD 90,000 from Stanbic Bank, which was used for the development of the said property. This loan facility, repayable in 120 equal monthly instalments, is exhibited at Annexture G to the Applicant''s Trial Bundle. The same property, according to the Applicant''s submissions, is also mortgaged to Stanbic Bank, confirming the purpose of the loan. The Applicant contended that the Respondent erred in disregarding this loan expenditure as a deductible expense when computing taxable rental income.

The Applicant further submitted that the Respondent wrongly interpreted and applied the section 3 of the Income Tax (Amendment) Act, 2022, which amended Section 5 of the principal Act. The section provides:

"Section 5 of the principal Act is amended in subsection (3): (a) by repealing paragraph (b); (b) by substituting for paragraph (c) the following- "(c) the expenditures and losses incurred by a person, other than an individual or partnership, in the production of rent shall be allowed as a deduction for any year of income only as provided for in section 22(1)(c)."

According to the Applicant, this amendment clarified that only individuals and partnerships are subject to the 75% capping rule, not corporate entities like the Applicant. The implication is that all expenses incurred in the production of rental income by the Applicant, as a non-individual, were deductible without restriction.

The Applicant highlighted that during cross-examination, the Respondent''s own witness, Ms. Filly Okori Acio, acknowledged that the Applicant was a non-individual and that the expenses were, by law, allowable. This directly contradicted the notes in the objection decision, which stated that "Claimed Expenses were More than 75% of the Gross Rental Income" and consequently disallowed amounts exceeding that cap.

The Applicant submitted that the Respondent erroneously applied a legal regime that was only applicable to individuals, which constituted an illegality.

On the issue of loan documentation, the Applicant submitted that the loan information, though unavailable at the time of filing the returns and objection, was eventually availed. He emphasized that the Tax Procedures Code Act provides timelines for handling objections, which the Respondent failed to adhere to in good faith.

Specifically, the Applicant submitted that the Respondent neither waived the time limit nor gave the Applicant sufficient time to provide the requested documents. Further, the Respondent made its objection decision in only 31 days after receipt of the objection, thereby depriving the Applicant of a fair opportunity to present its case.

The Applicant argued that during the mediation proceedings after the objection had already been decided, the Applicant provided the loan documentation, and the same was also submitted to the Tribunal on 2 July 2024. Therefore, the Respondent''s claim that it was never availed with the loan documentation was misleading.

The Applicant also pointed to the principle of the standard of proof in tax matters and cited the decision in Red Concepts v. Uganda Revenue Authority, TAT Application No. 36 of 2018, where the Tribunal stated:

"The standard of proof in tax matters is on a balance of probabilities. Where there is doubt, the taxpayer takes the benefit of it."

The Applicant contended that based on the evidence before the Tribunal, including the existence of the loan, its purpose, and continued repayment obligations, the Tribunal ought to find that the Applicant had sufficiently discharged its burden.

The Applicant, thus prayed for the following reliefs:
a) A declaration that the Respondent''s assessment for the financial year 2021/2022 was irregular, illegal, and in contravention of applicable tax law;
b) An order setting aside the said assessment and directing the Respondent to vacate the same from the Applicant''s income tax rental tax ledger;
c) Costs of the application.

The Applicant concluded by praying that the Tribunal should decide in its favour on both issues and grant all the reliefs prayed for.

4. Submissions of the Respondent
The Respondent submitted that the Applicant is liable to pay the tax assessed and that the assessment was proper, lawful, and based on sound statutory and evidentiary grounds.

The Respondent submitted that the Applicant failed to discharge their burden of proof burden when the Respondent gave the Applicant several opportunities to provide documentation, particularly in respect of a loan allegedly used to develop the rental property. Despite reminders, the documentation was not submitted in time.

Further, the Respondent referred to section 5(3)(b) of the Income Tax Act, which provides:

"(b) the expenditures and losses incurred by the individual in the production of the rent shall be allowed as a deduction for any year of income;"

He emphasized that only expenses incurred in the actual production of rental income were allowable. This was reinforced by section 22(2) of the same Act, which explicitly excludes deductions for private or domestic expenses:

"(2) The following amounts shall not be allowed as deductions- (a) expenditure of a domestic or private nature; (b) capital expenditure; (c) any loss or expenditure recoverable under insurance contract or indemnity; (d) income tax payable in Uganda; (e) fines or penalties paid to a government or statutory body for breach of any law."

The Respondent explained several of the Applicant''s claimed expenses including travel, facilitation, medical expenses, and condolence fees, were personal and unrelated to rental income.

The Respondent also pointed out inconsistencies in the Applicant''s documentation, notably vouchers that were internally issued by the Applicant and lacked proper authentication. For instance, the Respondent stated that, Voucher No. 227 dated 1 October 2021 appeared to precede Voucher No. 228 dated 12 September 2021.

In addressing the Applicant''s reliance on a loan as part of its claim, the Respondent strongly argued that the loan was advanced to Mr. John Omiat in his personal capacity, not to the Applicant. The Respondent relied on the principle of separate legal personality, as laid down in Salomon v. Salomon & Co Ltd [1897] AC 22, which affirms that a company is a separate legal person distinct from its shareholders. Thus, Mr. Omiat''s personal liabilities, including the loan, could not be imputed on the Applicant.

The Respondent emphasized that the loan agreement was between Stanbic Bank and Mr. Omiat, and that both the disbursement and repayments were made through Mr. Omiat''s personal account. He stressed that the Applicant''s own witness admitted during cross-examination that the company had no bank account and that the loan was for Mr. Omiat''s future personal development.

Accordingly, the Respondent submitted that the loan did not qualify as a deductible expense under section 5(3)(b) of the Income Tax Act, since it was not incurred by the company and was not related to the production of rental income.

Furthermore, the Respondent refuted the Applicant''s argument that it was denied time to provide the loan documentation. The Respondent maintained that the loan had existed since 2015 and that, if genuinely related to the Applicant''s business, the documentation should have been readily available. Consequently, the Applicant''s failure to provide the required supporting documentation in a timely manner was deliberate and intended to frustrate the Respondent''s statutory obligations.

The Respondent submitted that the Applicant had failed to prove that the expenses disallowed were indeed incurred in the generation of income, or that the loan had any connection to the company''s income-generating activities.

The Applicant did not filed submissions in rejoinder.

5. The determination of the issues
Having heard the evidence of the parties and read submissions of the parties, this is the decision of the Tribunal.

The Respondent issued the Applicant, a company that is incorporated in Uganda with an administrative income tax assessment arising from disallowed expenses which the Applicant had claimed against their rental income.

The Applicant claims that the Respondent'' assessment is unlawful for the following reasons:

(i) The Respondent capped the Applicant''s expenses to 75% of the Applicant''s rental income. The Applicant claims that the capping only applies to individuals and partnerships.
(ii) As the Applicant is a company, all expenses claimed ought to have been allowed as a deduction against its rental income.

At the heart of the dispute is expenses claimed in respect of a loan that was extended to the Applicant''s shareholder by Stanbic Bank. The Applicant claims that they obtained the loan from Stanbic bank for purposes of developing the property which generates the rental income that was subject to tax.

On the other hand, the Respondent has argued that as the loan in question was obtained by the Applicant''s shareholder in his individual capacity, it cannot, for tax purposes be treated as a loan of the Applicant. Therefore, any expenses attributed to the loan are not expenses wholly and exclusively incurred by the Applicant in the production of the rental income.

The taxation of rental income is governed by section 5 of the Income Tax Act (ITA) and the applicable tax rates have changed over time. Therefore, it is important to determine the treatment of the rental income in the year of income in which it arose.
In this particular case, the year of income was 1 July 2021 to 30 June 2022.

Section 5 (1) of the ITA imposes on every person who has rental income for the year of income. With regard to persons who are companies, section 5 (2) (b), the relevant rates are determined in accordance with section 7 (2) to the rental income derived by the company for the year. Further, section 5 (3) (b) of the ITA is to the effect that "expenditures and losses incurred by a person, other than an individual or partnership, in the production of rent shall be allowed as a deduction for any year of income only as provided for in section 22 (1) (c)."

The above provision (section 5 (3) (b)) was introduced by the Income Tax (Amendment) Act, 2022 which came into force on 1 July 2022.

However, in view of the fact that the period in question is 1 July 2021 to 30 June 2022, it would follow that the provision as it stands does not apply to the present facts since the Income Tax (Amendment) Act, 2022 came into force after the period in issue.

Therefore, the correct provision for purposes of determining the allowable expenses is the provision which was repealed by the amendment Act of 2022. Prior to the amendment Act, the ITA provided as follows under section 5 (3) (c):

"Expenditures and losses incurred by a person, other than an individual, in the production of rent shall be allowed as a deduction under this Act for any year of income."

Therefore, prior to the Income Tax (Amendment) Act, 2022, all expenses incurred by a person in the production of rental income were allowable as a deduction under the ITA.

Therefore, the question that remains is whether the expenses which the Respondent disallowed were incurred by the Applicant in the production of its rental income. Specifically, we must determine whether expenses in respect of the loan that was obtained by the shareholder of the Applicant from Stanbic bank qualify as expenses incurred by the Applicant in the production of its rental income.

To this end, the Applicant has provided the following supporting documentation:

(i) A loan agreement between the Applicant''s shareholder, Mr. Omiat John and Stanbic bank dated 10 April 2015; and
(ii) Bank statements of Mr. Omiat John.

We have studied the loan agreement and have established that its purpose was to refinance an existing salary loan and to purchase land for future development.

There is nothing in the agreement that suggest that Mr. Omiat John borrowed on behalf of the Applicant. Further, the Applicant, being a company, cannot earn a salary. It is obvious from the loan agreement that it was obtained by Mr. Omiat John in his personal capacity.

It is common for shareholders to borrow on behalf of their companies for purposes of on-lending to the company. In the present case, there is no evidence which shows that the loan was then on-lent to the Applicant. Further, no board resolution, shareholder agreement, or corporate documentation was presented to show that the company assumed liability or reimbursed Mr. Omiat for the loan.

The Bank statement that was adduced belongs to Mr. Omiat. There is no evidence that the funds obtained from Stanbic bank were transferred to the Applicant''s bank account. At the hearing, the Applicant admitted that they do not own a bank account.

This Tribunal is alive to the principle in Salomon v Salomon Co. Ltd. [1897] AC 22, that a company is distinct from its shareholders and directors. Personal liabilities of individuals cannot be imputed to the company unless there is clear legal assumption of such liabilities.

Further, the Applicant''s failure to provide the loan documentation at the objection stage, despite repeated requests by the Respondent, indicates the non-existence of information that points to the Applicant''s ownership of the property or the liability.
It should also be noted that by their very own admission, the Applicant states that the property comprised in FRV 1421, Folio 23, Kyadondo, Block 242, plot 632, Bukasa, Kirinya, is registered in the names of John Kokas Omiat. This admission, coupled with the evidence of the loan and mortgage in Mr. Omiat''s personal capacity, shows that the for all intents and purposes, the property and rental income therefrom belong to an individual and not a company. Therefore, the Respondent rightfully treated the rental income as that of an individual and not of a company by applying the 75% cap to expenses in line with section 22 (1) (c) of the ITA.

In light of the above, the Tribunal finds that the Respondent lawfully disallowed the expenses purportedly incurred by the Applicant in respect of the loan including the corresponding interest expense. This application is therefore dismissed with costs to the Respondent.', 'This ruling underscores the critical importance of maintaining clear distinctions between a company''s finances and those of its shareholders, a fundamental principle of corporate law (Salomon v. Salomon & Co Ltd [1897] AC 22). Tax practitioners must ensure that all expenses claimed by a corporate entity are demonstrably incurred by the company itself and are directly related to its income-generating activities. The Tribunal''s decision highlights that even if a shareholder''s personal loan benefits a company''s property, without formal documentation (e.g., board resolutions, loan agreements between shareholder and company) showing the company assumed liability or received the funds, the expenses will not be deductible for the company. This case also clarifies the application of the 75% expense cap for rental income, confirming that for the period 1 July 2021 to 30 June 2022, corporate entities were not subject to this cap, but individuals were. The key takeaway is that proper documentation and adherence to corporate legal personality are paramount in tax matters.

*   **Maintain Corporate Separation:** Ensure all financial transactions and liabilities are clearly attributed to the correct legal entity.
*   **Document Everything:** All expenses, especially those involving shareholders, must be thoroughly documented with formal company resolutions and agreements.
*   **Understand Tax Law Amendments:** Be aware of the effective dates of tax law amendments, as they can significantly impact tax treatment for different periods.', '2026-07-04 20:27:23.598653+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('6743f2cf-5173-455d-8d1e-c7866e64ed55'::uuid, 'TAT No. 182 of 2024', 'UNION LOGISTICS UGANDA LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'VAT', 'Dismissed', 'The Applicant, a freight-forwarding and customs-clearing company, challenged a VAT assessment on Internal Container Depot (ICD) charges and transit, agency, and clearing fees. The Applicant argued these were either disbursements or incidental to zero-rated international transport. The Tribunal found that the Applicant invoiced and declared these as its own supplies, making them independent, standard-rated services, and upheld the URA''s assessment.', 'This ruling concerns an application challenging the legality and correctness of the Value Added Tax assessment, covering the period from July 2018 to June 2023. The Respondent imposed VAT at a standard rate on amounts classified as Internal Container Depot (ICD) charges and on transit, agency, and clearing fees relating to international transport.

The Applicant disagreed with the Respondents'' charging VAT at the standard rate of 18% on transit clearing services and ICD charges on the following grounds:
a) Transit clearing services are incidental and auxiliary to international transport, whose VAT rate is 0% as it relates to cargo moving from outside Uganda to destinations outside Uganda but passing through Uganda. Therefore, the applicable VAT rate for this clearing service ought to be 0%.
b) ICD charges: These were invoices billed for the recovery of money paid on behalf of the Applicant''s client while picking up clients'' cargo from ICDs, as evidenced by sampled transaction documents attached.

In resolving the first limb of the dispute concerning ICD charges, the Tribunal is guided by the principle that VAT liability is determined by the legal and economic substance of the transaction, rather than the labels adopted by a taxpayer. While section 11(1) of the VAT Act excludes "money" from the definition of a supply, it does not exempt from tax a situation in which amounts are recovered as consideration for a service supplied by the person invoicing and declaring the transaction.

The evidence before the Tribunal shows that the Applicant issued EFRIS tax invoices in its own name in respect of ICD charges and declared those amounts as part of its taxable turnover. Notably, the invoices were raised by the Applicant to its clients, not by the ICD operators, and no contemporaneous agency agreements or disclosed principal documentation was produced to demonstrate that the ICD operators supplied the services directly to the Applicant''s clients while the Applicant acted merely as a paying agent.

Accordingly, the Tribunal finds that both the ICD charges and the transit, agency and clearing fees constituted independent taxable supplies made by the Applicant in Uganda in the course of its business. They did not qualify as disbursements, nor did they assume the VAT character of international transport.

IT IS HEREBY ORDERED THAT:
(i) The assessment of Shs.266,740,452 is upheld.
(ii) The Application is dismissed
(iii) Costs are awarded to the Respondent.', 'This ruling reinforces the ''substance over form'' principle in VAT, particularly concerning disbursements and incidental services. Tax practitioners should note that merely labelling a payment as a ''disbursement'' is insufficient if the taxpayer invoices and declares it as their own supply. The Tribunal''s distinction between services that merely facilitate a principal supply and those that are commercially distinct is crucial. The case highlights the importance of clear contractual arrangements and invoicing practices to accurately reflect the nature of services for VAT purposes. Practitioners should advise clients to review their billing and declaration practices for services related to international transport to ensure they align with the VAT Act and Tribunal precedents.

*   **Key Takeaway:** Invoicing and declaration practices are critical in determining VAT liability, overriding mere labels.
*   **Main Risk/Precedent:** Services that are separately priced, invoiced, and commercially identifiable will likely be treated as independent taxable supplies, even if operationally linked to a zero-rated principal supply (e.g., international transport).
*   **Relevant Acts/Sections:** Section 11(1) and Section 18(2) of the VAT Act, and Section 145(1) of the EACCMA.', '2026-07-04 16:16:50.901941+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('68a0d448-70b5-4d64-8f5b-eb8f6364005e'::uuid, 'TAT No. 228 of 2022', 'Canaan Sites Limited v Uganda Revenue Authority', 2024, 'VAT', 'Allowed', 'The Applicant, a real estate company, sought a refund of VAT erroneously collected on the sale of unimproved land, which is an exempt supply. The Respondent argued that the VAT was paid by customers and the refund claim was time-barred under Section 34 of the VAT Act. The Tribunal found that the Applicant bore the VAT burden from its own profits, not passing it to customers, and that Section 34 was inapplicable as the claim arose from illegally collected tax on exempt supplies, not overpaid tax. The Tribunal ordered the refund with interest and costs.', 'This ruling is in respect of an application challenging the Respondent''s decision to deny the Applicant''s request for a refund of Shs 1,223,526,463. The Applicant contends that this amount was erroneously collected as Value Added Tax on the sale of unimproved land, which is categorized as an exempt supply. The Respondent argues that the Applicant is not entitled to claim this refund and that the refund should be claimed by the Applicant''s customers.

1. Background facts
The Applicant, a company incorporated in Uganda, specializes in real estate. The Applicant primarily purchases large tracts of land, subdivides them into plots, and sells the plots to various customers. In March 2013, the Respondent instructed the Applicant to charge VAT on land sales and amend its returns. The Applicant contended that it was not dealing in improved land, arguing that there was no clear definition of "improved land," and therefore its supplies are not subject to VAT as per paragraph 1(e) of VAT Act, Schedule 3. Despite this, the Respondent upheld its VAT assessment of Shs. 710,120,283 and proceeded to issue agency notices to the Applicant''s bankers.

On 4 March 2016, the Applicant requested clarification from the Respondent on the definition of "improved land" and explained its difficulty in charging VAT, as customers believed that sales of unimproved land were exempt from VAT. Subsequently, the Applicant entered into a payment plan with the Respondent and paid the assessed VAT without collecting it from its customers.

On 18th April 2016, the Applicant sought a private ruling regarding the definitions of serviced, improved, and unimproved land. On 15 May 2017, the Respondent replied, confirming that after visiting one of the Applicant''s properties, they clarified that the sale of land, which involved only subdivision and the provision of land titles, fell under the category of unimproved land as defined in Paragraph 1 (c) of the VAT Act''s second schedule and was thus exempt from VAT.

As a result, on 11th November 2020, the Applicant applied for a refund of Shs. 1,756,651,736, which the Respondent had incorrectly collected as VAT from January 2013 to February 2017. The Respondent conducted a VAT audit, approved a refund of Shs. 533,125,273, and denied the request for Shs. 1,223,526,463 for the period from October 2013 to February 2017, arguing that this VAT had been paid by the Applicant''s customers, and it is they who were entitled to claim a refund and not the Applicant. The Applicant objected on the grounds that:

i) The VAT refund claim is a result of administrative assessments issued on 5th February 2016 whereby the Applicant had to pay the tax from its coffers and the tax was not assessed based on invoices issued to customers.
ii) The Applicant was made to pay VAT on the basis that the Applicant was deemed a taxable person under Section 5(1)(a) of the VAT Act.
iii) The private ruling of 15th May 2017 confirmed that no VAT was due on transactions of the Applicant, and therefore the Respondent received a payment of money that it should not have received.
iv) Section 42 (2) of the VAT Act does not apply to the Applicant''s case.
v) The Respondent did not provide proof that the VAT claimed was paid by anyone else.

On 15th August 2022, the Respondent issued an objection decision maintaining its earlier position. The Applicant seeks this Tribunal to review the Respondent''s objection decision.', 'This ruling is a significant win for taxpayers in Uganda, particularly those dealing with exempt supplies. It clarifies that Section 34 of the VAT Act, which governs refunds for overpaid tax and includes a three-year limitation period, does not apply to claims for taxes illegally collected on exempt supplies. The Tribunal emphasized the principle of unjust enrichment, stating that URA cannot retain unlawfully collected taxes. This case reinforces the importance of proper classification of supplies (taxable vs. exempt) and the taxpayer''s right to reclaim funds collected outside the legal framework. Tax practitioners should advise clients to meticulously document who bears the tax burden, especially for exempt supplies, to support refund claims.
*   **Key Takeaway:** Section 34 of the VAT Act does not limit refunds for illegally collected tax on exempt supplies.
*   **Risk/Precedent:** URA''s retention of unlawfully collected tax on exempt supplies constitutes unjust enrichment.
*   **Practical Lesson 1:** Ensure clear documentation of whether VAT is passed on to customers or absorbed by the supplier.
*   **Practical Lesson 2:** Illegally collected taxes on exempt supplies are refundable, and the three-year limitation under Section 34 VAT Act does not apply.
*   **Practical Lesson 3:** URA is obligated to pay interest on delayed refunds of unlawfully collected taxes.', '2026-07-04 15:18:21.302621+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('69c40aa0-2e5b-4795-8698-040c5abb916a'::uuid, 'TAT No. 112 of 2024', 'Kampala Hardware Ltd v URA', 2024, 'VAT', 'Allowed', 'Tribunal ruled in favour of taxpayer on input VAT claims for capital equipment imported for manufacturing. URA''s denial of credits was found to be inconsistent with the VAT Act provisions.', NULL, 'A major win for manufacturers. The Tribunal clarified that input VAT on capital goods imported for business operations is fully claimable under Section 28 of the VAT Act. URA''s attempt to restrict credits based on timing or incomplete internal system records was rejected because physical custom declarations and invoices were intact.', '2026-06-10 10:05:00.190142+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('6daa42d0-876d-481e-9823-23c3369c6a64'::uuid, 'TAT No. 89 of 2023', 'Tunga Nutrition (U) Limited v Uganda Revenue Authority', 2025, 'WHT', 'Allowed', 'The Applicant, Tunga Nutrition (U) Limited, was assessed withholding tax by URA on the transfer of assets from Unga Millers (U) Limited in exchange for shares as part of a joint venture. The Applicant argued that the transaction qualified for roll-over relief under Section 76(1) of the Income Tax Act, meaning it was not a disposal and thus not subject to income tax or withholding tax. The Tribunal found that all conditions for roll-over relief were met, and since withholding tax is merely a collection mechanism for income tax, no withholding tax liability arose where no income tax was due. The assessment was set aside, and a refund ordered.', 'This ruling is in respect of an application seeking a declaration that the transfer of assets from Unga millers (U) Ltd to the Applicant was not a purchase subject to withholding tax and at any rate qualifies for roll over relief and is exempt from tax.

1. Background Facts
The Applicant is a company incorporated in Uganda whose principal business is the manufacture of animal feeds in the business of agriculture and forestry. On 2 August 2021, Nutreco International B.V("Nutreco") and Unga Millers (U) Limited entered into an investment agreement to form a joint venture to consolidate the aquafeed business in Uganda. The Joint Venture birthed Tunga Nutrition (U) Limited in which Nutreco and Unga Millers would receive shares in exchange for contributions in kind and cash.

On 19 November 2021, the Applicant was incorporated wherein the shareholders held unpaid shares in the Applicant. On 19 February 2022, Unga Millers Limited, a resident shareholder through an asset transfer agreement transferred to the Applicant assets and buildings including the land in dispute as consideration for the shares. No cash was paid by the Applicant to Unga Millers for the said land. At the point of transfer, the Applicant paid stamp duty based on Government valuation which usually translates the market value of the land. The Respondent issued a withholding tax assessment of Shs. 637,960,410 basing on the stamp duty government valuation of the land at Shs. 10,632,673,500. This assessment was initially based on the assumption that the Applicant purchased this property from Unga Millers whereas no cash was paid as the consideration was 50% shareholding in the Applicant.

Being dissatisfied with the assessment, the Applicant objected providing full disclosure of the transaction and how it was a reorganisation which qualified for roll over relief which meant that withholding tax as a collection mechanism would not apply.

On 4 May 2023, the Respondent''s objections team reviewed the application and upheld the assessment on the new founded basis that the land was transferred at market value and not cost base as stipulated under the roll over relief provisions.

2. Issue for determination
Whether the Applicant is liable to pay withholding tax of Shs. 637,960,410 as assessed by the Respondent.

7. The determination of the Tribunal
Having listened to the evidence and read the submissions of the parties, this is the decision of the Tribunal.

The Tribunal will break down the case into two sub issues namely:
(i) Did the Applicant''s transfer of land in exchange for shares satisfy the conditions of roll-over relief in section 76(1) of the Income Tax Act?
(ii) Was the withholding tax assessment correctly imposed?

Whether the Applicant meets the conditions for roll-over relief
Rollover relief provisions are found in section 76 (1) of the Income Tax Act (ITA). Under this provision, once a person qualifies for roll-over relief, the transfer is not treated as a disposal for income tax purposes and the assets are deemed to have been transferred on a no gains-no loss basis.

The conditions set out in section 76 (1) are as follows:
(i) There must be a resident person (the transferor);
(ii) Who transfers a business asset;
(iii) Not in excess of its cost base;
(iv) To another resident company (the transferee) (other than an exempt organisation);
(v) In exchange for a share in the transferee; and
(vi) the transferor has a fifty-percent or greater interest in the voting power of the transferee immediately after the transfer.

Applying the above conditions to the present facts:
(i) Unga Millers, a resident person, that is incorporated and registered in Uganda.
(ii) On 19 February 2022, by virtue of an asset transfer agreement, Unga Millers transferred its assets including property, fixed assets, moveable assets, business information and records;
(iii) The assets were transferred to the Applicant, a company incorporated and resident in Uganda.
(iv) The transfer of the assets was in exchange for 50% shares in the Applicant. This is evidenced by the 500 shares held by the Unga Millers in the Applicant which equate to 50% of the Applicant''s total shareholding.
(v) The assets were transferred at their cost base as evidence by the income tax returns of both the transferor and the transferee. An analysis of the returns shows that the Unga Miller''s residual carried forward tax written down values of the assets is the same as the Applicant''s brought forward tax written down values. This shows that the assets were transferred by Unga Millers to the Applicant at their cost hence a no gain / no loss position.

Therefore, the Applicant meets all the conditions for the roll-over relief. The Respondent''s arguments that the shares must have the same value as the asset does not hold. The assets were the consideration for the shares and while this will have an effect on the overall value of the Applicant arising from the transferred assets, it does not translate into a new book value for the shares.

Further, there was no need for a valuation report as the assets are transferred at their tax written down value i.e. the carrying amount for tax purposes and not at their market value.

Therefore, we find that the Applicant met the conditions for rollover relief. Consequently, as stated in section 76 (1) of the ITA, where the conditions are met, the transfer is not treated as a disposal of the asset.

We now turn to the interplay between the roll-over relief and the withholding tax under Section 130(2).

Whether withholding tax was correctly assessed
Section 130(2) of the Act provides
"A resident person who purchases a business or business asset shall withhold tax" at the prescribed rate."

The WHT payable under section 130 (2) is not a final tax as per the provisions of section 139 of the ITA. This means that it is advance income tax which is offset against the taxpayers'' year end tax liability.

However, roll over relief is the exception to the above. This is because the transfer of the asset is treated as not amounting to a disposal and the asset is considered to have been disposed of on a no gain/ no loss basis owing to the transfer at the cost of the asset.

Therefore, a harmonious interpretation of the ITA should be applied to reconcile the two provisions.

As highlighted by the Applicant in the case of Luwaluwa Investments V. Uganda Revenue Authority (HCCA No. 43 of 2022) where it was held that withholding is a mode of collection of tax and not a head of tax in itself. Therefore, the Respondent cannot rely on section 130 (2) as a backdoor to impose tax.

Therefore, for the above reason, the application succeeds and the Tribunal makes the following orders:
(i) The withholding tax assessment of Shs. 637,960,410 is hereby set aside;
(ii) The Respondent should refund the 30% deposit of the assessed tax in accordance with section 123 (4) of the ITA; and
(iii) Costs are hereby awarded to the Applicant.', 'This ruling provides crucial clarity for Uganda tax practitioners regarding the application of roll-over relief and its interaction with withholding tax, particularly in corporate reorganizations involving asset transfers for shares. The Tribunal''s emphasis on Section 76(1) of the Income Tax Act, Cap 338, as a non-disposal event is a significant precedent, reinforcing that withholding tax (under Section 130(2)) cannot be imposed where there is no underlying income tax liability. The decision highlights the importance of distinguishing between tax accounting and financial reporting, noting that stamp duty valuations do not necessarily reflect the tax cost base for income tax purposes. Tax practitioners should ensure that all conditions for roll-over relief are meticulously met to avoid similar assessments.

*   **Key Takeaway:** Withholding tax is a collection mechanism, not a standalone tax; if no income tax is due (e.g., due to roll-over relief), no WHT applies.
*   **Main Risk/Precedent:** URA may incorrectly apply WHT on transactions qualifying for roll-over relief, conflating market value for stamp duty with tax cost base.
*   **Relevant Acts/Sections:** Income Tax Act, Cap 338, Sections 76(1) (Roll-Over Relief) and 130(2) (Withholding Tax on Business Assets).
*   **Practical Lessons:**
    *   Ensure all conditions for roll-over relief under Section 76(1) ITA are clearly documented.
    *   Distinguish between stamp duty valuation and tax cost base for income tax purposes.
    *   Challenge WHT assessments on transactions that are not taxable disposals.', '2026-07-04 16:56:28.843788+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('6f3defdd-62fc-41f6-bce5-b9240174166c'::uuid, 'APPLICATION NO. 179 OF 2025.', 'PORTMAN SQUARE LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'VAT', 'Allowed', 'The Applicant, Portman Square Limited, sought a refund of Shs. 4,064,860,158 in VAT paid on supplies for the construction of its hotel, which the Uganda Revenue Authority (URA) had previously confirmed were VAT-exempt. Despite URA''s guidance to suppliers not to charge VAT, the Applicant was charged and paid the tax due to commercial necessity. The Tribunal ruled that the VAT was paid in error on exempt supplies and, applying Section 40(3) of the Tax Procedures Code Act, ordered URA to refund the amount with interest, emphasizing that the right to a refund lies with the person who bore the economic burden of the overpaid tax, not necessarily the remitter.', 'This ruling is in respect of an application challenging the Respondent''s decision in rejecting the Applicant''s claim for a refund amounting to Shs. 4,064,860,158 purportedly paid VAT on supplies made during the construction of the Applicant''s hotel project.

The Applicant is the proprietor of the hotel at Plot 1, Elgon Terrace, Kololo, Kampala, known as Four Points by Sheraton. Prior to the construction of the hotel, in anticipation of its investment of over USD 100 million in the construction of its hotel, the Applicant by a letter dated 24 January 2020, sought advice from the Respondent to confirm that the construction project for the hotel would benefit from the exemption regime provided for under the VAT Act as related to supplies to the project.

In a letter dated 23 March 2020, the Respondent advised the Applicant that under Section 19(1) and Paragraph 1(qq) of the Second Schedule to the VAT Act, the supply of services to conduct a feasibility study, design and construction, the supply of locally produced materials for construction of premises, infrastructure, machinery and equipment or furnishings and fittings which are not available on the local market, to a hotel or tourism developer whose investment capital is USD 8,000,000, with a room capacity exceeding 100 guests, would be exempt from VAT.

In a letter dated 27 July 2020, the Respondent advised the Applicant''s suppliers for the construction of the hotel, including Seyani Brothers Company Uganda Limited, not to charge the Applicant VAT for the supply of the construction works for the proposed four-star hotel. The Ministry of Finance, Planning and Economic Development had also previously, in a letter dated 27 August 2021, advised the Respondent that the Applicant''s investments for its Four-star hotel at Plot 1, Elgon Terrace, Kololo, would be entitled to various incentives, including exemptions for VAT, Excise Duty and import duty.

Between 2020 and 2023, the Applicant received a supply of various services and materials for the construction of the hotel and was issued with various tax invoices by its suppliers under which it was forced to pay VAT in the amount of Shs. 4,064,860,158, the Applicant applied for a refund of the VAT paid in error on tax invoices for the supply of VAT-exempt services and goods.

By a letter dated 7 February 2025, the Respondent advised that where the Applicant incurred VAT on supplies with respect to the construction of the Applicant''s hotel, the Applicant was not entitled to input VAT since the supplies were exempt from VAT. The Respondent further advised that Seyani Brothers and Co. (U) Ltd may issue credit notes and amend affected returns to reflect exempt supplies.

The Applicant objected on the grounds that the Respondent''s decision requiring Seyani Brothers Co. Ltd and other suppliers to issue credit notes and amend their returns to reflect exempt supplies is erroneous, as the Respondent''s reliance on Section 22 of the VAT Act is limited to taxable supplies.

The Respondent disallowed the objection on grounds that the conditions were not met as provided for under Section 19(1) and Paragraph 1(af) of Schedule 3 of the VAT Act and such invoices were issued and paid, then the Applicant does not qualify for a refund of input VAT for the tax periods in accordance with Section 34 of the VAT Act as it was not a taxable person.

The issue for determination is whether the VAT incurred by the Applicant is refundable.

The Applicant contended that the VAT incurred by the Applicant is refundable as having been paid wrongly and in error on exempt supplies made to it during the construction of its hotel, Four Points by Sheraton at Plot 1, Elgon Terrace, Kololo. The Respondent expressly conceded that the supplies made to the Applicant during the construction were VAT-exempt under Section 19(1) of the VAT Act with Paragraph 1(qq) of the Second Schedule.

The Applicant argued that this is reflected at pages 1 and 2 of the Respondent''s letter to the Applicant dated 23 March 2020, annexed to the application as Annexure "A", as well as in the Respondent''s correspondence addressed to Seyani Brothers Company (U) Limited, one of the Applicant''s principal suppliers, annexed as Annexure "B". Further, the Ministry of Finance, Planning and Economic Development had also, by a letter dated 27 August 2021, confirmed and advised the Respondent that the Applicant''s investments in its hotel would be entitled to exemptions from Value Added Tax, Excise Duty, and import duty.

The Applicant cited section 19 of the VAT Act provides:
"(1) A supply of goods or services is an exempt supply if it is specified in the Second Schedule". The following supplies are specified as exempt supplies for the purposes of section 19-
"(qq) the supply of services to conduct a feasibility study, design and construction; the supply of locally produced materials for construction of premises, infrastructure, machinery and equipment or furnishings and fittings which are not available on the local market to a hotel or tourism facility developer whose investment capital is at least eight million United States dollars and with a room capacity exceeding one hundred guests."

The Applicant submitted that the Respondent, by a letter dated 23 March 2020 and marked as Annexure "B" to the application, expressly confirmed to the Applicant that the project was VAT-exempt. Further, in a letter dated 27 July 2020, marked as Annexure "C", the Respondent similarly confirmed to one of the Applicant''s principal suppliers, M/s Seyani Brothers & Company (U) Limited, that the Applicant''s project was VAT-exempt and that VAT ought not to be charged on supplies made there to. These unequivocal confirmations, made by the Respondent both to the Applicant and directly to its suppliers, confirmed that the supplies to the Applicant would be exempt from VAT in accordance with the law.

The Applicant contended that during the course of construction, it''s suppliers nonetheless charged VAT on various invoices issued to the Applicant and annexed as "Annexure D". Faced with pressing commercial realities, including strict construction timelines and debt financing milestones tied to the successful completion of the project, the Applicant reluctantly paid the VAT component in order to maintain continuity of works and avoid disruption amounting to Shs. 4,064,860,158.

According to the Applicant, its application for a refund was disallowed on the basis that, since the supplies were exempt, the Applicant was not entitled to claim input VAT. The Respondent further advised that M/s Seyani Brothers & Company (U) Limited could issue credit notes and amend the affected returns to reflect exempt supplies, seemingly based on Section 22 of the Value Added Tax Act. However, this interpretation is legally flawed.

The Applicant cited Section 22 VAT Act, which provides:
"22. Adjustments
This section applies where, in relation to a taxable supply by a taxable person-
(a) the supply is cancelled;
(4) Subject to subsection (6), where the output tax actually accounted for exceeds the output tax properly chargeable in relation to that supply. the taxable person making the supply shall be allowed a credit for the amount of, the excess in the tax period in which the event referred to in subsection (1) occurred.
(5) The credit allowed under subsection (4) shall, for the purposes of this Act, be treated as a reduction of output tax."

The Applicant contended that Section 22 of the VAT Act applies strictly to taxable supplies. The Respondent has already acknowledged, in its previous correspondence and in its tax decision, that the supplies in question were exempt. Consequently, the requirement for suppliers to issue credit notes is a misapplication of the law, as credit notes would have been relevant if VAT was lawfully charged in the first instance.

The Applicant submitted that in the case of Target Well Control Uganda Limited v. Commissioner General, Uganda Revenue Authority (Civil Suit No. 751 of 2015), the High Court unequivocally held that VAT paid in error or as an overpayment is recoverable from URA, provided there is no evidence of the supplier''s deregistration and the tax was unlawfully collected. The tax laws make it clear that the collection of tax is the sole responsibility of the Respondent. Where a taxable person claimed VAT, it was the Respondent''s duty to take on the party that received the money from the person.

The Applicant submitted that it claimed VAT wrongly paid in error, entitling it to a refund under the law and specifically under section 40(3) of the Tax Procedure Code Act. The invoices, collectively marked as Annexure "D" to the application, conclusively demonstrate that the Applicant incurred and paid VAT on supplies that were exempt under the law, a position not disputed by the Respondent. The Respondent also contended that the Applicant''s suppliers should claim the VAT refund, since they paid and remitted the VAT to the Respondent.

The Applicant''s suppliers claiming a refund is not a prerequisite/condition for a VAT refund and is not provided for under the law. The Applicant has no mandate to compel its suppliers to claim a refund from the Respondent. The Respondent manages the tax ledger system, and any reconciliation or adjustments can be made on its own systems. The Applicant contended that it is entitled to a refund of VAT on the exempt supplies made during the construction of its hotel.

The Applicant prayed that the Tribunal order that:
(i) A declaration that the Applicant is entitled to a refund of the sum of Shs. 4,064,860,158 that was paid in error against invoices for the supply of VAT-exempt services and goods.
(ii) An order setting aside the objection decision of the Respondent, disallowing the Applicant''s application for the refund of Shs. 4,064,860,158 VAT paid in error.
(iii) General damages.

(iv) An order that the Respondent pay the costs of this application.

However, in the Respondent''s statement of reasons, the Respondent contends that the Applicant is not entitled to the relief sought. The Respondent asserted that the Applicant''s VAT registration took effect on 1 May 2023. On 24 January 2020, the Applicant sought guidance from the Respondent on the VAT exemptions for construction materials, and on 23 March 2020, the Respondent provided guidance based on the law.

The Respondent submitted that on 27 July 2020, the Respondent provided further guidance to one of the Applicant''s suppliers, Seyani Brothers and Company Uganda Ltd, advising them not to charge the Applicant VAT on the supplies in the letter marked "B". Despite the Respondent''s guidance, the Applicant claims that it received taxable supplies and paid VAT to its suppliers.

On 12 August 2024, the Applicant applied for a refund of Shs. 4,064,860,158 VAT paid in error. On 22 May 2025, the Respondent issued an objection decision disallowing the Applicant''s application for a refund on the grounds that the Applicant is not entitled to input VAT incurred on exempt supplies and the Applicant was advised to obtain credit notes from its suppliers. The Respondent further contends that the Applicant is not entitled to the claimed VAT refund.

The Respondent prayed for orders that:
(i) That Applicant is not entitled to the refund claimed.
(ii) This application is without any merit and should be dismissed with Costs to the Respondent.

Whether the supplies to the Applicant were exempt from VAT

It is not in dispute that the supplies made to the Applicant during the construction of its hotel fall within the ambit of Section 19(1) of the VAT Act, which provides that a supply is exempt if it is specified in the Second Schedule.

Paragraph 1(qq) of the Second Schedule to the VAT Act provides:
"The following supplies are specified as exempt supplies for the purposes of section 19-

(qq) the supply of services to conduct a feasibility study, design and construction; the supply of locally produced materials for construction of premises, infrastructure, machinery and equipment or furnishings and fittings which are not available on the local market to a hotel or tourism facility developer whose investment capital is at least eight million United States dollars and with a room capacity exceeding one hundred guests."

The Respondent itself, by its letters dated 23 March 2020 and 27 July 2020, expressly confirmed that the Applicant''s project qualified for VAT exemption and that suppliers ought not to charge VAT on supplies made to the Applicant. This was also an admission in the Respondent''s statement of reasons.

Accordingly, the Tribunal finds as a matter of fact and law that the supplies in question were exempt supplies, and no VAT was lawfully chargeable thereon.

Whether VAT paid on exempt supplies constitutes overpaid tax refundable under the law

However, despite the clear exemption, the undisputed evidence shows that Applicant''s suppliers charged VAT, and the Applicant paid a sum of Shs. 4,064,860,158. The legal consequence of VAT being charged on an exempt supply is that such tax is not tax properly due under the Act, and any amount paid in respect thereof constitutes tax paid in error or overpaid tax.

Section 40(3) of the Tax Procedures Code Act provides:
"40 (3) Where the Commissioner General is satisfied that tax has been overpaid, the Commissioner General shall-
(a) apply the excess in reduction of any other tax due from the taxpayer;
(b) apply the balance of the excess, if any, in reduction of any outstanding liability of the taxpayer; and
(c) refund the remainder, if any, to the taxpayer."

This provision creates a statutory obligation on the Respondent to refund tax that is established to have been paid in excess of what is legally due. This statutory obligation to refund overpaid tax is not discretionary.

Whether the Applicant, as opposed to the suppliers, is entitled to claim the refund

The Respondent contends that the Applicant is not entitled to a refund and that the Applicant''s suppliers ought to issue credit notes and seek adjustment. We do not agree.

First, the evidence shows that the economic burden of the tax was borne by the Applicant, who paid the VAT as part of the consideration for the supplies. There is no evidence that the Applicant recovered or passed on that VAT. Secondly, the statutory framework under section 40(3) of the Tax Procedures Code Act does not restrict the right to a refund to the person who remitted the tax, but rather to the person who has overpaid tax.

In the case of Commissioner General, URA v Edulink Holdings Uganda Limited & 2 Others, Civil Appeal No. 178 of 2021, the High Court affirmed that a taxpayer who demonstrates that tax has been paid in excess of what is legally due is entitled to a refund in accordance with the law. The court stated that:
"On the other hand, section 42 (3) to (5) of The Value Added Tax Act provides that a person may claim a refund of any output tax paid in excess of the amount of tax due under this Act for a tax period. In such cases, the taxable person is entitled to a refund immediately upon the Commissioner General being satisfied that the person has paid an amount of tax in excess of the amount due. Under this provision, the statutory right is conferred on the taxable person to get a refund of the excess tax paid upon the taxable person making a claim for refund".

The Court further stated that:
"In the Wealth of Nations, published in 1776, Adam Smith argued a tax system should have four characteristics: equity, certainty, convenience, and efficiency."

In this case, the Applicant has demonstrated that the supplies were exempt under the VAT Act yet charged and paid, and that such payment was in excess of any amount properly due. This was also admitted to by the Respondent in paragraphs 3 and 4 of their statement of reasons for the taxation decision.

Applying the reasoning in Edulink Holdings, once the Commissioner General is satisfied that the VAT was overpaid, as is the case here, the Applicant cannot be denied a refund on the basis that its suppliers, who acted contrary to both the law and the Respondent''s own guidance, charged VAT.

Whether the Applicant''s VAT registration status bars the refund

The Respondent further contended that the Applicant was not registered for VAT at the time the supplies were made.

We find that this argument is misplaced. The present claim is not one for input VAT credit under the VAT Act, which is contingent upon registration, but rather a claim for refund of tax paid in error under section 40 of the Tax Procedures Code Act.

In East African Investments Ltd v Uganda Revenue Authority HC Civil Appeal No. 0051 of 2020 (Commercial Division) (Mubiru J), the Court addressed issues of pre-registration transactions and emphasised that entitlement to tax relief cannot be defeated solely on the basis of registration status where the statutory conditions are otherwise satisfied.

Accordingly, the Applicant''s registration status does not extinguish its statutory right to recover tax that was not legally due. The Tribunal is guided by the principle that the tax authority ought not to retain monies that are not lawfully due. Further, As articulated in East African Investments (supra), the obligation to properly administer tax rests with the Respondent, and taxpayers should not be penalised for failures within the tax collection system.

To deny the refund in the present case would result in the Respondent retaining tax that was charged contrary to statute, paid under compulsion of commercial necessity, and not lawfully due. Such an outcome would offend the fundamental principles of equity, legality, and fairness in taxation.

In the result, and for the reasons set out above, this Application succeeds. The Tribunal accordingly makes the following orders:

(i) The objection decision of the Respondent disallowing the Applicant''s claim for a refund of Value Added Tax is hereby set aside.

(ii) The Applicant is entitled to a refund of the sum of Uganda Shillings Four Billion Sixty-Four Million Eight Hundred Sixty Thousand One Hundred Fifty-Eight (Shs. 4,064,860,158), being Value Added Tax paid in error on exempt supplies.

(iii) The Respondent is hereby directed, pursuant to section 40(3) of the Tax Procedures Code Act, 2014, to refund to the Applicant the said sum of Uganda Shillings Four Billion Sixty-Four Million Eight Hundred Sixty Thousand One Hundred Fifty-Eight (Shs. 4,064,860,158), being tax paid in excess of that legally due.

(iv) The Respondent shall pay interest on the said refund at the rate of 2% per month compounded, in accordance with section 36(1) of the Value Added Tax Act, such interest to accrue from the date of the Applicant''s application for the refund, being 12 August 2024, or from the date on which the Applicant submitted all information necessary to process the refund, whichever is later, and to run until the last day of the month in which the refund is made, subject to the provisions of section 36(5) of the Act.

(v) The Applicant is awarded the costs of this Application.
It is so ordered.

Dated at Kampala this 29th day of April 2026.', 'This ruling is a significant win for taxpayers in Uganda, particularly those who have erroneously paid VAT on exempt supplies. It reinforces the principle that the tax authority cannot retain monies not lawfully due, even if the error originated from suppliers charging VAT on exempt goods or services. The Tribunal''s reliance on Section 40(3) of the Tax Procedures Code Act, 2014, and the High Court''s decision in *Commissioner General, URA v Edulink Holdings Uganda Limited & 2 Others* is crucial, establishing that the right to a refund rests with the person who economically bore the tax burden, not just the remitter. This clarifies the refund mechanism for overpaid tax, distinguishing it from input VAT credit claims which are contingent on VAT registration. Tax practitioners should advise clients to meticulously document URA''s guidance on exemptions and to pursue refunds directly when VAT is erroneously charged on such supplies, irrespective of their VAT registration status at the time of the transaction.
*   Taxpayers can claim refunds for VAT erroneously paid on exempt supplies.
*   The right to a refund under Section 40(3) of the Tax Procedures Code Act is not restricted to the remitting party but to the party who bore the economic burden.
*   VAT registration status does not bar a claim for refund of tax paid in error, as this differs from an input VAT credit claim.', '2026-07-04 15:54:10.912022+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('73f11256-c936-4af4-b49b-1e3c462c8b4e'::uuid, 'TAT No. 089 of 2024', 'Grace Tumwine v Commissioner General', 2024, 'Income Tax', 'Partial', 'Partial relief granted. Tribunal upheld URA''s assessment on business income but struck down penalties imposed without proper notice under Section 52 of the Income Tax Act.', NULL, 'This ruling emphasizes that administrative penalties must comply with procedural fairness. While the underlying tax liability was upheld, the Tribunal struck down the penalties because URA failed to show detailed calculations and did not issue a warning notice. Taxpayers should always scrutinize the penalty assessment documents for procedural defects.', '2026-06-10 10:05:00.190142+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('753e77e5-b261-4fd0-886d-dfdf91c61280'::uuid, 'APPLICATION NO. 188 OF 2024', 'INTERNATIONAL SCHOOL OF UGANDA v UGANDA REVENUE AUTHORITY', 2025, 'Income Tax', 'Allowed', 'The Applicant, an exempt educational institution, earned interest from fixed deposits and declared it as exempt income. The Respondent assessed additional income tax, arguing that withholding tax (WHT) on fixed deposit interest is not a final tax for exempt organizations, unlike interest from treasury bills or government securities. The Tribunal ruled that WHT on interest paid by a financial institution to an exempt organization is a final tax under Section 139(a) of the Income Tax Act, and therefore, no further tax liability should be imposed.', 'This ruling is in respect of an application challenging an income tax assessment of Shs. 315,903,143 on interest paid to the Applicant in respect of fixed deposits held by the Applicant with a financial institution.

1. Background
The Applicant provides education services and was granted an income tax exemption by the Respondent for the period 2016-2020.

In 2016-2020, the Applicant earned interest of Shs. 1,053,010,485 from fixed deposit accounts with Stanbic Bank and declared this interest as exempt income. The Respondent issued assessments totalling Shs. 315,903,143 for the same period, arguing that withholding tax (WHT) on interest from fixed deposits is not a final tax under the Income Tax Act.

The Applicant objected contending that WHT on interest paid to exempt organizations should be treated as a final tax with no further liability.

The Respondent upheld the assessment stating that WHT as a final tax applies only to treasury bills and government securities under Section 139(a) of the Income Tax Act) and not to fixed deposits.

The Applicant was dissatisfied with the objection decision lodged this application before the Tribunal.

2. Representation
The Applicant was represented by Ms. Jackie Aturinda and Ms. Linda Mugisha while the Respondent was represented by Ms. Doreen Amutuhaire.

3. Submissions of the Applicant
The Applicant submitted that from July 2015 onwards, they were granted an Income Tax exemption by the Respondent for the period between 2016 and 2020. During the 2016-2020 period, the Applicant earned Shs. 1,053,010,485 as interest from fixed deposit accounts held with Stanbic Bank. The Applicant declared this interest as exempt income.

They asserted that the withholding tax (WHT) applied by Stanbic Bank on these interest payments constituted a final tax under Section 127 read with Section 139 of the Income Tax Act. Therefore, they argued that no further tax liability should be imposed on this income.

Interpretation of Section 139(a) of the Income Tax Act (ITA)
The Applicant submitted that Section 139(a) of the Income Tax Act required a person to withhold tax on any interest paid to another resident person and that Stanbic Bank withheld the tax on interest payments made to the Applicant and the same was remitted to the Respondent.

The Applicant further submitted that it was clear from the reading of Section 139 of the Income Tax Act that tax withheld on interest payments made by a financial institution to an exempt organization is a final tax.

The Applicant also submitted that substitution and amendment of the impugned provision in 2006 and 2008 did not restrict the finality of WHT on interest payments to only treasury bills and Government securities.

The Applicant contended that the Respondent''s interpretation, which restricts the finality of WHT to only interest from treasury bills and government securities when paid by a financial institution, overlooks the express wording and legislative intent of the Act.

Legislative History and Intent
The Applicant argued that the amendments to the Income Tax Act in 2006 and 2008 did not limit the finality of WHT on interest payments solely to treasury bills.

They stated that the original position under Section 123 of the 1997 Act treated WHT on interest paid by financial institutions to resident individuals, trustees, retirement funds, or exempt organizations as final. The 2006 amendment extended this finality to treasury bills, and the 2008 amendment further included other Government securities, suggesting an intent to broaden the scope of final tax treatment, not restrict it.

The Applicant also referred to the Explanatory Notes to the Income Tax Bill, 1997, which supported their interpretation that Section 123 applied to interest paid by a financial institution to a resident individual and exempt organizations as a final tax.

The Applicant cited Article 152(1) of the Constitution of Uganda, 1995 and submitted that it was trite law that no tax shall be imposed except under the authority of an Act of Parliament. They cited the case of URA v Siraje Hassan Kajura CA no. 26 of 2013 which cited the English case of Cape Brandy Syndicate v IRC (1992) KB1 stating he cardinal principle of interpretation of tax statutes is that in a taxing Act, one merely needs to look at what is said and that nothing is to be read in nor implied and that one can only look fairly at the language used.

The Applicant prayed for a declaration that the tax withheld at source by Stanbic bank is a final tax and the assessment is unlawful; a declaration that they are not liable to pay the assessed tax of Shs. 315,903,143; an order for the Respondent to refund the 30% amount paid with interest from the date it was deposited and to be awarded the costs of the suit.

4. Submissions of the Respondent
The Respondent submitted that the Applicant operates an international school that provides general education. The Applicant held an income tax exemption from the Respondent for the period between 2016 and 2020. The Respondent assessed the Applicant for Shs. 315,903,143.00 due to un-declared interest income earned from fixed deposits.

The Applicant objected to this assessment, arguing that WHT on interest from a financial institution to an exempt organization is a final tax, meaning no further tax liability. The Respondent reviewed and upheld the assessment, stating that withholding tax (WHT) on interest earned from fixed deposits is not a final tax.

The Respondent submitted that the burden of proof rests with the Applicant to demonstrate that the assessments raised by the Respondent are either incorrect or erroneous, and that the Applicant is not liable to pay the taxes.

Interpretation of Section 139(a) of the Income Tax Act (ITA)
The Respondent contended that Section 139(a) of the Income Tax Act considers withholding tax a final tax only on payments of interest on treasury bills or other government securities when paid by the Bank of Uganda or a financial institution to a resident individual or an exempt organization. They assert that fixed deposits do not fall under these categories.

The Respondent argues that Section 21(1)(f) of the Income Tax Act specifies that property income (including interest on fixed deposits) is not exempt unless specifically stipulated under the law or exemption certificates. Therefore, the interest earned by the Applicant on its fixed deposits, despite the withholding tax charged, does not fall under the exemptions or finality provisions of Section 139(a), as fixed deposits are neither treasury bills nor government securities.

The Respondent submits that the plain meaning of Section 139(a) must apply, and the law specifically limits the finality of WHT to interest earned from treasury bills or government securities. They argue that fixed deposits are not included, and thus, the withholding tax on interest earned from them does not qualify as final tax.

The Respondent also submitted that the Applicant''s exemption certificate does not cover property income such as interest from fixed deposits, and even if the Applicant is an exempt organization, income from fixed deposits remains taxable.

The Respondent emphasizes that the plain language of the statute must be adhered to, stating there is no ambiguity in this regard, and thus, the withholding tax on interest earned from fixed deposits does not qualify as final tax, and the Applicant must pay the assessed tax.

Property Income and Taxability
The Respondent submits that property income (including interest on fixed deposits) is not exempt unless explicitly stated under the law or exemption certificates, making the Applicant liable for the assessed taxes.

They maintain that the tax assessment of Shs. 315,903,143.00 is justifiable because the withholding tax on interest from fixed deposits does not meet the conditions for final tax treatment under Section 139(a) as it is not related to treasury bills or government securities. They conclude that the Applicant is liable to pay the taxes assessed, as the interest on fixed deposits does not qualify for final tax treatment.

The Respondent submits that the burden of proof rests with the Applicant to demonstrate that the assessments raised by the Respondent are either incorrect or erroneous, and that the Applicant is not liable to pay the taxes, or that the taxation decision should not have been made, or should have been made differently.

5. Submissions of the Applicant in rejoinder
In rejoinder, the Applicant reiterated their earlier submissions.

The Applicant submitted that the Respondent deliberately ignores the part of the same section which reads

''... or by a financial institution to a resident individual, ...or to an exempt organisation''.

The Applicant submitted that Section 139(a) of the ITA envisages two scenarios:

(i) The first being where an interest payment is made by the Bank of Uganda on treasury bills or other Government Securities to any person; and

(ii) The second where an interest payment is made by a financial institution to a resident individual, or to an exempt organisation.

The word ''or'' is a disjunctive, which denotes that tax withheld on the payment of interest by a financial institution to an exempt organisation is a final tax. Under Section 139(a) of the ITA, withholding tax is a final tax if paid in respect to treasury bills or other Government securities by the Bank of Uganda to any person or if paid by a financial institution to a resident individual, other than in the capacity of trustee, resident retirement fund, or to an exempt organization.

Regarding the Respondent''s submission that property income is not exempt from tax under section 21(1) (f) of the ITA, the Applicant submitted that it objected to the assessments on the ground that "the tax withheld on the payment of interest by a financial institution to an exempt organisation is a final tax and no further tax liability should be imposed on such income." Therefore, the Respondent is bound by the grounds upon which the assessments were raised and the objection decision was made.

6. The determination of the Tribunal
Having carefully considered the representations, evidence, and submissions presented by both parties, this is decision of the Tribunal.

The Applicant earned interest of Shs. 1,053,010,485 from their fixed deposits with Stanbic Bank. The Respondent argued that withholding tax (WHT) on fixed deposit interest was not a final tax. The Applicant objected, contending that WHT on interest paid to exempt organizations is a final tax. The Respondent upheld the assessment, asserting that final tax treatment applies only to treasury bills/government securities.

The tribunal is tasked with determining whether the tax withheld at source by Stanbic bank to the Applicant is a final tax.

The provisions that are at the heart of this dispute are sections 127 and 139 of the ITA.

Section 127 (1) of the ITA, provides as follows:

"...a resident person who pays interest to another resident person shall withhold tax on the gross amount of the payment at the rate prescribed in part ix of schedule 4 to this act."

In the present case, Stanbic Bank, a resident person, paid interest to the Applicant, another resident person. Therefore, Stanbic bank was required to withhold tax at a rate of 15%, which the bank rightfully withheld.

However, section 139(a) ITA provides:

"Where
(a) tax has been withheld under Section 127 on a payment of interest on treasury bills or other Government securities by the Bank of Uganda to any person, or by a financial institution to a resident individual, other than in the capacity of trustee, resident retirement fund, or to an exempt organization:

(b)

(c).

the withholding tax is a final tax, and –

(d)no further tax liability is imposed upon the taxpayer in respect of the income to which the tax relates...."

The Applicant argues that the tax withheld by Stanbic Bank was a final tax. On the other hand, the Respondent argues that the tax was not final and the Applicant ought to have declared the interest income and it should have borne additional tax at a rate of 30%.

It is therefore critical to analyse the import of section 139 of the ITA and examine the plain meaning of the provision (URA v. Siraje Hassan Kajura, SCCA No. 9 of 2015).

For tax withheld to be treated as a final tax under section 139, the transaction must fall within the two scenarios envisaged by the provision namely:

(i) The tax should have been withheld on the payment of interest on treasury bills or other government securities by the bank of Uganda to any person: OR

(ii) The tax should have been withheld by a financial institution to a resident individual, other than in the capacity of trustee, resident retirement fund, or to an exempt organization.

The two scenarios are alternate as they are separated by the conjunction "or".

The first scenario does not apply to the present facts as the interest payment in question did not arise from government securities.

The second scenario, which concerns payment by financial institutions is the relevant part of the provision that we must now apply ourselves to.

First, the payment must have been made by a financial institution, which was the case in the present case as Stanbic Bank is a financial institution. Secondly, the interest should have been paid to either:

(i) A resident individual; or
(ii) An exempt organisation.

The Applicant is not an individual, therefore, we should now establish whether they are an exempt organisation.

Section 2 of the ITA defines the term "exempt organisation" to mean:

"any company, institution or irrevocable trust-

(a) which is –
(i)...
(ii) a ...educational institution...

(b) which has been issued with a written ruling by the Commissioner General currently in force stating that it is an exempt organisation; and

(c) none of the income or assets of which confers, or may confer, a private benefit on any person;"

In the present case, the Applicant, an educational institution, was issued a written ruling by the Commissioner General, stating that it is an exempt organisation. This is as per the certificate of exemption exhibited as A1, A2 and A3 at pages 1-6 for periods 1 July 2015 to 30 June 2021 of the Applicant''s Trial Bundle.

The Respondent has not denied the issuance of the said exemption certificate. Therefore, it is reasonable to conclude that the Applicant is an exempt organisation within the meaning of section 2 of the ITA.

Having established the above, the logical conclusion is that the Applicant fulfils all the conditions contained in section 139 of the ITA. Therefore, the tax that was withheld by Stanbic bank from interest payments to the Applicant was a final withholding tax.

In line with section 139 (d) of the ITA, no further tax liability ought to be imposed on the Applicant in respect of the income to which the tax relates. Therefore, the Respondent''s assessment is not grounded in law.

We have taken note of the Respondent''s arguments that section 21 (f) of the ITA does not exempt property income from taxation. While that is true of section 21, it should be read in harmony with the other provisions of the ITA (Farid Meghani v URA, Civil Appeal No. 0006 of 2021).

In recognition of the non-exempt status of property income such as interest earned by the Applicant, section 127 imposes withholding tax on the said income. This tax was withheld by the Stanbic Bank.

The dispute before us is whether the tax on the said property income is a final tax or not. We have established that the tax is a final tax within the meaning of section 139 of the ITA. Therefore, the Respondent ought not have subjected the interest income to additional tax.

In the circumstance this application is allowed with costs to the Applicant.

Dated at Kampala this. 2nd day of July .2025.', 'This ruling clarifies a crucial aspect of withholding tax finality for exempt organizations in Uganda. The key takeaway is that WHT on interest from fixed deposits paid by a financial institution to an exempt organization is considered a final tax, preventing further assessment. This decision hinges on the interpretation of Section 139(a) of the Income Tax Act, which the Tribunal found to have a disjunctive ''or'' clause, separating interest from government securities from interest paid by financial institutions to exempt organizations. Tax practitioners should note the importance of the specific wording in tax statutes and the Tribunal''s emphasis on legislative intent over a restrictive interpretation. The main risk for URA is that this precedent limits their ability to levy additional income tax on such interest income for exempt entities.
*   **Key Practical Lessons:**
*   Exempt organizations should ensure their exemption certificates are valid and cover the relevant periods.
*   Carefully review the specific wording of Section 139(a) of the Income Tax Act regarding final tax treatment.
*   Understand the distinction between interest from government securities and interest from other financial instruments when assessing WHT finality.', '2026-07-04 20:25:53.931811+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('76a58821-95ef-42d7-805d-43641051432c'::uuid, 'TAT APPLICATION NO. 90 OF 2025', 'MICRO-HAEM SCIENTIFICS & MEDICAL SUPPLIES LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'Income Tax', 'Allowed', 'The Applicant challenged an income tax assessment arising from disallowed interest expenses under Section 25(3) of the Income Tax Act, which limits deductible interest to 30% of EBITDA for taxpayers in a group. The Respondent argued the Applicant was part of a group due to common shareholding and that the interest limitation applied to all debts. The Tribunal, relying on a High Court decision, found that Section 25(3) was not intended to apply to borrowings from independent third-party lenders, even if the taxpayer was part of a group. The Tribunal also noted the Applicant failed to prove its claimed tax exemption.', 'The Applicant challenges the Respondent''s income tax assessment of Shs. 706,657,213, arising from disallowed interest expenses pursuant to Section 25(3) of the Income Tax, which limits deductible interest to 30% of EBITDA for Taxpayers in a group.
...
85. Consequently, the High Court held that the Hansard indicates that Section 25(3) was not intended to apply to companies borrowing from sources outside the “group” as defined in Section 25(5) of the ITA. Specifically, Justice Patricia Kahigi Asiimwe stated:
“...this provision was not meant to apply to companies borrowing from sources outside the “group” defined in Section 25(5).”
86. In the present case, the Applicant stated that they borrowed the impugned funds from third-party lenders, namely SFC Finance Limited, based in Mauritius, and Stichting Medical Credit Fund (MCF), a foundation in the Netherlands, as well as from various local banks. The Applicant also stated that they locally acquired loan facilities from Standard Chartered Bank Uganda to the tune of Shs. 3,500,000,000 and USD 6,392,948. The Respondent has not disputed these facts.
87. In view of the above, to the extent that the Applicant''s borrowings were from third-party lenders, we are bound by the decision of the High Court in Moil Uganda Limited, which held that this provision was not meant to apply to companies borrowing from sources outside the “group” defined in Section 25(5).”
...
99. The Tribunal, however, finds that although the Applicant qualifies as a member of a group under Section 25(5) of the Income Tax Act, the impugned borrowings were obtained from independent third-party lenders outside the group structure. In light of the binding decision of the High Court in Moil Uganda Limited v Uganda Revenue Authority, Civil Appeal No. 0072 of 2024, the Tribunal finds that Section 25(3) was not intended to apply to third-party borrowings obtained from outside the group. Consequently, the Respondent improperly disallowed the Applicant''s interest expenses and unlawfully issued the additional assessment of Shs. 706,657,213.
100. Having found that Section 25(3) does not apply to the Applicant''s third-party borrowings obtained from outside the group structure, the Tribunal finds that the additional assessment issued by the Respondent cannot stand. The Applicant is therefore entitled to the remedies sought in the Application, including a refund of the statutory deposit paid under Section 15 of the Tax Appeals Tribunal Act. Under Section 27(1) of the Civil Procedure Act, Cap 282, costs follow the event unless the court or tribunal directs otherwise.', 'This ruling provides crucial clarity for Ugandan tax practitioners regarding the application of Section 25(3) of the Income Tax Act, particularly concerning interest deductibility. The key takeaway is that the interest limitation rule, intended to combat BEPS practices through intra-group financing, does not extend to loans obtained from independent third-party lenders. This aligns with the purposive interpretation of tax statutes, moving beyond strict literalism, as affirmed by the High Court in Moil Uganda Limited. Practitioners should, however, be mindful that the burden of proving any tax exemption remains strictly on the taxpayer, requiring concrete documentary evidence. The main risk or precedent is the URA''s continued broad application of Section 25(3) to all debts, which this ruling now limits.

*   **Purposive Interpretation:** The Tribunal emphasized the legislative intent behind Section 25(3) ITA, focusing on its anti-avoidance purpose for intra-group loans.
*   **Third-Party Loans Excluded:** Interest on borrowings from independent third-party lenders is not subject to the 30% EBITDA limitation under Section 25(3) ITA.
*   **Burden of Proof for Exemptions:** Taxpayers claiming exemptions must provide strict documentary proof; mere assertions or references are insufficient.', '2026-07-04 21:31:52.12564+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('7b021b98-16a4-496c-9d28-a9e4ae51827c'::uuid, 'TAT APPLICATION NO. 98 OF 2025', 'UGANDA TEA CORPORATION LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'WHT', 'Dismissed', 'The Applicant, a tea grower and processor, challenged a withholding tax assessment on brokerage fees paid to Kenyan firms for selling tea at the Mombasa auction. The Applicant argued that the services were not Uganda-sourced and that they did not directly pay the brokers, as the East African Tea Trade Association (EATTA) deducted fees from sales proceeds. The Tribunal dismissed the application, holding that the 2015 amendment to Section 78(d)(ii) of the Income Tax Act expanded the scope of WHT to include payments by resident persons to non-residents for services rendered anywhere, and that the Applicant was ultimately responsible for the payment, regardless of the EATTA''s role.', 'This Ruling is in respect of an application challenging the Respondent''s decision to assess a withholding tax amounting to Shs. 56,564,399 on brokerage fees paid by the Applicant to Kenyan brokerage firms.

The Applicant is a company duly incorporated and validly existing under the laws of Uganda and is engaged in the business of growing and processing tea, which is subsequently exported to Kenya for auction.

Following the audit, the Respondent issued an Audit Management Letter dated 3 February 2025 alleging that the Applicant had failed to withhold tax on payments made to Kenyan brokerage firms.

The Respondent consequently raised an assessment of Shs. 56,564,399, being 15% of the brokerage fees paid by the Applicant.

The Applicant, on 25 February 2025, objected to the WHT assessment on grounds that the brokerage fees are paid to auctioneers in Mombasa for the sale of tea conducted there, without any connection to Uganda and the Withholding tax is not applicable on the brokerage fees since the services are not rendered in Uganda, and the income is not sourced from Uganda.

At scheduling, the following issues were set down for determination by the Tribunal;
(i) Whether the Applicant is liable to pay the tax assessed?
(ii) What remedies are available to the parties?

... The Tribunal held:
"... section 78 (d) (ii)...was introduced by the Income Tax (Amendment) Act, 2015, which repealed the previous provision - section 78 (c)...which ...was narrower in scope than the current section 78 (d) (ii), as only income that arose from services rendered in Uganda was taxable on the non-resident person. Therefore, unlike the current section 78 (d) (ii), the provision would not apply where the services were rendered or performed abroad. Had this dispute related to brokerage fees paid before 2015, the fees would not have fallen within the source rules as they stood then... However, in 2015, the Legislature widened the scope of section 78 by repealing subsection (c) and replacing it with a catch-all provision. Under the new provision, section 78(d) (ii), it does not matter where the services are rendered. As long as a payment originates from Uganda and it is to a non-resident person for services rendered wherever, the Ugandan resident person is required to withhold... The Tribunal cannot depart from the literal rule of interpretation in favour of the golden rule when there is a clear intention of the Legislature to depart from the very position that the Applicant would like us to adopt."

... The Tribunal, as was the case in Rwenzori Commodities Limited (supra), rejects the argument that the Applicant is absolved from the duty to withhold since the payments were not directly made by them. The Tribunal held:
"It should also be noted that while the Applicant did not have physical custody of the funds from which the brokerage fees were deducted, the funds at all material times belonged to the Applicant, who had control over them as they arose from the sale of its tea. The economic reality or true essence of a transaction is more important than its legal or superficial appearance. In other words, the Tribunal shall consider the substance of the transaction over its form. Therefore, how the Applicant chooses to settle its obligations with the brokers, whether by a direct cash payment or offset, does not dispense with its withholding tax obligations."

Therefore, having evaluated the evidence, the Tribunal finds that the Applicant is liable to pay the withholding tax assessed and makes the following orders:
(i) The withholding tax assessment amounting to Shs. 56,564,399 is hereby maintained.
(ii) Costs are awarded to the Respondent.', 'This ruling reinforces the broad reach of Uganda''s withholding tax provisions, particularly for payments made by resident entities to non-resident service providers. The Tribunal''s emphasis on the ''substance over form'' principle and the legislative intent behind the 2015 amendment to Section 78(d)(ii) of the Income Tax Act (ITA) is a critical takeaway. Tax practitioners should advise clients that the physical location of service rendition is no longer the sole determinant for Ugandan-sourced income for WHT purposes, and that the ultimate economic responsibility for a payment, even if facilitated by a third party, can trigger WHT obligations under Section 137(1) and 142 of the ITA. The risk for taxpayers is failing to account for WHT on payments to non-residents where the funds originate from Uganda, regardless of the payment mechanism.

*   **Key Takeaway:** The source of income for WHT purposes is broadly interpreted to include payments by Ugandan residents to non-residents for services rendered anywhere.
*   **Main Risk:** Failure to withhold tax on payments to non-residents, even if a third party facilitates the payment, can lead to personal liability for the withholding agent.
*   **Relevant Acts/Sections:** Income Tax Act (Cap 340), Sections 4, 17, 78(d)(ii), 84, 137(1), 142.
*   **Practical Lesson 1:** Review all contracts with non-resident service providers to ensure WHT obligations are clearly addressed.
*   **Practical Lesson 2:** Understand the ''substance over form'' principle in tax matters; the economic reality of a transaction takes precedence over its legal or superficial appearance.
*   **Practical Lesson 3:** Even if a third party deducts fees, if the underlying funds belong to the Ugandan resident, the WHT obligation may still rest with the resident.', '2026-07-04 16:57:07.739486+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('7d19a3b2-cc66-4ee5-baf4-07b74ded4bc7'::uuid, 'TAT APPLICATION NO. 111 OF 2024', 'AFRICA GLOBAL LOGISTICS UGANDA LTD. v UGANDA REVENUE AUTHORITY', 2025, 'VAT', 'Dismissed', 'The Applicant challenged a VAT assessment after an ADR decision upheld it. The Respondent raised preliminary objections, arguing the application was time-barred and the 30% tax in dispute was not paid. The Tribunal found it lacked appellate jurisdiction over ADR decisions, citing High Court precedent, and dismissed the application. A dissenting opinion argued the application was timely, considering the ADR decision as the relevant ''taxation decision'', and noted the 30% payment was made.', 'THE REPUBLIC OF UGANDA
IN THE TAX APPEALS TRIBUNAL AT KAMPALA
TAT APPLICATION NO. 111 OF 2024
AFRICA GLOBAL LOGISTICS UGANDA LTD................................................APPLICANT
VERSUS
UGANDA REVENUE AUTHORITY................................................................RESPONDENT
BEFORE: MRS. STELLA NYAPENDI CHOMBO, MR. SIRAJ ALI,
MS. CHRISTINE KATWE
RULING
This ruling, is in respect of an appeal by the Applicant, challenging an ADR decision
issued by the Respondent''s ADR Committee.
Background
The Applicant is engaged in the business of providing customs clearing,
transportation, warehousing and freight forwarding services.
On 6th March 2012, following a review of the Applicant''s VAT declarations for the
period May to December 2011, the Respondent issued the Applicant with an
Administrative Additional VAT Assessment amounting to Shs. 562,362,124. This
additional assessment was issued by the Respondent because of a variance between
the total output VAT declared in the Applicant''s VAT Returns and the total input VAT
claimed by the Applicant''s VAT registered customers during the period May 2011 to
December 2011.
Following a review of an objection filed by the Applicant 10 years after the issuance of
the assessments, the Respondent disallowed the Applicant''s objection by a letter
dated 13th April 2023.
Dissatisfied with the objection decision, the Applicant filed an application under the
ADR procedure. On 19th April 2024, the Respondent''s ADR team delivered its decision
maintaining the entire VAT assessment of Shs. 562,362,124.
Dissatisfied with the ADR decision, the Applicant filed the instant application as an
appeal with the Tax Appeals tribunal.
Representation
At the hearing, the applicant was represented by Mr. Lusiba Derrick and Simon
Ssendikadiwa while the Respondent was represented by Mr. Kenan Aruho.
When the instant Application came up for hearing, the Respondent raised a
preliminary objection that the Application was filed outside the statutory period of 30
days, provided for under S. 16(1) (c) of the Tax Appeals Tribunal Act.
Issues
The following issues were set down for the resolution of the preliminary objection.
1. Whether the Application is time barred?
2. Whether the Application is bad in law for failure to pay the statutory sum of
30% of the tax in dispute?
3. What remedies are available to the parties?
Respondent''s Submissions
The Respondent submitted that the law relating to a party''s right to raise preliminary
points of law is provided for under Order 6 Rule 28 of the Civil Procedure Rules. The
Respondent also cited the decision in Mukisa Biscuit Manufacturing Co. Ltd v.
West End Distributors Ltd (1996) EA 696.
The Respondent submitted that S. 14(1) of the Tax Appeals Tribunal Act provides
that any person who is aggrieved by a decision made under a taxing Act by the Uganda
Revenue Authority may apply to the tribunal for review of the said decision.
The Respondent submitted further that S. 25(1) of the Tax Procedure Code Act, and
S. 16(1) (c) of the Tax Appeals Tribunal Act provide that a person dissatisfied with
an objection decision may within 30 days after being served with a notice of objection,
lodge an application with the Tax Appeals Tribunal for review of the objection decision.
The Respondent also cited Regulation 4(3) of the Tax Procedure Code (Alternative
Dispute Resolution) Regulations, 2023 which provides that where Alternative
Dispute Resolution is commenced between a taxpayer and the Commissioner, the
time within which the taxpayer is required to file an application with the tribunal or a
suit with the court shall not be affected by the Alternative Dispute Resolution
procedure.
The Respondent submitted that the above provisions of the law clearly set out the
mandatory timelines for a person dissatisfied with the decision of the Commissioner
to file an application in the Tax Appeals Tribunal. The Respondent also relied on the
decision in Uganda Revenue Authority v. Uganda Consolidated Properties
Limited, Court of Appeal Civil Appeal No. 75, where the court stated that timelines
set by Statutes are matters of substantive law and not mere technicalities and must
be strictly complied with.
The Respondent submitted that its communication dated 13th April 2023, constituted
a taxation decision and therefore time started to run from that date. The Respondent
submitted that the Applicant instead filed the Application for review of the taxation
decision on 16th May 2024, over a year later.
The Respondent relied on the decision in Cable Corporation (U) Ltd v. Uganda
Revenue Authority (supra) where the Court observed that the Respondent has no
powers to review its objection decisions once they have been made lest they lead to
undesirable effects.
Relying on the above authority the Respondent submitted that once a taxpayer objects
to a taxation decision and an objection decision has been made, any review of the
decision can only be made by the tribunal.
The Respondent also relied on the decision in CIC Africa (Uganda) Limited v. URA
(Civil Appeal No. 100 of 2023, where the court held that decisions emanating from
the Respondent''s ADR cannot be reviewed by the Tax Appeals Tribunal.
The Respondent submitted further that the instant application is not properly before
the tribunal as the Applicant has not paid the mandatory 30% of the tax in dispute as
required under S. 15 of the Tax Appeals Tribunal Act. In support of this submission
the Respondent cited the decision of the Supreme Court in Uganda Projects
Implementation and Management Centre v. Uganda Revenue Authority
Constitutional Appeal No. 2 of 1999.
The Respondent submitted that the application ought to be dismissed on the basis of
the above grounds.
Applicant''s Submissions
The Applicant submitted that it filed the instant application under the provisions of S.
14(1) of the Tax Appeals Tribunal Act, which provides that any person aggrieved by a
decision made under a taxing Act by the Respondent may apply to the tribunal for a
review of the decision. The Applicant submitted further that a taxation decision is
defined under S. 1 of the Tax Appeals Tribunal Act to mean any assessment,
determination, decision or notice while S. 1 of the Tax Procedures Code Act defines a
taxation decision as including a decision on any matter left to the discretion, judgment,
direction, opinion, approval, satisfaction or determination of the Commissioner other
than a decision made in relation to a tax assessment.
The Applicant cited S. 24(11) of the Tax Procedure Code Act which provides that a
taxpayer who is dissatisfied with a decision of the Commissioner may apply to the
Commissioner to resolve the dispute using Alternative Dispute Resolution. The
Applicant submitted that the ADR decision that was communicated to the Applicant on
19th April 2024 involved the exercise of discretion of the part of the Commissioner. The
Applicant submitted that the discretion in this case being either to uphold the VAT
assessment or vacate the whole assessment.
The Applicant submitted that the Respondent does not have clean hands. The
Applicant stated that all through the assessment and objection process the
Respondent has not complied with the timelines. The Applicant stated that it was
not served with the assessments although they were first issued in 2012 and only
found about them during the ledger reconciliation that commenced 10 years later. The
Applicant stated that although it filed an objection to the assessments on 1st November
2022 it only received the objection decision on 13th April 2023 after a period of more
than 4 months contrary to S. 24(6) of the Tax Procedures Code Act. The Applicant
stated further that it applied to ADR on 25th April 2023, but only received the ADR
decision on 19th April, 2024, more than 11 months after the application was filed. The
Applicant submitted that the Respondent cannot plead that the Applicant is time-
barred yet it has not complied with the timelines set by law.
Relying on the decision of the tribunal in Al Noor Tiles and Ceramics Ltd v. Uganda
Revenue Authority (Misc. Application No. 103 of 2023) and Sogea Satom Uganda
Ltd v. Uganda Revenue Authority (TAT Application No. 22 of 2023), the Applicant
submitted that in communicating the objection decision, the Respondent ought to have
informed the Applicant that an ADR Application did not affect the time within which a
taxpayer is required to file an appeal at the Tax Appeals Tribunal.
The Applicant submitted further that the facts of the decision in the Cable Corporation
Case, relied upon by the Respondent are distinguishable from the facts of the instant
case. The Applicant submitted that in the Cable Corporation Case, the Tax
Procedures Code Act had not yet been enacted with the result that the ADR
procedure was in existence.
The Applicant submitted that the facts of the decision in CIC Africa Uganda Limited
v. Uganda Revenue Authority Civil Appeal No. 100 OF 2023; are distinguishable
from the facts of the instant case and accordingly, the decision in the said case cannot
be applied to the instant case. The Applicant concluded its arguments by stating that
it filed the instant application on 16th May 2024, well within the 30 days statutory period,
disputing the ADR taxation decision communicated through the letter dated 19th April
2024.
The Applicant submitted that 30% of the tax in dispute was duly remitted to the
Respondent on 20th June 2024 vide Payment Registration No. 2240017938166.
In rejoinder to the Applicant''s submissions, the Respondent reiterated its earlier
submissions.
The Respondent rejoined that the Applicant''s objection was considered under the
provisions of S. 26(4) of the Tax Procedures Code Act which empowers the
Commissioner to grant an extension of time within which to object to a decision. The
Respondent stated further that S.26 (9) of the same Act provides for the extension of
time within which the objection decision can be made, where extensive review is
required. The Respondent submitted that in the instant case, the Applicant lodged its
objection after 10 years, which necessitated an extensive review and requests for
documentation, a fact the Applicant was at all material times aware of. The
Respondent rejoined that the strict timelines referred to within which an application to
TAT can be made started running from the date of the notice of objection which was
13th April 2023.
The Respondent rejoined that the facts of the decision in CIC Africa Uganda Limited
v. Uganda Revenue Authority (supra) are on all fours with the facts in the instant
case.
The Respondent rejoined further that the terms of its Charter have no effect
whatsoever on the provisions of statutory law, which provides no exceptions
whatsoever to the requirement to lodge an Application to the Tax Appeals Tribunal
within the stipulated timelines. The Respondent rejoined further that the ADR
Regulations were gazetted and published widely and consequently the Applicant was
well aware of the Regulations and their implication. The Respondent stated further
that ignorance of the law was no defence. The Respondent rejoined further that in any
event the tribunal had long confirmed the position that ADR did not affect the time
within which to apply to the Tax Appeals Tribunal. In support of this contention the
Respondent cited the decision in Conta Plast Ventures Limited v. Uganda Revenue
Authority.
Determination of the issues
The real question for determination in this application is whether the tribunal has
jurisdiction to entertain this application.
The applicant stated in its submissions that the instant application was filed as an
appeal against the decision of the Respondent''s ADR team.
The question which arises in light of the above submission is whether the tribunal has
appellate jurisdiction over the decisions of the ADR Committee.
Appellate jurisdiction or the power to hear appeals must be established by Statute.
In Attorney-General v. Shah (No. 4) 1971 1 EA 50, The Court of East Africa stated
as follows; "It has long been established and we think there is ample authority for saying that
appellate jurisdiction springs from statute. There is no such thing as inherent appellate
jurisdiction".
In the instant case, the Applicant has submitted that the tribunal derives the power to
hear this application by virtue of S.14 (1) of the Tax Appeals Tribunals Act.
S. 14 of the Tax Appeals Tribunals Act, states as follows;
14. Tribunal to review taxation decisions
(1) A person who is aggrieved by a decision made under a
taxing Act by-
a) The Uganda Revenue Authority; or
b) The Tax Agents Registration Committee established under the Tax
Procedures Code Act, may apply to the tribunal for a review of the
decision.
(2) The tribunal has power to review any taxation decision in respect of
which an application is properly made.
(3) A tribunal shall, in the discharge of its functions, be independent and
shall not be subject to the direction or control of any person or authority.
A statutory provision conferring appellate jurisdiction must expressly state that a
tribunal or a court shall have jurisdiction to hear matters on appeal from a specific
tribunal or court. Anything less would mean that such jurisdiction is being inferred or
implied.
In Baku Raphael Obudra & Another vs. Attorney General S.C.C.A No. 1 of 2005,
Odoki CJ (As he then was) restated the position set out in Attorney-General vs.
Shah (supra) as follows;
"It is trite law that there is no such thing as inherent appellate jurisdiction. Appellate jurisdiction
must be specifically created by law. It cannot be inferred or implied".
In the instant case, there is nothing in S. 14(1) above, which can be interpreted as
giving the tribunal appellate jurisdiction from the decisions of the Respondent''s ADR
Committee.
S. 14(1) of the Tax Appeals Tribunals Act, was enacted in the year 1998, to grant
the tribunal powers, to hear applications from the decisions, of the Commissioner
General of the Uganda Revenue Authority.
S. 26(11) of the Tax Appeals Procedure Code Act, which provides for the
Alternative Dispute Resolution Procedure, only came into force with the enactment
of the Tax Appeals Procedure Code Act in the year 2016.
We therefore do not agree with the Applicant that S. 14(1) of the Tax Appeals
Tribunal Act confers on the tribunal powers to hear appeals from the ADR Committee
of the Respondent.
Further, the High Court has clarified on the question, as to whether a taxpayer, can
challenge the outcome of the ADR procedure before the Tax Appeals Tribunal.
In CIC Africa (Uganda) Limited vs. Uganda Revenue Authority; High Court Civil
Appeal No. 100 of 2023, Hon. Lady Justice Patricia Kahigi Asiimwe stated as
follows;
"The above three grounds all raise one issue which is whether the Appellant could challenge
outcome of the ADR process. Having found that the Appellant could not lodge an objection
against the outcome of the ADR decision, it follows that the Appellant does not have the right
to apply to the Tribunal for review of that decision."
Considering ourselves bound by the above decision of the High Court and having
reached the conclusion that S. 14(1) of the Tax Appeals Tribunals Act, does not
confer appellate jurisdiction on the Tax Appeals Tribunal, in respect of matters
emanating from the Respondent''s ADR procedure, we find that the tribunal has no
jurisdiction to entertain this application. It is accordingly dismissed with costs.
IT IS SO ORDERED.
Dated at Kampala this 12th day of August 2025.
SIRAJ ALI
MEMBER
CHRISTINE KATWE
MEMBER', 'This ruling underscores the critical importance of adhering to statutory timelines for tax appeals in Uganda. Tax practitioners must advise clients that engaging in Alternative Dispute Resolution (ADR) under the Tax Procedures Code Act does not extend the 30-day period for filing an appeal with the Tax Appeals Tribunal (TAT) against an objection decision (S. 16(1)(c) of the Tax Appeals Tribunal Act). Furthermore, the TAT does not have appellate jurisdiction over ADR decisions, as clarified by the High Court in CIC Africa (Uganda) Limited v. URA. This means taxpayers must carefully consider the timing of their appeal to the TAT following an objection decision, irrespective of any ongoing ADR process.', '2026-07-04 14:32:24.175935+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('7d4f9a56-2f3a-4cbb-be43-2182bfcc8b93'::uuid, 'TAT APLICATION NO. 259 OF 2022', 'NGUVU DAIRY v UGANDA REVENUE AUTHORITY', 2025, 'VAT', 'Dismissed', 'Nguvu Dairy challenged a VAT assessment of Shs. 346,147,110, arguing that its supply of yoghurt was an exempt supply as ''processed milk'' under the VAT Act. The Uganda Revenue Authority (URA) contended that yoghurt, being a fermented product with additives, is not ''processed milk'' and is therefore a taxable supply. The Tribunal dismissed the application, ruling that yoghurt is not ''processed milk'' for VAT exemption purposes and upheld the URA''s assessment.', 'This ruling is in respect of an application challenging a VAT assessment of Shs. 346,147,110 arising from the treatment of yoghurt as a taxable supply for VAT purposes.

1. Background Facts
The Applicant processes and manufactures dairy products. The Respondent audited the Applicant for the period 1 July 2017 to 30 June 2021, following which the Respondent registered the Applicant for VAT effective 1 November, 2017 and issued a VAT assessment of Shs. 346,147,110.
The Applicant objected to the assessments on the ground that the company deals in processed milk products which are exempt supplies. The Respondent issued an objection decision disallowing the objection on the ground that yoghurt is not processed milk and is therefore not an exempt supply.

2. Issues for Determination
The key issue is whether the Applicant is liable to pay the assessed VAT.

6. Determination of the issues by the Tribunal
The dispute revolves around the classification of yoghurt – whether it is processed milk for VAT purposes. Under section 19 (1) of the VAT Act, read together with paragraph 1 (au) of the third schedule, the supply of processed milk is exempt from VAT purposes. Since 2017, the Applicant manufactured and sold yoghurt and did not charge VAT on the grounds that their supplies are VAT exempt as yoghurt is “processed milk”.
Therefore, the Shs. 346,147,110 question is – is yoghurt processed milk?
The VAT Act does not define the term “processed milk”. However, it is trite law that where a term is not defined, the words must be given their natural and ordinary meaning (Crane Bank v URA, Court of Appeal Civil Appeal No. 18 of 2010).
What is milk? Milk is the white liquid produced by cows, goats, and sheep and used by humans as a drink (https://dictionary.cambridge.org/dictionary/english/milk).
The term “process” means to prepare, change, or treat food or natural substances as a part of an industrial operation (https://dictionary.cambridge.org/dictionary/english/process).
Therefore, definition of the words “processed milk” can be derived from the above two definitions to mean the white liquid from cows, goats and sheep that has undergone some form of preparation, change or treatment.

Regulation 3 defines “processing of milk as:
“The treatment of raw milk by approved heating, fermentation or mechanical means to either increase its shelf life or turn it into a desired milk product.”

On the other hand, secondary processing of milk transforms raw milk into various dairy products. For example, fermentation changes milk into another product, called yoghurt. Therefore, while yoghurt is processed from milk, it is not milk. Similarly cheese, butter, ice cream, eshabwe and ghee are not milk.

Therefore, we agree with the Respondent that yoghurt is not processed milk and Applicant ought to have charged VAT at the standard rate of 18% on its yoghurt supplies. Therefore, the Respondent lawfully registered the Applicant for VAT effective from the time they ought to have registered as a VATable person.

In sum, the application is hereby dismissed and the Tribunal makes the following orders:
(i) The supply of yoghurt is not a supply of processed milk. Therefore, it is not an exempt supply within the meaning of section 19 of the VAT Act read together with paragraph 1 (au) of schedule three of the Act;
(ii) The tax as assessed by the Respondent stands;
(iii) Costs are hereby awarded to the Respondent.', 'This ruling provides crucial clarity on the interpretation of ''processed milk'' for VAT exemption in Uganda, particularly for the dairy industry. The Tribunal''s distinction between milk that has undergone primary processing (e.g., pasteurization) and milk transformed into a new product (e.g., yoghurt through fermentation) is a significant precedent. Tax practitioners should advise clients in the dairy sector to carefully review their product classifications against this ruling to ensure correct VAT application, as misclassification can lead to substantial retrospective assessments and penalties under the VAT Act and Tax Procedures Code Act. The case highlights the importance of strict interpretation of exemption provisions and the burden of proof on the taxpayer.
*   Exemptions are strictly construed; ''processed milk'' does not include fermented milk products like yoghurt.
*   The historical legislative intent shows that exemptions were for milk, not milk products.
*   Taxpayers must have a clear statutory basis for claiming exemptions, not relying on administrative interpretations or general industry practices.', '2026-07-04 15:50:05.067956+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('7e707a24-d7df-4a66-af13-bf99f3e15f19'::uuid, 'APPLICATION NO. 366 OF 2024', 'FINN CHURCH AID UGANDA v UGANDA REVENUE AUTHORITY', 2025, 'Other', 'Partial', 'The Applicant, an international non-governmental organization, challenged a stamp duty assessment of Shs. 53,880,000 on employment and supplier agreements. The Tribunal found that while stamp duty is chargeable on such agreements, the Respondent''s assessment was based on assumptions from PAYE and WHT returns without verifying the actual agreements. The Tribunal remitted the matter to the Respondent to re-compute the duty based on the actual agreements.', 'This ruling is in respect of an application challenging a stamp duty assessment issued to the Applicant in respect of employment and supplier contracts.

1. Background facts

The Applicant was registered in Uganda in 2014 as an international non-governmental organization working to support people in fragile and disastrous regions of Uganda. The Applicant is also an implementing agent of the United Nations High Commission for Refugees and also partners with the Office of the Prime Minister in the LEARN program.

On 27 September 2024, the Respondent issued to the Applicant an assessment of Shs.53,880,000 for stamp duty on employment and supplier agreements that were executed in the period 2014-2024.

On 5 October 2024, the Applicant objected to the assessment on the grounds that they did not have the numbers of employment and supplier contracts assessed and that the Stamp Duty Act does not specify the party that should bear the cost of stamp duty in respect to employment and supplier contracts.

On 4 November 2024, the Respondent issued its objection decision maintaining the assessment.

3. Issues

The main issue for determination is whether the Applicant is liable to pay the stamp duty as assessed by the Respondent.

7. The determination of the Tribunal

Having listened to the evidence and read the submissions of both parties, this is the decision of the Tribunal.

The Applicant contended that it is not liable to pay the stamp duty assessed on the grounds that Section 2 of the Stamp Duty Act read together with item 5 of the second schedule to the Act do not impose any liability or obligation on the Applicant to pay stamp duty for contracts executed either for employees or service providers. The Respondent argued that the Applicant executed employment and supplier contracts that accrued stamp duty worth Shs. 53,880,000 and is therefore liable to stamp duty.

S.2(1)(a) of the Stamp Duty Act provides:

"(1) Subject to this Act, the following instruments shall be chargeable with duty in accordance with Schedule 2 to this Act –

(a) Every instrument mentioned in schedule 2 to this Act which, not having been previously executed by a person in Uganda is executed by a person is executed in Uganda and relates to property situated, or to a matter or thing done or to be done, in Uganda."

Further, section 2 of the Stamp Duty Act defines an "instrument" to include:

"a document by which a right or liability is, or purports to be, created, transferred, limited, extended, extinguished or recorded".

The above definition of "instrument" is broad as it includes every document by which a right or liability is, or purports to be, created, transferred, limited, extended, extinguished or recorded. Thus, written contracts including employment and supply contracts fall within this definition as they create rights and liabilities.

In addition, section 3(1) imposes duty on all instruments listed in the second schedule to the Act that are executed in Uganda. In this regard, item 5 of the second schedule charges a flat duty of UGX 10,000 on every "agreement or memorandum of an agreement".

This item applies regardless of the subject matter of the agreement. The schedule encapsulates agreements of all kinds and makes them dutiable at the specified rate. Consequently, any written agreement executed in Uganda not otherwise exempted attracts this duty. The instrument is dutiable regardless of the income or profitability of the executors.

In Stanbic Bank Uganda v URA HCCS.No.92/2007, the court emphasized that stamp duty attaches to the instrument itself upon execution, not to the transaction or parties'' intent. Therefore, the Respondent''s power is limited to charging duty on the written document the moment it is signed as non-payment does not invalidate the contract. This affirms the general principle that written agreements are prima facie chargeable under the second schedule when executed.

Thus, each signed employment or supply contract automatically generated a duty irrespective of the party''s status or motive. The Applicant''s non-profit status or the fact that contracts might involve grants or service fees is irrelevant. This is because stamp duty is a tax that applies to documents and is not based on profit.

The Applicant has also submitted that the Respondent relied on PAYE returns and withholding tax returns to assess stamp duty and thereby made assumptions. By inference, the Applicant''s position is that the Respondent ought to have relied on the agreements to assess whether duty was paid or not.

According to section 28 of the Tax Appeals Tribunal Act, for a tax assessment, the burden is on the taxpayer to prove that the assessment is incorrect. Therefore, the onus was on the Applicant to demonstrate to this Tribunal, that the contracts underpinning the PAYE and withholding tax filings were charged with duty.

The Applicant has not discharged the burden.

That said, whilst information in PAYE and withholding tax returns is indicative of the existence of employment and supplier arrangements, the returns on their own do not specify the number of or the specific agreements that are dutiable. It is also worth noting that the Respondent did not request for the said agreements during review and only requested for them on 25 October 2025, a week before the objection decision was made. It is also worth noting that the agreements requested for span a ten-year period from 2014 – 2024 and the Applicant requested the Respondent for time to provide the same and this was not granted.

As stamp duty is chargeable in documents and not income or value of the transaction unless specified by the Stamp Duty Act, it is important for the Respondent to verify the documents liable to ensure completeness and correctness of the stamp duty assessment. Therefore, in the absence of the physical agreements, this Tribunal is unable to determine the accuracy of the assessed duty.

We now turn to the question as to who is liable to pay the stamp duty. The Applicant has argued that the Stamps Act does not assign the liability and of it does to the employer or contractor, that would be discriminatory.

Section 9 of the Stamps Act provides:

"The expense of providing the proper stamp shall be as set out in Schedule 3 to this Act."

In this regard, paragraph 1 of the third schedule to the Stamps Act provides:

"In the absence of an agreement to the contrary, the expense of providing the proper stamp shall be borne, in the case of an instrument described in Schedule 2 to this Act, by the person drawing, making or executing the instrument."

Therefore, the Applicant''s argument that the Act is silent on which party bears the duty cannot hold as the above provision states who bears the cost of stamp duty where the agreement is silent.

In the present case, the Respondent''s assessment was based on the assumption of the existence of employment and supplier agreements on account of the Applicant''s withholding tax and PAYE returns. Whilst in practice, both employment and supplier contracts are drawn and issued by the employer, it is important that the very existence and execution of the same is ascertained to enable the correct determination of the duty payable. Therefore, while we agree with the Respondent that employment and supplier contracts are chargeable with stamp duty at a rate of Shs.10,000 per agreement and that the duty is payable by the person who draws or makes the agreement, the dutiable agreements must be physically verified to enable the correct assessment of the stamp duty.

In light of the above, the Tribunal therefore makes the following orders:

(i) The assessment of Shs.53,800,000 is set aside;

(ii) The matter is hereby remitted to the Respondent to re-compute the duty based on the actual agreements underlying the PAYE and withholding tax returns that were reviewed by the Respondent;

(iii) The above exercise should be completed not later than 15 September 2025; and

(iv) Each party should bear their own costs.

Dated at Kampala this 18th day of August 2025.', 'This ruling highlights the critical importance of proper documentation and the burden of proof in tax assessments. While stamp duty is clearly applicable to employment and supplier agreements under the Stamp Duty Act, Cap 339, the Uganda Revenue Authority (URA) must base its assessments on verifiable instruments, not mere assumptions from other tax returns. Tax practitioners should advise clients to maintain meticulous records of all agreements, as the burden of proving an assessment incorrect lies with the taxpayer (Section 28 of the Tax Appeals Tribunal Act). The case also reinforces the principle that tax laws require clear words for taxation, and ambiguity benefits the taxpayer.
*   **Key Takeaway:** URA assessments must be based on actual, verifiable documents, not just inferences from other tax filings.
*   **Main Risk/Precedent:** Taxpayers risk having assessments upheld if they cannot produce the underlying documents to challenge URA''s assumptions.
*   **Practical Lessons:**
    *   Maintain comprehensive records of all employment and supplier agreements.
    *   Ensure stamp duty is paid on all dutiable instruments at the time of execution.
    *   Challenge assessments with specific evidence, not just general denials.', '2026-07-04 16:58:58.950499+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('7f3c6075-751f-450e-ba67-46a91d43e33f'::uuid, 'TAT APPLICATION NO. 276 OF 2024', 'LAGAN DOTT NAMANVE LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'Income Tax', 'Allowed', 'The Applicant challenged an income tax assessment and reduction of its declared tax loss by URA, which arose from a default assessment due to late filing, disallowance of professional fees, staff welfare, and management fees, and a VAT vs. Income Tax sales variance. The Tribunal overruled URA''s preliminary objection regarding the 30% payment rule, finding it inapplicable to tax loss disputes. The Tribunal found that URA did not sufficiently justify the disallowance of expenses or the recharacterization of the VAT variance as undeclared income, as the Applicant provided adequate documentation. Consequently, the Tribunal set aside the assessment and directed URA to recompute the tax loss.', 'I. Introduction
1. This application challenges an administrative default assessment amounting to Shs. 9,162,736,149 on grounds of failure to file the income tax return within the approved extension period and the basis of reducing the Applicant''s assessed tax loss from Shs. 24,713,932,424 to Shs. 19,298,229,285.

II. Background facts
2. The Applicant is engaged in infrastructure development. On 16 April 2024, the Respondent, the Uganda Revenue Authority (URA), issued an administrative default assessment against the Applicant for the year of income ending 30 June 2023 in the sum of Shs. 9,162,736,149. The assessment arose from the Applicant''s failure to file its corporate income tax return within the extended period granted by the Respondent.
3. The Applicant objected to the assessment on 28 May 2024. Thereafter, the parties held reconciliation meetings on 6 August 2024 and 21 August 2024, during which the Respondent requested supporting documentation from the Applicant. The Applicant provided, among other documents, bank statements, interim payment certificates, ledgers, and schedules relating to various expenditure items, including professional fees, staff welfare, advertising, and management fees.
4. Following the reconciliation process, the Respondent issued an objection decision on 4 September 2024. While part of the objection was allowed, the Respondent amended the assessment to Shs. 2,822,478,034.
5. The Applicant was dissatisfied with the objection decision for two principal reasons. First, it contended that the Respondent introduced a new issue concerning an alleged variance of Shs. 26,379,704,449 between sales declared in the Applicant''s VAT returns and those declared in its income tax returns, yet this issue had neither been raised nor discussed during the objection process.
6. Secondly, the Applicant disputed the disallowance of business expenses amounting to Shs. 7,742,488,088, including professional and tax advisory fees of Shs. 2,888,000,885, staff welfare expenses of Shs. 275,964,341, and management fees paid to Lagan Group Limited amounting to Shs. 1,936,901,419. The Applicant maintains that adequate supporting documentation for these expenses was provided to the Respondent during reconciliation.
7. It is against that background that the Applicant filed the present application before the Tribunal.

VII. The Determination
50. Before addressing the substantive issues, the Tribunal notes that the Respondent''s position evolved considerably during the objection and mediation processes. The original default assessment of Shs. 9,162,736,149 was subsequently reduced at the objections and appeals stage to Shs. 2,822,278,034, and during mediation, the Respondent further accepted that the Applicant had incurred a tax loss of Shs. 19,298,229,285. Consequently, the live dispute before the Tribunal ultimately narrowed to:
a. the treatment of the VAT variance as undeclared income; and
b. the disallowance of professional fees, staff welfare expenses, and management fees amounting to approximately Shs. 5.4 billion.

Preliminary Issue: Whether the application was incompetent for failure to pay 30% of the tax assessed
52. The Respondent raised a preliminary objection contending that the application was incompetent for failure by the Applicant to comply with section 15 of the Tax Appeals Tribunal Act, which requires payment of 30% of the tax assessed or the tax not in dispute before commencement of proceedings before the Tribunal.
53. We have considered the objection together with the authorities cited by both parties. The present dispute principally concerns the reduction of the Applicant''s declared tax loss from Shs. 24,713,932,424 to Shs. 19,298,229,285. Although the Respondent initially issued a default assessment, the mediation process substantially altered the parties'' positions, and the dispute ultimately crystallised around the treatment of the disallowed expenses and the reduction of the assessed loss.
54. In our view, where the dispute substantially concerns the adjustment or reduction of a tax loss rather than a crystallised tax liability immediately payable by the taxpayer, the application of the 30% requirement must be considered in light of the circumstances of the case. In Fuelex Uganda Limited v Uganda Revenue Authority (Constitutional Petition No. 3 of 2009), it was established that the 30% requirement is a condition precedent to the tax becoming due and payable. Where a taxpayer is in a loss position, there is no immediately payable tax liability to which a 30% calculation can be applied. In the circumstances of this case, where the dispute principally concerns the reduction of a declared tax loss rather than an immediately payable tax liability, the Tribunal is not persuaded that the application is rendered incompetent by non-payment of the 30% requirement.
55. Accordingly, we find that the preliminary objection lacks merit and it is hereby overruled.

Issue (i): Whether the administrative additional income tax assessment was valid?
A. The VAT vs. Income Tax Variance
56. The Respondent adjusted the Applicant''s income by adding back Shs. 26,379,704,449 on the basis of a variance between sales declared in the Applicant''s VAT returns and those declared in the income tax return, treating the variance as undeclared income liable to tax. The Applicant contended that this issue was introduced after the reconciliation process and did not form part of the original matters communicated during the objection proceedings. The Applicant further maintained that it was not afforded a sufficient opportunity to reconcile or explain the variance prior to the objection decision.
57. We have considered the evidence and submissions of both parties on this issue. While the Respondent established that a variance existed between the VAT declarations and the income tax return, no reconciliation schedules, transaction analysis, or supporting documentation were produced to demonstrate that the entire variance constituted undeclared taxable income. The evidence before the Tribunal did not sufficiently demonstrate how the Respondent concluded that the variance represented undeclared sales as opposed to possible accounting or timing differences arising from accrual treatment, advance payments, credit notes, or differences in recognition under the VAT and income tax regimes.
58. In Standard Chartered Bank (U) Ltd v URA (TAT Application No. 22 of 2017), the Tribunal observed that a variance between accounting records does not automatically translate into taxable income unless the Revenue Authority establishes the factual and legal basis for treating the difference as income chargeable to tax. Similarly, in Tullow Uganda Operations Pty Ltd v Uganda Revenue Authority (TAT Application No. 4 of 2011), the Tribunal emphasised that the Commissioner''s power to issue an assessment is not an unfettered license to estimate liability without an objective foundation. Where a taxpayer produces audited accounts and supporting financial records, the Revenue Authority must demonstrate the factual basis upon which the assessment is anchored.
59. The Respondent relied on section 117 of the Income Tax Act to justify recharacterisation of the variance as undeclared income. While section 117 empowers the Commissioner to recharacterize transactions or amounts in appropriate circumstances, the exercise of that power must be supported by evidence demonstrating why the impugned amounts ought properly to be treated as taxable income. In the present case, the Respondent did not place before the Tribunal sufficient evidence to justify recharacterisation of the variance as undeclared income.
60. The Tribunal further notes that the evidence before it did not sufficiently demonstrate that the Applicant was specifically afforded an opportunity during the objection process to reconcile or explain the variance before the adjustment was confirmed in the objection decision. In Meera Investments Ltd v Commissioner General URA [2007] HCT-00-CC-CA-0003, the High Court underscored the importance of procedural fairness in tax administration.
61. In the circumstances, the Tribunal is unable to find a sufficient evidential basis for the addition of Shs. 26,379,704,449 as undeclared income.

B. Professional and Tax Advisory Expenses
62. The Respondent disallowed professional and tax advisory expenses amounting to Shs. 3,202,837,380 on the ground that the expenditure was unsupported. The Applicant, through the evidence of its witnesses, maintained that the expenditure related to audit, tax, legal, engineering, and consultancy services provided by firms including Mott MacDonald, Ernst & Young LLP, PKF-FPM, and Carson McDowell LLP. In support of the claim, the Applicant produced invoices, ledgers, explanatory schedules, contractual documentation, and audited financial records contained in Exhibits "B", "C", "K1", and "K2". The Tribunal notes in particular that the schedules and invoices identified the nature of the professional services rendered, the service providers involved, and the corresponding accounting treatment adopted by the Applicant.
63. Section 22(1)(a) of the Income Tax Act permits the deduction of expenditure incurred in the production of income. The applicable inquiry is whether the expenditure bears a sufficient nexus to the carrying on of the taxpayer''s business. This principle was recognised in Magna Alloys & Research Pty Ltd v FC of T (1980) and similarly applied in Okello Okello v Commissioner General, URA HCCS No. 229 of 2010.
64. Having considered the evidence on record, the Tribunal is satisfied that the Applicant produced sufficient documentary material demonstrating both the nature and business purpose of the disputed expenditure. The invoices, ledgers, contractual schedules, and accounting explanations contained in Exhibits "B", "C", "K1", and "K2" established a clear connection between the expenditure incurred and the Applicant''s infrastructure development activities. The Tribunal further notes that the audited accounts prepared by PKF Uganda reflected the disputed expenditure within the Applicant''s recorded project costs for the relevant year of income. In particular, the evidence of Hamza Mukasa Ssali explaining the amortisation of the contractual costs over the relevant accounting period was not substantially challenged or rebutted by the Respondent.
65. While the Respondent questioned the adequacy of the supporting documentation, it did not demonstrate that the services in question were fictitious, unrelated to the Applicant''s business operations, or otherwise prohibited under the Income Tax Act. The Tribunal further notes that the Respondent did not place before it any contrary reconciliation, analysis, or evidence that would displace the documentation produced by the Applicant. In our view, the evidence produced by the Applicant established a prima facie basis for the deductions claimed and sufficiently demonstrated the requisite nexus between the expenditure and the carrying on of the Applicant''s business.
66. Accordingly, we find that the Respondent did not sufficiently justify the disallowance of the professional and tax advisory expenses.

C. Staff Welfare Expenses
67. The Respondent disallowed staff welfare expenses amounting to Shs. 275,964,341 principally on the basis that the Applicant had not demonstrated compliance with PAYE obligations in respect of certain accommodation and welfare benefits.
68. The evidence before the Tribunal, including the reconciliation schedules, PAYE records, and Table "C" referred to by Hamza Mukasa Ssali and Gerard Anthony Cawley, showed that expenditure amounting to UGX 245,897,373 had already been voluntarily disallowed by the Applicant in its own tax computation. The same documentation further demonstrated that accommodation expenses amounting to Shs. 91,234,198 had been subjected to PAYE declarations.
69. The Tribunal agrees with the Respondent that employers are under a statutory obligation to account for PAYE where taxable employment benefits arise. However, the deductibility of expenditure under section 22 of the Income Tax Act is distinct from liability arising under the PAYE regime. As recognized in Kasese Cobalt Company Limited v URA (HCCA No. 4 of 2020), the treatment of employment benefits for PAYE purposes does not necessarily determine whether the expenditure is deductible for corporate income tax purposes.
70. In the present case, the Respondent did not demonstrate that the expenditure itself was fictitious, unrelated to the Applicant''s business operations, or otherwise non-deductible under the Income Tax Act. The evidence before the Tribunal, particularly the reconciliation schedules and PAYE records referred to in Table "C", further showed that part of the impugned expenditure had already been voluntarily adjusted by the Applicant, while another portion had been declared for PAYE purposes. In those circumstances, the Tribunal is unable to find a sufficient factual basis for the wholesale disallowance of the expenditure.
71. To the extent that any PAYE non-compliance existed, the appropriate remedy lay in enforcement under the PAYE provisions rather than outright disallowance of the expenditure for corporate income tax purposes. We therefore find that the Respondent did not establish a sufficient basis for the impugned disallowance of the staff welfare expenses.

D. Management Fees
72. The Respondent disallowed management fees amounting to Shs. 1,936,901,419 on the ground that there was a risk of duplication with the pre-establishment and post-establishment costs already allowed by the Respondent.
73. The Applicant, through the evidence of Hamza Mukasa Ssali and the supporting EFRIS invoices and schedules contained in Exhibit "F", explained that the management fees related to reimbursements made to Lagan Group Limited for consultancy and project implementation services incurred during execution of the project. The Applicant distinguished these expenses from the pre-establishment and post-establishment costs, which it maintained related to services rendered during the project inception and financing stages.
74. The Tribunal has considered the explanations advanced by both parties together with the supporting invoices, schedules, and EFRIS documentation placed before it. Although the Respondent expressed concern regarding possible duplication of expenditure, no direct evidence was produced demonstrating that the same invoices, transactions, or consultancy costs had in fact been claimed twice.
75. The Applicant further relied on the EFRIS invoices contained in Exhibit "F", which bore identifiable fiscal document numbers capable of independent verification within the Respondent''s own EFRIS system. The Tribunal notes that while the existence of EFRIS invoices does not automatically establish deductibility, such records nevertheless formed part of the documentary trail supporting the Applicant''s explanation that separate invoices existed for the management fees and the pre-establishment costs.
76. In the absence of evidence demonstrating actual duplication within the EFRIS records or other accounting documentation, the Tribunal is unable to uphold the disallowance solely on the basis of perceived similarity in the description of the expenses. The Respondent''s concern remained largely speculative and was not supported by documentary verification or transaction analysis establishing double claiming of the expenditure.
77. We therefore find that the Respondent did not sufficiently justify the disallowance of the management fees.
78. The Tribunal has considered the specific adjustments that ultimately formed the basis of the Respondent''s revised assessment of Shs. 2,822,278,034. These adjustments primarily arose from treating the VAT variance as undeclared income and disallowing professional fees, management fees, and staff welfare expenses.
79. There is no dispute that the Respondent was entitled to audit the Applicant''s affairs, question documentation, reconcile variances, and revise the Applicant''s tax position where necessary. However, the exercise of those powers must be supported by a sufficient factual and evidential foundation. In Tullow Uganda Operations Pty Ltd v Uganda Revenue Authority (TAT Application No. 4 of 2011), the Tribunal emphasised that the Commissioner''s power to issue an assessment is not an unfettered license to estimate liability without an objective basis. Where a taxpayer produces audited accounts, invoices, schedules, and financial records, the Revenue Authority must demonstrate, through objective analysis, why the taxpayer''s material ought not to be accepted.
80. The Respondent relied on Williamson Diamonds Ltd v Commissioner General (2008) in support of the argument that the burden of proof remained throughout on the taxpayer. The Tribunal agrees that the legal burden rests on a taxpayer to demonstrate that an assessment is excessive or incorrect. In the present case, however, the Applicant did more than merely assert that the disputed expenditure was deductible. Through its witnesses and documentary exhibits, including invoices, ledgers, audited accounts, payment schedules, reconciliation schedules, and accounting explanations, the Applicant produced prima facie material explaining both the nature of the expenditure and its connection to the Applicant''s business operations.
81. Once such material was placed before the Respondent, it became necessary for the Respondent to properly evaluate the documentation and provide a reasonable evidential basis for rejecting it. This approach is consistent with the reasoning in URA v Balondemu David, Civil Appeal No. 0002 of 2023, where the court recognised the Revenue Authority''s obligation to evaluate and rebut documentary material produced by a taxpayer.
82. Although the Respondent questioned the adequacy of the Applicant''s documentation and raised concerns regarding possible duplication and undeclared income, no sufficient evidence was placed before the Tribunal demonstrating that the disputed expenses were fictitious, duplicated, or unrelated to the Applicant''s business operations. In several instances, the disallowances appear to have been based on perceived inconsistencies or suspicion without corresponding documentary verification or reconciliation analysis.
83. Having considered the evidence as a whole, the Tribunal is unable to find a sufficient evidential basis for the Respondent''s reduction of the Applicant''s declared tax loss from Shs. 24,713,932,424 to Shs. 19,298,229,285. The underlying adjustments giving rise to the revised assessment of Shs. 2,822,278,034 were therefore not sufficiently justified, and the resultant assessment cannot be sustained.

VIII. ORDERS
87. For the reasons stated above, the Tribunal makes the following orders:
(i) A declaration is hereby made that the Respondent did not sufficiently justify the reduction of the Applicant''s assessed tax loss from Shs. 24,713,932,424 to Shs. 19,298,229,285.
(ii) The objection decision dated 4 September 2024, together with the resultant additional income tax assessment of Shs. 2,822,278,034 is hereby set aside.
(iii) The Respondent is directed to recompute the Applicant''s assessed tax loss in accordance with the findings contained in this ruling, taking into account the adjustments voluntarily conceded by the Applicant during mediation.
(iv) Each party shall bear its own costs.', 'This ruling reinforces the critical importance of procedural fairness and the evidential burden on the Uganda Revenue Authority (URA) when making tax assessments, even where a taxpayer initially defaults. While the burden of proof generally rests with the taxpayer to demonstrate an assessment is excessive (Section 18, Tax Appeals Tribunal Act), this case clarifies that once a taxpayer provides prima facie evidence and supporting documentation, the URA must provide a reasonable evidential basis for rejecting it. The Tribunal''s decision to overrule the 30% payment requirement in cases primarily concerning tax loss adjustments, rather than immediate tax liability, is a significant precedent for taxpayers in similar situations, aligning with the principle established in *Fuelex Uganda Limited v Uganda Revenue Authority (Constitutional Petition No. 3 of 2009)*.

Key practical lessons:
*   **Documentation is paramount:** Taxpayers must maintain comprehensive records for all claimed expenses.
*   **Procedural fairness:** URA must afford taxpayers adequate opportunity to reconcile and explain variances.
*   **30% rule clarity:** The 30% payment rule may not apply where the dispute is primarily about a tax loss, not a payable tax liability.', '2026-07-04 21:29:27.761438+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('7fd63b2b-8659-4c81-95ed-364fb972dfc1'::uuid, 'TAT APPLICATION NO. 207 OF 2023', 'AFRICA RENEWAL MINISTRIES LIMITED v UGANDA REVENUE AUTHORITY', 2025, 'WHT', 'Allowed', 'The Applicant, a non-profit organization, received land as a gift in June 2019. The Respondent assessed 6% withholding tax on this transaction, treating it as a purchase. The Tribunal found that the property was a gift, not a purchase, and therefore not subject to withholding tax. Additionally, the High Court had previously ruled that the Respondent''s objection decision was invalid due to its ambiguity and failure to comply with statutory requirements. Consequently, the Tribunal set aside the withholding tax assessment.', 'THE REPUBLIC OF UGANDA
IN THE TAX APPEALS TRIBUNAL AT KAMPALA
TAT APPLICATION NO. 207 OF 2023
AFRICA RENEWAL MINISTRIES LIMITED................................................APPLICANT
VERSUS
UGANDA REVENUE AUTHOURITY.......................................................RESPONDENT
BEFORE: MS. PROSCOVIA R. NAMBI, MS. KABAKUMBA MASIKO, MS. GRACE SAFI
RULING
This ruling is in respect of an application challenging an assessment of Shs. 54, 000,000 being withholding tax on land acquired by the Applicant by gift. Further, the High court of Uganda made a decision invalidating the Respondent''s objection decision.
1. Background Facts
The Applicant is a non-profit, non-governmental organization established under Ugandan law, and it carries out evangelism across the country. On 19 September 2019, the Howie Christian Charitable Trust and the Applicant executed a gift deed, in which the Trust donated property located at Leasehold Register Volume 3026 Folio 8 Main Street, Iganga, measuring approximately 0.231 hectares. Subsequently, on 7 July 2020, the Respondent issued a notice of assessment for Shs. 54,000,000, representing a 6% withholding tax on the purchase of said property.
On 10 July 2020, the Applicant objected to the assessment on the grounds that the land in question was a gift, not a purchase. On 7 October 2020, the Respondent issued a decision on the objection, rejecting it and upholding the initial assessment, along with an additional assessment.
...
Conclusion:
The Tribunal therefore finds that the property in question was indeed gifted to the Applicant, not purchased, and therefore does not attract withholding tax. The Tribunal is bound by the decision of the High Court that the Respondent''s objection decision dated 7 October 2020 is invalid due to its ambiguity and failure to comply with statutory requirements.
The Tribunal orders as follows:
i. This Application is accordingly allowed.
ii. The withholding tax assessment of Shs. 54,000,000 is hereby set aside.
iii. Costs of this application are awarded to the Applicant.
Dated at Kampala this 11th day of April 2025.', 'This ruling reinforces the critical distinction between a ''gift'' and a ''purchase'' for withholding tax purposes in Uganda, particularly concerning business assets. Tax practitioners should note that the Income Tax Act''s provisions for withholding tax on the purchase of business assets (Section 118B(2), now Section 130(2)) do not apply to genuine gifts where no monetary consideration is exchanged. The case also highlights the importance of clear and unambiguous objection decisions from the Uganda Revenue Authority (URA), as an invalid objection decision can lead to the setting aside of assessments. The Tribunal''s adherence to the High Court''s finding on the invalidity of the URA''s objection decision underscores the procedural fairness expected in tax administration.

Key practical lessons:
*   **Document Gifts Clearly:** Ensure gift deeds and resolutions explicitly state ''no monetary consideration'' to avoid misclassification as a purchase.
*   **Timing of Legislation:** Be mindful of the effective dates of tax law amendments; retrospective application is generally not permitted unless expressly stated.
*   **URA Objection Decisions:** Challenge ambiguous or non-compliant objection decisions, as they can be deemed invalid, impacting the entire assessment process.', '2026-07-04 16:22:49.110954+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('84b30a92-9db8-43b6-8ec7-837f8e21525a'::uuid, 'TAT ARU NO. 002 OF 2024', 'MAN ENGINEERING UGANDA LIMITED v UGANDA REVENUE AUTHORITY', 2026, 'VAT', 'Allowed', 'The Applicant challenged a VAT assessment of Shs. 718,139,648 for the period 2014-2019, issued by the Respondent for failure to file VAT returns. The Applicant argued that no business was conducted during this period due to the unavailability of its directors (one arrested, one ill and deceased, one departed the country) and an inactive bank account. The Tribunal found that the assessment was an estimate lacking legal basis, as the Applicant had provided sufficient evidence to show no taxable supplies were made. The Tribunal set aside the VAT assessment, ordering the Applicant to only pay the penalty for failure to file returns.', 'The Applicant, being aggrieved, challenges the Respondent''s assessment of Value Added Tax (VAT) of Shs.718,139,648 for the period between 20214 to 2019, which the Respondent issued for a failure to file VAT returns.

The Applicant objected to the assessments on the grounds that they did not conduct any business in the period and could not file returns following the arrest and detention of Mr. Asea Geoffrey, one of the Directors, the illness of the 2nd Director, Adiga Pastori for a long period, followed by his death and the departure of Andama Jimmy to South Sudan in 2014.

The Respondent requested the Applicant to provide supporting documentation for the objection raised, which included bank Account statements, detention letters and others. The Applicant provided a Bail Bond form for Mr. Asea Geoffrey, who was released on bail on 17 September 2018. The Applicant also provided a letter from Centenary Bank dated 6 September 2024 confirming that the account was inactive and had been closed by the system due to prolonged inactivity. No Bank statement was available. During submissions, the applicant also provided a death Certificate confirming the death of Adiga Pastori, one of the Directors.

The Respondent resolved to disallow the Applicant''s objection due to the Applicant''s failure to provide the Bank statement for the period assessed, and hence maintained the VAT assessment.

Under Section 5 of the Value Added Tax Act, a person is liable to pay Value Added Tax in case of a taxable supply, but in the instant Application, no supply was made by the Applicant during the period of assessment 2014 to 2019, hence there is no legal basis for the assessment.

Section 65 (2) (a) and (b) of the Value Added Tax Act provides that where a person fails to lodge a return within the required time under this Act, that person is liable to pay a penalty. Therefore, the Applicant is only entitled to pay the penalty for failure to file the tax returns.

The Tribunal therefore concludes and recommends that it is just, fair and proper that the Applicant pays the penalty for failure to file the tax returns.

In the circumstances, this Application is allowed, and the Tribunal makes the following orders:
(i) The assessment of Shs.718,139,648 is untenable and is hereby set aside.
(ii) The Applicant is to be assessed by the Respondent to pay the penalty for failure to file VAT returns for the period 2014 to 2019 using the formula required by law.
(iii) Each party to bear their own costs.', 'This ruling reinforces a critical principle in Uganda tax law: a tax assessment must have a legal basis, and where no taxable supplies are made, only penalties for non-filing may apply, not a substantive tax liability. Tax practitioners should note the Tribunal''s emphasis on the burden of proof, which, while generally on the taxpayer to prove an assessment is excessive, can be discharged by demonstrating the absence of taxable activity. The case also highlights the importance of maintaining records, even during periods of inactivity, and the limited scope of the 30% deposit rule under Section 15(1) of the Tax Appeals Tribunal Act, which does not apply when the legality of the assessment itself is in dispute.

*   **Key Takeaway:** No taxable supply, no VAT liability, only penalties for non-filing.
*   **Risk/Precedent:** URA cannot levy VAT based on mere estimation if the taxpayer proves no taxable activity.
*   **Relevant Acts:** Section 5, 18(1), 65(2) of the VAT Act, Cap. 344; Section 15(1), 19 of the TAT Act; Section 16(1), 26(2) of the Tax Procedures Code Act.', '2026-07-04 15:48:18.226959+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('85f7d25d-0abb-4c4e-a6ec-de07425e3733'::uuid, 'APPLICATION NO. 348 OF 2024', 'GULF LINK INTERNATIONAL LIMITED v UGANDA REVENUE AUTHORITY', 2025, 'Income Tax', 'Dismissed', 'The Applicant challenged an income tax assessment arising from the recharacterization of a zero-interest loan as income by the Respondent. The Respondent raised a preliminary objection, arguing that the Applicant failed to pay the mandatory 30% of the tax in dispute as required by Section 15(1) of the Tax Appeals Tribunal Act. The Tribunal upheld the preliminary objection, dismissing the application with costs, as the Applicant did not provide evidence of having made the required payment.', 'THE REPUBLIC OF UGANDA
IN THE TAX APPEALS TRIBUNAL AT KAMPALA
APPLICATION NO. 348 OF 2024
GULF LINK INTERNATIONAL LIMITED...................................................APPLICANT
VERSUS
UGANDA REVENUE AUTHORITY...........................................................RESPONDENT
BEFORE: MS. CRYSTAL KABAJWARA, MS. KABAKUMBA MASIKO,
MS. CHRISTINE KATWE
RULING
This ruling is in respect of an application challenging an income tax assessment amounting to Shs. 82,258,919 arising from the recharacterization of the Applicant''s loan that did not attract interest as income by the Respondent.
1. Background facts
The Applicant is a company incorporated under the laws of Uganda with its principal business being provision of external labour recruitment.
On 25 August 2023, the Respondent issued the Applicant with an Administrative additional income tax Assessment amounting to Shs. 82,258,919 against the Applicant for the period of July 2021 to June 2022.
The said assessment was raised due to the Applicant''s declaration of an unsupported loan that did not attract interest thus the Respondent reclassified the said loan as income hence the assessment.
On 4 June 2024, the Applicant objected to the assessment on ground that it has loan agreements and bank statements which show that the loan was obtained at 0% interest.
During the objection review process, the Respondent established that the Applicant obtained a loan of Shs. 315,586,000 from Credify limited at an interest rate of 0%. The Respondent further established that the said company is in the business of money lending and ought to have charged and deducted interest for the dispensed loan.
The Applicant failed to further adduce evidence in confirmation that the loan was received by the company.
Consequently, on 28 April 2024 the Respondent made an objection decision disallowing the objections owing to the Applicant''s failure to avail sufficient information.
The Applicant contends that the tax assessed against the Applicant is improper and not justifiable.
The Applicant objected to the assessments on three grounds namely that the Applicant acquired the loan at zero interest in the ordinary course of its business from its related party, who had common director with the Applicant. Therefore, there was no need to charge interest.
The Respondent maintained the assessments amounting to Shs. 82,258,919 in respect of the tax periods of July 2021 to June 2022 on the basis that the Applicant failed to provide additional information to support the said assessments.
2. Representation
The Applicant was represented by Mr. Kitti Norman, their Accountant while the Respondent was represented by Mr. Orishaba Simon Peter.
3. Issues for determination
The key issue for determination is whether the Applicant was liable to pay the assessed tax.
4. Submissions by the Applicant
The Applicant submitted that it is not liable to pay the tax as the Respondent''s assessments and decisions were unlawful and in violation of Section 23(2) (b) of the Tax Procedures Code Act (as it was then) and should be dismissed.
The Applicant relied on Section 20(1) (e) of the Tax Appeals Tribunal Act Cap.341 which empowers this Honourable Tribunal with the discretion to dismiss any decision made by the Respondent that has not been subjected to review. The Applicant prayed that this honourable Tribunal dismisses the Respondent''s objection decision and with costs.
The Applicant quoted Section 22(5) of the Tax Appeals Tribunal Act Cap.341 which provides that: “a Tribunal may make an order for costs against any party, and the order shall be enforceable in the same manner as an order of the High Court.”
5. Submissions by the Respondent
The Respondent raised a preliminary objection to the effect that the application is improperly before the Tribunal owing to the Applicant''s failure to pay 30% of the tax in dispute as required by law.
The Respondent relied on Section 15 (1) of the Tax Appeals Tribunal Act Cap 341 (TAT Act) which provides inter alia that a taxpayer who has lodged a notice of objection to an assessment shall, pending final resolution of the objection, pay 30 percent of the tax assessed or that part of the tax assessed not in dispute, whichever is greater.
The Respondent submitted that the constitutionality of Section 15 of the TAT Act was long settled, first by the Constitutional Court and further cemented, on appeal, by the Supreme Court in the land mark decision of Uganda Projects Implementation and Management Centre Vs. Uganda Revenue Authority, Supreme Court Constitutional Appeal No. 2 of 1999, where it was ruled that the statutory requirement in the then VAT Act (similar to s. 15 of the TAT Act), requiring a taxpayer who has lodged a notice of objection to an assessment to, pending final resolution of the objection, pay 30 percent of the tax assessed or that part of the tax assessed not in dispute, whichever is greater, is constitutional and did not infringe on the right to a fair hearing, under the Constitution of Uganda and the right to equal treatment before and under the law.
Furthermore, in the case of Elgon Electronic Versus Uganda Revenue Authority HCCA 11 OF 2007 Hon. Justice Geoffrey Kiryabwire held that the provisions of Section 15(1) of the Tax Appeals Tribunal Act are mandatory. Accordingly, the requirement to pay 30% of the tax assessed or that part of the tax assessed not in dispute is a legal doctrine which is in line with the "pay now and argue later" principle.
It is the Respondent''s submission that the instant application was filed on 22 November 2024 and up to date, the Applicant has neither paid 30% of the tax in dispute. This deems the Application improper before this Tribunal and the Applicant did not avail to the Respondent at objection or the Tribunal any explanation, satisfactorily or otherwise as to why the Commissioner''s powers to re-characterise should be faulted. In the premises the Respondent''s decision to re-characterise the said loan as income was justified as no evidence to the contrary had been availed by the Applicant. The Applicant only provided the loan agreement and did not provide the bank statements thus the Respondent disallowing the objection raised and maintaining the tax assessed.
The Respondent submitted that it is trite law that the burden of proof lies with the Applicant to prove that an assessment is excessive, where the taxation decision is an objection decision in relation to an assessment, as per Section 19 of the Tax Appeals Tribunals Act Cap 341. The Applicant did not provide the bank statements to the Respondent despite requests for the same right from the time the Applicant objected to the assessment, which was on 4 June 2024 to 28 August 2024, when the objection decision was made maintaining the assessment. Furthermore, the bank statements for the period July 2021 to June 2022, covering the assessed period as requested by the Respondent are a reasonable demand which would enable it verify the existence of the loan, whether the loan was ever received if at all. Without such crucial documents/information, the Respondent was justified to re-characterise the same as income under Section 117 (1) of the Income Tax Act because the form did not reflect the substance.
The above was the position in East Africa Breweries International Limited v URA Application No. 14 of 2017, where the Tribunal stated that the Commissioner''s powers to re-characterise a transaction cannot be faulted unless there are satisfactory explanations and the Tribunal will not interfere with such powers unless it is shown that the decision of the Respondent was illegal, irrational or was made with procedural impropriety.
The Respondent invited the Tribunal to consider the ruling in Bullion Refinery Limited v Uganda Revenue Authority TAT Application no. 87 of 2021, where it was found that the Respondent was justified to consider the unexplained sums of the Applicant as undeclared income and taxed them accordingly. It is also important to note that the present Application is distinguishable from the case of Explorer Limited vs Uganda Revenue Authority TAT No. 87 of 2023, as in that case, the Applicant had adduced the loan agreements, bank statements and a letter from the shareholders extending the loan. It is the combination of all 3 documents which was deemed sufficient by the Tribunal to find for the Applicant. Therefore, a loan agreement alone is not is not sufficient to prove the existence and disbursement of a loan.
The Respondent submitted that this honourable Tribunal finds that the assessment of Shs. 82,258,919 is justified and upholds the same as the Respondent justifiably exercised its mandate to recharacterize the purported loan as income due to the Applicant''s failure to submit documentation to prove receipt of the said monies.
6. The determination of the issues
We have carefully read and considered the submissions of both parties, and this is our decision.
A preliminary objection was raised by the Respondent that this matter is improper before the Tribunal because the Applicant has not deposited 30% of the tax in dispute.
This requirement to pay 30% is a preliminary point of law which if argued successfully will dispose of this suit.
The Tribunal shall resolve this matter as a point of law, applying the principle of "pay now, argue later" and examining relevant case law and statutory provisions.
The requirement to pay 30% is set out in Section 15 of the Tax Appeals Tribunal Act which provides:
"(1) A taxpayer who has lodged a notice of objection to an assessment shall, pending final resolution of the objection, pay thirty percent of the tax assessed or that part of the tax assessed not in dispute, whichever is greater". (emphasis is ours)
In the case of Sanctum Investments Limited V Uganda Revenue Authority, Application No. 157 Of 2024, the Tribunal discussed the key elements of section 15 (1) of the Tax Appeals Tribunal Act Cap 341 (TAT Act) as follows:
a. Filing a notice of objection
This legal provision applies after a taxpayer has lodged a notice of objection to an assessment with the Commissioner General. This is the first step in the tax dispute process, where the taxpayer formally disputes the assessment.
b. Pending final resolution of the objection
While awaiting the final resolution of the objection by the Commissioner General, the above legal provision imposes a legal obligation onto the taxpayer to make a partial payment.
c. Payment requirement
The taxpayer is required to pay thirty percent of the tax in dispute or that part of the tax assessed not in dispute
d. Timing of payment
The thirty percent deposit of the disputed or undisputed amount must be paid during the objection process and before escalating the dispute to the Tax Appeals Tribunal. This payment can be said to be a mandatory precondition to filing an application before the Tribunal.
In Bullion Refinery Ltd Vs Uganda Revenue Authority TAT application no. 36 of 2021, it was held by this Tribunal that "a tax payer who objects to an assessment will still be required to pay 30% of the tax assessed in the objection."
Hon. Mr. Justice Boniface Wamala in A Better place Uganda limited v URA, Civil Appeal No. 37 of 2019 stated:
"...the requirement to pay then 30% of the tax assessed or the part of the tax not in dispute, is set in motion when the taxpayer lodges with the Commissioner a notice of objection to an assessment... Where the portion of the tax was not collected at the time the objection was considered by the Commissioner, as was the case in the instant matter, the TAT is obliged to enforce that payment".
The Applicant has neither adduced any evidence to demonstrate that the 30% payment was effected nor has a rejoinder been filed to controvert the Respondent''s averments in this regard. In the circumstances and in the absence of any credible rebuttal, the Tribunal finds that the Respondent''s assertion remains unchallenged and must therefore be deemed as established.
The requirement to pay thirty percent of the tax in dispute is a statutory requirement which the Applicant ought to have complied with. Consequently, the preliminary objection is sustained and disposes of this suit.
This application is therefore dismissed with costs to the Respondent.
Dated at Kampala this. 20th day of June .2025.', 'This ruling serves as a critical reminder for Uganda tax practitioners regarding the mandatory ''pay now, argue later'' principle enshrined in Section 15(1) of the Tax Appeals Tribunal Act, Cap 341. Failure to deposit 30% of the disputed tax, or the undisputed portion if greater, is a fatal procedural flaw that will lead to the dismissal of an application before the Tax Appeals Tribunal, regardless of the merits of the substantive tax dispute. This case reinforces the precedent set in *Uganda Projects Implementation and Management Centre Vs. Uganda Revenue Authority* and *Elgon Electronic Versus Uganda Revenue Authority*, emphasizing that this requirement is constitutional and mandatory. Practitioners must ensure strict compliance with this precondition to avoid their clients'' cases being dismissed on preliminary objections.

Key practical lessons:
*   Always advise clients to pay the 30% deposit before filing an application with the TAT.
*   Ensure robust documentation for all financial transactions, especially related-party loans.
*   Be prepared to demonstrate compliance with procedural requirements at every stage of a tax dispute.', '2026-07-04 20:22:03.18185+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('877212a4-d2a2-4191-87f0-3109fd261963'::uuid, 'TAT No. 36 of 2024', 'RWENZORI COMMODITIES LIMITED v UGANDA REVENUE AUTHORITY', 2025, 'Income Tax', 'Dismissed', 'The Applicant challenged URA''s capping of its interest expense to 30% of EBITDA, arguing that net interest expense, not gross interest, should be used in the calculation, in line with international best practices (OECD BEPS Action 4) and GAAP. The Tribunal dismissed the application, holding that Section 25 of the Income Tax Act clearly refers to ''interest incurred'' and ''deductible interest'' (gross interest) and does not provide for netting. The Tribunal emphasized that domestic tax law takes precedence over international guidelines and accounting principles where the law is clear.', 'This ruling is in respect of an application challenging the Respondent''s capping of the Applicant''s interest expense to 30% of EBITDA as provided under section 25 of the Income Tax Act. The Applicant contends that the Respondent should have applied net interest and not gross interest.

1. Background Facts
The Applicant grows tea and manufactures tea products. The Respondent''s International Tax Department reviewed the Applicant''s corporate income tax returns for 2019-2021 and found that the Applicant had claimed an interest expense of Shs. 1,738,250,300 that exceeded the 30% EBITDA cap. Relying on section 25(3), the Respondent disallowed this excess interest and raised additional assessments totalling to Shs. 521,475,118.

The Applicant objected on grounds that it had paid both interest on debt and earned taxable interest income and the net interest expense should be used in the EBITDA calculation. The Applicant contended that the Respondent''s use of gross interest was contrary to international best practice (OECD BEPS Action 4) and resulted in double taxation.

On 30 January 2024, the Respondent rejected the objection maintaining that the interest expenses were correctly considered in the computation of the EBIDTA.

The Applicant asserts that this matter concerns the proper interpretation and application of section 25(3) of the Income Tax Act and the applicability of OECD and BEPS Action Plan 4 in the determination of taxable interest expenses.

2. Representation
The Applicant was represented by Mr. Andrew Kyambadde, Mr. Trevor Mark Ntege and Ms. Lamunu Daisy while the Respondent was represented by Mr. Agaba Edmond and Mr. Amanya Mishambi Rodney.

Mr. Prakit Shah, the Managing Director of the Applicant, was the Applicant''s sole witness. He stated in his witness statement that the Applicant is in the business of growing and processing of tea. He also stated that the Respondent reviewed the Applicant''s tax returns for the period 2019-2021 and established that the interest expense claimed by it was overstated by Shs. 1,738.250,300 based on EBITDA calculations.

He further testified that the Applicant objected to the assessments on the grounds that it had considered the net interest expenses to comply with section 25(3) of Income Tax Act therefore, the Respondent committed tax computation errors by using gross interest instead of net interest in chargeable income determination. He further testified that the Respondent misinterpreted and misapplied Section 25(3) of the ITA, by ignoring OECD BEPS Action Plan 4.

Ms. Matovu Lorna, a supervisor in the Respondent''s International Trade Unit was the Respondent''s sole witness. She stated in her witness statement that the Respondent conducted a return examination of the Applicant''s declarations for the periods 2019 -2021 and established that the Applicant had overclaimed interest contrary to Section 25 of the Income Tax Act.

She testified that the Applicant objected on grounds that the Respondent misinterpreted and misapplied Section 25 (3) of ITA when it ignored best practices as recommended by BEPS Action Plan 4 of applying net interest when computing the earnings before interest, tax, depreciation and amortization and not gross interest expense. She testified that the ITA provides the method for interest capping computation and its provisions take precedence over OECD guidelines therefore, the Respondent correctly considered the computation of the EBITDA

3. Issues for Determination
The issue for determination is whether the Applicant is liable to pay the tax assessed.

4. Submissions of the Applicant
The Applicant submitted that the Respondent misinterpreted section 25(3) by insisting on gross interest rather than net interest. In the Applicant''s view, section 25(3) does not explicitly say "gross" interest, and the proper accounting treatment (and fairness) is to offset interest income against interest expense. The Applicant contended that net interest expense should have been used in line with international best practice and proper statutory interpretation.

Section 25 of the Income Tax Act
The Applicant relied on Section 25(3) of the Income Tax Act, which provides:
"The amount of deductible interest in respect of all debts owed by the taxpayer who is a member of the group... shall not exceed thirty percent of the tax earnings before interest, tax, depreciation and amortization."

The Applicant emphasized that the provision speaks only of "deductible interest" and "interest incurred" (under section 25(1)), without any explicit reference to the word "gross". The Applicant contended that if Parliament intended the cap to apply to gross interest, it would have stated so expressly.

The Applicant further argued that the Tribunal should adopt an interpretation that considers the economic substance of transactions and aligns with modern accounting and tax principles, particularly in situations where a taxpayer earns taxable interest income and also incurs interest expenses.

Accounting Standards and GAAP Principles
The Applicant cited Section 38 of the Income Tax Act, which requires taxpayers to follow Generally Accepted Accounting Principles (GAAP). According to the Applicant, under GAAP, Interest income is recorded as revenue, Interest expense is recorded as a deduction and the net interest figure being the difference between income and expense reflects the actual financing cost incurred during the year.

The Applicant argued that the accounting treatment under GAAP provides a more accurate representation of economic reality and the Tribunal should interpret the tax statute in a way that is compatible with accounting standards especially when the law does not expressly contradict such treatment.

The Applicant relied on IAS 1 (International Accounting Standard 1) which governs the Presentation of Financial Statements to argue that the netting of financial income and expense is standard in financial reporting. The Applicant submitted that the Respondent''s failure to adopt this approach led to distorted taxable income and an unjustified increase in the Applicant''s tax burden.

OECD BEPS Action Plan 4
The Applicant submitted that Section 25(3) of the Income Tax Act should be interpreted in light of international best practices particularly the OECD Base Erosion and Profit Shifting (BEPS) Action Plan 4 which advocates for the use of net interest expense in determining deductible interest under thin capitalization rules.

The Applicant quoted Paragraph 62 of the BEPS Action 4 Report, which states:
"A net interest rule would reduce the risk of double taxation, as an entity''s interest income would be set against its interest expense before the interest limitation is applied."

The Applicant explained that BEPS Action 4 recommends a Fixed Ratio Rule that limits net interest deductions to a percentage (typically 30%) of EBITDA. The use of net interest is intended to reflect the true cost of borrowing and avoid scenarios where a taxpayer is taxed on income that is economically neutralized by corresponding financial expenses.

The Applicant argued that the Respondent''s approach of applying the cap to gross interest expense ignores Uganda''s tax policy trajectory toward alignment with international standards and leads to double taxation. The Applicant also submitted that the Respondent''s approach contradicts the spirit of the 2018 amendment to the ITA which was intended to replace the older thin capitalization rules with a fairer and more modern EBITDA-based limitation system.

The Applicant cited the case of Unilever Kenya Ltd v The Commissioner of Income Tax, where Hon. Justice Alnashir Visram held:
"We must be prepared to innovate, and to apply creative solutions based on lessons and best practices available to us internationally... To do otherwise would be highly short-sighted."

The Applicant submitted that the Tribunal should follow the Unilever principle and adopt a contextual interpretation of Uganda''s section 25, one that aligns with OECD guidance and economic fairness, especially where the language of the law allows such flexibility.

The Applicant prayed that the Tribunal finds that net interest expense be used in the computation of EBITDA where a taxpayer has both earned taxable interest income and incurred interest expense.

5. Submissions of the Respondent
The Respondent submitted that the additional assessments issued to the Applicant were lawful and correctly calculated in accordance with the literal provisions of Section 25 of the Income Tax Act. The Respondent argued that the Income Tax Act''s language is plain and admits no implied netting of interest

Section 25 of the Income Tax Act
The Respondent argued that section 25(1) allows a taxpayer to deduct interest incurred on debt obligations used to generate taxable income. The phrase "interest incurred" refers exclusively to actual interest expense paid by the taxpayer, not to a net figure derived by offsetting income.

Section 25(3) provides that this deductible interest shall not exceed 30% of EBITDA. The Respondent emphasized that this provision does not refer to net interest and that it must be read in conjunction with Section 25(1) which only allows deductions for expenses not income or netting concepts.

According to the Respondent, the computation of EBITDA under Section 25(5) further supports the conclusion that gross interest expense is the basis for the cap since EBITDA is calculated by adding back interest deducted under subsection (1). Netting would contradict this statutory structure.

OECD BEPS Action Plan 4
The Respondent acknowledged that the Applicant relied heavily on OECD BEPS Action Plan 4 but submitted that these guidelines have no force of law in Uganda. They are not binding and cannot override the clear language of domestic legislation.

The Respondent cited Paul Mwiru v Igeme Nabeta & Others, Election Petition No. 6 of 2011, where the Court of Appeal held that:
"Policy decisions cannot tantamount to legal or statutory requirements and therefore lack force of law."

The Respondent submitted that had the Legislature intended to apply a net interest rule, it would have amended section 25 to that effect. Uganda''s Income Tax (Amendment) Act, 2018, was enacted after the OECD published BEPS Action 4 in 2015, but did not incorporate any such rule. The deliberate exclusion of a net interest reference indicates that Parliament did not intend to adopt it.

Principles of Tax Deductibility and Burden of Proof
The Respondent also relied on Section 22(1)(a) of the Income Tax Act, which allows deductions only for expenditures “wholly and exclusively incurred" in the production of income. It argued that interest income is not an expenditure, and therefore cannot be used to reduce deductible interest expenses under the law.

In support, the Respondent cited the case of New Vision Printing & Publishing Corporation v URA, HCCA No. 78 of 1999, where it was held:
"For an expenditure to qualify for deduction, some evidence of its character must be adduced. It must be wholly and exclusively incurred in the production of income."

The Respondent maintained that only actual, proven interest expense qualifies for deduction and the Applicant failed to provide any legal justification or legislative basis for netting such expense against income.

The Respondent further submitted that under Section 28 of the Tax Procedures Code Act, the burden of proof in tax matters lies with the taxpayer. The Applicant had not discharged this burden as it did not demonstrate that the gross interest amounts were incorrectly capped under section 25(3).

The Respondent prayed that the Tribunal finds that the Respondent correctly applied gross interest in the EBITDA computation as provided under the Act and that the OECD BEPS Action Plan 4 does not override Uganda''s ITA.

In rejoinder, the Applicant reiterated their earlier arguments.

6. The determination of the Issues
Having listened to the evidence and read the submissions of both parties, this is the decision of the Tribunal.

The dispute revolves around whether the Respondent erred in applying the 30% EBITDA interest deduction cap using gross interest expense rather than net interest expense.

Section 38 (1) of the Income Tax Act
The Applicant relied on section 38(1) of the Income Tax Act, which provides:
"A taxpayer''s method of accounting shall conform to generally accepted accounting principles."

The Tribunal agrees that while accounting principles govern how taxpayers maintain their financial records, taxation does not always follow accounting.

In the recent case of Ambitious Construction Ltd v URA, TAT 219 of 2023, the Tribunal held;
"that accounting and taxation serve different purposes. The purpose of accounting is to provide interested parties information relevant to stewardship, control and decision-making. On the other hand, the main purpose of taxation is to raise revenue for the government''s'' economic and social policy. Therefore, taxation does not always follow accounting as tax is determined by the provisions of the applicable tax legislation and not the taxpayers'' accounting".

Therefore, accounting principles cannot override the express provisions of a taxing Act.

Section 25 of the Income Tax Act
This provision lies at the core of the dispute and must be interpreted based on its express wording.

Section 25 of the Income Tax Act provides as follows:
"(1) Subject to this Act, a person is allowed a deduction for interest incurred during the year of income in respect of a debt obligation to the extent that the debt obligation has been incurred by the person in the production of income included in gross income.

(3) The amount of deductible interest in respect of all debts owed by a taxpayer who is a member of a group, other than a financial institution, microfinance deposit taking institution, tier 4 microfinance institution or person carrying on insurance business, shall not exceed thirty percent of the tax earnings before interest, depreciation and amortization

(4) A taxpayer whose interest exceeds thirty percent of the fax earnings before interest, tax, depreciation and amortization may carry forward the excess interest for not more than three years, and the excess interest shall be treated as incurred during the next year of income.

(5) In this section-
"group" means persons other than individuals, with common underlying ownership, "tax earnings before interest, tax, depreciation and amortization" means the sum of-

(a) gross income less allowable deductions, except a deduction under subsection (1);"
Subject to certain exceptions, section 25(3) of the Income Tax Act provides that the deductible interest for a member of a group shall not exceed 30% of the taxpayer''s tax EBITDA.

From the literal reading, the above provision caps "deductible interest", which is the interest amount that would otherwise have been allowed under subsection (1). That deductible interest is interest incurred and nowhere does the Act refer to net interest.

The EBITDA formula in subsection (5) reinforces that the interest to be capped is the amount deducted under subsection (1), which is the gross interest expense.

Net interest is not "interest incurred", neither does it arise from a debt obligation nor is it tax deductible. Net interest refers to the interest income after deducting all interest expenses such as interest paid on deposits or borrowed funds. Therefore, a plain reading of the provision reveals that the section is concerned with the interest expense that was incurred by the taxpayer which in the absence of the capping provision would have been fully deductible. It does not apply to net interest income or net interest expense.

The Tribunal reiterates the well-established rule of statutory interpretation enunciated in Cape Brandy Syndicate v CIR [(1921) 1 KB 64], which requires the application of the plain meaning of the provision.

The words "interest incurred” in section 25(1) and "deductible interest" in section 25(3) mean exactly what they say. There is no reference or basis in the Act for netting interest income from interest expense. Accordingly, only gross interest incurred qualifies for the deduction and is therefore the basis for the 30% EBITDA limitation.

Applicability of OECD BEPS Action Plan 4
The OECD BEPS Action Plan 4 recommends the use of net interest expense to prevent double taxation and ensure economic neutrality.

However, the decision of this Tribunal in Ambitious Construction Ltd v URA is instructive. The Tribunal held that even where OECD guidelines are persuasive, they cannot override a clear statutory provision.

Further, it is also worth noting that the OECD BEPS Action Plan came into force in 2015. This includes Action Point 4 which sets out a best practice approach for countries to prevent erosion of the tax base through the use of interest expense. Section 25 in its current form was introduced by the Income Tax (Amendment) Act, 2018, 3 years after the BEPS Project. If there was any intention of the government through the Ministry of Finance which shapes the country''s tax policy to align section 25 with the BEPS Action Plan 4, the BEPS ''recommendations would have been fully adopted in the Income Tax (Amendment) Bill that was tabled before the Legislature and eventually passed in the form of the Income Tax (Amendment) Act, 2018. However, this was not the case.

We''ve taken note of the Applicant''s reliance on the Unilever case (supra) wherein the OECD Transfer Pricing Guidelines were found to be applicable in Kenya. In Unilever Kenya Ltd v Commissioner of Income Tax, the Kenyan court considered OECD Transfer Pricing Guidelines only because Kenya had no domestic legislation on the matter at the time. That case is therefore distinguishable. Uganda has a clear provision under section 25.

From the above, the statute clearly provides for a capping mechanism based on interest incurred not net interest. The Tribunal cannot read into the law what Parliament chose to leave out.

In the circumstances, we find that the Respondent correctly applied section 25 of the ITA and there was no misinterpretation or misapplication of the law.

In the circumstances, the application is hereby dismissed and the Tribunal makes the following orders:

(i) The Applicant is liable to pay the tax assessed.
(ii) Costs are hereby awarded to the Respondent.

Dated at Kampala this 30th day of July 2025.', 'This ruling reinforces the principle of strict interpretation of tax statutes in Uganda, particularly concerning deductions. Tax practitioners should note that where the Income Tax Act (ITA) provides clear language, international best practices like OECD BEPS Action Plans or GAAP will not override domestic law. The Tribunal''s consistent stance, as seen in Ambitious Construction Ltd v URA, is that taxation serves a different purpose than accounting and is governed by specific legislative provisions. This case highlights the importance of adhering to the literal wording of the ITA, especially Section 25, when calculating interest expense limitations.

Key practical lessons:
*   **Literal Interpretation:** The TAT prioritizes the plain meaning of the ITA over external guidelines.
*   **Domestic Law Precedence:** OECD BEPS Action Plans are persuasive but not binding if domestic law is clear.
*   **Gross vs. Net Interest:** For Section 25(3) of the ITA, the cap applies to gross interest incurred, not net interest.', '2026-07-04 21:38:39.959763+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('8d7be89b-ec51-4b78-a997-0d33b41978b9'::uuid, 'APPLICATION NO. 359 OF 2024', 'Kazinga Channel Office World Ltd v Commissioner General, Uganda Revenue Authority', 2026, 'Jurisdiction', 'Dismissed', 'The Applicant challenged the Respondent''s continued enforcement of tax assessments previously quashed by the High Court and its failure to implement the High Court''s judgment. The Respondent raised preliminary objections, arguing that the Tribunal lacked jurisdiction as the matter concerned non-enforcement of High Court orders (contempt of court) and that the Applicant failed to pay the mandatory 30% of the disputed tax. The Tribunal upheld the preliminary objections, finding that it lacked jurisdiction to entertain a matter arising from alleged non-compliance with High Court orders, which falls under the exclusive jurisdiction of the High Court.', '1. This ruling is in respect of an application challenging the Respondent''s continued enforcement of tax assessments that had already been quashed by the High Court and its failure to implement the court''s judgment delivered on 28 October, 2020. The Applicant is seeking orders that:
(i) The Tribunal makes a declaration that the Respondent''s action of demanding the tax liability that has been quashed by the court is illegal.
(ii) The Tribunal orders that the Respondent implement the court judgment dated 28 October 2020 by her Lordship Hon. Elizabeth Jane Alividza.
(iii) The Tribunal orders that the Respondent issue new assessments as ordered by the court in the judgment of her Lordship Hon. Elizabeth Jane Alividza.

III. Issues
9. At the scheduling of this application, the parties agreed on the following issues:
(i) Whether the Tribunal has jurisdiction to hear and determine this application.
(ii) Whether the Applicant is required to pay 30% of the assessed tax?
(iii) What remedies are available?

49. We are inclined to believe that this indeed is a case of failure to execute/implement lawful High Court orders that would amount to contempt of court, which falls within the exclusive jurisdiction of the court that issued the orders. As rightly pointed out by the Respondent relying on Betty Kizito v Dickson Nsubuga & Others, Supreme Court Civil Application 25 & 26 of 2021, the Supreme Court held that civil contempt consists of disobedience of judgments or orders of court and must be brought before the court that issued those orders. Therefore, the proper forum for the Applicant''s grievance is the High Court, Commercial Division, and not this Tribunal.

51. In light of the foregoing, this Tribunal finds that it lacks jurisdiction to entertain the present aapplication. Jurisdiction being a threshold issue, the absence of it renders the Tribunal incapable of considering any of the substantive prayers or ancillary reliefs sought. Consequently, the Tribunal will therefore make no determination on any of the remedies sought, as to do so would be an exercise in excess of jurisdiction.

Orders
(i) The Tribunal finds it lacks jurisdiction to hear and determine this application.
(ii) The preliminary objection is upheld.
(iii) Costs are awarded to the Respondent.', 'This ruling is a crucial reminder for Uganda tax practitioners regarding the jurisdictional boundaries between the Tax Appeals Tribunal (TAT) and the High Court. The TAT clearly states that its mandate is to review ''taxation decisions'' as defined under Section 14(1) and (2) of the Tax Appeals Tribunal Act. Issues pertaining to the enforcement or alleged disobedience of High Court judgments, even if they relate to tax matters, are considered civil contempt and fall exclusively within the High Court''s jurisdiction. Practitioners must carefully assess the nature of their client''s grievance: if it''s a challenge to a new assessment or a ''taxation decision,'' the TAT is the correct forum; if it''s about non-compliance with a prior court order, the High Court is the appropriate avenue for contempt proceedings or execution. Attempting to bring contempt-related issues before the TAT will result in dismissal for lack of jurisdiction.

*   **Key Takeaway:** The TAT will not act as an enforcement arm for High Court judgments.
*   **Main Risk/Precedent:** Misfiling a case in the TAT when it concerns contempt of court will lead to dismissal and wasted time/resources.
*   **Relevant Acts/Sections:** Tax Appeals Tribunal Act, S. 1, S. 14(1), S. 14(2); Article 152(3) of the Constitution.
*   **Practical Lessons:**
    *   Distinguish between challenging a ''taxation decision'' and enforcing a court order.
    *   Contempt of court matters must be pursued in the court that issued the original order.
    *   Jurisdiction is a threshold issue; ensure proper forum selection from the outset.', '2026-07-04 21:28:02.217457+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('8dd8e88b-d8bb-49fc-9a57-c0ac7c296350'::uuid, 'HCT-00-CV-CS-0352-2020', 'BABAANA CHILDREN OF UGANDA LIMITED v COMMISSIONER CUSTOMS, UGANDA REVENUE AUTHORITY', 2020, 'Customs', 'null', 'The plaintiff, a charitable organization, imported donated medical equipment and other commodities, securing a tax exemption for the medical items. The goods were warehoused, and the plaintiff requested an extension of the warehousing period due to incomplete clinic construction. Despite the request and alleged assurances from the defendant, the goods were subsequently disposed of by the Uganda Revenue Authority (URA) for want of entry, as the statutory warehousing period had expired and the plaintiff had not cleared the goods or paid taxes on non-exempt items. The plaintiff sued the URA for unlawful disposal of the goods and sought significant damages for loss of goods and income.', '1. The plaintiff’s case is that it is a company limited by guarantee and a charitable organisation that imported into Uganda a donated consignment comprising medical equipment and assorted commodities valued at CHF 364,817 under Bill of Lading No. MAEU962276576. The plaintiff states that, before importation, it sought a tax exemption certificate through the Acting Director General of the Ministry of Health on 27 November 2017, and that the defendant confirmed the tax exemption on 28 November 2017. The plaintiff further contends that, after the goods were warehoused, it sought an extension of the warehousing period to December 2018 because construction of the intended clinic premises was incomplete, and that the defendant did not object to that request. According to the plaintiff, when it later followed up on the consignment for purposes of commencing the clearing process, it was informed that the goods had been disposed of, although the defendant’s officers allegedly assured it that the goods were still available. The plaintiff states that, despite subsequent correspondence, a meeting between the parties, and several attempts to obtain the goods, it failed to recover the consignment and later learnt that the goods had in fact been disposed of. It therefore claims that the defendant, while in possession of the tax-exempt goods and with knowledge of the extension of the warehousing period, unlawfully disposed of them without following the requisite procedure, thereby causing the plaintiff loss and damage. The plaintiff accordingly seeks a declaration that the defendant is liable for the loss of its goods, special damages of UGX 17,262,918,622, general damages, aggravated damages, interest, and costs of the suit.

2. The defendant’s defence is that it lawfully handled the importation, warehousing, and disposal of the plaintiff’s goods in accordance with the applicable customs laws. It contends that, before importation, the plaintiff sought tax exemption only for items intended for use in licensed hospitals, and that the defendant’s response specified the exempt items, including medical equipment and medical supplies, as well as the non-exempt items, such as toys, shoes, milk, toilet supplies, and office supplies. The defendant further states that the goods were warehoused on 11 December 2017 for the statutory maximum period of nine months, which expired on 7 September 2018, and that the plaintiff failed to clear the goods, pay taxes on the non-exempt items, or formally apply for redemption before disposal. According to the defendant, although the goods remained in the warehouse until December 2018, the plaintiff took no steps to remove them, whereupon they were listed for want of entry, forfeited, and disposed of in accordance with customs law. The defendant maintains that any later effort to assist the plaintiff in recovering the goods was made on a without-prejudice and humanitarian basis, and denies liability on the ground that the plaintiff’s claim is exaggerated, unsubstantiated, and attributable to its own failure to comply with the statutory warehousing and clearance requirements.', 'This case highlights the critical importance of strict adherence to customs warehousing regulations, even for tax-exempt goods. While the plaintiff secured a tax exemption for medical equipment, the URA''s defense centered on the expiry of the statutory warehousing period and the plaintiff''s failure to clear the goods or pay taxes on non-exempt items. Tax practitioners should advise clients that a tax exemption does not negate other customs obligations, particularly regarding warehousing periods and clearance procedures. The risk here is that even with valid exemptions, goods can be forfeited and disposed of if procedural requirements under the East African Community Customs Management Act (EACCMA) are not met. This case underscores the need for proactive engagement with URA and formalizing all requests, such as warehousing extensions, in writing with clear, documented approvals.

Key practical lessons:
* Tax exemptions do not override customs clearance and warehousing obligations.
* Always formally apply for and secure written approval for warehousing extensions.
* Be aware of statutory warehousing periods (e.g., 9 months under EACCMA).
* Promptly clear goods, even tax-exempt ones, to avoid forfeiture and disposal.', '2026-07-18 17:01:15.856132+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('9069c1d8-8746-4dd3-8a3c-ec9ce38ad9c3'::uuid, 'TAT No. 93 of 2022', 'CFAO Motors Uganda Limited v Uganda Revenue Authority', 2025, 'VAT', 'Dismissed', 'CFAO Motors Uganda Limited (the Applicant) imports motor vehicles and sells some in a bonded warehouse to exempt customers (diplomats, UN agencies, etc.). The Uganda Revenue Authority (URA) assessed VAT on the Applicant''s sales mark-up, arguing it was a separate taxable supply not covered by the customers'' exemptions. The Applicant contended that the mark-up was for services incidental to the import of goods, which should be exempt from VAT under Sections 12(3) and 20(1)(a) of the VAT Act. The Tribunal ruled that while Section 12(3) is a general provision, Section 23(c) specifically defines the taxable value of an import to include incidental services not already part of the customs value, making the Applicant''s mark-up taxable.', 'THE REPUBLIC OF UGANDA
IN THE TAX APPEALS TRIBUNAL AT KAMPALA
APPLICATION NO. 93 OF 2022
CFAO MOTORS UGANDA LIMITED................................................................APPLICANT
VERSUS
UGANDA REVENUE AUTHORITY................................................................RESPONDENT
BEFORE: MR. SIRAJ ALI, MS. CHRISTINE KATWE, MS. KABAKUMBA MASIKO
RULING
This ruling, relates to the question, whether a supply of services incidental to the import
of goods, is exempt from VAT, under the provisions of S. 12(3) and S. 23(c) of the
VAT Act.
1. Background
The Applicant is a company engaged in the business of selling, leasing, and the
maintenance of motor vehicles.
On or about the year 2021, the Respondent carried out an audit on the Applicant for
the period 2018 to 2020. Following the audit, the Respondent issued Administrative
Additional VAT tax assessments of Shs. 2,088,468,660 for the period of the audit. The
Applicant''s objection to the assessment was disallowed by the Respondent through
an objection decision dated 15th March 2022. Aggrieved with the decision of the
Respondent, the Applicant filed this application.
2. Representation
At the hearing, the Applicant was represented by Ms. Leah Nambuya and Ms. Jemima
Mushabe. The Respondent was represented by Mr. Alex Aliddeki Ssali, Mr. Ronald
Baluku, Ms. Ritah Nabirye, Mr. Edmond Agaba and Mr. Amanya Mishambi.
3. Issues for determination
At the scheduling, the following issues were set down for hearing:
1. Whether the Applicant is liable to pay the tax assessed?

7. Determination of the Tribunal
(i) Whether the Applicant is liable to pay the tax assessed?
At its heart, this dispute is about the scope and application of sections 12(3) and 23 of
the VAT Act.
S. 12, which has been reproduced below, is a codification of the incidental transactions
rule. Briefly stated, where two or more elements or acts supplied by a taxable person
to a customer, are so closely linked that they form objectively a single economic
supply, the taxation of the incidental element will be regarded as following the taxation
of the primary element. The term incidental, indicates an element, which is subordinate
in nature and does not directly form part of the taxable person''s main activity
"12. Mixed Supplies
(1) A supply of services incidental to the supply of goods is part of the supply of goods.
(2) A supply of goods incidental to the supply of services is part of the supply of services.
(3) A supply of services incidental to the import of goods is part of the import of goods.
(4) Regulations made under section 51 may provide that a supply is a supply of goods or
services."
The Applicant''s case, is that it rendered the service, of delivering and making the
motor vehicles in question, available at the customs bonded warehouse. This service,
the Applicant argues, was incidental to the import of the said motor vehicles. For the
reason, that the motor vehicles were exempt from VAT by virtue of S. 20(1) (a) of the
VAT Act, the Applicant argues, that the taxation of the incidental service, should follow
the taxation of the primary service, with the result that the supply of the incidental
service, should be considered as exempt from VAT.
S. 20(1) of the VAT Act provides:
"20. Exempt Import
(1) An import of goods is an exempt import if the goods;-
a) Are exempt from customs duty under the Fifth schedule of the East African Community
Customs Management Act, except compact fluorescent bulbs with a power connecting
cap at the end and lamps and bulbs made from light emitting diodes (LED) technology
for domestic and industrial use; or
b) Would be exempt had they been supplied in Uganda."

The Respondent concedes, that while the services supplied by the Applicant, were
incidental to the import of the motor vehicles, their supply was not exempt from VAT.
The Respondent''s case, which is based on S.20 (1) (a) above and S. 23(c) of the VAT
Act, is that the said services could only be exempt from VAT, if their value formed part
of the customs value of the imported motor vehicles.
S. 23 of the VAT Act, states as follows;
"S. 23 Taxable value of import of goods
The taxable value of an import of goods is the sum of-
a) The value of the goods ascertained for the purposes of customs duty under the laws
relating to customs;
b) The amount of customs duty, excise tax and any other fiscal charge other than tax
payable on those goods; and
c) The value of any services to which section 12(3) applies which is not otherwise
included in the customs value under paragraph (a).”
The above provision, sets out the amounts, which form the taxable value of imported
goods. The importance of a taxable value cannot be over emphasized, as it forms, the
basis for the application of the tax rate. This is apparent from S. 24(1) of the VAT Act,
which has been reproduced below;
"24. Calculation of tax payable on taxable transaction
(1) Subject to subsection (2), the tax payable on a taxable transaction is calculated by
applying the rate of tax to the taxable value of the transaction."
It can be inferred from Ss. 23 and 24 above, that the amounts constituting the taxable
value of imported goods, are liable to VAT while those not constituting the taxable
value are exempt from VAT. In order to determine whether the services supplied by
the Applicant are exempt from VAT, we must determine whether or not, the value of
these services form part of the taxable value under S.23 above.
S. 23 can be reduced to the following formula;
Taxable Value of Imported Goods = Customs Value of Imported Goods + The
Amount of all taxes Payable on the Imported Goods except VAT + The Value of

Services Incidental to the Import of the Goods which have not been included in the
customs value of the imported goods.
Customs Value of Imported Goods
S. 23 (a) provides that the customs value of the goods should be the value of the
imported goods ascertained for the purposes of customs duty under the laws relating
to customs;
The customs value of goods imported into Uganda is determined in accordance with
the East African Community Customs Management Act (EACCMA). S. 122 of
EACCMA stipulates that when imported goods are subject to Ad valorem import duty,
their value is determined according to the 4th Schedule and import duty is levied on
that value.
Paragraph (1) of Part 1 of the 4th Schedule specifies that the customs value of
imported goods is the transaction value (the price actually paid or payable for the
goods when sold for export to the partner State).
Paragraph 9(2) of Part 1 of the 4th Schedule to EACCMA, provides that;
"In determining the value for duty purposes of any imported goods, there shall be added to the
price actually paid or payable for the goods;
a) The cost of transport of the imported goods to the port or place of importation into the
Partner State, provided that in case of import by air no freight costs shall be added to
the price paid or payable.
b) Loading, unloading and handling charges associated with the transport of the
imported goods to the port or place of importation into the Partner State; and
c) The cost of insurance".
The Amount of all taxes Payable on the Imported Goods except VAT.
To the customs value of the imported goods derived under Paragraph 2(1) of Part 1
of the 4th Schedule and Paragraph 9(2) of Part 1 of the 4th Schedule to EACCMA,
should be added the amount of all taxes chargeable on the imported goods with the
exception of VAT.

The Value of Services Incidental to the Import of the Goods which have not been
included in the customs value of the imported goods.
S. 23(c), refers to the value of services incidental to the import of the goods which
have not been included in the customs value under S. 23(a) above. We have seen
under Paragraph 9(2) of Part 1 of the 4th Schedule of EACCMA, that the incidental
services, whose values have been included in the customs value of the imported motor
vehicles, are transportation services, loading and handling services and insurance. It
is clear, that the incidental services supplied by the Applicant, are not the kind of
incidental services, envisaged as forming part of the customs value of the imported
goods under Paragraph 9(2) of Part 1 of the 4th Schedule of EACCMA. The exclusion
of the value of the incidental services supplied by the Applicant, from the customs
value of the imported motor vehicles, means that they form part of the taxable value
of the imported motor vehicles under S. 23(c) and are accordingly taxable.
It should be noted that S. 12(3) is a general provision, which exempts the supply of
services incidental to the import of goods from VAT. S. 23(c) on the other hand, is a
specific provision which determines which of the incidental services under S. 12(3),
are exempt from VAT, under the incidental transactions rule.
It is trite that specific provisions of a legal instrument should prevail over more general,
conflicting provisions. This principle of the interpretation of statutes goes under the
maxim Generalia specialibus non derogant (general things do not derogate from
specific things).
In the instant case, S.23 (c) which is a specific provision prevails over S. 12(3) which
is a general provision.
For the reasons above, we find that the Applicant is liable to pay the tax assessed.
This application is dismissed with costs to the Respondent.
Dated at Kampala this 31st day of January 2025.', 'This ruling clarifies the interplay between general and specific provisions in the VAT Act regarding incidental services and import exemptions. The key takeaway for tax practitioners is that not all services incidental to an exempt import will automatically be exempt from VAT. The Tribunal emphasized the principle of *Generalia specialibus non derogant*, where specific provisions (like Section 23(c) of the VAT Act) override general ones (like Section 12(3)). The main risk or precedent is that businesses providing services related to exempt imports must carefully analyze whether their charges fall within the customs value or constitute a separate taxable value under Section 23(c) of the VAT Act. This decision reinforces URA''s position that any value added beyond the CIF value, even if incidental to an exempt import, can be subject to VAT if not explicitly included in the customs value for exemption purposes.

*   **Key Practical Lessons:**
*   Incidental services to exempt imports are not automatically VAT-exempt.
*   Section 23(c) of the VAT Act is crucial for determining the taxable value of incidental services.
*   Businesses must distinguish between customs value and additional mark-ups for VAT purposes.', '2026-07-04 15:19:02.909417+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('9726d789-8f72-4f62-9f6e-a6774b2c7670'::uuid, 'TAT No. 063 of 2023', 'China North Machine Company Limited v Uganda Revenue Authority', 2026, 'VAT', 'Allowed', 'The Applicant, an importer and wholesaler, supplied machinery to contractors of aid-funded hydro-electric power projects. The Uganda Revenue Authority (URA) assessed additional VAT, arguing these supplies were exempt under Paragraph 1(z) of Schedule 3 of the VAT Act, thus disallowing input tax credits. The Applicant contended that its supplies qualified for ''deemed VAT paid'' status under Section 24(6) of the VAT Act, entitling it to input tax credits. The Tribunal found a conflict between Section 24(6) and Paragraph 1(z) and, applying the absurd result principle and legislative intent, ruled that Section 24(6) should prevail, treating the supplies as taxable with deemed VAT paid, and allowing the Applicant full input tax credits.', '179. In the instant case, Paragraph 1(z) frustrates the legislative intent, behind S. 24(6), by preventing suppliers of contractors, executing aid-funded hydro-electric and similar power projects from claiming VAT in respect of supplies made by them.
180. Paragraph 1(z), also creates irrational distinctions by confining S. 24(6) to aid-funded projects which are not hydro-electric, solar, geothermal, bio-gas or wind energy projects. This leads to incoherence, contradictions and discrimination in the application of S. 24(6).
181. Tax payers failing to meet the requirements of S. 24(6) as a result of the operation of Paragraph 1(z) have suffered extremely unreasonable and unfair treatment and pointless hardship through no fault of their own.
182. S. 24(6) provides equal treatment, to the suppliers of contractors and subcontractors, of all aid-funded projects regardless of the nature of the aid-funded projects being undertaken.
183. In order to give effect to the intention of Parliament, we find it necessary, that in construing the provisions of S. 24(6), in relation to supplies made to the contractors/subcontractors of aid-funded hydro-electric power, solar, geothermal, bio-gas or wind energy projects, the provisions of Paragraph 1(z) should be disregarded.
This will avoid the absurdity, which arises from a plain and literal construction of the above provisions.
184. This application is accordingly allowed with the following orders;
1) The provisions of S. 24(6) of the VAT Act apply to the Applicant''s supplies to Sino-hydro Corporation Ltd and China International Water and Electric Corporation for the construction of the Karuma and Isimba hydro-electric power projects.
2) The supplies made by the Applicant to Sino-hydro Corporation Ltd and China International Water and Electric Corporation were taxable supplies in respect of which Sino-hydro Corporation Ltd and China International Water and Electric Corporation were deemed to have paid the requisite VAT.
3) The Additional Assessment of Shs. 1,265,705,370 is hereby vacated.
4) The Applicant is entitled to full input tax credits on its imports.
5) The Applicant is awarded the costs of this Application.', 'This ruling is a significant win for suppliers to aid-funded projects in Uganda, particularly those involved in renewable energy infrastructure. The Tribunal''s application of the ''absurd result principle'' to reconcile conflicting provisions (Section 24(6) and Paragraph 1(z) of Schedule 3 of the VAT Act) is a crucial precedent. It clarifies that the legislative intent behind Section 24(6) was to ensure VAT neutrality for suppliers to aid-funded projects, preventing VAT cascading, even when the output supplies might otherwise appear exempt. Tax practitioners should note that the Tribunal prioritized the specific, later-enacted provision (S. 24(6) from 2016) over a more general, earlier exemption (Para 1(z) from 2008) to achieve the policy objective of tax relief for such projects.

Key practical lessons:
*   Legislative intent and VAT neutrality are critical interpretative tools.
*   Specific provisions for aid-funded projects (S. 24(6) VAT Act) can override general exemptions.
*   Suppliers to aid-funded projects should assert their right to input tax credits under the ''deemed VAT paid'' mechanism.', '2026-07-04 15:21:34.691715+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('98189051-7d0d-40d6-b12e-98b4cdce84bc'::uuid, 'TAT No. 004 of 2024', 'Bujagali Energy Limited v Uganda Revenue Authority', 2026, 'Income Tax', 'Dismissed', 'The Applicant challenged additional income tax and withholding tax assessments, primarily disputing the foreign exchange rate used for converting capital asset costs and the reclassification of start-up costs. The Tribunal found that the assessments were not time-barred due to the discovery of new information during an audit. It upheld the Respondent''s application of exchange rates at the time expenditure was incurred and agreed with the reclassification of certain ''start-up costs'' as industrial buildings or land, and the disallowance of certain sponsor labour costs and WHT deductions for suppliers without valid TINs.', '1. This ruling is in respect of an application, challenging Administrative Additional Income and Withholding Tax Assessments of Shs. 157,839,904,229. The Assessments arise, principally, out of a dispute, relating to the correct interpretation of S. 56(2) of the Income Tax Act, which provides for the conversion, into Uganda Shillings, of amounts, in foreign currency, taken into account, for tax purposes.

II. Background Facts
2. The Applicant was incorporated in Uganda in the year 2005, as a special purpose vehicle to develop and operate the Bujagali Hydro Electric power project in Uganda. In the year 2017, as part of efforts by the Government of Uganda, to achieve affordable electricity tariffs in the country, S. 21 of the Income Tax Act (ITA) was amended to grant the Applicant, income tax exemption up to 30th June 2022.
...
169. Relying on the above authorities and considering ourselves bound by the decision in UETCL vs. Commissioner General Uganda Revenue Authority (supra), we find that the assessments in question, are not time barred.
170. We will now proceed to determine the sub-issue, as to whether the Applicant used a wrong foreign exchange rate, to convert the concession asset costs, from United States Dollars to Uganda Shillings.
171. The resolution of this sub-issue, turns on the construction of S.56 (2) of the ITA. S. 56 provides as follows;
56. Currency Conversion
(1) Chargeable income under this Act shall be calculated in Uganda Shillings.
(2) Where an amount taken into account under this Act is in a currency other than the Uganda Shilling, the amount shall be converted to the Uganda Shilling at the Bank of Uganda mid-exchange rate applying between the currency and the Uganda Shilling on the date that the amount is derived, incurred, or otherwise taken into account for tax purposes.
(3) With the prior written permission of the Commissioner General, a taxpayer may use the average rate of exchange during the year of income, or may keep books of accounts in a currency other than the Uganda Shilling.
...
246. For the reasons, set out above, this Application is dismissed with costs. The revised assessment of Shs. 155,618,956,094 comprising of WHT of Shs. 298,382,432 and income tax of Shs. 155,320,573,662 is hereby upheld.
Dated at Kampala this... 30th day of April 2026.', 'This ruling provides crucial clarity for Uganda tax practitioners on the interpretation of ''new information'' for additional assessments under S. 25(2)(a) of the Tax Procedures Code Act (TPCA) and the application of foreign exchange rates for capital allowances under S. 56(2) of the Income Tax Act (ITA). The Tribunal''s emphasis on the incurrence date for foreign currency conversion of capital expenditure, rather than the asset''s commissioning date, sets a significant precedent. Taxpayers must ensure meticulous record-keeping of acquisition dates and corresponding exchange rates for capital assets. The decision also reinforces the strict interpretation of ''start-up costs'' under S. 29 of the ITA and the requirement for valid TINs for deductible expenses under S. 22(2)(m) of the ITA.

Key practical lessons:
* Maintain detailed asset registers with acquisition dates and exchange rates.
* Strictly adhere to the definition of ''start-up costs'' as per S. 29 ITA.
* Ensure all suppliers have valid TINs for expense deductibility.', '2026-07-06 18:11:48.126855+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('98832fa8-df33-4848-8240-436e1b256437'::uuid, 'MISCELLANEOUS APPLICATION NO. 130 OF 2024 (ARISING OUT OF TAT APPLICATION NO.227 OF 2022)', 'AC Yafeng Construction Limited v Uganda Revenue Authority', 2025, 'Income Tax', 'Allowed', 'The Applicant sought leave to amend its original application (TAT Application No. 227 of 2022) to reframe the issues for determination, specifically concerning its liability to pay PAYE for employees no longer employed or during periods when no salaries were paid. The Respondent opposed the amendment, arguing it introduced a new cause of action. The Tribunal, applying principles of amendment of pleadings, found that the proposed amendment did not introduce a new cause of action and would not prejudice the Respondent, as the core dispute remained the PAYE assessment. The Tribunal allowed the amendment to ensure the real controversy between the parties is determined.', 'THE REPUBLIC OF UGANDA.
IN THE TAX APPEALS TRIBUNAL AT KAMPALA REGISTRY.
MISCELLANEOUS APPLICATION NO. 130 OF 2024.
(ARISING OUT OF TAT APPLICATION NO.227 OF 2022)
AC YAFENG CONSTRUCTION LIMITED
APPLICANT
VERSUS
UGANDA REVENUE AUTHORITY.
RESPONDENT
BEFORE: MS. CRYSTAL KABAJWARA, MR. SIRAJ ALI, MS. CHRISTINE KATWE
RULING
This ruling is in respect of an application brought under Rule 30 of the Tax Appeals
Tribunal (Procedure) Rules 2012, Order 6 Rule 19 Of the Civil Procedure Rules and
Section 98 of the Civil Procedure Act.
The Applicant seeks leave to amend its application vide TAT Application 227/2022 by
substituting the issues framed thereunder with one issue.
1. Background facts
This application is supported by an affidavit deponed by Mr. Emeka Okoye, the
Director of the Applicant company, sworn on 16 January 2024 stating as follows:
(i) On 14 September 2022, the Applicant lodged TAT application 227/ 2022 on
grounds that it had been wrongly assessed PAYE in the sums of Shs.
322,024,319.
(ii) On 6 August 2024, the Applicant was informed by the Tribunal that his witness
statement and case as presented by the new lawyer had departed from the
application filed on the 14 September 2022.
(iii) That the Applicant''s lawyer advised the Applicant that they can seek leave of the
Tribunal to amend the application and reflect the actual grievance.
(iv) That the previous legal counsel filed the application on the Applicant''s behalf
without the involvement of the Applicant.
(v) That the Applicant is a lay man without any tax knowledge and only got to know
that the application was not addressing his grievance when he was informed by
the Tribunal.
(vi) That the gist of his case is whether it is legal for the Applicant to continue paying
PAYE for employees who are no longer employed by it.
(vii) That it is necessary to amend TAT application 227/2022 to determine the real
controversy between the parties.
(viii) That it is in the interest of justice that this application for amendment is allowed.
(ix) That the Respondent will not be prejudiced in any way if this application is
granted and the balance of convenience lies in his favour.
The Respondent filed an affidavit in reply deponed by Kenan Aruho, a Supervisor in
the Respondent''s Legal Department, sworn on 13 November 2024 opposing the
application on grounds that:
(i) On 24 March 2021, the Respondent conducted a search and seizure operation
at the Applicant''s premises and obtained documents in relation to employment
particulars of the Applicant''s employees.
(ii) The Respondent issued the Applicant with a management letter detailing its
findings and the taxes payable namely, PAYE amounting to Shs. 222,356,987 for
the period 2019-2021.
(iii) The Applicant objected to the PAYE assessments on the grounds that the
Respondent treated per diem as allowances subject to PAYE.
(iv) The Respondent reviewed the Applicant''s objection and issued an objection
decision upholding the assessment on the basis that the Applicant had failed to
account for tax on total employee renumeration.
(v) The Applicant objected to the Respondent''s objection decision challenging the
PAYE assessment on grounds that it had been wrongly assessed PAYE.
(vi) That the Respondent filed a statement of reasons opposing the application.
(vii) In specific reply to paragraphs 3 to 8 of the Applicant''s affidavit in support, the
Respondent stated that the averments of the application are misleading as there
is no evidence the Tribunal advised the applicant to amend its pleadings.
(viii) That in specific reply to paragraph 7 and 8 of the affidavits in support, the
application is not sustainable in law as its intended to introduce a new cause of
action that is not related to TAT Application 227/2022.
(ix) That the jurisdiction of the Tax Appeals Tribunal is restrained to adjudicate
objection decisions and not averments pleaded at will by parties and as such,
this application is expressly prohibited by the law.
(x) That the application is misconceived, frivolous, vexatious and an abuse of court
process and ought to be struck out or dismissed with costs on account of the fact
that it does not amend the criteria for court to exercise its jurisdiction and allow
amendment of TAT Application 227/2022.
(xi) That it is in the interest of justice that the orders prayed for in this application are
not granted and that the application is dismissed with costs.
2. Representation
At the hearing of this Application, Mr. Sydney Ojwee appeared for the Applicant while
Mr. Tonny Kalungi and Mr. Samuel Oseku appeared for the Respondent.
3. Submissions of the Applicant
The Applicant submitted that they lodged TAT application No.227 of 2022 on grounds
that they had wrongly been assessed PAYE in the sums of Shs. 322,024,319. In their
application, the Applicant''s former lawyers framed the issue:
"1. Whether the site allowances are exempt under section 19(2) (d) of the Income Tax Act
2. "what is the actual amount of site allowances the Applicant paid to its employees."
The Applicant prayed for leave to amend their application so that the real issue in
controversy between the parties is determined. The issues in the application in its
current form do not reflect the real issue that needs determination by the Tribunal.
The Applicant submitted that the tribunal is vested with jurisdiction to grant such
applications in order to avoid the substance of the matter from being defeated by
technicalities. The applicant cited Article 126(2) (e) of the Constitution of the
Republic of Uganda, 1995 as amended which states that;
"In adjudication of cases of both civil and criminal nature, courts shall, subject to the law,
administer substantive justice without undue regard to technicalities."
The Tribunal has wide and extensive powers to allow amendment of pleadings. These
powers are designed to prevent the failure of justice due to procedural errors, mistakes
and defects. Thus, the object of amendment of pleading is to enable the parties to alter
or amend their pleadings so as to determine the true substantive merits of the case
having regard to substance rather than form.
The Applicant cited the law on amendment of pleadings which is provided for under
Order 6 Rule 19 Of the Civil Procedure Rules S1 71-1 which states that;
"The court may at any stage of the proceedings allow either party to alter or amend
his/her pleadings in such a manner and such terms as may be necessary for the
purposes of determining the real question in controversy between the parties"
This position was re-affirmed in the case of Sarah Nyakato V Lin Jeng Liang M.A
No 316 Of 2022, where it was held that the object of amendment of pleadings is to
enable the parties alter their pleadings so as to determine the true substantive merits
of the case having regard to the substance rather than form.
The Applicant also cited the case of Nyanzi Sam V Daisy Lwanga Namirembe MΑ
3123 of 2023, where it was held that the recognised principles governing the exercise
of discretion in allowing the amendment of pleadings are as follows;
(i) That the amendment should not work injustice to the other side. An injury that
can be compensated for by way of costs is not treated as an injustice.
(ii) Multiplicity of proceedings should be avoided as far as possible and all
amendments which avoid such multiplicity should be allowed.
(iii) An application made malafide should not be granted.
(iv) No amendment should be allowed where it is expressly or implied prohibited by
any law.
The Applicant further submitted that the amendment to the original application shall
not prejudice the Respondent or cause it injustice as it does not bring in new facts but
rather refocuses the issues to resolve the contention at hand. The Applicant''s actual
grievance is whether it is liable to pay PAYE for employees who are no longer
employed by it.
The Applicant additionally submits that the poor structuring and raising of issues was
the mistake of the Applicant''s previous lawyers who made the application on behalf of
the Applicant therefore their mistakes should not be visited on the Applicant.
4. Submissions by the Respondent
The Respondent submitted that the law on amendment of pleadings is governed by
Order 6 Rule 19 Of the Civil Procedure Rules and this provision grants court the
discretion to grant leave to the parties to amend their pleadings at any stage of the
proceedings, however courts have overtime developed parameters within with such
discretion should be exercised. The Respondent relied on Muwolooza & Brothers V
N. Shah & Co. Ltd Civil Appeal No.26 Of 2010 where it was held that amendments
to pleadings sought before the hearing should be freely allowed if they can be made
without injustice to the other side and there is no injustice of the other side can be
compensated by costs. The court will not refuse to allow an amendment simply
because it introduces a new case but there is no power to enable one distinct cause
of action to be substituted for another. The court will refuse leave to amend where the
amendment would change the action into one of a substantially different character.
The Respondent also made reference to the principles which govern the exercise of
discretion in allowing amendments to pleadings (see
(i) The amendment should not work injustice to the other side. An injury that can be
compensated for by way of costs is not treated as an injustice.
(ii) Multiplicity of proceedings should be avoided as far as possible and all
amendments which multiplicity should be allowed.
(iii) An application which is made malafide should not be granted
(iv) No amendment should be allowed where it is expressly or impliedly prohibited
by the law.
The Respondent further submitted that the Applicant lodged TAT Application 227/2022
on grounds that it had been wrongly assessed PAYE and raised their issues, therefore
it is surprising that the matter went on through scheduling and mediation and it is only
at the hearing stage that the Applicant sought to amend their pleadings to raise this.
Specifically, the Respondent contends that the issue as to whether the Applicant is
liable to pay PAYE for employees who are no longer employed by it or during periods
when they were not paying salaries was never pleaded.
Therefore, this amendment seeks to introduce a new cause of action contrary to what
was pleaded and this is against the cardinal principle of parties being bound by their
pleadings. The Applicant throughout the assessment, objection process and through
mediation did not plead nor raise the issue whether it is liable to pay PAYE for
employees who are no longer employed by it or during periods when they were not
paying salaries is a total contravention of the objection decision and consequentially
falls outside the mandate and jurisdiction of the Tribunal.
Further, the Respondent submitted that the amendment is expressly prohibited by law
as it falls outside this jurisdiction of this Tribunal and the Applicant has failed to prove
that the application passes the parameters as laid out in the case of Gasso
transporters (supra) for court to exercise its discretion and invite the Tribunal to deny
the grant of this application and dismiss it with costs.
5. Submissions of the Applicant in Rejoinder
In rejoinder, the Applicant submitted that the amendment will not introduce a new
cause of action as the same has always been that the Applicant was assessed PAYE
on grounds that it under declared tax from the employees renumeration. In the sought
amendment, the Applicant seeks to focus the issues in contention to why it contends
that it did not under declare tax from the employees renumeration. The Respondent''s
contentions on a new cause of action in the Applicant''s amendment are misplaced.
6. The Determination by the Tribunal
Having read the submissions of the parties, this is the decision of the Tribunal.
Rule 22 of the Tax Appeals Tribunal Rules grants the Tribunal the discretion to allow
parties to amend their pleadings provided that such amendments do not raise new
issues. Further, the application ought to be made at any time before the closure of the
case.
The principles that govern the exercise of discretion to allow or disallow amendment of
pleadings were laid down in the Supreme Court decision in Gasso Transport Services
Limited v Martin Adala Obene SCCA 4 of 1994. These are:
(i) The amendment should not work injustice to the other side. An injury that can be
compensated for by way of costs is not treated as an injustice.
(ii) The multiplicity of proceedings should be avoided as far as possible and all
amendments, which avoid such multiplicity, should be allowed.
(iii) An application which is made mala fide should not be granted.
(iv) No amendment should be allowed where it is expressly or impliedly prohibited by
any law (Limitation of Action).
Amendments are premised on the need for courts to determine the real questions in
controversy between the parties and to avoid multiplicity of pleadings. Where it appears
that the way in which a party has framed his case will not lead to a decision on the real
matter in controversy, it is as much a matter of right on his part to have it corrected, if it
can be done without injustice, as anything else in the case is a matter of right.
However, it should be noted that the Court cannot amend pleadings under the above
provisions where to do so would be tantamount to exonerating a party from complying
with statutory provisions (Biiso v Tibamwenda [1991] HCB 92).
The amendment also ought to be pursued at the earliest available opportunity that is as
soon as the issue which requires amendment is brought to the Court or parties'' attention.
A party therefore, should not leave their application to a stage so late in the proceedings
that to allow an amendment then would be unjust to his opponent (Eastern Bakery v
Castelino [1958] EA 461).
Further, Odgers on Pleadings and Practice 20th Edition at page 170 states that
where the amendment is necessary to enable justice to be done between the parties, it
will be allowed even at a late stage.
Application of the above principles to the facts
In 2021, the Respondent assessed the Applicant PAYE in the amount of Shs.
222,356,987. The assessment was on the grounds that allowances paid to workers
formed part of their salaries and were therefore subject to PAYE. The Applicant objected
to the assessment on the grounds that the payments were used to facilitate travel, meals
and as such are not subject to PAYE. The Respondent disallowed the objection.
On 14 September 2022, the Applicant applied to this Tribunal to review the
Respondent''s objection decision.
In their application, they framed the following issues:
"1. Whether the site allowances are exempt under section 19(2) (d) of the Income Tax Act
2. What is the actual amount of site allowances the Applicant paid to its employees.
3. Whethe the Respondent''s assessment is lawful
4. Whether the Applicant is liable to pay the tax assessed."
We have perused the record of proceedings and have established that on 16 May 2023,
when the matter came up for scheduling, the parties framed the following agreed upon
issues:
"1. Whether the Applicant is liable to pay the tax assessed?
2. What remedies are available?"
The Applicant would like to substitute the issues listed in their application with the
following issue:
"Whether the Applicant is liable to pay the tax as assessed.”
The Respondent argues that re-framing the issue as requested by the Applicant will
result in a change in the cause of action. Specifically, the Respondent contends that the
issue as to whether the Applicant is liable to pay PAYE for employees who are no longer
employed by it or during periods when they were not paying salaries was never pleaded.
We do not agree with the Respondent. From the very beginning, this dispute has been
about the Applicant''s PAYE declarations. The Respondent raised an additional PAYE
assessment against the Applicant. There is no change in the cause of action. The
substantive question for determination by the Tribunal is whether the Applicant is liable
to pay the PAYE as assessed by the Respondent.
Further, there will be no injustice occasioned to the Respondent if the application is
granted. Moreover, when the matter came up for scheduling, the parties jointly agreed
to frame the issue in the same manner as that currently proposed by the Applicant.
It should also be noted that at scheduling, one of the agreed facts was stated as follows:
"The Applicant objected inter alia on the ground that some of the employees had been laid off
due to COVID 19."
Having agreed to the above fact, the Respondent cannot now argue that employees
who are no longer employed by the Applicant or during periods when the Applicant was
not paying salaries was never pleaded.
While the issues as framed by the Applicant in their application were four, at scheduling,
these were condensed to into one issue, namely, whether the Applicant is liable to pay
the tax assessed. The purpose of scheduling/conferencing is for parties to agree on the
issues for disagreement between them.
Since the controversy between the parties is whether the applicant was correctly or
wrongly assessed PAYE, framing the issue along these lines will enable the Tribunal to
make a determination based on the true substantive merits of the case.
Therefore, the application is hereby allowed and the Tribunal makes the following
orders:
i. The Applicant is granted leave to amend the issues in TAT Application No. 227
of 2022.
ii. The Applicant should file and serve its amended application within seven (7)
working days from the date of this ruling.
iii. Each party should bear their own costs
Dated at Kampala this 26th day of March 2025.', 'This ruling reinforces the Tax Appeals Tribunal''s broad discretion to allow amendments to pleadings, particularly when such amendments aim to clarify the real issues in controversy and prevent injustice. Tax practitioners should note that the Tribunal prioritizes substantive justice over procedural technicalities, as enshrined in Article 126(2)(e) of the Constitution. The key takeaway is that amendments are generally permitted if they do not introduce a wholly new cause of action, do not prejudice the other party (or such prejudice can be compensated by costs), and avoid multiplicity of proceedings. This case highlights the importance of clearly defining the scope of an appeal from the outset, but also provides a mechanism for correction if initial pleadings are found to be inadequate. Practitioners should be mindful of the principles laid out in cases like *Gasso Transport Services Limited v Martin Adala Obene SCCA 4 of 1994* when considering amendments.

*   **Takeaway:** The TAT will generally allow amendments to pleadings to ensure substantive justice, even at a late stage, provided no new cause of action is introduced and no irremediable injustice is caused.
*   **Risk/Precedent:** While amendments are allowed, introducing a completely new cause of action that was not part of the original objection decision may be prohibited, as the Tribunal''s jurisdiction is tied to the objection decision.
*   **Relevant Acts/Sections:** Tax Appeals Tribunal (Procedure) Rules 2012 (Rule 30, Rule 22), Civil Procedure Rules (Order 6 Rule 19), Civil Procedure Act (Section 98), Constitution of the Republic of Uganda, 1995 (Article 126(2)(e)).', '2026-07-06 17:57:01.51344+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;
INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ('9dfe41bd-ee61-44be-a99a-63ea3db404e9'::uuid, 'APPLICATIONS NO. 139, 144, 240, 270 & 330, 274, 304, 312, 332, 342, 380 OF 2024', 'NYANGA OBUROFA ENTERPRISES LTD & 9 OTHERS v UGANDA REVENUE AUTHORITY', 2025, 'WHT', 'Allowed', 'Multiple applicants challenged the Uganda Revenue Authority''s (URA) imposition of withholding tax (WHT) on imported agricultural produce from Tanzania, despite holding WHT exemption certificates. The Tribunal found that agricultural supplies are explicitly exempt from WHT under Section 136(5)(c) of the Income Tax Act. It also ruled that the requirement for a 30% deposit does not apply to disputes concerning the legality of a tax, rather than its quantum, and that the URA''s denial of entry constituted a taxation decision appealable to the Tribunal. The Tribunal ordered the URA to refund any WHT paid and allow entry of the goods.', 'This ruling is in respect of an application challenging the Respondent''s imposition of withholding tax on the agricultural produce imported by the Applicant.

1. Background facts

The Applicants import agricultural goods (rice, beans, soya beans, millet, onions, groundnuts, maize, sorghum, onions, Irish potatoes) from the Republic of Tanzania. The Applicants applied for a withholding tax (WHT) exemption certificate which the Respondent granted. The Applicants contend that at the time of the importation and declarations the Respondent charged withholding tax on all the produce even with valid and running exemption certificates. The Respondent contended that the Applicants alleged that they were denied the benefit of their WHT exemptions when the Respondent demanded WHT on the said imports, despite the Applicants holding valid WHT exemption certificates. Being dissatisfied, the Applicants filed applications before the Tax Appeals Tribunal.

Given that there were various applications filed concerning the same issue, the Tribunal guided the parties to file joint submissions so that a single decision is made. This would save time rather than resolve each application separately, and the parties agreed to this.

2. Issue for determination

The issue for determination is whether the Applicants are liable to withholding tax on importation of rice and other agricultural produce.

...

The Applicants alleged that they are exempted from WHT in accordance with Section 136 (3) and (5) of the Income Tax Act, which provides:

"(3) Every person who imports goods into Uganda is liable to pay at the time of importation on the value of the goods at the rate prescribed in Part X of Schedule 4 to this Act".

However, Subsection (5) provides:

"(5) This section does not apply to-

(a) importations by organisations within the definition of "exempt organisation" in section 2(a)(ii) of that definition;

(b) a supplier or importer-

i. who is exempt from tax under this Act; or

ii. who the Commissioner General is satisfied has regularly complied with the obligations imposed on the supplier or importer under this Act; and

(c) agricultural supplies.”

The ITA does not define the term "agricultural supplies". Therefore, in the absence of a definition, we must defer to the ordinary or literal meaning of the term.

The term "agricultural" is an adjective that refers to things that are related to or used in farming (The term "agricultural" is an adjective that refers to things that are related to or used in farming
(https://dictionary.cambridge.org/dictionary/english/agricultural)

The term supplies is defined to mean food or other things necessary for living
(https://dictionary.cambridge.org/dictionary/english/supplies).

Therefore, the term "agricultural supplies" can be taken to mean things such as food items that are related to farming.

In the present case, the Applicants seek to import agricultural produce such as rice, beans, ground nuts, among others. These items, which constitute agricultural produce are related to or used in farming. Therefore, they are agricultural supplies within the meaning of the ITA.

The Applicants imported or sought to import supplies such as rice, beans, ground nuts, soya, sorghum and other produce into the country. These are agricultural supplies which are not subject to withholding tax as per section 136 (5) (c) of the ITA.

We therefore find that the Applicants are exempt from withholding tax in respect of the importation of agricultural produce. Therefore, the Respondent actions of imposing withholding tax on the agricultural products were unlawful.', 'This ruling is a significant win for importers of agricultural produce in Uganda, clarifying the application of withholding tax exemptions. The key takeaway is that agricultural supplies are statutorily exempt from WHT under Section 136(5)(c) of the Income Tax Act, regardless of whether an exemption certificate is held or has expired. This decision reinforces the principle that the legality of a tax imposition can be challenged without first paying the mandatory 30% deposit, especially when no formal assessment has been issued. Tax practitioners should advise clients importing agricultural goods to rely on this statutory exemption and challenge any unlawful WHT demands. The ruling also highlights the importance of the Tax Appeals Tribunal''s jurisdiction over ''taxation decisions,'' which can include actions like denying entry of goods.

*   Statutory exemption for agricultural supplies under ITA Section 136(5)(c) is paramount.
*   30% deposit rule does not apply to disputes on tax legality, only quantum.
*   URA actions like denying goods entry can be challenged as ''taxation decisions'' at TAT.', '2026-07-04 16:23:53.069969+00'::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;