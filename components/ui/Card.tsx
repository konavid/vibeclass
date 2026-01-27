import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'md'
}: CardProps) {
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const hoverStyle = hover
    ? 'hover:shadow-lg transition-shadow duration-200'
    : ''

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${paddingStyles[padding]} ${hoverStyle} ${className}`}>
      {children}
    </div>
  )
}
