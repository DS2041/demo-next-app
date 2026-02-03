'use client'

import Button from '@/components/ButtonsUI/button'
import Image from 'next/image'


import { useState, useEffect } from 'react'

import { useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useAffiliate } from '@/context/affiliate'
import { useAppKit } from "@reown/appkit/react";
import BlackSpinner from '@/components/Old/Spinners/BlackSpin';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import ShareModal from '@/components/Old/Modal/ShareModal';

const ReferCodeUI = ({ className = 'w-full', unique = 'footer' }) => {


    const { address: userAddress } = useAccount()
    const {
        state: affiliate,
        handleReferralCodeChange,
        handleGenerateCode,
        clearTransaction,
    } = useAffiliate()

    const searchParams = useSearchParams()
    const { transaction } = affiliate
    const { open } = useAppKit();

    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

    const toggleShareMenu = () => setIsShareMenuOpen(!isShareMenuOpen);

    const handleConnectWallet = () => {
        open();
    };

    useEffect(() => {
        const referralCode = searchParams.get('referral')
        if (referralCode) {
            handleReferralCodeChange(referralCode)
        }
    }, [searchParams, handleReferralCodeChange])

    useEffect(() => {
        if (transaction.status === 'success') {

            const timer = setTimeout(clearTransaction, 5000);
            affiliate.usdtBalance;
            affiliate.ramiBalance;
            return () => clearTimeout(timer);

        }
    }, [transaction.status, clearTransaction, affiliate.usdtBalance, affiliate.ramiBalance]);

    useEffect(() => {
        if (transaction.status === 'success' || transaction.status === 'error') {
            const timer = setTimeout(() => {
                clearTransaction();
            }, 3000); // Show success state for 3 seconds
            return () => clearTimeout(timer);
        }
    }, [transaction.status, clearTransaction]);

    const renderReferralCode = () => {
        if (affiliate.generatedCode) {
            return affiliate.generatedCode;
        }
        return "Generate Code"; // Show placeholder when no code exists
    };


    return (
        <>
            <div className={`${className}`}>
                <div className="@container flex flex-col gap-10">
                    <div className="@container flex flex-col gap-6">
                        <div className="flex flex-col">
                            <div className='flex justify-between items-center'>
                                <label
                                    className="font-sans text-xl font-medium text-fern-1100 leading-none mb-1"
                                >
                                    My Referral Code
                                </label>

                                {/* Modal here */}
                                {isShareMenuOpen && (
                                    <ShareModal
                                        isOpen={isShareMenuOpen}
                                        onClose={toggleShareMenu}
                                        referralLink={affiliate.referralLink}
                                    />
                                )}

                                <p className="text-sm text-ui-body opacity-80 leading-none mb-3">
                                    <Image
                                        src="/rami/barcode.svg"
                                        alt="-"
                                        width={25}
                                        height={25}
                                        className="w-6"
                                        priority
                                    />
                                </p>
                            </div>
                            <div className="relative">
                                <div
                                    className={`flex gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-16 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}>
                                    <label
                                        className="font-sans text-xl font-medium text-fern-1100 leading-none mb-1 tracking-tight text-[1.3rem] opacity-80"
                                    >
                                        {userAddress && affiliate.exists ? "My referral code." : "This is the default referral code."}
                                    </label>
                                    <span className='text-[#d53c3c] font-bold tracking-wide'>
                                        {userAddress && affiliate.exists ? renderReferralCode() : "7TXH5B"}
                                    </span>
                                    <label
                                        className="font-sans text-xl font-normal text-fern-1100 leading-none tracking-tight text-[1rem] opacity-80"
                                    >
                                        {userAddress && affiliate.exists ? "Share and earn 10% commission." : "Use this code if you do not have any referral code."}
                                    </label>
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
                        ) : userAddress && affiliate.exists ? (
                            <Button
                                onClick={toggleShareMenu}
                                theme="dandelion"
                                className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                            >
                                Share Code
                            </Button>
                        ) : (
                            <Button
                                onClick={handleGenerateCode}
                                disabled={transaction.status === 'generating'}
                                theme="dandelion"
                                className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                            >
                                {transaction.status === 'generating' ? (
                                    <span className="flex justify-center items-center gap-2">
                                        <BlackSpinner />
                                        Generating
                                    </span>
                                ) : transaction.status === 'success' ? (
                                    <span className="flex justify-center items-center gap-2 text-black">
                                        <CheckCircleIcon className="w-6 h-6 text-[#28b97d]" /> Success
                                    </span>
                                ) : transaction.status === 'error' ? (
                                    <span className="flex justify-center items-center gap-2 text-black">
                                        <XCircleIcon className="w-5 h-5 text-[#ff0000]" />Failed
                                    </span>
                                ) : (
                                    <span className="flex justify-center items-center gap-2">
                                        Generate Code
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

export default ReferCodeUI