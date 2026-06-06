import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  reason: string
}

export default function UpgradeModal({ isOpen, onClose, reason }: Props) {
  const navigate = useNavigate()

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', zIndex: 50 }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-canvas)',
          border: '1px solid var(--color-hairline)',
          borderRadius: 'var(--radius-lg)',
          padding: 32,
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
          fontFamily: 'var(--font-display)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(62,207,142,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Zap size={24} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: 'var(--color-ink)', margin: '0 0 8px' }}>
          Upgrade Plan
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--color-ink-mute)', margin: '0 0 24px' }}>
          {reason}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { navigate('/pricing'); onClose() }}
            style={{ flex: 1, background: 'var(--color-primary)', color: 'var(--color-on-primary, #171717)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-display)', transition: 'background 0.15s ease' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-deep)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-primary)')}>
            Lihat Pricing
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, background: 'var(--color-canvas)', color: 'var(--color-ink)', border: '1px solid var(--color-hairline-strong)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
            Nanti saja
          </button>
        </div>
      </div>
    </div>
  )
}
