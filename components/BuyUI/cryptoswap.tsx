'use client'

import { useRef, useState, useEffect } from 'react'
import Button from '@/components/ButtonsUI/button'
import Image from 'next/image'

import { useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useAffiliate } from '@/context/affiliate'
import { useAppKit } from "@reown/appkit/react";
import BlackSpinner from '@/components/Old/Spinners/BlackSpin';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const CryptoSwapPage = ({ className = 'w-full', unique = 'footer' }) => {

  const { address: userAddress } = useAccount()
  const {
    state: affiliate,
    isAmountValid,
    isLoading,
    handlePurchase,
    handleUSDTChange,
    handleRAMIChange,
    handleReferralCodeChange,
    handleApproveUSDT,
    clearTransaction,
  } = useAffiliate()

  const needsApproval = parseFloat(affiliate.usdtAmount) > affiliate.allowance
  const referralContainerRef = useRef<HTMLDivElement>(null)
  const usdtContainerRef = useRef<HTMLDivElement>(null)
  const ramiContainerRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const { transaction } = affiliate
  const { open } = useAppKit();

  const handleConnectWallet = () => {
    open();
  };

  useEffect(() => {
    const referralCode = searchParams.get('referral')
    if (referralCode) {
      handleReferralCodeChange(referralCode)
    }
  }, [searchParams, handleReferralCodeChange])

  const handleInputFocus = (ref: React.RefObject<HTMLDivElement>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }, 300)
  }

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

  const isReferralValid = affiliate.referralCode !== "" &&
    affiliate.isValidReferralCode &&
    affiliate.referralCodeExists &&
    affiliate.referralCode !== affiliate.generatedCode;

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

            {/* Refer code section */}
            <div ref={referralContainerRef} className="flex flex-col">
              <div className='flex justify-between items-center'>
                <div
                  className="font-sans text-lg font-medium text-fern-1100 leading-none mb-1"
                >
                  Referral Code
                </div>
              </div>

              {affiliate.referralCode && !affiliate.isValidReferralCode && (
                <p className="text-red-500 text-sm mt-1 mb-2">Referral code must be 6 characters</p>
              )}

              <div className="relative">
                <input
                  className={`no-scrollbar focus:outline-none font-ui form-input w-full text-3xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-4 rounded-sm font-bold placeholder:font-normal placeholder:text-lg placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)] ${affiliate.referralCode && !affiliate.isValidReferralCode ? 'text-[#6f6d6d]' : 'text-[#26a17b]'}`}
                  type="text"
                  placeholder="enter referral code"
                  value={affiliate.referralCode}
                  onChange={(e) => handleReferralCodeChange(e.target.value)}
                  onFocus={() => handleInputFocus(referralContainerRef)}
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="characters"
                  maxLength={6}
                />

                <div className="px-3 py-1 rounded-sm absolute right-2 top-1/2 -translate-y-1/2 flex justify-center items-center gap-1 ">
                  <div className='flex justify-center items-center'>
                    <Image
                      src="/rami/barcode.svg"
                      alt="RAMI Logo"
                      width={30}
                      height={30}
                      className="w-7 h-7"
                      priority
                    />
                  </div>
                </div>
              </div>

              {(userAddress && (affiliate.referralCode === "" || !affiliate.isValidReferralCode || !affiliate.referralCodeExists || affiliate.referralCode === affiliate.generatedCode)) && (
                <p className="text-red-500 text-sm mt-1">
                  {affiliate.referralCode === ""
                    ? "Referral Code Is Required"
                    : !affiliate.isValidReferralCode
                      ? "Invalid Code Format"
                      : !affiliate.referralCodeExists
                        ? "Referral Code Does Not Exist"
                        : "You cannot use your own referral code"}
                </p>
              )}
            </div>

            {/* Sell Section */}
            <div className="flex flex-col">
              <div className='flex justify-between items-center'>
                <div
                  className="font-ui text-lg font-medium text-fern-1100 leading-none mb-1"
                >
                  Sell
                </div>

                {/* Usdt Balance */}
                {userAddress ? (
                  affiliate.usdtBalance !== undefined ? (
                    <p className='flex justify-start items-center space-x-1'>
                      <span className={`${hybridFormat(affiliate.usdtBalance).fontSize} text-md opacity-80 leading-none flex items-center font-ui text-[#000000]`}>
                        {hybridFormat(affiliate.usdtBalance.toFixed(2)).formatted}
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
                <input
                  className={`no-scrollbar focus:outline-none form-input font-ui w-full text-3xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-4 rounded-sm text-[#000000] font-medium placeholder:text-lg placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}

                  type="number"
                  placeholder="enter amount to sell"
                  onFocus={() => handleInputFocus(usdtContainerRef)}
                  value={affiliate.usdtAmount}
                  onChange={(e) => handleUSDTChange(e.target.value)}
                  min={affiliate.minPurchase}
                />

                <div className="bg-[#000000]/10 px-3 py-1 rounded-sm absolute right-2 top-1/2 -translate-y-1/2 flex justify-center items-center gap-1 ">
                  <div className='flex justify-center items-center'>
                    <Image
                      src="/rami/blogo/busdt.svg"
                      alt="RAMI Logo"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                      priority
                    />
                  </div>
                  <span className='flex justify-center items-center font-ui'>USDT</span>
                </div>
              </div>
            </div>

            {/* middle swap icon */}
            <div className="flex justify-center py-1 relative">
              <div className="absolute inset-x-0 top-1/2 h-[2px] bg-gradient-to-r from-transparent via-gray-300/50 to-transparent"></div>
              <button className="bg-white rounded-full shadow-lg hover:shadow-xl transition-all 
                    hover:-translate-y-0.5 active:translate-y-0 border-2 border-[#26A17B]/50
                    transform-gpu duration-200 ease-out z-2
                    flex items-center justify-center w-6 h-6 p-1
                    group">
                <svg xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7 text-[#26A17B] group-hover:text-[#1e8c6d] transition-colors rotate-90"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path d="M16 4L20 8L16 12" />
                  <path d="M8 20L4 16L8 12" />
                  <path d="M20 8H10" />
                  <path d="M4 16H14" />
                </svg>
              </button>
            </div>

            {/* Buy section */}
            <div className="flex flex-col">
              <div className='flex justify-between items-center'>
                <div
                  className="font-ui text-xl font-medium text-fern-1100 leading-none mb-1"
                >
                  Buy
                </div>
                {/* rami balance */}
                {userAddress ? (
                  affiliate.ramiBalance !== undefined ? (
                    <p className='flex justify-start items-center space-x-1'>
                      <span className={`${hybridFormat(affiliate.ramiBalance).fontSize} text-md opacity-80 leading-none flex items-center font-ui text-[#000000]`}>
                        {hybridFormat(affiliate.ramiBalance.toFixed(2)).formatted}
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
                <input
                  className={`no-scrollbar focus:outline-none form-input font-ui w-full text-3xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-4 rounded-sm text-[#000000] font-medium placeholder:text-lg placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}

                  type="number"
                  placeholder="Enter amount to buy"
                  value={affiliate.ramiAmount}
                  onChange={(e) => handleRAMIChange(e.target.value)}
                  onFocus={() => handleInputFocus(ramiContainerRef)}
                  min={affiliate.minRamiPurchase}
                />
                <div className="bg-[#000000]/10 px-3 py-1 rounded-sm absolute right-2 top-1/2 -translate-y-1/2 flex justify-center items-center gap-1 ">
                  <div className='flex justify-center items-center'>
                    <Image
                      src="/rami/blogo/brami.svg"
                      alt="RAMI Logo"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                      priority
                    />
                  </div>
                  <span className='flex justify-center items-center font-ui'>RAMI</span>
                </div>
              </div>
            </div>
          </div>

          {/* updated swap btn */}
          {!userAddress && parseFloat(affiliate.usdtAmount) > 0 ? (
            <Button
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
          ) : parseFloat(affiliate.usdtAmount) < 1 ? (
            <Button
              onClick={handleConnectWallet}
              theme="dandelion"
              className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
            >
              $1 : Minimum Investment
            </Button>
          ) : userAddress && ((parseFloat(affiliate.usdtAmount)) > (affiliate.usdtBalance || 0)) ? (
            <Button
              theme="dandelion"
              className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
            >
              Insufficient Funds
            </Button>
          ) : needsApproval && isAmountValid && !isLoading ? (
            <Button
              onClick={handleApproveUSDT}
              disabled={
                !needsApproval ||
                !isAmountValid ||
                !isReferralValid ||
                isLoading}
              theme="dandelion"
              className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
            >
              {transaction.status === 'approving' ? (
                <span className="flex justify-center items-center gap-2">
                  <BlackSpinner />
                  Approving
                </span>
              ) : transaction.status === 'success' ? (
                <span className="flex justify-center items-center gap-2 text-black">
                  <CheckCircleIcon className="w-6 h-6 text-[#000000]" /> Success
                </span>
              ) : transaction.status === 'error' ? (
                <span className="flex justify-center items-center gap-2 text-black">
                  <XCircleIcon className="w-5 h-5 text-[#ff0000]" />Failed
                </span>
              ) : (
                <span className="flex justify-center items-center gap-2">
                  Approve
                </span>
              )}
            </Button>
          ) : <Button
            onClick={handlePurchase}
            disabled={
              needsApproval ||
              !isAmountValid ||
              !isReferralValid ||
              isLoading}
            theme="dandelion"
            className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
          >
            {transaction.status === 'purchasing' ? (
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
                <XCircleIcon className="w-5 h-5 text-[#ff0000]" />Failed
              </span>
            ) : (
              <span className="flex justify-center items-center gap-2">
                Swap
              </span>
            )}
          </Button>
          }
        </div>
      </div>
    </>
  )
}

export default CryptoSwapPage
