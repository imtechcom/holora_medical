# Holora Medical — Design Concept & Guidelines

> Last updated: v1.5.0 (2025-06-14)

---

## 0. Project Checklist

### A. Infrastructure & DevOps

| # | Item | Status | Notes |
|---|------|--------|-------|
| A1 | Docker Compose setup (MySQL, Backend, Frontend, phpMyAdmin) | ✅ Done | 4 services |
| A2 | Production server (DigitalOcean 165.22.241.56) | ✅ Done | Ubuntu 24.04 |
| A3 | CORS multi-origin support | ✅ Done | Comma-separated env |
| A4 | Git version tagging | ✅ Done | v1.0.0 → v1.5.0 |
| A5 | CI/CD pipeline (GitHub Actions) | ❌ Not started | Manual SSH deploy |
| A6 | SSL/HTTPS certificate | ❌ Not started | Currently HTTP only |
| A7 | Domain name setup | ❌ Not started | Using raw IP |
| A8 | Database backup automation | ❌ Not started | |
| A9 | Logging & monitoring (PM2/Sentry) | ❌ Not started | Console.log only |
| A10 | Rate limiting / API protection | ❌ Not started | |

### B. Authentication & Authorization

| # | Item | Status | Notes |
|---|------|--------|-------|
| B1 | JWT login/register | ✅ Done | |
| B2 | Google OAuth | ✅ Done | |
| B3 | Forgot/Reset password | ✅ Done | Email-based |
| B4 | Doctor invite onboarding | ✅ Done | `/doctor/invite-setup` |
| B5 | Role-based route guards (7 roles) | ✅ Done | Patient, Doctor, Admin, ClinicOwner, Receptionist, Accountant, Protected |
| B6 | Permission middleware (provider) | ✅ Done | Subscription + branch access checks |
| B7 | RBAC permissions (role ↔ permission) | ✅ Done | Assign/remove API |
| B8 | Refresh token / token rotation | ❌ Not started | Single JWT only |
| B9 | Session management / force logout | ❌ Not started | |

### C. Admin Zone (`/admin`)

| # | Item | Status | Notes |
|---|------|--------|-------|
| C1 | Dashboard (stats cards) | ✅ Done | 5 aggregate queries |
| C2 | Users CRUD (list, create, edit, detail) | ✅ Done | 4 pages |
| C3 | Roles CRUD (list, create, edit, detail) | ✅ Done | 4 pages |
| C4 | Permissions CRUD (list, create, edit) | ✅ Done | 3 pages |
| C5 | Doctors management (list, create, edit) | ✅ Done | 3 pages |
| C6 | Patients management (list, create, edit) | ✅ Done | 3 pages |
| C7 | Specialties CRUD (list, create, edit) | ✅ Done | Hierarchy support |
| C8 | Branches CRUD (list, create, edit) | ✅ Done | 3 pages |
| C9 | Appointments admin list | ✅ Done | Status updates |
| C10 | Schedules admin management | ✅ Done | |
| C11 | Consultations admin list | ✅ Done | |
| C12 | Version History page | ✅ Done | v1.5.0 |
| C13 | Sidebar with icons + section headers | ✅ Done | Lucide icons |
| C14 | Mobile responsive layout | ✅ Done | Sidebar toggle |
| C15 | Dark mode support | ✅ Done | Token system |
| C16 | i18n (vi/en) | ✅ Done | All keys present |
| C17 | Analytics / chart visuals | ⚠️ Partial | API exists, no chart UI |
| C18 | Subscription management (admin view) | ❌ Not started | Only clinic-owner side |
| C19 | System logs / audit trail | ❌ Not started | |

### D. Doctor Zone (`/doctor`)

