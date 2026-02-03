'use client'

import Link from 'next/link'
import Image from 'next/image';
import { useRamicoin } from '@/context/trackrecord';
import BlackSpinner from '../Old/Spinners/BlackSpin';

const DailyData = ({ className = 'w-full' }) => {

    const {
        currentData,
        isLoading,
        shortenHash
    } = useRamicoin();

    return (
        <>
            <div className={`${className}`}>
                <div className="@container flex flex-col gap-10">
                    <div className="@container flex flex-col gap-6">
                        {/* daily profit */}
                        <div className="flex flex-col">
                            <div className="relative">
                                <div
                                    className={`tracking-normal flex  gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 pb-2 pt-8 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}>
                                    <Image src="/rami/blogo/bonlydt.svg" alt='-' width={80} height={80} priority/>
                                    <span className='text-[#000000]/50 text-lg tracking-normal'>USDT</span>
                                    <span className='tracking-tight'>
                                        {isLoading ? <BlackSpinner /> : `${currentData ? (currentData.profit === 0 || currentData.profit_hash === "-" ? "0" : `$${currentData.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`) : '--'}`}
                                    </span>
                                    <span className='text-[20px] opacity-70'>Total profit made today</span>
                                    <Link target='_blank' href={currentData?.profit_hash && currentData.profit_hash !== "-" ? `https://bscscan.com/tx/${currentData.profit_hash}` : "#"}
                                        className="text-[#000000] button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                                    >
                                        <span className='opacity-70 text-sm'>
                                            {isLoading ? <BlackSpinner /> : `${shortenHash(currentData?.profit_hash)}`}
                                        </span>
                                        <br />
                                        <span className='opacity-35 text-sm'>
                                            transaction hash
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* token burn daily */}
                        <div className="flex flex-col">
                            <div className="relative">
                                <div
                                    className={`tracking-normal flex  gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 pb-2 pt-8 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}>
                                    <Image src="/ramiburn.svg" alt='-' width={80} height={80} priority/>
                                    <span className='text-[#000000]/50 text-lg tracking-normal'>RAMICOIN</span>
                                    <span className='tracking-tight'>
                                        {isLoading ? <BlackSpinner /> : `${currentData ? (currentData.rami_burn === 0 || currentData.burn_hash === "-" ? "0" : `${currentData.rami_burn.toLocaleString()}`) : '--'}`}
                                    </span>
                                    <span className='text-[20px] opacity-70'>Tokens burnt today</span>
                                    <Link target='_blank' href={currentData?.burn_hash && currentData.burn_hash !== "-" ? `https://bscscan.com/tx/${currentData.burn_hash}` : "#"}
                                        className="text-black button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                                    >
                                        <span className='opacity-70 text-sm'>
                                            {isLoading ? <BlackSpinner /> : `${shortenHash(currentData?.burn_hash)}`}
                                        </span>
                                        <br />
                                        <span className='opacity-35 text-sm'>
                                            transaction hash
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


export default DailyData
