# AR Generator — Project Context

## Overview

Web app untuk membuat proyek AR (Augmented Reality) berbasis marker. User upload gambar marker + konten (video/3D), sistem mengkompilasi `.mind` file, lalu menghasilkan AR viewer yang bisa diakses via URL publik.

**100% frontend** — tidak ada backend. Semua logic ditangani Supabase (auth, database, storage).

## Tech Stack

- **Vite v8** + **React 19** + **TypeScript 6**
- **Tailwind CSS v4** dengan plugin `@tailwindcss/vite`
- **Supabase** — auth, database (PostgreSQL), storage
- **MindAR** (`mind-ar@1.2.5`) — AR marker compiler & viewer
- **A-Frame 1.6.0** — 3D/AR rendering di browser
- **React Router v7** — client-side routing
- **React Hook Form + Zod** — form validation

## Struktur Folder

```
PROJECT TA/
├── frontend/               # Semua kode ada di sini
│   ├── src/
│   │   ├── pages/          # Login, Register, Dashboard, Create, Edit, ARViewer
│   │   ├── lib/
│   │   │   ├── supabase.ts         # Supabase client
│   │   │   └── mindCompiler.ts     # MindAR compiler logic
│   │   ├── types/index.ts          # ARProject, ARTarget types
│   │   └── vite-env.d.ts           # /// <reference types="vite/client" />
│   ├── public/
│   │   ├── .htaccess               # SPA routing untuk Apache
│   │   └── ar-viewer.html          # Standalone AR viewer (A-Frame + MindAR)
│   └── index.html                  # Font link tags ada di sini
├── .github/workflows/deploy.yml    # CI/CD GitHub Actions → FTP
├── .gitignore                      # includes *.sql
└── CLAUDE.md                       # file ini
```

## Routes

| Path | Page | Auth |
|---|---|---|
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/dashboard` | Dashboard | Protected |
| `/create` | Create Project | Protected |
| `/edit/:id` | Edit Project | Protected |
| `/ar/:slug` | AR Viewer | Public |

## Data Models

```typescript
interface ARProject {
  id: string
  user_id: string
  name: string
  slug: string          // URL identifier untuk AR viewer
  mind_file_url: string // URL ke .mind file di Supabase Storage
  scan_count: number
  created_at: string
  ar_targets?: ARTarget[]
}

interface ARTarget {
  id: string
  project_id: string
  target_index: number  // index dalam .mind file
  marker_url: string    // URL gambar marker
  content_type: 'video' | '3d'
  content_url: string   // URL konten AR
}
```

## Typography Token System

Font: **Switzer** (Fontshare, display/UI) + **JetBrains Mono** (code/mono).
Font diload via `<link>` di `index.html` — BUKAN `@import` di CSS (Vite tidak follow external CSS imports).

| Token | Size | Weight | Notes |
|---|---|---|---|
| DISPLAY-MD | 28px | 500 | letter-spacing: -0.42px |
| HEADING-LG | 22px | 500 | |
| BODY-LG | 18px | 400 | |
| BODY-MD | 16px | 400 | |
| BUTTON-MD | 14px | 500 | |
| CAPTION | 13px | 400 | |
| MICRO | 12px | 400 | |

**Aturan:** tidak ada font-weight 600/700, tidak ada positive letter-spacing.

CSS custom properties di `frontend/src/index.css`:
- `--font-display`: Switzer
- `--font-mono`: JetBrains Mono
- Color tokens: `--color-canvas`, `--color-ink`, `--color-primary`, dll

## Deployment

**Target:** `https://ar.nano.co.id` (Niagahoster shared hosting, cPanel)
**Server:** `srv167.niagahoster.com` / `151.106.119.235`
**FTP root:** `public_html/` langsung (bukan subfolder lagi)
**Deploy folder:** `public_html/ar.nano.co.id/`

CI/CD via GitHub Actions (`.github/workflows/deploy.yml`):
1. Push ke `master` → trigger build
2. `npm ci` + `npm run build` di `frontend/`
3. FTP upload `frontend/dist/` → `ar.nano.co.id/` di server