| # | Item | Status | Notes |
|---|------|--------|-------|
| D1 | Dashboard (real data, hero, stats, quick access) | ✅ Done | Cyan theme, 9 data points |
| D2 | My Appointments (list + detail) | ✅ Done | Status badges |
| D3 | Consultation Requests (list + detail) | ✅ Done | AI image analysis in detail |
| D4 | My Patients list | ✅ Done | |
| D5 | Work Schedule page | ✅ Done | CRUD schedules |
| D6 | Profile page | ✅ Done | Edit own profile |
| D7 | HoloraMind AI chat | ✅ Done | Cyan accent, role-aware |
| D8 | Video consultation room | ✅ Done | Jitsi integration |
| D9 | Sidebar with icons + sections | ✅ Done | Emoji icons |
| D10 | Mobile responsive | ✅ Done | |
| D11 | Dark mode | ✅ Done | |
| D12 | i18n | ✅ Done | defaultValue pattern |
| D13 | Prescription management | ❌ Not started | |
| D14 | Medical records / notes | ❌ Not started | |
| D15 | Revenue / earnings dashboard | ❌ Not started | |

### E. Patient Zone (`/patient`)

| # | Item | Status | Notes |
|---|------|--------|-------|
| E1 | Dashboard (real data, hero, stats, quick access) | ✅ Done | Rose theme, 9 parallel queries |
| E2 | Browse branches (list + detail) | ✅ Done | |
| E3 | Browse doctors (list + detail) | ✅ Done | |
| E4 | My Appointments (list + detail) | ✅ Done | Rose accents |
| E5 | My Consultations (history + detail + request) | ✅ Done | |
| E6 | HoloraMind AI chat | ✅ Done | Rose accent, role-aware |
| E7 | Profile page | ✅ Done | |
| E8 | Video consultation room | ✅ Done | Jitsi |
| E9 | Sidebar with Lucide icons | ✅ Done | rose-500 theme |
| E10 | Appointment booking flow | ✅ Done | Available slots API |
| E11 | Mobile responsive | ✅ Done | |
| E12 | Dark mode | ✅ Done | |
| E13 | i18n | ✅ Done | defaultValue pattern |
| E14 | Payment for appointments | ❌ Not started | |
| E15 | Medical history / records view | ❌ Not started | |
| E16 | Notification system (real-time) | ❌ Not started | Mock only |

### F. Clinic Owner Zone (`/clinic-owner`)

| # | Item | Status | Notes |
|---|------|--------|-------|
| F1 | Dashboard | ✅ Done | |
| F2 | My Branches (list + create + edit) | ✅ Done | Subscription limit check |
| F3 | My Doctors (list + create + edit) | ✅ Done | Doctor limit check + invite |
| F4 | My Patients list | ✅ Done | |
| F5 | My Appointments list | ✅ Done | |
| F6 | My Consultations list | ✅ Done | |
| F7 | Subscription & Billing | ✅ Done | Plans, payment, invoice history |
| F8 | Sidebar with emoji icons | ✅ Done | |
| F9 | Mobile responsive | ✅ Done | |
| F10 | Revenue analytics | ❌ Not started | |
| F11 | Staff management (receptionist/accountant) | ❌ Not started | |

### G. Receptionist Zone (`/receptionist`)

| # | Item | Status | Notes |
|---|------|--------|-------|
| G1 | Dashboard | ⚠️ Basic | Mock data, placeholder UI |
| G2 | Layout + sidebar | ✅ Done | |
| G3 | Check-in patients | ❌ Not started | |
| G4 | Manage walk-in appointments | ❌ Not started | |
| G5 | Queue management | ❌ Not started | |

### H. Accountant Zone (`/accountant`)

| # | Item | Status | Notes |
|---|------|--------|-------|
| H1 | Dashboard | ⚠️ Basic | Mock data, placeholder UI |
| H2 | Layout + sidebar | ✅ Done | |
| H3 | Financial reports | ❌ Not started | |
| H4 | Invoice management | ❌ Not started | |
| H5 | Payment reconciliation | ❌ Not started | |

### I. HoloraMind AI

| # | Item | Status | Notes |
|---|------|--------|-------|
| I1 | Chat UI (full-screen, role-aware) | ✅ Done | Rose/cyan accents |
| I2 | Chat history (sidebar) | ✅ Done | DB-backed |
| I3 | DB tables (holora_mind_chats + messages) | ✅ Done | |
| I4 | Backend API (getChats, getMessages, send) | ✅ Done | |
| I5 | AI image analysis (doctor consultation) | ✅ Done | Async polling |
| I6 | Real AI integration (OpenAI/Claude) | ❌ Mock only | Keyword-based responses |
| I7 | Medical knowledge base | ❌ Not started | |
| I8 | Conversation context / memory | ❌ Not started | Stateless per message |
| I9 | File/image upload in chat | ❌ Not started | |

