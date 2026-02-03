'use client'

import { useGlobal } from '@/context/global';
import BlackSpinner from '../Old/Spinners/BlackSpin';

const PoolBalance = ({ className = 'w-full', unique = 'footer' }) => {

    const { state, isLoading } = useGlobal();

    return (
        <>
            <div className={`${className}`}>
                <div className="@container flex flex-col gap-10">
                    <div className="@container flex flex-col gap-6">
                        <div className="flex flex-col">
                            <div className='flex justify-between items-center'>
                                <span
                                    className="font-sans text-xl font-medium text-fern-1100 leading-none mb-1"
                                >
                                    Usdt Pool
                                </span>
                                <p className="text-sm text-ui-body opacity-80 leading-none mb-3">
                                    .
                                </p>
                            </div>
                            <div className="relative">
                                <div
                                    className={`flex  gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-16 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}>
                                    <span className=''>
                                        {isLoading ? <BlackSpinner /> : `$${(state.usdtPool).toFixed(2)}`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default PoolBalance