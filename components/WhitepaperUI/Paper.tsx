'use client'

import { useState } from 'react'
import { Header, Title, Column, Description } from '@/components/page'
import Image from 'next/image'
import BlackSpinner from '../Old/Spinners/BlackSpin'

export default function PaperUI() {
    const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'complete'>('idle');

    const handleDownload = () => {
        if (downloadState !== 'idle') return;

        // Show spinner immediately
        setDownloadState('loading');

        // Start download after a brief delay to allow spinner to render
        setTimeout(() => {
            const fileUrl = "/whitepaper/ramicoin.pdf";

            const link = document.createElement("a");
            link.href = fileUrl;
            link.download = fileUrl.split("/").pop() || "ramicoin.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show tick after 3 seconds
            setTimeout(() => {
                setDownloadState('complete');

                // Reset to download icon after another 3 seconds
                setTimeout(() => {
                    setDownloadState('idle');
                }, 3000);
            }, 3000);
        }, 100);
    };

    const renderIcon = () => {
        switch (downloadState) {
            case 'loading':
                return <BlackSpinner />;
            case 'complete':
                return (
                    <Image
                        src="/rami/ramitick.svg"
                        width={30}
                        height={30}
                        className="mx-auto"
                        alt="Download Complete"
                        priority
                    />
                );
            default:
                return (
                    <Image
                        src="/rami/download.svg"
                        width={30}
                        height={30}
                        className="mx-auto"
                        alt="Download Whitepaper"
                        priority
                    />
                );
        }
    };

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
                    <Title>whitepaper</Title>
                    <Description>
                        <div className='flex flex-col justify-center lg:justify-start lg:items-start items-center gap-2 lg:gap-4'>
                            <span>See the full business picture of ramicoin.com</span>
                            <button
                                onClick={handleDownload}
                                disabled={downloadState !== 'idle'}
                                className='w-11 h-11 bg-[#ffffff] flex justify-center items-center text-center rounded-sm p-1'
                            >
                                {renderIcon()}
                            </button>
                        </div>
                    </Description>
                </Column>
            </Header>
        </>
    )
}
