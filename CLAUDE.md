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
