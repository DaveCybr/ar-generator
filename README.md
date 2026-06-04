# AR Generator

Web-based Augmented Reality generator. Upload gambar sebagai marker dan tambahkan konten video atau 3D object — sistem akan generate AR viewer dengan shareable link dan QR code.

## Demo

Scan marker → konten muncul di atas marker secara real-time via kamera HP.

## Fitur

- **Auth** — Register & login via Supabase
- **Upload Marker** — Gambar JPG/PNG sebagai image target
- **Upload Konten** — Video (MP4/WebM) atau 3D Object (GLB/GLTF)
- **Kompilasi .mind** — Dilakukan di browser, tidak perlu server
- **AR Viewer** — Berbasis MindAR.js + A-Frame, akses via browser tanpa install app
- **QR Code** — Generate QR untuk setiap project
- **Shareable Link** — Link `/ar/:slug` bisa dibagikan langsung

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React + Vite + TypeScript + TailwindCSS |
| AR Engine | MindAR.js + A-Frame + Three.js |
| Auth & DB | Supabase (PostgreSQL + Auth) |
| Storage | Supabase Storage |

## Setup

### 1. Clone repo

```bash
git clone https://github.com/USERNAME/ar-generator.git
cd ar-generator/frontend
npm install
```

### 2. Setup Supabase

1. Buat project di [supabase.com](https://supabase.com)
2. Buka **SQL Editor**, jalankan isi file [`supabase-setup.sql`](./supabase-setup.sql)

### 3. Konfigurasi environment

```bash
cp .env.example .env
```

Isi `.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4. Jalankan

```bash
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173)

## Penggunaan

1. **Register/Login** di halaman auth
2. Klik **Buat AR Baru**
3. Upload **gambar marker** (gunakan gambar dengan banyak detail)
4. Upload **video atau 3D object**
5. Klik **Generate AR** — sistem akan kompilasi marker di browser
6. Dapatkan **link & QR code** AR viewer
7. Buka link di HP (perlu HTTPS) → arahkan kamera ke marker

## Akses via HP (Development)

Karena kamera butuh HTTPS:

```bash
# Option 1: Cloudflare Tunnel
npx cloudflared tunnel --url http://localhost:5173

# Option 2: ngrok (butuh akun)
ngrok http 5173
```

## Struktur Project

```
ar-generator/
├── frontend/
│   ├── public/
│   │   ├── ar-viewer.html      # Standalone AR viewer (A-Frame + MindAR)
│   │   └── libs/               # A-Frame & MindAR bundled lokal
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Create.tsx
│   │   │   └── ARViewer.tsx    # Redirect ke ar-viewer.html
│   │   └── lib/
│   │       ├── supabase.ts
│   │       └── mindCompiler.ts # Kompilasi .mind di browser
│   └── vite.config.ts
└── supabase-setup.sql          # SQL migration
```

## Catatan

- Marker yang baik: gambar dengan banyak detail, kontras tinggi, tidak simetris
- File video diunduh sebagai Blob sebelum AR dimulai untuk menghindari buffering
- AR Viewer berjalan sepenuhnya di browser — tidak perlu backend
