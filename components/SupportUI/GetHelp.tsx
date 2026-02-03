"use client"

// components/HelpUI.tsx
import { Header, Title, Column, Description } from '@/components/page'
import Image from 'next/image'
import LeftSideFaq from './FAQ/faqleft'
import RightSideFaq from './FAQ/faqright'
import SearchInput from './FAQ/search'
import NoResults from './FAQ/noresult'
import { FAQProvider, useFAQ } from '@/context/faqcontext'

// Helper component to render FAQ content conditionally
function FAQContent() {
    const { hasSearchResults, isSearching, filteredFaqs } = useFAQ();

    // Show no results message when searching with no results
    if (isSearching && !hasSearchResults) {
        return <NoResults />;
    }

    // Don't render columns if no FAQs (though this shouldn't happen normally)
    if (filteredFaqs.length === 0) {
        return null;
    }

    return (
        <>
            <div className="mb-1 col-start-content-start max-lg:col-end-content-end lg:col-span-5 xl:col-span-7 2xl:col-span-7">
                <LeftSideFaq />
            </div>
            <div className="col-start-content-start col-end-content-end lg:col-start-6 xl:col-start-9 2xl:col-start-8 flex flex-col gap-4 2xl:col-span-7">
                <RightSideFaq />
            </div>
        </>
    );
}

export default function HelpUI() {

    const handleEmailClick = () => {
        window.open('mailto:ramicoinbsc@gmail.com', '_blank');
    };

    return (
        <FAQProvider>
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
                        <Title>need help?</Title>
                        <Description>Get in touch or find your answers from frequently asked questions. <br /> <br />
                            <span className="font-ui text-xl text-black">ramicoinbsc@gmail.com</span>
                            <div className='w-full flex justify-center items-center lg:justify-start lg:items-start pt-3'>
                                <span className='w-11 h-11 bg-[#26a17b] hover:bg-[#fb780c] p-1 rounded-sm flex justify-center items-center transition-transform duration-300 hover:scale-110'>
                                    <Image className="cursor-pointer" onClick={handleEmailClick} src="/mail.svg" alt='-' width={100} height={100} priority />
                                </span>
                            </div>
                        </Description>
                    </Column>
                </Header>
                <article className="grid grid-cols-subgrid col-content">
                    <div className="col-start-content-start col-end-content-end lg:col-span-full">
                        <SearchInput />
                    </div>
                    <FAQContent />
                </article>
            </>
        </FAQProvider>
    )
}