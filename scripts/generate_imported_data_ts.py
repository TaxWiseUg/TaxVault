import glob
import csv
import json
import os

# 1. Load tat_cases
cases = []
seen = set()
for f in sorted(glob.glob('scripts/tat_cases_part*.csv')):
    with open(f, encoding='utf-8', errors='replace') as fp:
        reader = csv.DictReader(fp)
        for r in reader:
            cn = r.get('case_number', '').strip()
            if cn and cn not in seen:
                seen.add(cn)
                try:
                    yr = int(r.get('year', 0))
                except:
                    yr = 2024
                cases.append({
                    'id': r.get('id'),
                    'case_number': cn,
                    'title': r.get('title', ''),
                    'year': yr,
                    'tax_type': r.get('tax_type', 'Income Tax'),
                    'outcome': r.get('outcome', 'Allowed'),
                    'summary': r.get('summary', ''),
                    'full_text': r.get('full_text', ''),
                    'ai_commentary': r.get('ai_commentary', ''),
                    'created_at': r.get('created_at', '2026-07-04 12:00:00+00')
                })

# 2. Load admin_logs
admin_logs = []
with open('scripts/admin_logs.csv', encoding='utf-8') as fp:
    reader = csv.DictReader(fp)
    for r in reader:
        meta = r.get('metadata', '{}')
        try:
            parsed_meta = json.loads(meta)
        except:
            parsed_meta = {}
        row_id = r.get('id', '').strip()
        if not row_id or row_id == 'None':
            import uuid
            row_id = str(uuid.uuid4())
        admin_logs.append({
            'id': row_id,
            'action': r.get('action', ''),
            'performed_by': r.get('performed_by', ''),
            'metadata': parsed_meta,
            'created_at': r.get('created_at', '2026-07-04 12:00:00+00')
        })

# 3. Load users, site_settings, enrollments, compliance_reports
from scripts.generate_data import SITE_SETTINGS, USERS, USER_PROGRESS, COMPLIANCE_CHECKS

