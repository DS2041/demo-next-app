"use client";

import { useAccount } from 'wagmi';
import { useAppKit } from "@reown/appkit/react";
import { useGlobal } from '@/context/global'
import Image from 'next/image';

export default function ConnectWalletButton() {
    const { isConnected, address } = useAccount();
    const { open } = useAppKit();

    const {
    } = useGlobal()

    const formattedAddress = (address: string | undefined) => {
        return address ? `${address.slice(0, 4)}...${address.slice(-4)}` : null;
    };

    const handleConnectWallet = () => {
        open();
    };

    return (
        <button onClick={handleConnectWallet} className='gap-1 bg-black text-white rounded-sm px-3 py-2 flex justify-center items-center tracking-tight'>
            <Image className="relative -top-[0.5px]" src="/old/whiteWallet.svg" alt='wallet' width={20} height={20} priority/>
            <span className="relative top-[1.5px]">
                {isConnected ? formattedAddress(address) : "Connect Wallet"}
            </span>
        </button>
    );
}


