import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Layers, ScanLine, QrCode, Zap, Shield, Smartphone, BarChart2, ArrowRight } from 'lucide-react'
import { Spotlight } from '../components/ui/Spotlight'
import { AnimatedText } from '../components/ui/AnimatedText'
import { AnimatedCounter } from '../components/ui/AnimatedCounter'

const ease = [0.22, 1, 0.36, 1] as const

function fadeUp(delay = 0, reducedMotion = false) {
  if (reducedMotion) return {}
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease },
  }
}

const stats = [
  { num: 100, suffix: '%', label: 'Gratis selamanya' },
  { num: 2, suffix: ' mnt', label: 'Rata-rata setup' },
  { num: 5, suffix: 'x', label: 'Lebih cepat dari coding' },
]

const features = [
  {
    icon: <ScanLine size={20} style={{ color: 'var(--color-primary)' }} />,
    title: 'Multi-marker',
    desc: 'Satu project bisa punya banyak marker, masing-masing dengan konten berbeda.',
    extra: (
      <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 16, flexWrap: 'wrap' }}>
        {['Marker 1 → Video', 'Marker 2 → 3D', 'Marker 3 → Video'].map((t) => (
          <span key={t} style={{ padding: '3px 9px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-hairline)', fontSize: 11, color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{t}</span>
        ))}
      </div>
    ),
    grid: { gridColumn: '1 / 3' as const },
  },
  {
    icon: <Smartphone size={20} style={{ color: 'var(--color-primary)' }} />,
    title: 'Video & 3D',
    desc: 'Dukung konten video (MP4/WebM) dan objek 3D (GLB/GLTF) langsung di browser tanpa app.',
    extra: (
      <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 16 }}>
        {[{ label: 'MP4', sub: 'WebM' }, { label: 'GLB', sub: 'GLTF' }].map(({ label, sub }) => (
          <div key={label} style={{ flex: 1, border: '1px solid var(--color-hairline)', borderRadius: 'var(--radius-sm)', padding: '8px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}>{label}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--color-ink-faint)' }}>{sub}</p>
          </div>
        ))}
      </div>
    ),
    grid: { gridColumn: '3', gridRow: '1 / 3' as const },
  },
  {
    icon: <QrCode size={20} style={{ color: 'var(--color-primary)' }} />,
    title: 'QR + Link',
    desc: 'Setiap project otomatis punya QR code dan link pendek yang bisa langsung dibagikan.',
    extra: null,
    grid: { gridColumn: '1', gridRow: '2' as const },
  },
  {
    icon: <Zap size={20} style={{ color: 'var(--color-primary)' }} />,
    title: 'Slug Custom',
    desc: 'Atur URL AR viewer sendiri supaya mudah diingat.',
    extra: (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '6px 10px', background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-sm)', marginTop: 12, color: 'var(--color-ink-mute)', border: '1px solid var(--color-hairline)' }}>
        /ar/<span style={{ color: 'var(--color-primary)' }}>nama-event</span>
      </div>
    ),
    grid: { gridColumn: '2', gridRow: '2' as const },
  },
  {
    icon: <BarChart2 size={20} style={{ color: 'var(--color-primary)' }} />,
    title: 'Analytics',
    desc: 'Pantau berapa kali AR kamu di-scan dengan grafik per hari.',
    extra: (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36, marginTop: 12 }}>
        {[35, 55, 40, 72, 50, 65, 90].map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 6 ? 'var(--color-primary)' : 'var(--color-hairline)', borderRadius: '2px 2px 0 0', transition: 'background 0.15s' }} />
        ))}
      </div>
    ),
    grid: { gridColumn: '1 / 3' as const, gridRow: '3' as const },
  },
  {
    icon: <Shield size={20} style={{ color: 'var(--color-primary)' }} />,
    title: 'Aman & Private',
    desc: 'Project hanya dikelola pemiliknya. AR viewer bisa diakses siapa saja.',
    extra: null,
    grid: { gridColumn: '3', gridRow: '3' as const },
  },
]