# 4. Courses from schema.sql
COURSES = [
  {
    "id": 1,
    "title": "Uganda Tax Fundamentals",
    "level": "Beginner",
    "emoji": "📘",
    "color": "#E6F5F2",
    "accent_color": "#1A7B6B",
    "description": "Master Income Tax, VAT, PAYE, and withholding tax from scratch. Built for new business owners and accounting students.",
    "lessons": [
      {
        "id": "1a",
        "title": "Introduction to Uganda's Tax System",
        "duration": "15 min",
        "content": "Uganda's tax system is administered by the Uganda Revenue Authority (URA), established under the Uganda Revenue Authority Act, Cap 196. The main taxes include: **Income Tax** (governed by the Income Tax Act, Cap 340), **Value Added Tax** (VAT Act, Cap 349), **Pay As You Earn** (PAYE — a form of Income Tax), **Withholding Tax**, and **Excise Duty**.\n\nThe URA is divided into the Domestic Taxes Department (handling income tax, VAT, PAYE) and the Customs Department (handling import/export duties).\n\n**Key Principle:** Tax is a legal obligation. Every person earning income above the threshold, every registered business, and every employer must comply with Uganda's tax laws or face penalties and interest."
      },
      {
        "id": "1b",
        "title": "Income Tax — Who Pays & How Much",
        "duration": "20 min",
        "content": "**Individual Income Tax** applies to all income earned by residents and non-residents from Ugandan sources. Rates for individuals (2024/25):\n\n- Income up to UGX 2,820,000/year: **0% (exempt)**\n- UGX 2,820,001 – 4,920,000: **10%**\n- UGX 4,920,001 – 120,000,000: **20%**\n- Above UGX 120,000,000: **30%**\n\n**Corporate Tax** is charged at **30%** of chargeable income for resident companies. Agribusiness companies enjoy a reduced rate of **25%**.\n\n**Filing:** Individual tax returns are due by **30 June** each year. Corporate returns are due **6 months** after the end of the accounting period."
      },
      {
        "id": "1c",
        "title": "VAT — Registration, Rates & Filing",
        "duration": "25 min",
        "content": "**VAT Registration** is mandatory when taxable turnover exceeds **UGX 150 million** in any 12-month period. Voluntary registration is allowed below this threshold.\n\n**VAT Rates:**\n- Standard rate: **18%** on most goods and services\n- Zero-rated (0%): Exports, some foodstuffs, educational materials\n- Exempt: Medical services, financial services, residential accommodation\n\n**Input VAT:** Registered taxpayers can claim back VAT paid on business purchases (input tax) against VAT collected on sales (output tax). The difference is either paid to URA or refunded.\n\n**Filing:** VAT returns are due on the **15th of the following month**. Late filing attracts a penalty of **2% per month** on the outstanding tax."
      },
      {
        "id": "1d",
        "title": "PAYE — Employer Obligations",
        "duration": "20 min",
        "content": "**PAYE (Pay As You Earn)** requires every employer to deduct income tax from employees' salaries and remit to URA by the **15th of the following month**.\n\n**Employer Duties:**\n1. Register with URA as an employer\n2. Obtain Tax Identification Numbers (TINs) for all employees\n3. Calculate tax on gross pay minus allowable deductions\n4. Deduct NSSF (10% employee, 10% employer)\n5. File PAYE return and pay by the 15th\n\n**Key Risk:** Failure to deduct and remit PAYE makes the **employer personally liable** for the tax plus 2% monthly interest plus penalties up to 20% of the tax due."
      }
    ]
  },
  {
    "id": 2,
    "title": "TAT Appeals: Process & Strategy",
    "level": "Intermediate",
    "emoji": "⚖️",
    "color": "#FEF3CD",
    "accent_color": "#C8922A",
    "description": "Master the Tax Appeals Tribunal process — from objections to appeals, jurisdiction rules, and building a winning case.",
    "lessons": [
      {
        "id": "2a",
        "title": "The TAT — Structure & Jurisdiction",
        "duration": "20 min",
        "content": "The **Tax Appeals Tribunal (TAT)** was established under the Tax Appeals Tribunal Act, Cap 345. It provides an independent forum for taxpayers to challenge URA decisions without going to the High Court first.\n\n**Jurisdiction:** The TAT hears appeals against:\n- URA assessments and amended assessments\n- Refusal to grant refunds\n- Penalties and interest charges\n- Decisions on objections\n\n**Composition:** The TAT consists of a Chairperson (must be an advocate of 10+ years), Deputy Chairperson, and members appointed by the Minister of Finance.\n\n**Critical Limitation:** The TAT **cannot** hear matters where no objection was first filed with URA, or where the 30-day filing window has lapsed."
      },
      {
        "id": "2b",
        "title": "The 30-Day Rule — Uganda's Most Critical Tax Deadline",
        "duration": "25 min",
        "content": "**Section 14 of the TAT Act** requires that any appeal must be filed **within 30 days** of receiving URA's objection decision.\n\n**This is the most litigated issue in Uganda tax law.** Missing this deadline means:\n1. The TAT has **no jurisdiction** to hear your appeal\n2. The case will be **dismissed** regardless of its merits\n3. You lose the right to challenge the assessment at TAT level\n\n**Case Study — Edward Mwanje v URA (TAT No. 145/2025):** The taxpayer filed 45 days after receiving URA's objection decision. The TAT dismissed the appeal for lack of jurisdiction. The merits of the case were never considered.\n\n**Practical Tips:**\n- Diarise the deadline the day you receive URA's decision\n- File even a basic notice of appeal to preserve jurisdiction\n- Always request an acknowledgement of receipt from TAT"
      },
      {
        "id": "2c",
        "title": "Filing an Objection with URA",
        "duration": "20 min",
        "content": "Before going to TAT, you must first file an **objection with URA**. This is a mandatory pre-condition.\n\n**Objection Requirements (Section 101, Income Tax Act):**\n- Filed within **45 days** of receiving the assessment\n- Must state the **grounds of objection** in detail\n- Must be in **writing** addressed to the Commissioner\n- Must include all supporting documents\n\n**URA's Response:** URA must issue an objection decision within **90 days**. If they fail to respond within 90 days, the taxpayer may proceed directly to TAT treating the silence as a deemed refusal.\n\n**Deposit Requirement:** Where the assessment is above UGX 50 million, URA may require a deposit of **30% of the disputed tax** before the objection is heard."
      }
    ]
  },
  {
    "id": 3,
    "title": "URA eFRIS Mastery",
    "level": "Professional",
    "emoji": "🖥️",
    "color": "#E8EDF5",
    "accent_color": "#0F2044",
    "description": "Complete compliance guide for Uganda's Electronic Fiscal Receipting & Invoicing System. For tax agents and business owners.",
    "lessons": [
      {
        "id": "3a",
        "title": "What is eFRIS and Who Must Use It",
        "duration": "15 min",
        "content": "**eFRIS (Electronic Fiscal Receipting and Invoicing Solution)** is URA's system requiring businesses to issue electronic receipts for all taxable sales. It was rolled out in phases starting 2021.\n\n**Who Must Comply:**\n- All VAT-registered taxpayers\n- Businesses with turnover above UGX 50 million\n- Hotels, supermarkets, fuel stations, pharmacies (regardless of turnover)\n- Any business directed by URA to adopt eFRIS\n\n**How It Works:** A fiscal device (Electronic Receipting Device — ERD) is connected to your point of sale. Every sale is transmitted in real-time to URA's central server and a QR-coded fiscal receipt is issued to the customer.\n\n**Non-Compliance Penalties:** Failure to issue fiscal receipts attracts a penalty of **UGX 2 million per day** of non-compliance."
      },
      {
        "id": "3b",
        "title": "eFRIS Registration & Setup",
        "duration": "20 min",
        "content": "**Step-by-Step eFRIS Registration:**\n\n1. Log in to URA's TaxPro system (efris.ura.go.ug)\n2. Navigate to eFRIS → Business Registration\n3. Enter your TIN, business name, and branch details\n4. Select your ERD type (integrated VSDC or web-based)\n5. Submit and await URA approval (typically 2-5 business days)\n6. Collect or configure your fiscal device\n7. Test with URA before going live\n\n**Device Types:**\n- **VSDC (Virtual Sales Data Controller):** Software installed on your POS system\n- **Physical ERD:** Hardware device for businesses without POS software\n- **Web-based eFRIS:** Direct web interface for low-volume businesses\n\n**Important:** All devices must be activated by URA before first use. Do not issue receipts on unactivated devices."
      }
    ]
  }
]

