// components/Stats/badge.tsx
import Image from 'next/image'
import { ReactNode } from 'react'


export type BadgeTheme = 
  | 'rio' 
  | 'dandelion' 
  | 'lavender' 
  | 'magenta' 
  | 'grass' 
  | 'fern' 
  | 'moss' 
  | 'neutral-01' 
  | 'neutral-02' 
  | 'cornflour' 
  | 'text'

interface BadgeProps {
  theme?: BadgeTheme
  className?: string
  iconSrc: string  // Made required since we'll always pass it
  iconAlt: string  // Made required for accessibility
  children?: ReactNode
}

const defaultVariants: Record<BadgeTheme, string> = {
  rio: 'text-rio-400',
  dandelion: 'text-dandelion-500',
  lavender: 'text-lavender-500',
  magenta: 'text-magenta-500',
  grass: 'text-grass-500',
  fern: 'text-fern-600',
  moss: 'text-moss-400',
  'neutral-01': 'text-neutral-01-500',
  'neutral-02': 'text-neutral-02-500',
  cornflour: 'text-cornflour-600',
  text: 'text-fern-1100',
}

export default function Badge({ 
  theme = 'cornflour',
  className = 'badge',
  iconSrc,
  iconAlt,
  children
}: BadgeProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className={`w-[40px] h-[40px] flex-[0_0_auto] rounded-sm bg-white group-active/badge:bg-neutral-01-50 shadow-reduced group-hover/badge:shadow-picked group-active/badge:shadow-reduced flex items-center justify-center transition-all duration-100 ease-linear ${defaultVariants[theme]}`}>
        <Image 
          src={iconSrc} 
          alt={iconAlt} 
          width={50}
          height={50}
          className='p-2'
          priority
        />
      </span>
      {children}
    </div>
  )
}