'use client'

import Image from 'next/image'
import { FC, useEffect, useState } from "react";
import { useAffiliate } from '@/context/affiliate'
import { useAccount } from 'wagmi'

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    referralLink: string;  // Add this line
}


const ShareModal: FC<ModalProps> = ({ isOpen, onClose, referralLink }) => {

    const { address: userAddress } = useAccount()

    const {
        state: affiliate,
        isLoading,
    } = useAffiliate()

    const [isCopied, setIsCopied] = useState(false)

    if (!isOpen) return null;

    useEffect(() => {
        setIsCopied(false);
    }, [affiliate.referralLink]);

    // Add copy handler
    const copyReferralLink = async () => {
        try {
            await navigator.clipboard.writeText(affiliate.referralLink)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch (error) {
            ('Failed to copy link')
        }
    }

    const toggleCross = () => {
        onClose()
    }

    const handleTwitterShare = () => {
        const shareText = encodeURIComponent("Join me on Rami using my referral link! 🚀");
        const shareUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(referralLink)}`;
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    };

    const handleWhatsappShare = () => {
        try {
            const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
                `Your referral message - ${referralLink}`
            )}`;

            const windowRef = window.open(
                shareUrl,
                'WhatsAppShare',
                'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes'
            );

            if (!windowRef || windowRef.closed) {
                throw new Error('Popup blocked - please allow popups');
            }
        } catch (error) {
            console.error('WhatsApp share failed:', error);
            // Fallback to clipboard copy
            navigator.clipboard.writeText(referralLink);
        }
    };

    const handleTelegramShare = () => {
        const shareText = encodeURIComponent("Join me on Rami using my referral link! 🚀");
        const shareUrl = `https://telegram.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`;
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    };


    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
            {/* Modal Header - acts as navbar */}
            <div className="w-full border-b border-gray-200 px-4 py-3">
                <div className="relative flex items-center justify-center">
                    <h2 className="w-full text-xl font-medium text-left">Share with friends</h2>
                    <button
                        className="absolute right-0 p-2"
                        onClick={toggleCross}
                    >
                        <Image
                            src="/old/cross.svg"
                            width={20}
                            height={20}
                            alt="Close modal"
                            priority
                        />
                    </button>
                </div>
            </div>

            {/* Modal Content - centered */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
                {/* Friend image */}
                <div className="mb-8">
                    <Image
                        src="/old/friend.svg"
                        width={600}
                        height={200}
                        alt="Share with friends"
                        priority
                    />
                </div>

                {/* Referral link section */}
                <div className="w-full max-w-md">
                    <button
                        onClick={copyReferralLink}
                        disabled={!userAddress || !affiliate.exists || isLoading}
                        className="w-full relative flex items-center justify-between bg-gray-100 rounded-full px-4 py-3 mb-6">
                        {isCopied ? (
                            <span className="w-full flex justify-between items-center space-x-1">
                                <span className="text-md font-medium text-[#26a17b] truncate">referral link successfully copied</span>
                                <Image
                                    src="/old/tick.svg"
                                    width={16}
                                    height={16}
                                    alt="Copy"
                                    priority
                                />
                            </span>
                        ) : (
                            <span className="w-full flex justify-between items-center space-x-2">
                                <span className="text-md font-medium truncate">Share link & earn 10% commission</span>
                                <Image
                                    src="/old/copy.svg"
                                    width={16}
                                    height={16}
                                    alt="Copy"
                                    priority
                                />
                            </span>
                        )}


                    </button>

                    {/* Social share icons */}
                    <div className="flex justify-center space-x-6">
                        <button
                            onClick={handleTwitterShare}
                            className="p-2">
                            <Image
                                src="/old/share/twitter.svg"
                                width={32}
                                height={32}
                                alt="Share on Twitter"
                                priority
                            />
                        </button>
                        <button
                            onClick={handleTelegramShare}
                            className="p-2">
                            <Image
                                src="/old/share/telegram.svg"
                                width={32}
                                height={32}
                                alt="Share on Telegram"
                                priority
                            />
                        </button>
                        <button
                            onClick={handleWhatsappShare}
                            className="p-2">
                            <Image
                                src="/old/share/whatsapp.svg"
                                width={32}
                                height={32}
                                alt="Share on WhatsApp"
                                priority
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ShareModal;