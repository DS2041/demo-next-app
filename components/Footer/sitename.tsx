'use client'

import { useState, MouseEvent } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { useAffiliate } from '@/context/affiliate'
import BlackSpinner from '@/components/Old/Spinners/BlackSpin'

interface WebsiteTitleProps {
  className?: string;
}

const WebsiteTitle = ({
  className = '',
}: WebsiteTitleProps) => {

  const [hovered, setHovered] = useState(false)
  const [isInvesting, setIsInvesting] = useState(false)

  const {
    state: affiliate,
    isLoading
  } = useAffiliate()

  const total = 5000000;
  const totalForSale = 1000000000;
  const totalRaised = affiliate?.totalSales + 144 || 0
  const progress = (totalRaised / total) * 100;
  const totalTokensSold = totalRaised > 13594 ? Math.floor(totalRaised / 0.005) : 0


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

  // Determine color based on progress percentage - Updated with pure colors
  const getProgressColor = () => {
    if (progress >= 85) return 'green';     // Default green
    if (progress >= 55) return 'pink';      // Pure light pink
    if (progress >= 30) return 'yellow';    // Pure yellow
    return 'orange';                        // Pure light orange
  };

  const progressColor = getProgressColor();

  return (
    <section className={`${className} flex flex-col items-center gap-8`}>
      <header className={`flex flex-col gap-2 items-center`}>
        <h2 className="text-3xl sm:text-5xl font-display font-variation-bold text-fern-1100 text-center mb-2">
          Ramicoin <span className="text-[#26a17b]">ICO</span>
        </h2>
       <p className='font-ui text-lg mb-5 font-bold'>1
          <span className='text-[#000000]/50 font-normal ml-1'>RAMI</span>
          <span className='text-[#000000]/50 font-normal mx-1'>=</span>
          0.005
          <span className='text-[#000000]/50 font-normal ml-1'>USDT</span>
        </p>
        <div className="w-full font-ui grid mb-4 border border-gray-200 rounded-lg shadow-xs md:grid-cols-2 bg-white">
          <figure className="flex flex-col items-center justify-center p-4 text-center bg-white border-b border-gray-200 rounded-t-lg md:rounded-t-none md:rounded-ss-lg md:border-e">
            <figcaption className="w-full flex justify-start">
              <div className="text-left">
                <div className="text-xl">
                  {isLoading || totalRaised <= 13594 ? (
                    <span>
                      <BlackSpinner />
                    </span>
                  ) : (
                    <>
                      <span>
                        ${totalRaised.toLocaleString('en-US')}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-lg text-[#000000]/50">Funds Raised</div>
              </div>
            </figcaption>
          </figure>
          <figure className="flex flex-col items-center justify-center p-4 text-center bg-white border-b border-gray-200 md:rounded-se-lg">
            <figcaption className="w-full flex justify-start">
              <div className="text-left">
                <div className="text-xl">${total.toLocaleString('en-US')}</div>
                <div className="text-lg text-[#000000]/50">Total Ask</div>
              </div>
            </figcaption>
          </figure>
          <figure className="flex flex-col items-center justify-center p-4 text-center bg-white border-b border-gray-200 md:rounded-es-lg md:border-b-0 md:border-e">
            <figcaption className="w-full flex justify-start">
              <div className="text-left">
                <div className="text-xl">{totalForSale.toLocaleString('en-US')}</div>
                <div className="text-lg text-[#000000]/50">Tokens On Sale</div>
              </div>
            </figcaption>
          </figure>
          <figure className="flex flex-col items-center justify-center p-4 text-center bg-white border-gray-200 rounded-b-lg md:rounded-se-lg">
            <figcaption className="w-full flex justify-start">
              <div className="text-left">
                <div className="text-xl">
                  {isLoading || totalRaised <= 13594 ? (
                    <span>
                      <BlackSpinner />
                    </span>
                  ) : (
                    <>
                      <span>
                        {totalTokensSold.toLocaleString('en-US')}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-lg text-[#000000]/50">Total Tokens Sold</div>
              </div>
            </figcaption>
          </figure>
        </div>

        {/* Battle.net Style Progress Bar */}
        <div className="progress w-full max-w-2xl bg-[#000000]/5 rounded-xs relative mb-8">
          {/* Colored Progress Bar */}
          <div
            className={`
                      progress__bar relative h-5 bg-opacity-95 border rounded-xs
                      transition-all duration-1000 ease-out
                      ${progress >= 100 ? 'rounded-xs' : 'rounded-l-xs rounded-r-none'}
                      ${progressColor === 'orange' ? `
                          bg-[#ffa500] border-[#ffb733]
                          shadow-[0_0_0.6em_#ffb733_inset,0_0_0.4em_#ffa500_inset,0_0_0.5em_rgba(255,165,0,0.5)]
                        ` : progressColor === 'yellow' ? `
                          bg-[#ffff00] border-[#ffff33]
                          shadow-[0_0_0.6em_#ffff33_inset,0_0_0.4em_#ffff00_inset,0_0_0.5em_rgba(255,255,0,0.5)]
                        ` : progressColor === 'pink' ? `
                          bg-[#ffb6c1] border-[#ffc6d0]
                          shadow-[0_0_0.6em_#ffc6d0_inset,0_0_0.4em_#ffb6c1_inset,0_0_0.5em_rgba(255,182,193,0.5)]
                        ` : progressColor === 'green' ? `
                          bg-[#00b217] border-[#10c227]
                          shadow-[0_0_0.6em_#10c227_inset,0_0_0.4em_#00b217_inset,0_0_0.5em_rgba(0,178,23,0.5)]
                        ` : ''
              }
                    `}
            style={{ width: `${progress}%` }}
          >
            {/* Simple shimmer effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            {/* Right edge effects */}
            <div className="absolute -right-1 -top-2.5 w-2 h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
            <div className="absolute -right-2 -top-2.5 w-3 h-10">
              <div className="w-full h-full bg-radial-gradient ellipse at center, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 75%"></div>
            </div>
          </div>

          {/* Percentage Text - Positioned right after the progress bar ends */}
          <span
            className="absolute top-0 h-5 flex items-center justify-center text-black text-xs font-bold z-9 whitespace-nowrap"
            style={{
              left: `calc(${progress}% + 8px)`,
            }}
          >
            {progress >= 100 ? 'Complete' : `${progress.toFixed(2)}%`}
          </span>
        </div>
        <div className='w-full'>
          <Link
            href="/buy"
            onClick={handleInvestClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`flex items-center justify-center px-3 py-3 rounded-sm font-ui
                                   transition-colors duration-300 min-w-[120px]
                                   ${isInvesting
                ? 'bg-[#000000]/10 cursor-not-allowed'
                : 'bg-[#ff0000] text-white hover:bg-[#000000] hover:text-white'}`}
          >
            {isInvesting ? (
              <div>
                <BlackSpinner />
              </div>
            ) : (
              <>
                <span className="mr-1 font-light text-lg">Invest Now</span>
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
        <span className="text-[#000000]/70 font-serif text-md italic tracking-wide leading-relaxed font-normal transition-all duration-500 hover:opacity-80">
          <strong>R</strong>eal <strong>A</strong>ssets . <strong>M</strong>eaningful <strong>I</strong>ntentions
        </span>
      </header>
    </section>
  )
}

export default WebsiteTitle







