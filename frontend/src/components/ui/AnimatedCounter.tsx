import { useRef, useEffect } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
}

export function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1.8 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { duration: duration * 1000, bounce: 0 })
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })

  useEffect(() => {
    if (inView) mv.set(value)
  }, [inView, mv, value])

  useEffect(() =>
    spring.on('change', (v) => {
      if (ref.current) ref.current.textContent = prefix + Math.floor(v) + suffix
    }),
    [spring, prefix, suffix]
  )

  return <span ref={ref}>{prefix}0{suffix}</span>
}
