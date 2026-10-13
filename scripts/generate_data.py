import json

# 1. SITE SETTINGS
SITE_SETTINGS = [
    {"key": "calc_corporate_rate", "value": "30"},
    {"key": "calc_import_rate", "value": "43"},
    {"key": "calc_paye_rate", "value": "12"},
    {"key": "calc_vat_rate", "value": "18"},
    {"key": "calc_wht_rate", "value": "6"},
    {"key": "hero_badge_text", "value": "Built for Uganda Tax & Customs Professionals"},
    {"key": "hero_subtitle", "value": "AI case analysis, TAT precedent research, live tax & import calculators, and compliance checking tools — purpose-built for Uganda's tax ecosystem."},
    {"key": "hero_title_line1", "value": "The tax intelligence"},
    {"key": "hero_title_line2", "value": "platform your practice"},
    {"key": "hero_title_line3", "value": "actually needs"},
    {"key": "pesapal_ipn_id_production", "value": "556a236c-3976-40da-8305-da35dcc97ba4"},
    {"key": "stat_calculators", "value": "6"},
    {"key": "stat_cases", "value": "1,200+"},
    {"key": "stat_practitioners", "value": "350+"},
    {"key": "stat_time_saved", "value": "85%"},
    {"key": "topbar_email", "value": "hello@taxwise.cloud"},
    {"key": "topbar_text", "value": "🇺🇬 Engineered for Uganda's Tax & Customs Ecosystem"}
]

# 2. USERS
USERS = [
    {
        "id": "0ef2a671-722d-465b-bb01-6baba1c94690",
        "email": "nexoshealthai@gmail.com",
        "full_name": "Nexos",
        "role": "Tax Consultant",
        "plan": "free",
        "created_at": "2026-07-07 08:22:27.659493+00",
        "last_login": None
    },
    {
        "id": "2659af7a-7132-426d-a1fb-a3fbe5a12848",
        "email": "princefredkent@gmail.com",
        "full_name": "Fred Kent",
        "role": "Admin",
        "plan": "free",
        "created_at": "2026-06-15 06:23:29.093788+00",
        "last_login": None
    },
    {
        "id": "46b4e1df-8bee-4dee-bfcc-24b8614999fd",
        "email": "ec632145@gmail.com",
        "full_name": "Eric",
        "role": "Tax Consultant",
        "plan": "free",
        "created_at": "2026-10-07 19:31:02.448999+00",
        "last_login": None
    },
    {
        "id": "5882774d-39e0-4b2e-a7a1-90551ebbd4dd",
        "email": "test69@gmail.com",
        "full_name": "Test 69",
        "role": "Tax Consultant",
        "plan": "free",
        "created_at": "2026-07-09 07:31:27.301119+00",
        "last_login": None
    },
    {
        "id": "67c34b59-ac3e-487a-9601-712af19c14f4",
        "email": "princefattahkent@gmail.com",
        "full_name": "Tester",
        "role": "Tax Consultant",
        "plan": "free",
        "created_at": "2026-06-20 06:30:22.183942+00",
        "last_login": None
    },
    {
        "id": "8f1022eb-171c-4845-9910-f097fe54657d",
        "email": "geraldmuwanguzi50@gmail.com",
        "full_name": "Muwanguzi Gerald",
        "role": "Tax Consultant",
        "plan": "free",
        "created_at": "2026-07-11 18:00:15.555553+00",
        "last_login": None
    },
    {
        "id": "a9e5e811-1a15-4c68-be82-faa5ce05bc24",
        "email": "bakulumpagieric99@gmail.com",
        "full_name": "ERIC",
        "role": "Admin",
        "plan": "free",
        "created_at": "2026-07-04 13:51:00.943779+00",
        "last_login": None
    },
    {
        "id": "f8174d44-d81a-4e70-9f4b-64744f969d09",
        "email": "taxwiseplatform@gmail.com",
        "full_name": "Tester123",
        "role": "Tax Consultant",
        "plan": "free",
        "created_at": "2026-07-04 11:36:52.408438+00",
        "last_login": None
    }
]

# 3. USER PROGRESS (ENROLLMENTS)
USER_PROGRESS = [
    {
        "id": "14360c7a-eb63-444f-92c6-9c5c2880e886",
        "user_id": "2659af7a-7132-426d-a1fb-a3fbe5a12848",
        "course_id": 1,
        "progress": 0,
        "completed_lessons": [],
        "completed_at": None,
        "created_at": "2026-06-15 07:49:06.881828+00"
    },
    {
        "id": "7f172271-2a1d-42ac-95b6-e9984d624d93",
        "user_id": "a9e5e811-1a15-4c68-be82-faa5ce05bc24",
        "course_id": 2,
        "progress": 0,
        "completed_lessons": [],
        "completed_at": None,
        "created_at": "2026-07-04 16:02:00.149399+00"
    }
]

# 4. COMPLIANCE CHECKS (COMPLIANCE REPORTS)
COMPLIANCE_CHECKS = [
    {
        "id": "1cbdf1d3-142f-4eb4-812c-4d9b5715557d",
        "user_id": "a9e5e811-1a15-4c68-be82-faa5ce05bc24",
        "type": "efris",
        "responses": {},
        "risk_report": "# EFRIS Compliance Risk Report\n\n## Overall Risk Assessment\n\n**Current Compliance Score: 0%**\n\nThe current compliance score of 0% indicates a **critical level of non-compliance** with Uganda Revenue Authority eFRIS requirements.",
        "score": 0,
        "created_at": "2026-07-15 10:58:30.235823+00"
    },
    {
        "id": "e0aa48fc-971c-472c-8ef8-af2402bc7af3",
        "user_id": "a9e5e811-1a15-4c68-be82-faa5ce05bc24",
        "type": "efris",
        "responses": {},
        "risk_report": "## Risk Report: eFRIS Compliance Assessment\n\n**Date:** October 26, 2023\n\n---\n\n### 1. Overall Risk Assessment\n\n**Current Compliance Score:** 0%\n**Threat Level:** Critical\n\nThe current compliance score of 0% indicates a complete and systemic failure to adhere to the Electronic Fiscal Receipting and Invoicing System (eFRIS) requirements as mandated by the Uganda Revenue Authority",
        "score": 0,
        "created_at": "2026-07-06 07:12:43.790615+00"
    }
]

print("Base constants defined")