export default function Landing() {
  const prefersReducedMotion = useReducedMotion() ?? false

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas)', fontFamily: 'var(--font-display)' }}>
      <style>{`
        *:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
        .btn-primary:hover { background: var(--color-primary-deep) !important; }
        .btn-outline:hover { border-color: var(--color-ink) !important; color: var(--color-ink) !important; }
        .bento-card { transition: border-color 0.18s, box-shadow 0.18s; }
        .bento-card:hover { border-color: var(--color-primary) !important; box-shadow: 0 8px 32px rgba(62,207,142,0.1) !important; }
        @media (max-width: 767px) {
          .bento-grid { grid-template-columns: 1fr !important; }
          .bento-grid > * { grid-column: auto !important; grid-row: auto !important; }
        }
        @media (max-width: 480px) {
          .landing-nav-masuk { display: none !important; }
          .landing-nav-pricing { display: none !important; }
          .landing-header { padding: 12px 16px !important; }
          .landing-hero { padding: 48px 20px 40px !important; }
          .landing-hero h1 { font-size: 32px !important; letter-spacing: -0.5px !important; }
          .landing-hero p { font-size: 16px !important; }
          .landing-cta-group { flex-direction: column !important; align-items: center !important; }
          .landing-cta-group a { width: 100% !important; justify-content: center !important; }
          .landing-stats { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
      `}</style>

      {/* Header */}
      <motion.header
        className="landing-header"
        style={{ borderBottom: '1px solid var(--color-hairline)', padding: '16px 24px' }}
        {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: -16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease } })}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers style={{ color: 'var(--color-primary)', width: 20, height: 20 }} />
            <span style={{ fontWeight: 500, fontSize: 16, color: 'var(--color-ink)' }}>AR Generator</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login"
              style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-hairline-strong)', color: 'var(--color-ink-mute)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s' }}
              className="btn-outline landing-nav-masuk">
              Masuk
            </Link>
            <Link to="/pricing"
              style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-hairline-strong)', color: 'var(--color-ink-mute)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'all 0.15s' }}
              className="btn-outline landing-nav-pricing">
              Pricing
            </Link>
            <Link to="/register"
              style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'background 0.15s' }}
              className="btn-primary">
              Daftar Gratis
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <Spotlight
        className="landing-hero"
        style={{ padding: '88px 24px 72px', textAlign: 'center', background: 'var(--color-canvas)' }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Badge */}
          <motion.div {...fadeUp(0.1, prefersReducedMotion)} style={{ display: 'inline-flex' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(62,207,142,0.1)', border: '1px solid rgba(62,207,142,0.25)', borderRadius: 'var(--radius-full)', padding: '4px 14px', fontSize: 13, color: 'var(--color-primary)', marginBottom: 28 }}>
              <Zap size={12} /> 100% gratis · tanpa coding · tanpa server
            </span>
          </motion.div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 500, lineHeight: 1.12, letterSpacing: '-0.6px', color: 'var(--color-ink)', margin: '0 0 22px' }}>
            <AnimatedText text="Buat pengalaman AR" delay={0.2} />
            <br />
            <AnimatedText text="dalam hitungan menit" delay={0.55} />
          </h1>

          {/* Subtitle */}
          <motion.p {...fadeUp(0.75, prefersReducedMotion)} style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--color-ink-mute)', margin: '0 0 40px', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
            Upload marker, pilih konten video atau 3D — sistem kami langsung mengkompilasi dan menghasilkan link AR yang bisa dibagikan.
          </motion.p>

          {/* CTA buttons */}
          <motion.div {...fadeUp(0.9, prefersReducedMotion)} className="flex items-center justify-center gap-3 flex-wrap landing-cta-group">
            <Link to="/register"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', borderRadius: 'var(--radius-sm)', padding: '11px 22px', fontSize: 15, fontWeight: 500, textDecoration: 'none', transition: 'background 0.15s' }}
              className="btn-primary">
              Mulai Sekarang — Gratis <ArrowRight size={15} />
            </Link>
            <Link to="/login"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-ink-mute)', fontSize: 15, textDecoration: 'none', padding: '11px 4px' }}>
              Sudah punya akun →
            </Link>
          </motion.div>
        </div>
      </Spotlight>

      {/* Stats */}
      <section style={{ borderTop: '1px solid var(--color-hairline)', borderBottom: '1px solid var(--color-hairline)', padding: '28px 24px', background: 'var(--color-canvas-soft)' }}>
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center landing-stats">
          {stats.map(({ num, suffix, label }, i) => (
            <motion.div
              key={label}
              {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: i * 0.1, ease } })}
            >
              <p style={{ fontSize: 26, fontWeight: 500, color: 'var(--color-ink)', margin: '0 0 4px', fontVariantNumeric: 'tabular-nums' }}>
                <AnimatedCounter value={num} suffix={suffix} />
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-ink-faint)', margin: 0 }}>{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features — Bento Grid */}
      <section style={{ padding: '72px 24px' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, ease } })}
            style={{ textAlign: 'center', marginBottom: 40 }}
          >
            <h2 style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-ink)', margin: '0 0 10px' }}>Semua yang kamu butuhkan</h2>
            <p style={{ fontSize: 16, color: 'var(--color-ink-mute)', margin: 0 }}>Dari marker ke AR experience dalam satu alur.</p>
          </motion.div>

          <div
            className="bento-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'start' }}
          >
            {features.map(({ icon, title, desc, extra, grid }, i) => (
              <motion.div
                key={title}
                className="bento-card"
                {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '0px 0px -60px 0px' }, transition: { duration: 0.5, delay: i * 0.07, ease }, whileHover: { y: -4 } })}
                style={{
                  background: 'var(--color-canvas)',
                  border: '1px solid var(--color-hairline)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: grid.gridColumn?.includes('/') ? 160 : 140,
                  ...grid,
                }}
              >
                <div style={{ width: 40, height: 40, background: 'rgba(62,207,142,0.1)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-ink)', margin: '0 0 6px' }}>{title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--color-ink-mute)', margin: 0 }}>{desc}</p>
                {extra}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section style={{ padding: '72px 24px', background: 'var(--color-canvas-soft)', borderTop: '1px solid var(--color-hairline)', textAlign: 'center' }}>
        <div className="max-w-lg mx-auto">
          <motion.div
            {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, ease } })}
          >
            <h2 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.42px', color: 'var(--color-ink)', margin: '0 0 12px' }}>Siap membuat AR pertamamu?</h2>
            <p style={{ fontSize: 16, color: 'var(--color-ink-mute)', margin: '0 0 28px' }}>Daftar gratis, tidak perlu kartu kredit.</p>
            <Link to="/register"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', borderRadius: 'var(--radius-sm)', padding: '11px 26px', fontSize: 15, fontWeight: 500, textDecoration: 'none' }}
              className="btn-primary">
              Buat Akun Gratis
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-hairline)', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--color-ink-faint)', margin: 0 }}>
          © {new Date().getFullYear()} AR Generator · <Link to="/login" style={{ color: 'var(--color-ink-faint)', textDecoration: 'none' }}>Masuk</Link> · <Link to="/register" style={{ color: 'var(--color-ink-faint)', textDecoration: 'none' }}>Daftar</Link> · <Link to="/pricing" style={{ color: 'var(--color-ink-faint)', textDecoration: 'none' }}>Pricing</Link>
        </p>
      </footer>
    </div>
  )
}
