import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'

const wordVariants = {
  hidden: { opacity: 0, filter: 'blur(8px)', y: 14 },
  visible: { opacity: 1, filter: 'blur(0px)', y: 0 },
}

interface AnimatedTextProps {
  text: string
  delay?: number
  style?: CSSProperties
  className?: string
}

export function AnimatedText({ text, delay = 0, style, className = '' }: AnimatedTextProps) {
  return (
    <motion.span
      className={className}
      style={{ display: 'inline', ...style }}
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.055, delayChildren: delay }}
    >
      {text.split(' ').map((word, i) => (
        <motion.span
          key={i}
          variants={wordVariants}
          transition={{ type: 'spring', damping: 22, stiffness: 180 }}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  )
}
