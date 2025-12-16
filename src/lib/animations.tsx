'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

// Animation Variants
export const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
}

export const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 40 },
}

export const scaleIn = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
}

export const slideInLeft = {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
}

export const slideInRight = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
}

// Stagger Container
export const staggerContainer = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
}

// Hover Effects
export const hoverScale = {
    scale: 1.02,
    transition: { duration: 0.2 },
}

export const hoverLift = {
    y: -4,
    boxShadow: '0 10px 40px rgba(99, 102, 241, 0.2)',
    transition: { duration: 0.2 },
}

export const tapScale = {
    scale: 0.98,
}

// Motion Components
interface MotionCardProps extends HTMLMotionProps<'div'> {
    children: ReactNode
    delay?: number
}

export function MotionCard({ children, delay = 0, ...props }: MotionCardProps) {
    return (
        <motion.div
      initial= {{ opacity: 0, y: 30 }
}
animate = {{ opacity: 1, y: 0 }}
transition = {{ duration: 0.5, delay, ease: 'easeOut' }}
whileHover = { hoverLift }
whileTap = { tapScale }
{...props }
    >
    { children }
    </motion.div>
  )
}

export function MotionSection({ children, delay = 0, ...props }: MotionCardProps) {
    return (
        <motion.section
      initial= {{ opacity: 0, y: 50 }
}
whileInView = {{ opacity: 1, y: 0 }}
viewport = {{ once: true, margin: '-100px' }}
transition = {{ duration: 0.6, delay, ease: 'easeOut' }}
{...props }
    >
    { children }
    </motion.section>
  )
}

// Re-export motion for direct use
export { motion }
