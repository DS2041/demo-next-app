'use client'

import Button from '@/components/ButtonsUI/button'
import Image from 'next/image'

// Import admin context
import { useAdmin } from "@/context/adminContext"
import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useAppKit } from "@reown/appkit/react";
import BlackSpinner from '../Old/Spinners/BlackSpin';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

const DepositUsdt = ({ className = 'w-full', unique = 'footer' }) => {
    const { open } = useAppKit();
    const { address: userAddress } = useAccount()

    // Use admin context
    const {
        state,
        isDepositValid,
        handleDepositAmountChange,
        handleDepositUSDT,
        refetchData,
        clearTransaction,
    } = useAdmin()

    const { transaction, usdtAllowance } = state

    const handleConnectWallet = () => {
        open();
    };

    useEffect(() => {
        if (transaction.status === 'success' || transaction.status === 'error') {
            const timer = setTimeout(() => {
                clearTransaction();
                // Force additional refetch after success message disappears
                setTimeout(() => refetchData(), 1000);
                refetchData();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [transaction.status, clearTransaction, refetchData]);

    // hybrid format function
    const hybridFormat = (value: number | string) => {
        const num = typeof value === 'number' ? value : parseFloat(value);

        const formatted = num.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });

        let fontSize = 'text-base';

        if (num >= 1e9) {
            fontSize = 'text-xs';
        } else if (num >= 1e8) {
            fontSize = 'text-sm';
        } else if (num >= 1e7) {
            fontSize = 'text-base';
        } else if (num >= 1e6) {
            fontSize = 'text-base';
        } else if (num >= 1e5) {
            fontSize = 'text-base';
        } else {
            fontSize = 'text-base';
        }

        return {
            formatted,
            fontSize,
        };
    };

    // Check if approval is needed
    const needsApproval = usdtAllowance < parseFloat(state.depositAmount || '0');

    return (
        <>
            <div className={`${className}`}>
                <div className="@container flex flex-col gap-10">
                    <div className="@container flex flex-col gap-6">
                        <div className="flex flex-col mt-2">
                            <div className='flex justify-between items-center'>
                                <span className="font-sans text-xl font-medium text-fern-1100 leading-none mb-1">
                                    Deposit Profits
                                </span>
                                {/* USDT Balance */}
                                {userAddress ? (
                                    state.usdtBalance !== undefined ? (
                                        <p className='flex justify-start items-center space-x-1'>
                                            <span className={`${hybridFormat(state.usdtBalance).fontSize} text-md opacity-80 leading-none flex items-center font-ui text-[#000000]`}>
                                                {hybridFormat(state.usdtBalance).formatted}
                                                <span className="text-sm flex items-center text-ui-body ml-1">USDT</span>
                                            </span>
                                        </p>
                                    ) : (
                                        <p className='flex justify-start items-center space-x-1'>
                                            <span className={`text-md opacity-80 leading-none flex items-center font-ui text-[#000000]`}>
                                                <BlackSpinner />
                                                <span className="text-sm flex items-center text-ui-body ml-1">USDT</span>
                                            </span>
                                        </p>
                                    )
                                ) : (
                                    <p className='flex justify-start items-center space-x-1'>
                                        <span className={`text-md opacity-80 leading-none flex items-center font-ui text-[#000000]`}>
                                            0.00
                                            <span className="text-sm flex items-center text-ui-body ml-1">USDT</span>
                                        </span>
                                    </p>
                                )}
                            </div>
                            <div className="relative">
                                <div className="flex gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-8 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]">
                                    <div className="">
                                        <Image
                                            src="/rami/blogo/busdt.svg"
                                            alt="USDT"
                                            width={100}
                                            height={100}
                                            className="w-10 h-10"
                                            priority
                                        />
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="Enter Amount"
                                        value={state.depositAmount}
                                        onChange={(e) => handleDepositAmountChange(e.target.value)}
                                        className="no-scrollbar flex gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full placeholder:text-3xl text-4xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-12 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 items-center justify-between">
                        {!userAddress && parseFloat(state.depositAmount) ? (
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
                        ) : (
                            <Button
                                onClick={handleDepositUSDT}
                                disabled={!isDepositValid ||
                                    transaction.status === 'approving' ||
                                    transaction.status === 'depositing'}
                                theme="dandelion"
                                className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                            >
                                {transaction.status === 'approving' ? (
                                    <span className="flex justify-center items-center gap-2">
                                        <BlackSpinner />
                                        Approving...
                                    </span>
                                ) : transaction.status === 'depositing' ? (
                                    <span className="flex justify-center items-center gap-2">
                                        <BlackSpinner />
                                        Depositing...
                                    </span>
                                ) : transaction.status === 'success' ? (
                                    <span className="flex justify-center items-center gap-2 text-black">
                                        <CheckCircleIcon className="w-6 h-6 text-[#000000]" /> Success
                                    </span>
                                ) : transaction.status === 'error' ? (
                                    <span className="flex justify-center items-center gap-2 text-black">
                                        <XCircleIcon className="w-6 h-6 text-[#ff0000]" /> Failed
                                    </span>
                                ) : (
                                    <span className="flex justify-center items-center space-x-2">
                                        <span className="flex justify-center items-center gap-2 text-black">
                                            {needsApproval ? 'Approve & Deposit' : 'Transfer Profits'}
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

export default DepositUsdt