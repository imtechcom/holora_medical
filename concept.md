# Holora Medical — Design Concept & Guidelines

> Last updated: v1.5.0 (2025-06-14)

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