# 5. Cases analyzed
CASES = [
  {
    "id": "case-demo-1",
    "user_id": "a9e5e811-1a15-4c68-be82-faa5ce05bc24",
    "title": "Uganda Clays VAT Input Audit Assessment",
    "input_text": "Taxpayer disputed disallowed input tax on industrial machinery purchased in 2024.",
    "ai_summary": {
      "summary": "Assessment of VAT input credit eligibility on imported capital equipment.",
      "keyIssues": ["Input VAT deductibility", "Customs clearance documentation", "Statutory time limits"],
      "verdict": "High probability of success on appeal",
      "risk": "low",
      "riskNote": "Valid bills of entry and custom receipts exist.",
      "tags": ["VAT", "Input Tax", "Machinery"],
      "advice": "Proceed with formal objection under Section 24 of Tax Procedures Code Act.",
      "applicableLaw": ["VAT Act Section 28", "Tax Procedures Code Act Section 24"]
    },
    "risk_level": "low",
    "tags": ["VAT", "Input Tax", "Machinery"],
    "created_at": "2026-07-05 14:10:00+00"
  },
  {
    "id": "case-demo-2",
    "user_id": "2659af7a-7132-426d-a1fb-a3fbe5a12848",
    "title": "Mukwano Industries PAYE Casual Workers Review",
    "input_text": "Audit regarding tax treatment of seasonal agricultural labor.",
    "ai_summary": {
      "summary": "Review of casual laborers classification under Income Tax Act Section 19.",
      "keyIssues": ["Employee vs Independent Contractor", "Withholding tax obligation", "Penalty mitigation"],
      "verdict": "Medium risk of partial liability",
      "risk": "medium",
      "riskNote": "Some seasonal workers work consistently across planting cycles.",
      "tags": ["PAYE", "Employment Taxes", "Agriculture"],
      "advice": "Apply precedent in Kiboga Farmers Cooperative v URA (TAT No. 033/2023) for penalty waiver.",
      "applicableLaw": ["Income Tax Act Section 19", "Tax Procedures Code Act Section 52"]
    },
    "risk_level": "medium",
    "tags": ["PAYE", "Employment Taxes", "Agriculture"],
    "created_at": "2026-07-06 09:30:00+00"
  }
]

print(f"Loaded: {len(cases)} TAT cases, {len(SITE_SETTINGS)} settings, {len(USERS)} users, {len(USER_PROGRESS)} enrollments, {len(COMPLIANCE_CHECKS)} compliance checks, {len(admin_logs)} admin logs.")

