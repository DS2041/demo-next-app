"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [show, setShow] = useState(true);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // On first load
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }

    // On route change
    setShow(true);
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (show) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
        <Image
          src="/brand.gif"   // ✅ Your GIF file in /public/gl.gif
          alt="..."
          priority
          width={288}     // Matches your w-72 (72 * 4 = 288)
          height={288}    // Matches your h-72 (72 * 4 = 288)
          className="w-60 h-60 lg:w-72 lg:h-72 object-contain"
          unoptimized     // Required for GIFs in Next.js
        />
      </div>
    );
  }

  return <>{children}</>;
}