### J. Public / Marketing

| # | Item | Status | Notes |
|---|------|--------|-------|
| J1 | Home page | ✅ Done | |
| J2 | Doctors directory (public) | ✅ Done | Search + detail |
| J3 | Branches directory (public) | ✅ Done | |
| J4 | Pricing page | ✅ Done | |
| J5 | Login / Register | ✅ Done | |
| J6 | Provider registration | ✅ Done | `/register/provider` |
| J7 | Public navbar + footer | ✅ Done | |
| J8 | SEO / meta tags | ❌ Not started | |
| J9 | Landing page optimization | ❌ Not started | |

### K. Cross-Cutting Concerns

| # | Item | Status | Notes |
|---|------|--------|-------|
| K1 | Dark mode (all zones) | ✅ Done | CSS token system |
| K2 | i18n Vietnamese + English | ✅ Done | en.json + vi.json |
| K3 | Mobile responsive (all zones) | ✅ Done | |
| K4 | File upload (attachments) | ✅ Done | Multer, max 5 files |
| K5 | Skeleton loading states | ✅ Done | All dashboard pages |
| K6 | Error handling middleware | ✅ Done | Backend error.middleware.js |
| K7 | Theme toggle in UserDropdown | ✅ Done | |
| K8 | Language switcher in UserDropdown | ✅ Done | i18n keys fixed |
| K9 | Notification badge component | ✅ Done | UI only, mock data |
| K10 | Breadcrumb navigation | ✅ Done | Doctor + Patient zones |
| K11 | WebSocket / real-time updates | ❌ Not started | |
| K12 | Email notifications | ❌ Not started | |
| K13 | Push notifications | ❌ Not started | |
| K14 | Search / global search | ❌ Not started | |
| K15 | Export data (PDF/Excel) | ❌ Not started | |

### L. Backend API Coverage

| Module | Endpoints | Auth | Status |
|--------|-----------|------|--------|
| Auth | 6 | Mixed | ✅ Done |
| Users | 9 | ⚠️ Public | ✅ Done (needs auth) |
| Roles | 8 | ⚠️ Public | ✅ Done (needs auth) |
| Permissions | 6 | ⚠️ Public | ✅ Done (needs auth) |
| Doctors | 11 | Mixed | ✅ Done |
| Patients | 12 | Mixed | ✅ Done |
| Branches | 7 | Mixed | ✅ Done |
| Appointments | 8 | Mixed | ✅ Done |
| Consultations | 7 | Auth | ✅ Done |
| Schedules | 4 | Auth | ✅ Done |
| Dashboard | 4 | Auth + role | ✅ Done |
| Subscriptions | 6 | Mixed | ✅ Done |
| HoloraMind | 3 | Auth | ✅ Done |
| AI Analysis | 3 | Auth | ✅ Done |
| Upload | 1 | Auth | ✅ Done |
| **Total** | **95+** | | |

> ⚠️ **Security note**: Users, Roles, Permissions APIs are currently public — should add auth middleware.

---

### Summary Scorecard

| Category | Done | Partial | Not Started | Total |
|----------|------|---------|-------------|-------|
| Infrastructure | 4 | 0 | 6 | 10 |
| Auth | 7 | 0 | 2 | 9 |
| Admin Zone | 16 | 1 | 2 | 19 |
| Doctor Zone | 12 | 0 | 3 | 15 |
| Patient Zone | 13 | 0 | 3 | 16 |
| Clinic Owner | 9 | 0 | 2 | 11 |
| Receptionist | 1 | 1 | 3 | 5 |
| Accountant | 1 | 1 | 3 | 5 |
| HoloraMind AI | 5 | 0 | 4 | 9 |
| Public Pages | 7 | 0 | 2 | 9 |
| Cross-Cutting | 10 | 0 | 5 | 15 |
| **TOTAL** | **85** | **3** | **35** | **123** |

**Overall Progress: ~70%** (85/123 items complete)

