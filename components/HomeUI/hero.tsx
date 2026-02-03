import Link from 'next/link'
import Image from '@/components/image'
import { SubTagline } from './subtagline'
import CTAButton from './CTA/ctabtn';

export default function Hero() {
  return (
    <section
      className={`mb-10 md:mb-18 max-lg:grid max-lg:grid-cols-subgrid col-start-container-start col-end-container-end place-items-center flex flex-col items-center relative frame frame-24 2xl:frame-40 2xl:frame-outset-top py-12 lg:pt-18 2xl:pt-10 lg:pb-[5.5rem] gap-y-4 max-lg:px-4`}
    >
      <h1
        id="hero-title"
        className="max-lg:col-content text-fern-1100 font-display text-3xl xs:text-5xl lg:text-7xl col-start-7 col-end-12 font-variation-bold lg:font-variation-extrabold text-center max-w-[13ch]"
      >
        Business  <br /> <span className="text-[#26a17b] text-4xl lg:text-6xl">Meets Blockchain</span>
      </h1>
      {/* <p className="max-lg:col-content text-sm xs:text-base lg:text-2xl text-ui-body text-center max-w-[30ch]">
        Protecting capital worldwide, while making passive income transparent.
      </p> */}
      <p className="max-lg:col-content text-sm xs:text-base lg:text-2xl text-ui-body text-center max-w-[30ch]">
        Powered by&nbsp; <SubTagline />
      </p>
      <ul className="inline-flex flex-wrap justify-center gap-4 lg:gap-6 max-lg:col-content lg:py-2 max-lg:mb-12">
        <li>
          <Link
            href="/audit"
            className="flex items-center gap-2 lowercase font-ui lg:text-lg transition duration-200 ease-in hover:text-rio-400"
          >
            <CTAButton text="audit" />
          </Link>
        </li>
        <li>
          <Link
            href="/buy"
            className="flex items-center gap-2 lowercase font-ui lg:text-lg transition duration-200 ease-in hover:text-dandelion-500"
          >
            <CTAButton text="invest" />
          </Link>
        </li>
      </ul>
      {/* <ul className="inline-flex flex-wrap justify-center gap-4 lg:gap-6 max-lg:col-content lg:py-2 max-lg:mb-12">
        <li>
          <Link
            href="/audit"
            className="flex items-center gap-2 lowercase font-ui lg:text-lg transition duration-200 ease-in hover:text-rio-400"
          >
            <span
              className="p-2 rounded-lg bg-rio-300 max-lg:hidden"
              aria-hidden="true"
            >
              <Image src="/rami/explore.svg" alt="" width="25" height="25" priority/>
            </span>
            <span
              className="p-2 rounded-lg bg-rio-300 lg:hidden"
              aria-hidden="true"
            >
              <Image src="/rami/explore.svg" alt="" width="15" height="15" priority/>
            </span>
            Audit
          </Link>
        </li>
        <li>
          <Link
            href="/buy"
            className="flex items-center gap-2 lowercase font-ui lg:text-lg transition duration-200 ease-in hover:text-dandelion-500"
          >
            <span
              className="p-2 rounded-lg bg-dandelion-300 max-lg:hidden"
              aria-hidden="true"
            >
              <Image src="/rami/home-dollar.svg" alt="" width="25" height="25" priority/>
            </span>
            <span
              className="p-2 rounded-lg bg-dandelion-300 lg:hidden"
              aria-hidden="true"
            >
              <Image src="/rami/home-dollar.svg" alt="" width="15" height="15" priority/>
            </span>
            Invest
          </Link>
        </li>
      </ul> */}
      <div className="w-full max-w-full [grid-column:1/-1] lg:mt-20">
        <Image
          src="/rami/bigbeat.svg"
          width={1440}
          height={240}
          className="w-full h-auto object-cover"
          alt=""
          aria-hidden="true"
          priority
        />
      </div>
    </section>
  )
}
