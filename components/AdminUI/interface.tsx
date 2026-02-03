import { Header, Title, Column, Description } from '@/components/page'
import Image from 'next/image'
import BnbBalance from '../ButtonsUI/bnbBalance'
import DepositUsdt from './deposit'
import BurnToken from './burn'
import TokenPool from './reserve'
// import PoolBalance from './usdtpool'

export default function Interface() {

  return (
    <>
      <Image
        src="/rami/bigbeat.svg"
        width={962}
        height={46}
        className={`col-start-1 col-end-3 row-start-1 max-w-[initial] justify-self-end self-start mt-3 drop-shadow-placed max-2xl:hidden`}
        alt=""
        aria-hidden="true"
        priority
      />
      <Header>
        <Column className="md:col-span-1">
          <Title>admin</Title>
          <Description>
            <span className='flex justify-center lg:justify-start lg:items-start items-center mt-5'>
              <BnbBalance />
            </span>
          </Description>
        </Column>
      </Header>
      <article className="grid grid-cols-subgrid col-content pb-18 gap-y-18">
        <div className="col-start-content-start max-lg:col-end-content-end lg:col-span-5 xl:col-span-7 2xl:col-span-6 gap-4">
          <DepositUsdt />
          {/* <PoolBalance /> */}
        </div>
        <div className="col-start-content-start col-end-content-end lg:col-start-6 xl:col-start-9 2xl:col-start-8 flex flex-col gap-4">
          <section className="flex flex-col gap-4">
            <BurnToken />
            <TokenPool />
          </section>
        </div>
      </article>
    </>
  )
}



