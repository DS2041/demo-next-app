"use client";

import React from "react";
import Image from "next/image";
import { Chessboard } from "react-chessboard";
import { useState, useEffect } from "react";
import WhiteSpinner from "../Old/Spinners/WhiteSpin";
import Button from "../ButtonsUI/button";

export default function AuditPageUI({ className = "w-full" }) {
  const [boardWidth, setBoardWidth] = useState(650);
  const [isClient, setIsClient] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768); // 768px is typically md breakpoint
    };

    const updateBoardWidth = () => {
      checkScreenSize();
      const container = document.querySelector(".chess-container");
      if (container) {
        const containerWidth = container.clientWidth;
        setBoardWidth(Math.min(650, containerWidth - 40));
      } else {
        setBoardWidth(Math.min(650, window.innerWidth - 40));
      }
    };

    updateBoardWidth();
    window.addEventListener("resize", updateBoardWidth);

    return () => window.removeEventListener("resize", updateBoardWidth);
  }, []);

  // Timer component for small screens - timer on right side
  const SmallScreenTimer = ({
    time = "15:00",
    label = "opponent's turn",
    address,
    isOpponent = true,
  }) => (
    <div className={`w-full ${isOpponent ? "" : ""}`}>
      <div className="flex items-center justify-between">
        {/* Left side: Player info */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-sm p-1 bg-[#000000]/5 flex items-center justify-center">
            <span
              className={`block rounded-full w-3 h-3 ${
                isOpponent
                  ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(0,255,0,0.7)]"
                  : "bg-gray-400"
              }`}
            ></span>
          </div>
          <div className="flex flex-col justify-start items-start overflow-hidden">
            <span className="truncate text-xs font-display overflow-hidden max-w-[100px]">
              {address || "0x000...0000"}
            </span>
            <span className="text-xs font-display opacity-70 italic">
              {label}
            </span>
          </div>
        </div>

        {/* Right side: Timer and lifelines */}
        <div className="flex items-center gap-2">
          {/* Lifelines */}
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={`${isOpponent ? "opp" : "my"}-lifeline-${i}`}
                className="w-4 h-4"
              >
                <Image
                  src={isOpponent ? "/chess/dead.svg" : "/chess/alive.svg"}
                  alt={isOpponent ? "Dead" : "Alive"}
                  width={16}
                  height={16}
                  className="w-full h-full"
                />
              </div>
            ))}
          </div>

          {/* Timer aligned to right */}
          <div className="flex flex-col items-end">
            <span className="block text-3xl font-ui font-semibold text-black leading-none">
              {time}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Image
        src="/rami/bigbeat.svg"
        width={962}
        height={46}
        className={`col-start-1 col-end-3 row-start-1 max-w-[initial] justify-self-end self-start mt-3 drop-shadow-placed max-2xl:hidden`}
        alt=" "
        aria-hidden="true"
        priority
      />

      <article className="grid grid-cols-subgrid col-content pb-18 gap-y-18">
        {/* Chessboard Column */}
        <div className="col-start-content-start max-lg:col-end-content-end lg:col-span-5 xl:col-span-7 2xl:col-span-6">
          <div className="chess-container w-full flex flex-col items-center gap-2">
            {/* Top Timer - Only on small screens */}
            {isSmallScreen && (
              <div className="w-full max-w-[700px] mt-2">
                <SmallScreenTimer
                  time="15:00"
                  label="opponent's turn"
                  address="0x000...0000"
                  isOpponent={true}
                />
              </div>
            )}

            <div className="w-full max-w-[768px] flex justify-center">
              {isClient && (
                <Chessboard
                  id="ChessBoard"
                  animationDuration={200}
                  boardWidth={Math.min(550, window.innerWidth - 40)}
                  arePiecesDraggable={false}
                  customBoardStyle={{
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                />
              )}
            </div>

            {/* Bottom Timer - Only on small screens */}
            {isSmallScreen && (
              <div className="w-full max-w-[500px]">
                <SmallScreenTimer
                  time="15:00"
                  label="waiting"
                  address="0x000...0000"
                  isOpponent={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* Pool Column */}
        <div className="col-start-content-start max-lg:col-end-content-end lg:col-span-5 xl:col-span-7 2xl:col-span-6">
          <div className="col-start-content-start col-end-content-end lg:col-start-6 xl:col-start-8 2xl:col-start-7 flex flex-col gap-4">
            <section className="flex flex-col gap-1">
              <>
                <div className={`${className}`}>
                  <div className="@container flex flex-col gap-10">
                    <div className="@container flex flex-col gap-6">
                      <div className="flex flex-col">
                        {/* Pool Selection Tabs */}
                        <div className="flex mb-1 bg-white rounded-md p-1">
                          {/* Game Data Tab */}
                          <Button
                            theme="dandelion"
                            className="!normal-case flex-1 py-2 px-4 rounded-md text-center font-medium bg-white text-black shadow-sm"
                          >
                            Live Data
                          </Button>
                        </div>

                        <div className="flex justify-center items-center gap-1 py-1">
                          <span className="font-ui text-lg font-bold text-[#ff0000]">
                            30
                          </span>
                          <p className="text-sm font-ui tracking-tight">
                            Opponent Disconnected: Lifeline Activated: 3/3
                          </p>
                        </div>

                        <div className="relative">
                          <div className="outline-none font-ui w-full shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-1 py-2 rounded-b-sm">
                            <div className="py-2">
                              <>
                                {/* Timer data for larger screens - hidden on small screens */}
                                {!isSmallScreen && (
                                  <>
                                    <div className="w-full flex justify-start items-center mb-4">
                                      <div className="flex-none flex justify-center items-center">
                                        <span className="block text-6xl font-ui text-black leading-none">
                                          15:00
                                        </span>
                                        <div className="flex justify-start items-start w-full gap-1 ml-3">
                                          <div className="flex gap-1 p-2">
                                            <div className="text-xs text-white flex justify-center items-center bg-pink-600 rounded-sm px-3 py-2">
                                              <WhiteSpinner />
                                              <span className="ml-2 flex justify-center items-center">
                                                Draw offer sent
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* opponent player info for larger screens */}
                                    <div className="hidden md:flex items-center space-x-2 mb-4">
                                      <div className="w-11 h-11 rounded-sm p-2 bg-[#000000]/5 flex items-center justify-center">
                                        <span
                                          className={`block rounded-full w-4 h-4 
                                                bg-green-500 animate-pulse shadow-[0_0_8px_rgba(0,255,0,0.7)]`}
                                        ></span>
                                      </div>
                                      <div className="flex flex-col justify-start items-start overflow-hidden">
                                        <span className="truncate text-[0.85rem] font-display overflow-hidden w-[90%]">
                                          0x0000000000000000000000000000000000000000
                                        </span>
                                        <span className="text-xs font-display opacity-70 italic">
                                          opponent's turn
                                        </span>
                                      </div>
                                    </div>

                                    {/* time tracker of opponent for larger screens - PROGRESS BAR HIDDEN ON SMALL SCREENS */}
                                    <div className="hidden md:flex justify-between items-center gap-1 mb-2">
                                      <div className="relative z-10 flex items-center gap-1">
                                        {[...Array(3)].map((_, i) => (
                                          <div
                                            key={`opp-progress-${i}`}
                                            className="w-4 h-4"
                                          >
                                            <Image
                                              src={"/chess/dead.svg"}
                                              alt={"Dead"}
                                              width={16}
                                              height={16}
                                              className="w-full h-full"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                      <div className="text-sm h-5 text-center bg-gray-300 flex justify-center items-center rounded-xs relative overflow-hidden w-full">
                                        <div
                                          className="absolute left-0 top-0 h-full bg-[#037d56] transition-all duration-1000"
                                          style={{
                                            width: `${0.5 * 100}%`,
                                          }}
                                        />
                                        <div className="relative z-10 flex items-center justify-center gap-1">
                                          <div>
                                            <Image
                                              className="w-3 h-3"
                                              src="/chess/clock.svg"
                                              alt="time"
                                              width={10}
                                              height={10}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* ------------------------------------game moves - single row for small screens */}
                                <div className="relative opacity-80">
                                  <div className="outline-none font-ui w-full shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% rounded-xs">
                                    {/* Game moves container */}
                                    <div className="border border-white/10 rounded-sm">
                                      {/* Fixed Header */}
                                      <div
                                        className={`rounded-t-xs grid ${
                                          isSmallScreen
                                            ? "grid-cols-1"
                                            : "grid-cols-3"
                                        } gap-2 text-xs tracking-wide uppercase px-2 py-1 border-b border-white/10 bg-black/10 sticky top-0 z-10`}
                                      >
                                        {isSmallScreen ? (
                                          <div className="text-center">
                                            Moves
                                          </div>
                                        ) : (
                                          <>
                                            <div className="text-center">#</div>
                                            <div className="text-center">
                                              White
                                            </div>
                                            <div className="text-center">
                                              Black
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      {/* Scrollable Moves List */}
                                      <div className="max-h-24 overflow-y-auto custom-scroll">
                                        {isSmallScreen ? (
                                          <div className="flex flex-col gap-1 p-2">
                                            {/* Single row move items for small screens */}
                                            <div className="text-center py-2 text-sm text-gray-500">
                                              No moves yet
                                            </div>
                                            <div className="flex flex-wrap gap-1 justify-center">
                                              <div className="flex items-center justify-center gap-1 bg-white rounded-sm px-3 py-1 text-sm">
                                                <span className="font-medium">
                                                  1.
                                                </span>
                                                <span>WPA7</span>
                                                <span className="opacity-60">
                                                  →
                                                </span>
                                                <span>WPA5</span>
                                              </div>
                                              <div className="flex items-center justify-center gap-1 bg-white rounded-sm px-3 py-1 text-sm">
                                                <span className="font-medium">
                                                  1...
                                                </span>
                                                <span>BPA4</span>
                                                <span className="opacity-60">
                                                  →
                                                </span>
                                                <span>WPA4</span>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="w-full">
                                            <div className="text-center py-4 text-sm text-gray-500">
                                              No moves yet
                                            </div>
                                            <div
                                              className={`grid grid-cols-3 gap-2 py-2 px-2 border-b border-black/10 transition-colors duration-300`}
                                            >
                                              <div className="text-sm font-display text-center flex items-center justify-center">
                                                1
                                              </div>
                                              <div className="flex items-center justify-center min-h-[24px]">
                                                <div className="flex items-center justify-center gap-1 bg-white w-24 rounded-sm h-6">
                                                  WPA7
                                                  <span className="text-sm font-ui font-normal leading-none">
                                                    WPA5
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="flex items-center justify-center min-h-[24px]">
                                                <div className="flex items-center justify-center gap-1 bg-white w-24 rounded-sm h-6">
                                                  BPA4
                                                  <span className="text-sm font-ui font-normal leading-none">
                                                    WPA4
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Timer and player info for larger screens (bottom part) */}
                                {!isSmallScreen && (
                                  <>
                                    {/* time tracker of player - PROGRESS BAR SHOWN ONLY ON LARGER SCREENS */}
                                    <div className="hidden md:flex justify-between items-center gap-1 mt-2">
                                      <div className="relative z-10 flex items-center gap-1">
                                        {[...Array(3)].map((_, i) => (
                                          <div
                                            key={`my-progress-${i}`}
                                            className="w-4 h-4"
                                          >
                                            <Image
                                              src={"/chess/alive.svg"}
                                              alt="a"
                                              width={16}
                                              height={16}
                                              className="w-full h-full"
                                            />
                                          </div>
                                        ))}
                                      </div>

                                      <div className="text-sm h-5 text-center bg-gray-300 flex justify-center items-center rounded-xs relative overflow-hidden w-full">
                                        <div
                                          className="absolute left-0 top-0 h-full bg-[#037d56] transition-all duration-1000"
                                          style={{
                                            width: `${0.5 * 100}%`,
                                          }}
                                        />
                                        <div className="relative z-10 flex items-center justify-center gap-1">
                                          <div>
                                            <Image
                                              className="w-3 h-3"
                                              src="/chess/clock.svg"
                                              alt="time"
                                              width={10}
                                              height={10}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* you - player info */}
                                    <div className="hidden md:flex items-center space-x-2 mt-4">
                                      <div className="w-11 h-11 rounded-sm p-2 bg-[#000000]/5 flex items-center justify-center">
                                        <span
                                          className={`block rounded-full w-4 h-4 bg-gray-400`}
                                        ></span>
                                      </div>
                                      <div className="flex flex-col justify-start items-start overflow-hidden">
                                        <span className="truncate text-[0.85rem] font-display overflow-hidden w-[90%]">
                                          0x0000000000000000000000000000000000000000
                                        </span>
                                        <span className="text-xs font-display opacity-70 italic">
                                          waiting
                                        </span>
                                      </div>
                                    </div>

                                    {/*timer data */}
                                    <div className="hidden md:block w-full flex justify-start items-center mt-2">
                                      <div className="flex-none flex justify-between items-center w-full">
                                        <span className="block text-6xl font-ui text-black leading-none">
                                          15:00
                                        </span>
                                        <div className="w-full flex flex-col justify-between items-stretch gap-2 ml-3">
                                          <button
                                            type="button"
                                            className="text-white bg-black font-medium rounded-sm text-sm px-4 py-2 w-full"
                                          >
                                            Accept Draw
                                          </button>
                                          <button
                                            type="button"
                                            className="text-white bg-black font-medium rounded-sm text-sm px-4 py-2 w-full"
                                          >
                                            Decline Draw
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* Draw buttons for small screens */}
                                {isSmallScreen && (
                                  <div className="flex gap-2 mt-4">
                                    <button
                                      type="button"
                                      className="flex-1 text-white bg-black font-medium rounded-sm text-sm px-4 py-2"
                                    >
                                      Accept Draw
                                    </button>
                                    <button
                                      type="button"
                                      className="flex-1 text-white bg-black font-medium rounded-sm text-sm px-4 py-2"
                                    >
                                      Decline Draw
                                    </button>
                                  </div>
                                )}
                              </>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            </section>
          </div>
        </div>
      </article>
    </>
  );
}