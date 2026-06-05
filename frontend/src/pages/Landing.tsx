import { Link } from 'react-router-dom'
import { Layers, ScanLine, QrCode, Zap, Shield, Smartphone } from 'lucide-react'

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas)', fontFamily: 'var(--font-display)' }}>
      <style>{`
        .feature-card:hover { border-color: var(--color-primary) !important; transform: translateY(-2px); }
        .feature-card { transition: border-color 0.15s, transform 0.15s; }
        .btn-primary:hover { background: var(--color-primary-deep) !important; }
        .btn-outline:hover { border-color: var(--color-ink) !important; color: var(--color-ink) !important; }
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--color-hairline)', padding: '16px 24px' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers style={{ color: 'var(--color-primary)', width: 20, height: 20 }} />
            <span style={{ fontWeight: 500, fontSize: 16, color: 'var(--color-ink)' }}>AR Generator</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login"
              style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-hairline-strong)', color: 'var(--color-ink-mute)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s' }}
              className="btn-outline">
              Masuk
            </Link>
            <Link to="/register"
              style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary)', color: 'var(--color-on-primary)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'background 0.15s' }}
              className="btn-primary">
              Daftar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: '80px 24px 64px', textAlign: 'center' }}>
        <div className="max-w-2xl mx-auto">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(62,207,142,0.1)', border: '1px solid rgba(62,207,142,0.25)', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: 13, color: 'var(--color-primary)', marginBottom: 24 }}>
            <Zap size={12} /> 100% gratis, tanpa coding
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 500, lineHeight: 1.15, letterSpacing: '-0.5px', color: 'var(--color-ink)', margin: '0 0 20px' }}>
            Buat pengalaman AR<br />dalam hitungan menit
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--color-ink-mute)', margin: '0 0 36px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Upload gambar marker dan konten video atau 3D. Sistem kami mengkompilasi file AR dan menghasilkan link yang bisa langsung dibagikan.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/register"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius-sm)', padding: '10px 20px', fontSize: 15, fontWeight: 500, textDecoration: 'none', transition: 'background 0.15s' }}
              className="btn-primary">
              Mulai Sekarang — Gratis
            </Link>
            <Link to="/login"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--color-ink-mute)', fontSize: 15, textDecoration: 'none', padding: '10px 4px' }}>
              Sudah punya akun →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ borderTop: '1px solid var(--color-hairline)', borderBottom: '1px solid var(--color-hairline)', padding: '24px', background: 'var(--color-canvas-soft)' }}>
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: 'Gratis', label: 'Tanpa biaya' },
            { value: '< 2 menit', label: 'Waktu setup' },
            { value: 'Langsung', label: 'Deploy otomatis' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-ink)', margin: '0 0 4px' }}>{value}</p>
              <p style={{ fontSize: 13, color: 'var(--color-ink-faint)', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '64px 24px' }}>
        <div className="max-w-5xl mx-auto">
          <h2 style={{ fontSize: 22, fontWeight: 500, textAlign: 'center', margin: '0 0 40px', color: 'var(--color-ink)' }}>Semua yang kamu butuhkan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: <ScanLine size={20} style={{ color: 'var(--color-primary)' }} />,
                title: 'Multi-marker',
                desc: 'Satu project bisa punya banyak marker. Setiap marker bisa memiliki konten yang berbeda.',
              },
              {
                icon: <Smartphone size={20} style={{ color: 'var(--color-primary)' }} />,
                title: 'Video & 3D',
                desc: 'Dukung konten video (MP4/WebM) dan objek 3D (GLB/GLTF) langsung di browser.',
              },
              {
                icon: <QrCode size={20} style={{ color: 'var(--color-primary)' }} />,
                title: 'QR + Link',
                desc: 'Setiap project otomatis punya QR code dan link pendek yang bisa langsung dibagikan.',
              },
              {
                icon: <Zap size={20} style={{ color: 'var(--color-primary)' }} />,
                title: 'Slug Custom',
                desc: 'Atur URL AR viewer sendiri, misalnya /ar/nama-event, supaya mudah diingat.',
              },
              {
                icon: <Shield size={20} style={{ color: 'var(--color-primary)' }} />,
                title: 'Aman & Private',
                desc: 'Project hanya bisa dikelola oleh pemiliknya. AR viewer bisa diakses siapa saja.',
              },
              {
                icon: <ScanLine size={20} style={{ color: 'var(--color-primary)' }} />,
                title: 'Analytics',
                desc: 'Pantau berapa kali AR kamu di-scan, dengan grafik per hari untuk tracking distribusi.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="feature-card" style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
                <div style={{ width: 40, height: 40, background: 'rgba(62,207,142,0.1)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-ink)', margin: '0 0 8px' }}>{title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--color-ink-mute)', margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '64px 24px', background: 'var(--color-canvas-soft)', borderTop: '1px solid var(--color-hairline)', textAlign: 'center' }}>
        <div className="max-w-lg mx-auto">
          <h2 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.42px', color: 'var(--color-ink)', margin: '0 0 12px' }}>Siap membuat AR pertamamu?</h2>
          <p style={{ fontSize: 16, color: 'var(--color-ink-mute)', margin: '0 0 28px' }}>Daftar gratis, tidak perlu kartu kredit.</p>
          <Link to="/register"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: 'var(--radius-sm)', padding: '10px 24px', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}
            className="btn-primary">
            Buat Akun Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-hairline)', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--color-ink-faint)', margin: 0 }}>
          © 2026 AR Generator · <Link to="/login" style={{ color: 'var(--color-ink-faint)', textDecoration: 'none' }}>Masuk</Link> · <Link to="/register" style={{ color: 'var(--color-ink-faint)', textDecoration: 'none' }}>Daftar</Link>
        </p>
      </footer>
    </div>
  )
}
