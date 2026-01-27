import { ReactNode } from 'react'

interface SectionProps {
  children: ReactNode
  className?: string
  background?: 'white' | 'gray' | 'none'
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export default function Section({
  children,
  className = '',
  background = 'none',
  padding = 'lg'
}: SectionProps) {
  const backgrounds = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    none: '',
  }

  const paddings = {
    sm: 'py-12',
    md: 'py-16',
    lg: 'py-20',
    none: '',
  }

  return (
    <section className={`${backgrounds[background]} ${paddings[padding]} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  )
}
