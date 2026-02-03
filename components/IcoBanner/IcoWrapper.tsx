// components/IcoBanner/ICOBannerWrapper.tsx
'use client'

import { usePathname } from 'next/navigation'
import ICOBanner from "@/components/IcoBanner/ico"

export default function ICOBannerWrapper() {
    const pathname = usePathname()

    // Only show on homepage
    return pathname === '/' ? <ICOBanner /> : null
}