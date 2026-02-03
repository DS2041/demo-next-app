'use client'

import { useEffect, useState, MouseEvent } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import "./ico.css"

import { useAffiliate } from '@/context/affiliate'
import BlackSpinner from '@/components/Old/Spinners/BlackSpin'

export default function ICOBanner() {
  const [visible, setVisible] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [isInvesting, setIsInvesting] = useState(false)

  const {
    state: affiliate,
    isLoading
  } = useAffiliate()

  // Calculate total raised amount
  const totalRaised = affiliate?.totalSales + 144 || 0

  // Auto-hide after 60s
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 60000)
    return () => clearTimeout(timer)
  }, [])

  const handleInvestClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Only prevent default if we're showing the spinner
    if (!isInvesting) {
      e.preventDefault();
      setIsInvesting(true);

      // Simulate a loading process (replace with actual investment process)
      setTimeout(() => {
        setIsInvesting(false);
        // Programmatically navigate after loading completes
        window.location.href = '/buy';
      }, 3000);
    }
  }

  if (!visible) return null

  return (
    <>
      <header
        className="mt-1 btn-shimmer grid grid-cols-subgrid col-start-margin-start col-end-margin-end relative z-10"
        id="top"
      >
        <div className="col-container 2xl:col-content flex items-center align-center max-lg:justify-between py-3 px-4 lg:-mx-4 lg:py-[1.625rem] 2xl:py-4 2xl:px-8 2xl:-mx-8 max-lg:-mx-4 max-2xl:gap-8">
          <div className="flex justify-between items-center w-full">
            {/* Funding details */}
            <div className="flex flex-col justify-start items-start">
              <span className="text-xs font-ui tracking-wide">
                <span className="text-xs font-light text-[#ffffff]/70">
                  Funding Goal:
                </span>
                <span className="ml-1 text-sm text-[#ffffff]">
                  $5,000,000
                </span>
              </span>
              <h1 className="text-xl font-ui text-[#ffffff] tracking-tight flex justify-start items-center">
                {isLoading || totalRaised <= 11129 ? (
                  <BlackSpinner />
                ) : (
                  <>
                    <span className='text-sm  text-[#ffffff]'>
                      ${totalRaised.toLocaleString('en-US')}
                    </span>
                  </>
                )}
                <span className="ml-1 text-xs font-light text-[#ffffff]/70">
                  raised
                </span>
              </h1>
            </div>

            {/* Invest Now Button */}
            <div>
              <Link
                href="/buy"
                onClick={handleInvestClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className={`flex items-center justify-center px-3 py-2 rounded-sm font-ui
                           transition-colors duration-300 min-w-[120px]
                           ${isInvesting
                    ? 'bg-white cursor-not-allowed'
                    : 'bg-[#ff0000] text-white hover:bg-[#ffffff] hover:text-black'}`}
              >
                {isInvesting ? (
                  <BlackSpinner />
                ) : (
                  <>
                    <span className="mr-1 font-light text-xs">Invest Now</span>
                    <span className="transition-transform duration-300">
                      {hovered ? (
                        <ArrowUpRight className="h-3 w-3 transform translate-x-0.5 -translate-y-0.5" />
                      ) : (
                        <ArrowRight className="h-3 w-3" />
                      )}
                    </span>
                  </>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
