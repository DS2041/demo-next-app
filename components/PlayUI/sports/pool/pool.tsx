'use client'

import Image from 'next/image'

import Button from '@/components/ButtonsUI/button'

const PoolGamePage = ({ className = 'w-full', unique = 'footer' }) => {

    return (
        <>
            <div className={`${className}`}>
                <div className="@container flex flex-col gap-10">
                    <div className="@container flex flex-col gap-6">
                        <div className="flex flex-col">
                            <div className='flex justify-between items-center'>
                                <label
                                    htmlFor={`input-name-${unique}`}
                                    className="font-sans text-xl font-medium text-fern-1100 leading-none mb-1"
                                >
                                    B.
                                </label>
                            </div>
                            <div className="relative">
                                <div
                                    className={`flex  gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-12 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}>
                                    <div className="">
                                        <Image
                                            src="/rami/player.svg"
                                            alt="-"
                                            width={500}
                                            height={100}
                                            priority
                                        />
                                    </div>
                                    <span className=''>8 Ball Pool</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 items-center justify-between">
                        <Button
                            theme="dandelion"
                            aria-label="Subscribe to the newsletter"
                            className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                        >
                            coming soon
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default PoolGamePage