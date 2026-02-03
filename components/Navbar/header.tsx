'use client'

import { usePathname } from 'next/navigation'
import Lottie from "lottie-react";
import coinAnimation from "../../public/coin.json";

// components
import Link from '../link'
import { Navigation } from '@/components/Navbar/navigation'

// css
import styles from './header.module.scss'
import Image from 'next/image'

const mynavitems = [
  { title: 'home', href: '/', imgSrc: '/rami/nav/home.svg' },
  { title: 'buy', href: '/buy', imgSrc: '/rami/nav/buy.svg' },
  { title: 'play', href: '/play', imgSrc: '/rami/nav/play.svg' },
  { title: 'stake', href: '/stake', imgSrc: '/rami/nav/stake.svg' },
  { title: 'claim', href: '/claim', imgSrc: '/rami/nav/claim.svg' },
]

export default function Header() {
  const pathname = usePathname()
  const nav = `flex flex-[1_0_auto] lg:gap-8 2xl:gap-12 xl:justify-center`
  const tabbarNav = `max-lg:transition max-lg:transition-all max-lg:duration-200 max-lg:ease-out max-lg:px-4 max-lg:bg-white/90 max-lg:shadow-placed max-lg:justify-between max-lg:fixed max-lg:left-0 max-lg:right-0 max-lg:bottom-0 max-lg:z-[100] max-lg:backdrop-blur max-lg:backdrop-brightness-100 max-lg:backdrop-saturate-150`

  const navLink = `flex items-center gap-1 text-base font-ui lowercase leading-none relative ${styles.link}`
  const horizontalNavLink = `lg:gap-2 lg:text-xl/none lg:py-1 xl:py-0.5`
  const tabbarNavLink = `max-lg:text-[12px] max-lg:flex-col max-lg:flex-1 max-lg:justify-center max-lg:pt-2`

  return (
    <>
      <header
        className="grid grid-cols-subgrid col-start-margin-start col-end-margin-end relative z-10"
        id="top"
      >
        <div
          className="absolute col-container lg:col-content lg:-mx-8 h-[45px] top-1/2 -translate-y-1/2 right-0 left-0 bg-[url(/images/texture.png)] bg-[172px_auto] bg-blend-multiply bg-neutral-01-150 z-[-1]"
          aria-hidden="true"
        />
        <div className="col-container 2xl:col-content flex items-center align-center max-lg:justify-between py-4 px-4 lg:-mx-4 lg:py-[1.625rem] 2xl:py-9 2xl:px-8 2xl:-mx-8 max-lg:-mx-4 max-2xl:gap-8">

          <Link
            href="/"
            className="flex-[1_0_10%]"
          >
            <Lottie
              animationData={coinAnimation}
              loop={true}
              style={{ width: 60, height: 60 }}
              aria-hidden="true"
              className='max-xl:hidden'
            />
            <Lottie
              animationData={coinAnimation}
              loop={true}
              style={{ width: 50, height: 50 }}
              aria-hidden="true"
              className="Icon xl:hidden"
            />
          </Link>

          <nav className={`${nav} ${tabbarNav}`} id="nav">
            {mynavitems.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  href={link.href}
                  className={`${navLink} ${link.title === 'Home' ? 'lg:hidden' : ''
                    } ${link.title === 'Contact' ? 'max-lg:hidden' : ''} ${styles.vertical
                    } ${tabbarNavLink} ${horizontalNavLink} ${styles.start} ${isActive ? 'max-lg:opacity-100' : 'max-lg:opacity-60'
                    } ${isActive ? 'max-lg:text-fern-1100' : ''}`}
                  key={link.href}
                >
                  <Image
                    src={link.imgSrc}
                    alt=""
                    width={20}
                    height={20}
                    className="text-current lg:opacity-50"
                    priority
                  />
                  {link.title}
                </Link>
              )
            })}
          </nav>
          <Navigation />
        </div>
      </header>
    </>
  )
}
