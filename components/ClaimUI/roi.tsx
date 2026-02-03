'use client'
import { useState, useEffect } from 'react';
import Button from '@/components/ButtonsUI/button'
import BlackSpinner from '../Old/Spinners/BlackSpin';
import Link from 'next/link'
import Image from 'next/image';

const MyStakedBalanceSection = ({ className = 'w-full', unique = 'footer' }) => {

    const [isLoading, setIsLoading] = useState(true);
    const [usdtPool, setUsdtPool] = useState(0);

    useEffect(() => {
        const fetchUsdtPool = async () => {
            try {
                const response = await fetch('/data/usdtpool.json');
                if (!response.ok) {
                    throw new Error('Failed to fetch USDT pool data');
                }
                const data = await response.json();
                setUsdtPool(data[0]?.usdtpool || 0);
            } catch (error) {
                console.error('Error fetching USDT pool:', error);
                setUsdtPool(0); // Fallback to 0 if there's an error
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsdtPool();
    }, []);

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
                                    Unclaimed Reward Pool (USDT)
                                </span>
                                <p className="text-sm text-ui-body opacity-80 leading-none mb-3">
                                    .
                                </p>
                            </div>
                            <div className="relative">
                                <div
                                    className={`flex gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-12 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}>
                                    <div className="">
                                        <Image
                                            src="/rami/blogo/busdt.svg"
                                            alt="USDT"
                                            width={100}
                                            height={100}
                                            className="w-12 h-12"
                                            priority
                                        />
                                    </div>

                                    <span className=''>
                                        {isLoading ? <BlackSpinner /> : `$${(usdtPool).toFixed(2)}`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Link href="/stake" className="flex flex-col gap-4 items-center justify-between">
                        <Button
                            theme="dandelion"
                            aria-label="Subscribe to the newsletter"
                            className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                        >
                            Stake RAMI
                        </Button>
                    </Link>
                </div>
            </div>
        </>
    )
}

export default MyStakedBalanceSection;

