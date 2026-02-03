'use client'

import Link from "../link"

const PPCY = ({ className = 'w-full' }) => {

    return (
        <>
            <div className={`${className}`}>
                <div className="@container flex flex-col gap-10">
                    <div className="@container flex flex-col gap-6">
                        {/* privacy policy */}
                        <div className="flex flex-col">
                            <div className="relative">
                                <div
                                    className={`tracking-normal flex  gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 pb-2 pt-8 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}>
                                    <span className='text-[20px]'>Privacy Policy</span>
                                    <Link href="/legal/privacy-policy"
                                        className="text-[#000000] button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight text-center"
                                    >
                                        <span className='opacity-60 text-lg'>
                                            Read Now
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default PPCY