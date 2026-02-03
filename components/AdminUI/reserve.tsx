'use client'

import Button from '@/components/ButtonsUI/button'
import Image from 'next/image'

// Import admin context
import { useAdmin } from "@/context/adminContext"
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useAppKit } from "@reown/appkit/react";
import BlackSpinner from '../Old/Spinners/BlackSpin';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

const TokenPool = ({ className = 'w-full', unique = 'footer' }) => {
    const { open } = useAppKit();
    const { address: userAddress } = useAccount()
    const [selectedPool, setSelectedPool] = useState<'reserve' | 'burn'>('reserve')

    // Use admin context
    const {
        state,
        isWithdrawValid,
        handleWithdrawAddressChange,
        handleWithdrawReservePool,
        handleWithdrawBurnPool,
        refetchData,
        clearTransaction,
    } = useAdmin()

    const { transaction } = state

    const handleConnectWallet = () => {
        open();
    };

    useEffect(() => {
        if (transaction.status === 'success' || transaction.status === 'error') {
            const timer = setTimeout(() => {
                clearTransaction();
                // Force UI refresh after success message
                setTimeout(() => refetchData(), 1000);
                refetchData();
            }, 3000); // Show success state for 3 seconds
            return () => clearTimeout(timer);
        }
    }, [transaction.status, clearTransaction, refetchData]);

    // hybrid format
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


    const handleWithdraw = () => {
        if (selectedPool === 'reserve') {
            handleWithdrawReservePool();
        } else {
            handleWithdrawBurnPool();
        }
    };

    const getTransactionStatus = () => {
        if (selectedPool === 'reserve') {
            return transaction.status === 'withdrawingReserve' ? 'withdrawing' : transaction.status;
        } else {
            return transaction.status === 'withdrawingBurn' ? 'withdrawing' : transaction.status;
        }
    };

    const poolBalance = selectedPool === 'reserve' ? state.reservePool : state.burnPool;
    const poolName = selectedPool === 'reserve' ? 'Reserve Pool' : 'Burn Pool';
    const poolIcon = selectedPool === 'reserve' ? "/rami/blogo/busdt.svg" : "/rami/blogo/brami-50.svg";

    return (
        <>
            <div className={`${className}`}>
                <div className="@container flex flex-col gap-10">
                    <div className="@container flex flex-col gap-6">
                        <div className="flex flex-col mt-2">
                            {/* Pool Selection Tabs */}
                            <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setSelectedPool('reserve')}
                                    className={`flex-1 py-2 px-4 rounded-md text-center font-medium ${selectedPool === 'reserve'
                                        ? 'bg-white text-black shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Reserve Pool
                                </button>
                                <button
                                    onClick={() => setSelectedPool('burn')}
                                    className={`flex-1 py-2 px-4 rounded-md text-center font-medium ${selectedPool === 'burn'
                                        ? 'bg-white text-black shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Burn Pool
                                </button>
                            </div>

                            {/* Withdraw Address Input */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Withdraw To Address
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter recipient address (0x...)"
                                    value={state.withdrawAddress}
                                    onChange={(e) => handleWithdrawAddressChange(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="relative">
                                <div className="flex gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-8 rounded-sm">
                                    <div className="">
                                        <Image
                                            src={poolIcon}
                                            alt={poolName}
                                            width={100}
                                            height={100}
                                            className="w-10 h-10"
                                            priority
                                        />
                                    </div>
                                    <span className=''>
                                        {userAddress ? (
                                            <div className='flex justify-end items-center space-x-1'>
                                                <span className={`${formatRegular(poolBalance)} whitespace-nowrap`}>
                                                    {formatRegular(poolBalance).formatted}
                                                </span>
                                            </div>
                                        ) : <BlackSpinner />
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 items-center justify-between">
                        {!userAddress ? (
                            <Button
                                onClick={handleConnectWallet}
                                theme="dandelion"
                                className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                            >
                                Connect Wallet
                            </Button>
                        ) : (
                            <Button
                                onClick={handleWithdraw}
                                disabled={!isWithdrawValid || getTransactionStatus() === 'withdrawing'}
                                theme="dandelion"
                                className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                            >
                                {getTransactionStatus() === 'withdrawing' ? (
                                    <span className="flex justify-center items-center gap-2">
                                        <BlackSpinner />
                                        Processing
                                    </span>
                                ) : getTransactionStatus() === 'success' ? (
                                    <span className="flex justify-center items-center gap-2 text-black">
                                        <CheckCircleIcon className="w-6 h-6 text-[#000000]" /> Success
                                    </span>
                                ) : getTransactionStatus() === 'error' ? (
                                    <span className="flex justify-center items-center gap-2 text-black">
                                        <XCircleIcon className="w-6 h-6 text-[#ff0000]" />Failed
                                    </span>
                                ) : (
                                    <span className="flex justify-center items-center space-x-2">
                                        <span className="flex justify-center items-center gap-2 text-black">
                                            Withdraw {poolName}
                                        </span>
                                    </span>
                                )}
                            </Button>
                        )}
                        <p className="m-0 p-0 text-fern-600 flex-1 text-center @sm:text-left">
                            Withdraw from {poolName.toLowerCase()} to specified address
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TokenPool