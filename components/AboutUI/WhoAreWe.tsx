import { Header, Title, Column, Description } from '@/components/page'
import Image from 'next/image'
import Box from './leftside'
// import RightSide from './rightside'

export default function AboutTeam() {

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
          <Title>team.</Title>
          <Description>Meet the minds behind ramicoin.com. <br></br>
          </Description>
        </Column>
      </Header>
      <article className="grid grid-cols-subgrid col-content pb-18 gap-y-18">
        <div className="col-start-content-start max-lg:col-end-content-end lg:col-span-5 xl:col-span-7 2xl:col-span-6">
          <Box />
        </div>
        {/* <div className="col-start-content-start max-lg:col-end-content-end lg:col-span-5 xl:col-span-7 2xl:col-span-6">
          <RightSide />
        </div> */}
      </article>
    </>
  )
}
