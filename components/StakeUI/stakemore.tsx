'use client'

import Button from '@/components/ButtonsUI/button'
import Image from 'next/image'


// staking code imports from old
import { useGlobal } from '@/context/global'
import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useAppKit } from "@reown/appkit/react";
import BlackSpinner from '../Old/Spinners/BlackSpin';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'


const StakeMoreSection = ({ className = 'w-full', unique = 'footer' }) => {

    const { open } = useAppKit();

    const { address: userAddress } = useAccount()

    const {
        state: staking,
        handleStake,
        handleStakeAmountChange,
        handleApproveStake,
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

                // Force additional refetch after success message disappears
                setTimeout(() => refetchData(), 1000);
                
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

    // hybrid
    const hybridFormat = (value: number | string) => {
        const num = typeof value === 'number' ? value : parseFloat(value);

        const formatted = num.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });

        let fontSize = 'text-base';

        if (num >= 1e9) {
            fontSize = 'text-xs'; // billions+
        } else if (num >= 1e8) {
            fontSize = 'text-sm'; // hundreds of millions
        } else if (num >= 1e7) {
            fontSize = 'text-base'; // tens of millions
        } else if (num >= 1e6) {
            fontSize = 'text-base'; // low millions
        } else if (num >= 1e5) {
            fontSize = 'text-base'; // 100k+
        } else {
            fontSize = 'text-base'; // < 100k
        }

        return {
            formatted,
            fontSize,
        };
    };

    return (
        <>
            <div className={`${className}`}>
                <div className="@container flex flex-col gap-10">
                    <div className="@container flex flex-col gap-6">
                        <div className="flex flex-col mt-2">
                            <div className='flex justify-between items-center'>
                                <span
                                    className="font-sans text-xl font-medium text-fern-1100 leading-none mb-1"
                                >
                                    Staked
                                </span>
                                {/* Ramicoin Balance */}
                                {userAddress ? (
                                    staking.ramiBalance !== undefined ? (
                                        <p className='flex justify-start items-center space-x-1'>
                                            <span className={`${hybridFormat(staking.ramiBalance).fontSize} text-md opacity-80 leading-none flex items-center font-ui text-[#000000]`}>
                                                {hybridFormat(staking.ramiBalance).formatted}
                                                <span className="text-sm flex items-center text-ui-body ml-1">RAMI</span>
                                            </span>
                                        </p>
                                    ) : (
                                        <p className='flex justify-start items-center space-x-1'>
                                            <span className={`text-md opacity-80 leading-none flex items-center font-ui text-[#000000]`}>
                                                <BlackSpinner />
                                                <span className="text-sm flex items-center text-ui-body ml-1">RAMI</span>
                                            </span>
                                        </p>
                                    )
                                ) : (
                                    <p className='flex justify-start items-center space-x-1'>
                                        <span className={`text-md opacity-80 leading-none flex items-center font-ui text-[#000000]`}>
                                            0.00
                                            <span className="text-sm flex items-center text-ui-body ml-1">RAMI</span>
                                        </span>
                                    </p>
                                )}
                            </div>
                            <div className="relative">
                                <div
                                    className={`flex  gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-8 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}>
                                    <div className="">
                                        <Image
                                            src="/rami/blogo/brami-50.svg"
                                            alt="-"
                                            width={100}
                                            height={100}
                                            className="w-10 h-10"
                                            priority
                                        />
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
                                        value={staking.stakeAmount}
                                        onChange={(e) => handleStakeAmountChange(e.target.value)}
                                        className={`no-scrollbar flex  gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full placeholder:text-3xl text-4xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-12 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}>
                                    </input>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 items-center justify-between">
                        {!userAddress && parseFloat(staking.stakeAmount) ? (
                            <Button
                                theme="dandelion"
                                disabled={true}
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
                        ) : userAddress && parseFloat(staking.stakeAmount) < 100 ? (
                            <Button
                                disabled={true}
                                theme="dandelion"
                                className="cursor-not-allowed button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                            >
                                min. stake 100 RAMI
                            </Button>
                        ): staking.allowance <= parseFloat(staking.stakeAmount) ? (
                            <Button
                                onClick={handleApproveStake}
                                theme="dandelion"
                                disabled={transaction.status === 'approving'}
                                className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                            >
                                {transaction.status === 'approving' ? (
                                    <span className="flex justify-center items-center gap-2 text-black">
                                        <BlackSpinner />
                                        Approving
                                    </span>
                                ) : transaction.status === 'success' ? (
                                    <span className="flex justify-center items-center gap-2 text-black">
                                        <CheckCircleIcon className="w-6 h-6 text-[#000000]" /> Approved
                                    </span>
                                ) : transaction.status === 'error' ? (
                                    <span className="flex justify-center items-center gap-2 text-black">
                                        <XCircleIcon className="w-6 h-6 text-[#ff0000]" />Failed
                                    </span>
                                ) : (
                                    <span className="flex justify-center items-center gap-2 text-black">
                                        Approve
                                    </span>
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleStake}
                                disabled={transaction.status === 'staking'}
                                theme="dandelion"
                                className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                            >
                                {transaction.status === 'staking' ? (
                                    <span className="flex justify-center items-center gap-2 text-[#000000]">
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
                                            Stake
                                        </span>
                                    </span>
                                )}
                            </Button>
                        )}
                        <p className="lg:hidden m-0 p-0 text-fern-600 flex-1 text-center @sm:text-left">
                            1 RAMICOIN <span className='mx-2'>=</span> 0.005 USDT
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}


export default StakeMoreSection