# Generate src/lib/importedData.ts
ts_code = f"""/* eslint-disable @typescript-eslint/no-explicit-any */
// Auto-generated from imported Supabase tables

export interface ImportedTatCase {{
  id: string;
  case_number: string;
  title: string;
  year: number;
  tax_type: string;
  outcome: string;
  summary: string;
  full_text?: string;
  ai_commentary?: string;
  created_at: string;
}}

export interface ImportedSiteSetting {{
  key: string;
  value: string;
}}

export interface ImportedUser {{
  id: string;
  email: string;
  full_name: string;
  role: string;
  plan: string;
  created_at: string;
  last_login?: string | null;
}}

export interface ImportedEnrollment {{
  id: string;
  user_id: string;
  course_id: number;
  progress: number;
  completed_lessons: string[];
  completed_at?: string | null;
  created_at: string;
}}

export interface ImportedComplianceReport {{
  id: string;
  user_id: string;
  type: string;
  responses: Record<string, any>;
  risk_report: string;
  score: number;
  created_at: string;
}}

export interface ImportedAdminLog {{
  id: string;
  action: string;
  performed_by: string;
  metadata: Record<string, any>;
  created_at: string;
}}

export const IMPORTED_TAT_CASES: ImportedTatCase[] = {json.dumps(cases, indent=2)};

export const IMPORTED_SITE_SETTINGS: ImportedSiteSetting[] = {json.dumps(SITE_SETTINGS, indent=2)};

export const IMPORTED_USERS: ImportedUser[] = {json.dumps(USERS, indent=2)};

export const IMPORTED_ENROLLMENTS: ImportedEnrollment[] = {json.dumps(USER_PROGRESS, indent=2)};

export const IMPORTED_COMPLIANCE_REPORTS: ImportedComplianceReport[] = {json.dumps(COMPLIANCE_CHECKS, indent=2)};

export const IMPORTED_ADMIN_LOGS: ImportedAdminLog[] = {json.dumps(admin_logs, indent=2)};

export const IMPORTED_COURSES = {json.dumps(COURSES, indent=2)};

export const IMPORTED_CASES = {json.dumps(CASES, indent=2)};
"""

with open('src/lib/importedData.ts', 'w', encoding='utf-8') as out:
    out.write(ts_code)

print("Generated src/lib/importedData.ts successfully!")

# Generate supabase/seed.sql
def sql_escape(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

seed_sql_lines = [
    "-- ====================================================================",
    "-- TaxWise Uganda - Seed Script for Supabase (Imported Tables)",
    "-- Run this in the Supabase SQL Editor after executing schema.sql",
    "-- ====================================================================\n"
]

# 1. Site Settings
seed_sql_lines.append("-- 1. Site Settings")
seed_sql_lines.append("INSERT INTO public.site_settings (key, value) VALUES")
setting_vals = []
for s in SITE_SETTINGS:
    setting_vals.append(f"({sql_escape(s['key'])}, {sql_escape(s['value'])})")
seed_sql_lines.append(",\n".join(setting_vals))
seed_sql_lines.append("ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;\n")

# 2. Courses
seed_sql_lines.append("-- 2. Education Courses")
for c in COURSES:
    lessons_json = json.dumps(c['lessons']).replace("'", "''")
    seed_sql_lines.append(f"""INSERT INTO public.courses (id, title, level, emoji, color, accent_color, description, lessons)
VALUES ({c['id']}, {sql_escape(c['title'])}, {sql_escape(c['level'])}, {sql_escape(c['emoji'])}, {sql_escape(c['color'])}, {sql_escape(c['accent_color'])}, {sql_escape(c['description'])}, '{lessons_json}'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, level = EXCLUDED.level, emoji = EXCLUDED.emoji, color = EXCLUDED.color, accent_color = EXCLUDED.accent_color, description = EXCLUDED.description, lessons = EXCLUDED.lessons;""")
seed_sql_lines.append("")

# 3. TAT Cases
seed_sql_lines.append("-- 3. TAT Case Precedents Library")
for c in cases:
    full_text_val = sql_escape(c.get('full_text'))
    ai_comm_val = sql_escape(c.get('ai_commentary'))
    seed_sql_lines.append(f"""INSERT INTO public.tat_cases (id, case_number, title, year, tax_type, outcome, summary, full_text, ai_commentary, created_at)
VALUES ({sql_escape(c['id'])}::uuid, {sql_escape(c['case_number'])}, {sql_escape(c['title'])}, {c['year']}, {sql_escape(c['tax_type'])}, {sql_escape(c['outcome'])}, {sql_escape(c['summary'])}, {full_text_val}, {ai_comm_val}, {sql_escape(c['created_at'])}::timestamptz)
ON CONFLICT (case_number) DO UPDATE SET title = EXCLUDED.title, year = EXCLUDED.year, tax_type = EXCLUDED.tax_type, outcome = EXCLUDED.outcome, summary = EXCLUDED.summary, full_text = EXCLUDED.full_text, ai_commentary = EXCLUDED.ai_commentary;""")

seed_sql_lines.append("")
os.makedirs('supabase', exist_ok=True)
with open('supabase/seed.sql', 'w', encoding='utf-8') as out:
    out.write("\n".join(seed_sql_lines) + "\n")

print("Generated supabase/seed.sql successfully!")