---

## 1. Architecture Overview

| Layer        | Technology                         | Notes                                 |
| ------------ | ---------------------------------- | ------------------------------------- |
| **Frontend** | React 19 + Vite 6 + Tailwind CSS 4 | SPA, dark mode, i18n (vi/en)         |
| **Backend**  | Node.js 18 + Express               | REST API, JWT auth, MySQL callbacks  |
| **Database** | MySQL 8.0                          | Docker volume, connection pool       |
| **Infra**    | Docker Compose on DigitalOcean     | 165.22.241.56 — Ubuntu 24.04        |

---

## 2. Design Token System

All custom tokens live in `frontend/src/index.css` via CSS custom properties, registered in `@theme {}` for Tailwind:

### Light Mode (`:root`)

| Token            | CSS Variable       | Value       | Tailwind Class     |
| ---------------- | ------------------ | ----------- | ------------------ |
| App background   | `--bg-app`         | `#f8fafc`   | `bg-bg-app`        |
| Surface (cards)  | `--bg-surface`     | `#ffffff`   | `bg-bg-surface`    |
| Primary text     | `--text-main`      | `#1e293b`   | `text-text-main`   |
| Secondary text   | `--text-dim`       | `#64748b`   | `text-text-dim`    |
| Border           | `--border-main`    | `#e2e8f0`   | `border-border-main` |

### Dark Mode (`.dark`)

| Token            | Value       |
| ---------------- | ----------- |
| App background   | `#0f172a`   |
| Surface          | `#1e293b`   |
| Primary text     | `#f1f5f9`   |
| Secondary text   | `#94a3b8`   |
| Border           | `#334155`   |

---

## 3. Role-Based Zone Themes

Each role has a dedicated "zone" with its own accent color used in sidebar, hero sections, buttons, and status badges.

| Role            | Zone Name        | Accent Color     | Tailwind               | Hero Gradient                          |
| --------------- | ---------------- | ---------------- | ----------------------- | -------------------------------------- |
| **Admin**       | Admin Zone       | Coral `#E06666`  | `bg-[#E06666]`         | N/A (no hero)                          |
| **Doctor**      | Doctor Zone      | Cyan             | `bg-cyan-500`          | `from-slate-800 to-slate-900`          |
| **Patient**     | Patient Zone     | Rose             | `bg-rose-500`          | `from-slate-800 to-slate-900`          |
| **Clinic Owner**| Provider Portal  | Coral `#E06666`  | `bg-[#E06666]`         | N/A                                    |
| **HoloraMind**  | AI Chat (shared) | Role-aware       | accent map object      | Full-screen dark `#0F141F`             |

### HoloraMind Accent Map

```js
const ACCENT = {
  doctor:  { bg: "bg-cyan-500",  hover: "hover:bg-cyan-600",  ... },
  patient: { bg: "bg-rose-500",  hover: "hover:bg-rose-600",  ... },
};
```

Static class objects are used (not string interpolation) to keep Tailwind JIT purge working.

---

## 4. Layout Structure

### Sidebar Pattern (all zones)

```
┌─────────────────┐
│ Logo + Zone Name │  ← brand header with Logo component
├─────────────────┤
│ Dashboard        │  ← icon + label, NavLink with navClass
│                  │
│ ── Section ──    │  ← uppercase tracking-wider text-text-dim
│ Nav Item 1       │
│ Nav Item 2       │
│ ...              │
│                  │
│ ── Section ──    │
│ Nav Item N       │
├─────────────────┤
│ Zone badge       │  ← footer with zone accent
└─────────────────┘
```

**Active nav item:** `bg-{accent} text-white font-medium shadow-md`
**Hover nav item:** `hover:bg-{accent-light} hover:text-{accent}`

### Icon Library

| Zone          | Icons              |
| ------------- | -------------------|
| Admin         | Lucide React icons |
| Doctor        | Emoji icons (🏠📅🩺👥🗓️🤖👤) |
| Patient       | Lucide React icons |
| Clinic Owner  | Emoji icons (🏠🏥👨‍⚕️🧑‍⚕️📅💬💳) |

### Topbar Pattern

