'use client'

import Button from '@/components/ButtonsUI/button'
import Image from 'next/image'

// unstaking code imports from old
import { useGlobal } from '@/context/global'
import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useAppKit } from "@reown/appkit/react";
import BlackSpinner from '../Old/Spinners/BlackSpin';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

const UnstakePageUI = ({ className = 'w-full', unique = 'footer' }) => {


    const { open } = useAppKit();

    const { address: userAddress } = useAccount()

    const {
        state: staking,
        handleUnstake,
        handleUnstakeAmountChange,
        refetchData,
        clearTransaction,
    } = useGlobal()

    const { transaction } = staking

    const handleConnectWallet = () => {
        open();
    };

    useEffect(() => {
        if (transaction.status === 'success' || transaction.status === 'error') {
            const timer = setTimeout(() => {
                clearTransaction();
                // Force UI refresh after success message
                refetchData();
            }, 3000); // Show success state for 3 seconds
            return () => clearTimeout(timer);
        }
    }, [transaction.status, clearTransaction, refetchData]);

    // regular format
    const formatRegular = (value: number) => {
        const num = typeof value === 'number' ? value : parseFloat(value);

        const formatted = num >= 10000
            ? num.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            })
            : num.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

        return {
            formatted,
            fontSize: num >= 1e6 ? 'text-sm' : 'text-base',
        };
    };

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
                                    Unstake Rami
                                </span>
                                <p className="text-sm text-ui-body opacity-80 leading-none mb-3">
                                    {!userAddress ? "00:00:00" : (staking.remainingTime)}
                                </p>

                            </div>
                            <div className="relative">
                                <div
                                    className={`flex  gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-8 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}>
                                    <div className="">
                                        {!userAddress ? (
                                            <Image
                                                src="/rami/footer/lock.svg"
                                                alt="-"
                                                width={100}
                                                height={100}
                                                className="w-10 h-10"
                                                priority
                                            />
                                        ) : userAddress && (parseFloat(staking.remainingTime) > 0) ? (
                                            <Image
                                                src="/rami/footer/lock.svg"
                                                alt="-"
                                                width={100}
                                                height={100}
                                                className="w-10 h-10"
                                                priority
                                            />
                                        ) : (
                                            <Image
                                                src="/rami/footer/unlock.svg"
                                                alt="-"
                                                width={100}
                                                height={100}
                                                className="w-10 h-10"
                                                priority
                                            />
                                        )}
                                    </div>
                                    <span className=''>
                                        {userAddress ? (
                                            staking.stakedBalance !== undefined ? (
                                                <div className='flex justify-end items-center space-x-1'>
                                                    <span className={`${formatRegular(staking.stakedBalance)} whitespace-nowrap`}>
                                                        {formatRegular(staking.stakedBalance).formatted}
                                                    </span>
                                                </div>
                                            ) : (
                                                <BlackSpinner />
                                            )
                                        ) : (
                                            <BlackSpinner />
                                        )}
                                    </span>
                                    <input
                                        type="number"
                                        placeholder="Enter Amount"
                                        value={staking.unstakeAmount}
                                        onChange={(e) => handleUnstakeAmountChange(e.target.value)}
                                        className={`no-scrollbar flex  gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full placeholder:text-3xl text-4xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-12 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}>
                                    </input>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 items-center justify-between">
                        {!userAddress && parseFloat(staking.unstakeAmount) ? (
                            <Button
                                disabled={true}
                                theme="dandelion"
                                className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                            >
                                Insufficient Funds
                            </Button>
                        ) : !userAddress ? (
                            <Button
                                onClick={handleConnectWallet}
                                theme="dandelion"
                                className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                            >
                                Connect Wallet
                            </Button>
                        ) : parseFloat(staking.remainingTime) > 0 ? (
                            <Button
                                disabled={true}
                                theme="dandelion"
                                className="cursor-not-allowed button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                            >
                                <span className="text-black">Funds Locked</span>
                            </Button>
                        ) : (
                            <Button
                                onClick={handleUnstake}
                                disabled={transaction.status === 'unstaking'}
                                theme="dandelion"
                                className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                            >
                                {transaction.status === 'unstaking' ? (
                                    <span className="flex justify-center items-center gap-2">
                                        <BlackSpinner />
                                        Processing
                                    </span>
                                ) : transaction.status === 'success' ? (
                                    <span className="flex justify-center items-center gap-2 text-black">
                                        <CheckCircleIcon className="w-6 h-6 text-[#000000]" /> Success
                                    </span>
                                ) : transaction.status === 'error' ? (
                                    <span className="flex justify-center items-center gap-2 text-black">
                                        <XCircleIcon className="w-6 h-6 text-[#ff0000]" />Failed
                                    </span>
                                ) : (
                                    <span className="flex justify-center items-center space-x-2">
                                        <span className="flex justify-center items-center gap-2 text-black">
                                            Unstake
                                        </span>
                                    </span>
                                )}
                            </Button>
                        )}
                        
                    </div>
                </div>
            </div>
        </>
    )
}


export default UnstakePageUI
