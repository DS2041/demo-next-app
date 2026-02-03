import { Header, Title, Column, Description } from '@/components/page'
import Image from 'next/image'

export default function DefiLandingUI() {

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
                    <Title>DEFI</Title>
                    <Description>Unlock the potential of decentralized finance with our innovative solutions. <br /> <br />
                        coming soon ...
                    </Description>

                </Column>
            </Header>
        </>
    )
}
