import { useRef, type ReactNode, type CSSProperties } from 'react'

interface SpotlightProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
}

export function Spotlight({ children, style, className = '' }: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !overlayRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    overlayRef.current.style.background = `radial-gradient(700px circle at ${x}px ${y}px, rgba(62,207,142,0.07) 0%, transparent 75%)`
  }

  const onMouseLeave = () => {
    if (overlayRef.current) overlayRef.current.style.background = 'none'
  }

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
    >
      <div
        ref={overlayRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, transition: 'background 0.15s ease' }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}
