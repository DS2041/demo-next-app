import Link from 'next/link'
import Image from 'next/image';

const RightSide = ({ className = 'w-full' }) => {

    return (
        <>
            <div className={`${className}`}>
                <div className="@container flex flex-col gap-10">
                    <div className="@container flex flex-col gap-6">
                        {/* bd */}
                        <div className="flex flex-col">
                            <div className="relative">
                                <div
                                    className={`tracking-normal flex  gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 pb-4 pt-8 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}>
                                    <Image src="/rami/team/irs.svg" alt='-' width={300} height={200} priority />
                                    {/* Socials */}
                                    <div className="w-full flex justify-center items-center space-x-2">
                                        <Link target='_blank' href="https://www.linkedin.com/in/seeuatwork" className='w-7 h-7 bg-[#000000] rounded-sm flex justify-center items-center transition-all duration-300 transform hover:scale-110 hover:bg-orange-500'>
                                            <Image src="/rami/team/ldn.svg" alt='-' width={50} height={50} priority />
                                        </Link>
                                        <Link target='_blank' href="https://x.com/since_bitcoin" className='w-7 h-7 bg-[#000000] rounded-sm flex justify-center items-center transition-all duration-300 transform hover:scale-110 hover:bg-orange-500'>
                                            <Image src="/rami/team/x.svg" alt='-' width={50} height={50} priority />
                                        </Link>
                                        <Link target='_blank' href="https://t.me/ramicoin_ceo" className='w-7 h-7 bg-[#000000] rounded-sm flex justify-center items-center transition-all duration-300 transform hover:scale-110 hover:bg-orange-500'>
                                            <Image src="/rami/team/tg.svg" alt='-' width={50} height={50} priority />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default RightSide