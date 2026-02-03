import { Header, Title, Column, Description } from '@/components/page'
import Image from 'next/image'

export default function SecurityDetailUI() {

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
                    <Title>security</Title>
                    <Description>Protect your digital assets with our advanced security features. <br /> <br />
                        coming soon ...

                        <Image
                            src="/rami/security.svg"
                            width={50}
                            height={50}
                            className={`mx-auto md:mx-0 justify-self-start self-start mt-3 drop-shadow-placed md:col-start-1 md:col-end-3 md:row-start-1 md:max-w-[initial]`}
                            alt=" "
                            aria-hidden="true"
                            priority
                        />
                    </Description>

                </Column>
            </Header>
        </>
    )
}
