import WebsiteTitle from '@/components/Footer/sitename'
import Link from '@/components/link'
import Image from 'next/image'
import ContactUsOnTelegram from './ContactUs'

export default function FooterProfile() {
  return (
    <>
      <aside className="grid grid-flow-dense grid-cols-2 sm:grid-cols-[repeat(16,_minmax(min-content,_1fr))] grid-rows-[repeat(auto-fill,_minmax(min-content,1fr))] gap-px col-start-container-start col-end-container-end shadow-placed rounded-lg lg:rounded-xl overflow-hidden mt-8">

        <WebsiteTitle className="block col-span-full lg:col-span-8 xl:col-span-7 row-span-10 bg-white py-12 px-8 sm:px-12 sm:py-12 md:px-[5vmax] xl:py-16 xl:px-24" />
        <div className="@container/about col-span-full sm:col-span-8 xl:col-span-9 row-span-7 bg-white py-12 px-8 sm:px-12 sm:py-12 xl:px-[4.5rem] content-end">
          <h3 className="font-display font-variation-bold text-3xl flex gap-2 mb-3">
            CEO.
          </h3>
          <div className="flex flex-col @md:flex-row gap-x-6 gap-y-2">
            <p className="text-ui-body text-base flex-1">
              When you think about investing in ramicoin, you're not just funding a project - you're backing a mindset.
            </p>
            <p className="text-ui-body text-base flex-1">
              Markets rise and fall. Ideas come and go. But the right team ? That's the one constant that turns ambition into reality. <br /> <br />
              <span
                className="mt-4 font-semibold text-fern-1100 hover:text-dandelion-600 transition duration-200 ease"
              >
                Invest in us.
              </span>
            </p>
          </div>
        </div>

        <div className="col-span-1 sm:col-span-8 lg:col-span-4 xl:col-span-5 row-span-3 bg-white py-12 px-8 sm:px-12 sm:py-12 xl:px-[4.5rem] flex flex-col justify-end">
          <h3 className="font-display font-variation-bold text-lg sm:text-3xl mb-4">
            Routes
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 sm:gap-y-4">
            <li>
              <Link
                href="/play"
                className="flex flex-row items-center gap-2 text-base font-ui lowercase text-fern-1100 hover:text-dandelion-600 transition duration-200"
              >
                <Image src="/rami/nav/play.svg" alt='' width={16} height={16} className="text-current shrink-0" priority />
                Esports
              </Link>
            </li>
            <li>
              <Link
                href="/security"
                className="flex flex-row items-center gap-2 text-base font-ui lowercase text-fern-1100 hover:text-dandelion-600 transition duration-200"
              >
                <Image src="/rami/footer/lock.svg" alt='' width={16} height={16} className="text-current shrink-0" priority />
                Security
              </Link>
            </li>
            <li>
              <Link
                href="/defi"
                className="flex flex-row items-center gap-2 text-base font-ui lowercase text-fern-1100 hover:text-dandelion-600 transition duration-200"
              >
                <Image src="/rami/nav/stake.svg" alt='' width={16} height={16} className="text-current shrink-0" priority />
                Defi
              </Link>
            </li>
            <li>
              <Link
                href="/blog"
                className="flex flex-row items-center gap-2 text-base font-ui lowercase text-fern-1100 hover:text-dandelion-600 transition duration-200"
              >
                <Image src="/rami/footer/news.svg" alt='' width={16} height={16} className="text-current shrink-0" priority />
                Blog
              </Link>
            </li>
            <li>
              <Link
                href="/legal"
                className="flex flex-row items-center gap-2 text-base font-ui lowercase text-fern-1100 hover:text-dandelion-600 transition duration-200"
              >
                <Image src="/rami/footer/legal.svg" alt='' width={16} height={16} className="text-current shrink-0" priority />
                Legal
              </Link>
            </li>
            <li>
              <Link
                href="/team"
                className="flex flex-row items-center gap-2 text-base font-ui lowercase text-fern-1100 hover:text-dandelion-600 transition duration-200"
              >
                <Image src="/rami/footer/profile.svg" alt='' width={16} height={16} className="text-current shrink-0" priority />
                team
              </Link>
            </li>
            <li>
              <Link
                href="/support"
                className="flex flex-row items-center gap-2 text-base font-ui lowercase text-fern-1100 hover:text-dandelion-600 transition duration-200"
              >
                <Image src="/rami/footer/email.svg" alt='' width={16} height={16} className="text-current shrink-0" priority />
                support
              </Link>
            </li>
            <li>
              <Link
                href="/whitepaper"
                className="flex flex-row items-center gap-2 text-base font-ui lowercase text-fern-1100 hover:text-dandelion-600 transition duration-200"
              >
                <Image src="/rami/footer/whitepaper.svg" alt='' width={16} height={16} className="text-current shrink-0" priority />
                Whitepaper
              </Link>
            </li>
          </ul>
        </div>

        <ContactUsOnTelegram />

        <div className="col-span-1 sm:col-span-8 lg:col-span-4 xl:col-span-4 row-span-2 bg-white py-12 px-8 sm:px-12 sm:py-12 xl:px-[4.5rem] flex flex-col justify-end">
          <h3 className="font-display font-variation-bold text-lg sm:text-3xl mb-4">
            Socials
          </h3>
          <ul className="flex flex-row flex-wrap gap-x-6 gap-y-2 sm:gap-y-4">
            <li>
              <Link
                href="https://www.youtube.com/@ramicoin"
                target='_blank'
                className="relative flex flex-row items-center gap-2 text-base font-ui uppercase text-fern-1100 hover:text-dandelion-600 transition duration-200"
              >
                <Image src="/rami/socials/youtube.svg" alt='' width={32} height={32} className="text-current shrink-0" priority />
                <div className="absolute -top-2.5 -right-2 bg-red-600 text-white text-[8px] font-bold px-1.5 py-[1px] rounded-md shadow">
                  LIVE
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="https://x.com/ramicoin_bnb"
                target='_blank'
                className="flex flex-row items-center gap-2 text-base font-ui lowercase text-fern-1100 hover:text-dandelion-600 transition duration-200"
                rel="me"
              >
                <Image src="/rami/socials/twitter.svg" alt='' width={32} height={32} className="text-current shrink-0" priority />

              </Link>
            </li>
            <li>
              <Link
                href="https://linkedin.com/company/theramicoin"
                target='_blank'
                className="flex flex-row items-center gap-2 text-base font-ui lowercase text-fern-1100 hover:text-dandelion-600 transition duration-200"
              >
                <Image src="/rami/socials/linkedin.svg" alt='' width={32} height={32} className="text-current shrink-0" priority />
              </Link>
            </li>
            <li>
              <Link
                href="https://bscscan.com/token/0xb93235b024a3063e3cf56cab9991f99c513bee78"
                target='_blank'
                className="flex flex-row items-center gap-2 text-base font-ui lowercase text-fern-1100 hover:text-dandelion-600 transition duration-200"
              >
                <Image src="/rami/socials/bsc.svg" alt='' width={32} height={32} className="text-current shrink-0" priority />

              </Link>
            </li>
          </ul>
        </div>
      </aside>

      <footer className="col-content flex flex-col max-md:items-center md:flex-row gap-8 pt-18 pb-18 md:py-18">
        <p className="flex flex-1 items-center justify-start gap-2 max-md:flex-col max-md:gap-1 text-balance -mb-5">
          All rights reserved
        </p>
        <ul className="flex">
          <li>
            <p className="text-ui-body">
              {`©`}{' '}
              <Link
                href="/"
                className="text-ui-body hover:text-dandelion-600 transition duration-200 ease-linear"
              >
                ramicoin
              </Link>{' '}
              2025
            </p>
          </li>
        </ul>
      </footer>
      <div className="col-container relative -top-4 pb-24 flex flex-row items-center gap-8">
        <span
          className="flex-1 bg-[url(/images/dash.svg)] h-[2px]"
          aria-hidden="true"
        />
        <Image src="/rami/blogo/brami.svg" alt='' width={32} height={32} priority />
        <span
          className="flex-1 bg-[url(/images/dash.svg)] h-[2px]"
          aria-hidden="true"
        />
      </div>
    </>
  )
}
