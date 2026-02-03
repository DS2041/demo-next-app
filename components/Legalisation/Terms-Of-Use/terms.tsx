import Image from 'next/image'

import { Header, Title, Column, Description } from '@/components/page'
import TermsDisplay from './TermsDisplay';

export default function TermsPage() {

  return (
    <>
      <Image
        src="/rami/bigbeat.svg"
        width={962}
        height={46}
        className={`col-start-1 col-end-3 row-start-1 max-w-[initial] justify-self-end self-start mt-3 drop-shadow-placed max-2xl:hidden`}
        alt=" "
        aria-hidden="true"
        priority
      />
      <Header>
        <Column className="md:col-span-1">
          <Title>Terms Of Use.</Title>
          <Description>
            <span className='text-sm font-normal'>
              Last revised:
            </span>
            <span className='text-lg font-ui ml-1'>
              September 18, 2025
            </span>
            <br></br>
          </Description>
        </Column>
      </Header>
      <article className="grid grid-cols-subgrid col-content">
        <div className='col-start-content-start col-end-content-end'>
          <TermsDisplay />
        </div>
      </article>
    </>
  )
}
