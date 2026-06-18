---
name: i18n-mass-update
description: Parallel-agent strategy for adding i18n translations across a large codebase — extract strings, build translation files, and update components in parallel batches.
source: auto-skill
extracted_at: '2026-06-18T12:05:54.231Z'
---

# i18n Mass Update Strategy

Use this approach when adding internationalization (i18n) to a large codebase with many files that have hardcoded text — especially when multiple languages are involved and many components/pages need updating.

## Why

Updating 40+ files with hundreds of hardcoded strings across 4 languages is impractical to do serially. Parallel subagents let you extract strings, build translation files, and update components simultaneously without conflicts since each agent works on non-overlapping file sets.

**How to apply:** When asked to add i18n across a project, follow this phased parallel-agent workflow:

## Phase 1: Discovery (single explore agent)

Launch one agent to survey the entire codebase:
- Check existing i18n setup (config, translation files, packages)
- Identify which files already use translations vs. which have hardcoded text
- Count languages configured and which translation sections are missing per language
- Report bugs in existing i18n usage (wrong import, stale i18next.t)

## Phase 2: String extraction (parallel explore agents)

Launch 2-3 parallel explore agents, each covering a group of files by category:
- Agent A: Public-facing pages + app-level files (Home, Login, Signin, App, Footer, Blog, etc.)
- Agent B: Portal pages (Dashboard, Cashier, Patients, Visits, etc.)
- Agent C: Sub-components (doctor/, patients/, admin/, medicine/, visits/)

Each agent reads its assigned files and outputs a structured list: `Original text → Suggested i18n key`.

## Phase 3: Translation files (master first, then parallel)

1. Write the complete English translation file first (the source of truth with ALL keys)
2. Launch 1 parallel agent per non-English language to create translation files with the same JSON structure
3. Each agent reads the English file, then writes its language file preserving all keys and interpolation placeholders

## Phase 4: Component updates (parallel agents by file category)

Launch parallel agents, each updating a non-overlapping set of files:

| Agent | Files to cover |
|---|---|
| Layout | Sidebar, Topbar, PortalLayout |
| Doctor | VitalSignsForm, ConsultationTab, HerbalMedicineForm, InvestigationForm, PatientHistoryTab, ActivePrescriptions, PendingInvestigations, FollowUpIndicator |
| Patient/Admin/Misc | PatientForm, PatientCard, admin/*, MedicineForm, VisitForm |
| Public | Footer, Blog, Testimonials, Home, LoginPage, SigninPage, Admin page, App.jsx, PrintableReceipt |
| Portal pages | DashboardPage, CashierPage, PatientsPage, VisitsPage, DoctorQueuePage, MedicinesPage, PharmacyPage, LaboratoryPage, CashierReportsPage, PatientDetailPage |

Each agent:
- Reads the English translation file to get exact key paths
- Uses `useTranslation` from `react-i18next` (not `i18next.t` directly)
- Replaces hardcoded strings with `t("key.path")` calls
- For dynamic strings, uses interpolation: `t("key.template", { variable })`
- Does NOT change logic, structure, or styling

## Key rules

- Always use `useTranslation` from `react-i18next` — never import `t` directly from `i18next` (won't re-render on language change)
- Keep interpolation placeholders (`{{firstName}}`, `{{status}}`, etc.) EXACTLY as they appear in the English file
- Currency codes, phone numbers, email addresses, and URLs stay as-is across all languages
- All translation files must have identical JSON key structure
- Use `common.*` namespace for shared strings (Cancel, Save, Patient, Amount, etc.)
- Each parallel agent's file set must be non-overlapping to avoid write conflicts