GitHub Secrets yang diperlukan:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`

Set ulang secret via: `& "C:\Program Files\GitHub CLI\gh.exe" secret set <NAME> --repo DaveCybr/ar-generator --body '<VALUE>'`

## SPA Routing

`frontend/public/.htaccess` menangani React Router di Apache:
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## MindAR Compiler

`mindCompiler.ts` load library MindAR dari CDN secara dynamic:
```typescript
const cdnUrl: string = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js'
const mod: any = await import(/* @vite-ignore */ cdnUrl)
```
`/* @vite-ignore */` perlu untuk suppress Vite warning. URL harus di-assign ke `const` dulu agar TypeScript tidak error.

## Hal yang Sudah Diselesaikan

- Migrasi font ke Switzer + JetBrains Mono
- Sistem typography token di semua halaman
- CI/CD pipeline GitHub Actions + FTP ke Niagahoster
- SSL Let's Encrypt untuk `ar.nano.co.id`
- DNS `nano.co.id` dikelola Niagahoster (bisa edit di cPanel)
- DNS `nano.com` dikelola AWS Route 53 (tidak bisa edit dari cPanel)

## Catatan Penting

- Jalankan dev server: `cd frontend && npm run dev`
- Build: `cd frontend && npm run build` (harus `tsc -b && vite build`)
- `*.sql` di `.gitignore` — file migrasi Supabase tidak di-commit
- `VITE_BACKEND_URL` ada di `.env.local` tapi tidak dipakai (proyek tidak punya backend)
- AR viewer standalone ada di `frontend/public/ar-viewer.html` — diakses langsung, bukan via React Router

---

## Design System Rules (WAJIB dibaca sebelum nulis kode apapun)

Referensi lengkap: **DESIGN.md** di project root.

### Critical Rules — tidak boleh dilanggar
1. Primary button: `background: var(--color-primary)`, `color: var(--color-on-primary, #171717)`
   → near-black text di atas hijau, BUKAN putih
2. Button border-radius: `var(--radius-sm)` = 6px — tidak boleh pill, tidak boleh > 6px
3. Tidak ada gradient di background manapun
4. Emerald hanya untuk: filled CTA button, wordmark accent, active state toggle
5. Font-weight maksimal 500 — tidak ada font-semibold atau font-bold
6. Tidak ada Tailwind color classes — pakai CSS custom properties
7. Tidak ada dark background — ini light mode app (background = var(--color-canvas) = white)
8. Setiap `color: var(--color-on-primary)` harus pakai fallback:
   `color: var(--color-on-primary, #171717)`

### Color Tokens Utama
- `--color-primary`: #3ecf8e — emerald, hanya untuk CTA
- `--color-primary-deep`: #24b47e — hover state primary button
- `--color-on-primary`: #171717 — text di atas green button
- `--color-ink`: #171717 — default text
- `--color-ink-mute`: #707070 — secondary text
- `--color-ink-faint`: #b2b2b2 — placeholder, hint text
- `--color-canvas`: #ffffff — page background
- `--color-canvas-soft`: #fafafa — alternating section
- `--color-canvas-night`: #1c1c1c — dark card, code block
- `--color-hairline`: #dfdfdf — default border
- `--color-hairline-strong`: #c7c7c7 — emphasis border
- `--color-success`: #059669 — file upload confirmed, success state
- `--color-danger` (raw): #ef4444 — destructive hover only

### Komponen Standar
PRIMARY BUTTON:
  background: var(--color-primary)
  color: var(--color-on-primary, #171717)
  padding: 8px 16px — border-radius: var(--radius-sm)
  font-size: 14px — font-weight: 500 — transition: background 0.15s ease

SECONDARY BUTTON:
  background: var(--color-canvas)
  color: var(--color-ink)
  border: 1px solid var(--color-hairline-strong)
  same shape as primary

LIGHT CARD:
  background: var(--color-canvas)
  border: 1px solid var(--color-hairline)
  border-radius: var(--radius-lg) = 12px — padding: 32px

DARK CARD:
  background: var(--color-canvas-night)
  color: var(--color-on-dark, #ffffff)
  same shape as light card

TEXT INPUT:
  background: var(--color-canvas)
  border: 1px solid var(--color-hairline)
  border-radius: var(--radius-sm) = 6px — padding: 8px 12px
  focus: border-color var(--color-primary), outline 2px solid var(--color-primary)

### Tailgrids
Diinstall sebagai component library.
Gunakan HANYA untuk struktur HTML — strip semua color, weight, dan shape classes.
Jangan pernah biarkan Tailgrids override CSS custom properties.

### Fitur yang Sudah Ada
- Custom landing page di /ar/:slug (ARLanding.tsx)
- Analytics modal + bar chart 7 hari di Dashboard
- scan_logs table — sudah dijalankan di Supabase
- Skeleton loading cards di Dashboard
- Focus-visible outline semua interactive elements
- Page titles via useEffect semua halaman
- Sistem monetisasi (Free/Pro/Business) — Stripe + Supabase Edge Functions
  - `usePlan` hook — baca plan dari subscriptions table + get_plan_limits RPC
  - `Pricing.tsx` — halaman pricing publik dengan toggle bulanan/tahunan
  - `UpgradeModal.tsx` — modal soft redirect ketika user kena limit
  - Plan enforcement: Dashboard (project limit), Create (marker limit + slug), Edit (expiry)
  - Plan & Billing card di Profile.tsx — upgrade/billing portal CTA
  - Watermark di ARLanding: tampil hanya jika owner plan = free
  - Edge Functions deployed: create-checkout-session, stripe-webhook, create-portal-session
  - subscriptions table + helper SQL functions sudah dijalankan di Supabase
- Suspend enforcement — suspended users are signed out immediately
  and shown a message on login page

### Fitur Belum Dikerjakan
- Country detection di scan_logs
- White label / custom domain
- Stripe Billing Portal perlu dikonfigurasi di Stripe Dashboard sebelum "Kelola Billing" bisa dipakai
  (Dashboard → Billing → Customer portal → Activate portal)
- Switch Stripe ke live mode sebelum launch production

## Stripe Configuration (Test Mode)
Price IDs:
- Pro Monthly: price_1Tf8E62LSlGk7TpHuIRDruVK  (Rp 99.000/bulan,  unit_amount=9900000)
- Pro Yearly: price_1Tf8E92LSlGk7TpHEjMdQaXp   (Rp 899.000/tahun, unit_amount=89900000)
- Business Monthly: price_1Tf8EC2LSlGk7TpHl7rwvDhv  (Rp 299.000/bulan,    unit_amount=29900000)
- Business Yearly: price_1Tf8EG2LSlGk7TpHNCuIq2w1   (Rp 2.499.000/tahun, unit_amount=249900000)

Product IDs:
- Pro: prod_UeQKVvY5w8BCif
- Business: prod_UeQKyyoDW2eQGc

PENTING: IDR di Stripe adalah 2-decimal currency (bukan zero-decimal).
unit_amount = harga IDR × 100 (contoh: Rp 99.000 → unit_amount 9.900.000)
Switch to live mode price IDs before production launch.

## Admin Route

Admin dashboard is at /console-r9x4mw (keep this secret)