```
┌──────────────────────────────────────────┐
│ ☰ (mobile) │ Zone Title      │ 🔔 UserDropdown │
│             │ Welcome, {name} │                  │
└──────────────────────────────────────────┘
```

All topbars use `<NotificationBadge />` + `<UserDropdown showTheme showLanguage />`.

---

## 5. Dashboard Page Pattern

### Hero Section

```jsx
<div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-8 shadow-lg">
  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{zone label}</p>
  <h1 className="text-2xl font-bold text-white">{greeting}</h1>
  {/* Stats bar: grid of mini cards with role-accent icon colors */}
</div>
```

### Quick Access Grid

```
4-column responsive grid (2 cols mobile, 4 cols desktop)
Each card: icon (accent bg) + title + description + "Open →" link
```

### Content Cards

```
2-column grid: Recent Appointments + Upcoming Schedule
- Card header: icon + title + "View all" link
- Divide-y list items or empty state with centered icon
```

### Skeleton Loading

Animate-pulse cards with `rounded-full bg-slate-200 dark:bg-slate-700` placeholders.

---

## 6. Component Conventions

### Status Badges

```js
const STATUS_CLS = {
  scheduled:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed:   "bg-emerald-100 text-emerald-700 ...",
  completed:   "bg-purple-100 text-purple-700 ...",
  cancelled:   "bg-red-100 text-red-700 ...",
  ...
};
```

Rendering: `<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLS[status]}`}>`

### Date/Time Helpers

```js
const formatDate = (d) => new Date(d).toLocaleDateString("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric"
});
const formatTime = (t) => String(t).slice(0, 5); // "HH:mm"
```

### Cards & Surfaces

- **Border radius:** `rounded-2xl` (16px) for main cards, `rounded-xl` (12px) for inner elements
- **Shadow:** `shadow-sm` default, `shadow-md` on hover
- **Border:** `border border-border-main`
- **Dark mode surface:** `dark:bg-slate-800`
- **Hover lift:** `hover:-translate-y-0.5 hover:shadow-md transition`

---

## 7. Internationalization (i18n)

### Setup

- Library: `react-i18next` + `i18next`
- Languages: `vi` (Vietnamese, default), `en` (English)
- Files: `frontend/src/i18n/locales/vi.json`, `en.json`
- Storage: `localStorage.language`

### Pattern

```jsx
// Always use defaultValue for safety
{t("doctor.dashboard.heroTitle", { defaultValue: "Welcome, Dr. {{name}}", name: doctor.full_name })}

