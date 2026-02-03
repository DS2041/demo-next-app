"use client";

import Link from "next/link";
import Image from "next/image";
import { useRamicoin } from "@/context/trackrecord";
import BlackSpinner from "../Old/Spinners/BlackSpin";
// import ApyChart from "@/components/MonthlyChartData/ApyChart";

const AllTimeData = ({ className = "w-full" }) => {
  const { currentData, isLoading, getPurchaseHashDisplay } = useRamicoin();

  // Get purchase hash display info
  const purchaseHashInfo = currentData
    ? getPurchaseHashDisplay(currentData.purchase_hash)
    : { text: "-", isLink: false, href: null };

  return (
    <>
      <div className={`${className}`}>
        <div className="@container flex flex-col gap-10">
          <div className="@container flex flex-col gap-6">
            {/* btc purchase daily */}
            <div className="flex flex-col">
              <div className="relative">
                <div
                  className={`tracking-normal flex  gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 pb-2 pt-8 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}
                >
                  <Image
                    src="/btcdaily.svg"
                    alt="-"
                    width={80}
                    height={80}
                    priority
                  />
                  <span className="text-[#000000]/50 text-lg tracking-normal">
                    BITCOIN
                  </span>
                  <span className="tracking-tight">
                    {isLoading ? (
                      <BlackSpinner />
                    ) : (
                      `${currentData ? (currentData.btc_purchase === 0 || currentData.purchase_hash === "-" ? "0" : `${currentData.btc_purchase.toFixed(8)}`) : "--"}`
                    )}
                  </span>
                  <span className="text-[20px] opacity-70">
                    bitcoin purchased today
                  </span>
                  {/* <button className="text-black button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center">
                    <span className="opacity-70">Bitcoin Purchased Today</span>
                    <br />
                    <span className="opacity-35 text-sm">ramicoin.com</span>
                  </button> */}

                  {purchaseHashInfo.isLink ? (
                    <Link
                      href={purchaseHashInfo.href || "#"}
                      target="_blank"
                      className="text-black button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center hover:opacity-80 transition-opacity"
                    >
                      <span className="opacity-70 text-sm">
                        {purchaseHashInfo.text}
                      </span>
                      <br />
                      <span className="opacity-35 text-sm">
                        transaction hash
                      </span>
                    </Link>
                  ) : (
                    <Link
                      href="#"
                      className="cursor-not-allowed text-black button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center hover:opacity-80 transition-opacity"
                    >
                      <span className="opacity-70 text-sm">
                        {purchaseHashInfo.text}
                      </span>
                      <br />
                      <span className="opacity-35 text-sm">
                        {currentData?.purchase_hash === "CEX"
                          ? "purchase method"
                          : "transaction hash"}
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* btc reserve all time */}
            <div className="flex flex-col">
              <div className="relative">
                <div
                  className={`tracking-normal flex  gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 pb-2 pt-8 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}
                >
                  <Image
                    src="/btc.svg"
                    alt="-"
                    width={80}
                    height={80}
                    priority
                  />
                  <span className="text-[#000000]/50 text-lg tracking-normal">
                    BITCOIN
                  </span>
                  <span className="tracking-tight">
                    {/* {isLoading ? <BlackSpinner /> : `${totalBtcReserveAllTime.toFixed(8)}`} */}
                    {isLoading ? (
                      <BlackSpinner />
                    ) : (
                      `${currentData ? (currentData.btc_reserve === 0 ? "0" : `${currentData.btc_reserve.toFixed(8)}`) : "--"}`
                    )}
                  </span>
                  <span className="text-[20px] opacity-70">
                    Total bitcoin reserve on this day
                  </span>
                  {/* href="https://bscscan.com/token/0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c?a=0x6F09eF95af0B49863225cFabA6875d9e6077fa77" */}
                  <Link
                    href="https://bscscan.com/address/0x6F09eF95af0B49863225cFabA6875d9e6077fa77#asset-multichain"
                    target="_blank"
                    className="text-black button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                  >
                    <span className="opacity-70 text-sm">
                      0x6F09eF95af ..... 5d9e6077fa77
                    </span>
                    <br />
                    <span className="opacity-35 text-sm">wallet hash</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* btc reserve all time */}
            {/* <div className="flex flex-col">
                            <div className="relative">
                                <div
                                    className={`tracking-normal flex  gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 pb-2 pt-8 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}>
                                    <Image src="/btc.svg" alt='-' width={80} height={80} priority />
                                    <span className='text-[#000000]/50 text-lg tracking-normal'>BITCOIN</span>
                                    <span className='tracking-tight'>
                                        {isLoading ? <BlackSpinner /> : `${totalBtcReserveAllTime.toFixed(8)}`}
                                    </span>
                                    <span className='text-[20px] opacity-70'>Total bitcoin reserve</span>
                                    <Link
                                        href="https://bscscan.com/token/0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c?a=0x6F09eF95af0B49863225cFabA6875d9e6077fa77"
                                        target='_blank'
                                        className="text-black button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl/tight lowercase text-center"
                                    >
                                        <span className='opacity-70 text-sm'>
                                            0x6F09eF95af ..... 5d9e6077fa77
                                        </span>
                                        <br />
                                        <span className='opacity-35 text-sm'>
                                            wallet hash
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        </div> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default AllTimeData;