// Fallback with || operator for older code
{t("doctor.zone") || "Doctor Zone"}
```

### Key Namespaces

| Namespace       | Usage                        |
| --------------- | ---------------------------- |
| `common.*`      | Shared buttons, labels, etc. |
| `admin.*`       | Admin zone pages             |
| `doctor.*`      | Doctor zone pages            |
| `patient.*`     | Patient zone pages           |
| `clinicOwner.*` | Clinic owner zone            |
| `navbar.*`      | Public navbar                |
| `specialty.*`   | Specialty module             |
| `branch.*`      | Branch module                |
| `holoraMind.*`  | HoloraMind AI chat           |

---

## 8. Authentication & Authorization

### Auth Flow

- JWT-based: access token in `localStorage`
- Google OAuth: callback to `/auth/google/callback`
- `AuthContext` provides: `user`, `role`, `token`, `login()`, `logout()`

### Roles & Route Guards

| Role           | Guard Component     | Base Path         |
| -------------- | ------------------- | ----------------- |
| `super_admin`  | `<AdminRoute>`      | `/admin`          |
| `admin`        | `<AdminRoute>`      | `/admin`          |
| `doctor`       | `<DoctorRoute>`     | `/doctor`         |
| `patient`      | `<PatientRoute>`    | `/patient`        |
| `clinic_owner` | `<ClinicOwnerRoute>`| `/clinic-owner`   |
| `receptionist` | `<ReceptionistRoute>`| `/receptionist`  |
| `accountant`   | `<AccountantRoute>` | `/accountant`     |

### Full-Screen Pages (no layout wrapper)

- HoloraMind AI: `/patient/holoramind`, `/doctor/holoramind`
- Video Consultation: `/consultation/:id/video`

---

## 9. Typography Scale

| Usage            | Class                                      |
| ---------------- | ------------------------------------------ |
| Page hero title  | `text-2xl sm:text-3xl font-bold text-white`|
| Section heading  | `text-lg font-bold text-text-main`         |
| Card title       | `text-sm font-semibold text-text-main`     |
| Body text        | `text-sm text-gray-600 dark:text-slate-300`|
| Caption/label    | `text-xs text-text-dim`                    |
| Micro label      | `text-[10px] font-bold uppercase tracking-wider` |
| Zone label (hero)| `text-xs font-semibold uppercase tracking-[0.3em] text-slate-400` |

---

## 10. Responsive Breakpoints

Standard Tailwind breakpoints:

| Prefix | Min Width | Usage                     |
| ------ | --------- | ------------------------- |
| (none) | 0px       | Mobile-first base         |
| `sm:`  | 640px     | Tablet adjustments        |
| `lg:`  | 1024px    | Desktop sidebar visible   |
| `xl:`  | 1280px    | Wide desktop grid cols    |

### Sidebar Behavior

- `< lg`: Hidden, toggle via hamburger menu + overlay backdrop
- `≥ lg`: Fixed visible sidebar, `lg:relative lg:translate-x-0`

---

## 11. Version Policy

- Versions follow semver: `vMAJOR.MINOR.PATCH`
- Each deploy gets a git tag: `git tag -a v1.5.0 -m "description"`
- Version history viewable at `/admin/version` (admin only)
- `package.json` in both `frontend/` and `backend/` synced to same version

### Version History

| Version  | Date       | Tag                          |
| -------- | ---------- | ---------------------------- |
| v1.5.0   | 2025-06-14 | HoloraMind AI + Versioning   |
| v1.4.0   | 2025-06-13 | Patient Zone                 |
| v1.3.0   | 2025-06-12 | Doctor Zone                  |
| v1.2.0   | 2025-06-11 | Billing & Clinic Owner       |
| v1.1.0   | 2025-06-09 | Mobile Optimization          |
| v1.0.0   | 2025-06-01 | Initial Release              |

---

## 12. File/Folder Conventions

```
frontend/src/
├── components/
│   ├── layout/           # *Layout.jsx — one per role
│   ├── Navbar.jsx        # Public navbar
│   ├── UserDropdown.jsx  # Shared dropdown (theme/language/zone links)
│   └── ...               # Reusable components (modals, badges, etc.)
├── context/              # AuthContext, ThemeContext, NotificationContext
├── i18n/locales/         # vi.json, en.json
├── pages/
│   ├── admin/            # Admin zone pages
│   ├── doctor/           # Doctor zone pages
│   ├── patient/          # Patient zone pages
│   ├── clinic-owner/     # Clinic owner zone pages
│   ├── receptionist/     # Receptionist zone pages
│   └── HoloraMindPage.jsx # Shared AI chat (full-screen)
├── routes/
│   ├── AppRoutes.jsx     # All route definitions
│   ├── AdminRoute.jsx    # Role guards
│   └── ...
├── services/             # API service modules (axios)
└── utils/                # Helpers
```

### Page Naming

- List pages: `{Entity}Page.jsx` or `{Entity}sPage.jsx`
- Form pages: `{Entity}FormPage.jsx`
- Detail pages: `{Entity}DetailPage.jsx`
- Dashboard: `{Role}DashboardPage.jsx`

---

## 13. Key UI Patterns

### Empty States

```jsx
<div className="flex flex-col items-center py-10 text-sm text-text-dim">
  <IconComponent className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
  {t("module.noData")}
</div>
```

### Loading Skeletons

```jsx
<div className="animate-pulse rounded-2xl border border-border-main bg-bg-surface p-5">
  <div className="h-4 w-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />
  <div className="mt-3 h-8 w-1/3 rounded-full bg-slate-200 dark:bg-slate-700" />
</div>
```

### Gradient Hero Cards

```
from-slate-800 to-slate-900  — standard dark hero
Accent blur circles as decorative ornaments (absolute positioned, pointer-events-none)
```

---
