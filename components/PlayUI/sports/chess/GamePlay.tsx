"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import io from "socket.io-client";
import confetti from "canvas-confetti";
import Image from "next/image";
// import { thinkingDialogues } from "@/constants";
import Button from "@/components/ButtonsUI/button";
import "./scrollbar.css";
import WhiteSpinner from "@/components/Old/Spinners/WhiteSpin";
import Link from "next/link";
import { useChessSounds } from "@/hooks/useChessSounds";
// Add these imports at the top
import { useChess } from "@/context/chesscontext";
import { useAccount } from "wagmi";
import { useSignMessage } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import BlackSpinner from "@/components/Old/Spinners/BlackSpin";
import { useSearchParams, useParams, useRouter } from "next/navigation";

// Replace the SOCKET_URL declaration at the top:
const SOCKET_URL = 
  process.env.NODE_ENV === 'production'
    ? "https://demo-next-app-production.up.railway.app"
    : "http://localhost:3001";

let socket: ReturnType<typeof io> | undefined;

// Add this interface - RIGHT AFTER SOCKET_URL declaration
interface InvalidWalletData {
  message: string;
}

// Add this interface at the top of your client component
interface GameReadyData {
  creatorName: string;
  joinerName: string;
  roomCode: string;
}

// Add type definitions
interface TimerStartData {
  activeTimer: "white" | "black";
  whiteTime: number;
  blackTime: number;
}

// ADD THIS NEW INTERFACE
interface TurnCorrectedData {
  activeTimer: "white" | "black";
  fen: string;
  whiteTime: number;
  blackTime: number;
}

// ADD THIS INTERFACE FOR INVALID MOVES
interface InvalidMoveData {
  message: string;
  expectedTurn: "white" | "black";
}

export default function GamePlayUI({
  className = "w-full",
  unique = "footer",
}) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get shortHash from dynamic route
  const shortHash = params?.shortHash as string;

  // Add state to store resolved game data
  const [resolvedGameData, setResolvedGameData] = useState<{
    roomCode: string;
    role: "creator" | "joiner";
    currency: string;
    gameAmount: number;
  } | null>(null);

  // Add these hooks
  const { address: userAddress, isConnected } = useAccount();
  const { open } = useAppKit();

  const { fetchContractOrderByRoomCode, handleCompleteGame } = useChess();

  const { initSounds, playMoveSound, playCaptureSound } = useChessSounds();

  const roomCode = resolvedGameData?.roomCode || "";
  const role = resolvedGameData?.role || "joiner";
  const currency = resolvedGameData?.currency || "USDT";
  const gameAmount = resolvedGameData?.gameAmount || 0.0;
  const timerMinutes = 15; // Default

  // Add state for wallet connection
  const [walletConnected, setWalletConnected] = useState(false);

  // Add state to track if game was started before wallet disconnect
  const [gameStartedBeforeDisconnect, setGameStartedBeforeDisconnect] =
    useState(false);

  // Add state for contract order
  const [contractOrder, setContractOrder] = useState<any>(null);
  const [isFetchingContract, setIsFetchingContract] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Calculate winning amount (80% ROI)
  const totalPot = gameAmount * 2; // Both players contribute
  const winningAmount = totalPot * 0.9; // 90% of total pot
  const playerProfit = winningAmount - gameAmount;

  // Add this ref at the top with other refs
  const lastUpdateRef = useRef<number | null>(null);

  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(() => gameRef.current.fen());
  const [moveFrom, setMoveFrom] = useState("");
  const [optionSquares, setOptionSquares] = useState<
    Record<string, React.CSSProperties>
  >({});

  const [myName, setMyName] = useState<string>(userAddress!);
  const [opponentName, setOpponentName] = useState<string>("Opponent");

  const [opponentConnected, setOpponentConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const [whiteTime, setWhiteTime] = useState(timerMinutes * 60);
  const [blackTime, setBlackTime] = useState(timerMinutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [activeTimer, setActiveTimer] = useState<"white" | "black">("white");

  const [selectedTab, setSelectedTab] = useState<"livegamefeed" | "potsize">(
    "livegamefeed",
  );

  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const [drawOffered, setDrawOffered] = useState(false);
  const [drawOfferFrom, setDrawOfferFrom] = useState<"white" | "black" | null>(
    null,
  );

  const [moveHistory, setMoveHistory] = useState<
    { white: string; black: string }[]
  >([]);

  const [lastMoveIndex, setLastMoveIndex] = useState<number>(-1);

  const [checkSquares, setCheckSquares] = useState<
    Record<string, React.CSSProperties>
  >({});

  // Connection status management
  const [myConnectionStatus, setMyConnectionStatus] = useState<
    "online" | "disconnected" | "reconnecting" | "refreshing" | "network-error"
  >("online");

  const [opponentRealStatus, setOpponentRealStatus] = useState<
    "online" | "disconnected" | "reconnecting" | "refreshing" | "network-error"
  >("online");

  const movesContainerRef = useRef<HTMLDivElement>(null);

  const [gameReady, setGameReady] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState(
    "Waiting for opponent to join...",
  );

  const [connectionEstablished, setConnectionEstablished] = useState(false);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerColor = role === "creator" ? "white" : "black";

  // lifeline tracking
  // Add these state variables
  const [myLifelines, setMyLifelines] = useState<number>(3);
  const [opponentLifelines, setOpponentLifelines] = useState<number>(3);
  const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(
    null,
  );
  const [countdownEndTime, setCountdownEndTime] = useState<number | null>(null);

  // Add this with your other state declarations (around line 130-140)
  const [error, setError] = useState<string | null>(null);

  // Add these states near your other state declarations
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState<
    "idle" | "signing" | "signed" | "verified" | "failed"
  >("idle");
  const [signatureMessage, setSignatureMessage] = useState("");
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Add modal states
  const [showDrawOfferModal, setShowDrawOfferModal] = useState(false);
  const [showAcceptDrawModal, setShowAcceptDrawModal] = useState(false);
  const [showDeclineDrawModal, setShowDeclineDrawModal] = useState(false);
  const [showCancelDrawModal, setShowCancelDrawModal] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);

  const handleConnectWallet = () => {
    open();
  };

  // Inside component:
  const { signMessageAsync } = useSignMessage();

  // Add this component to render countdown
  const renderDisconnectCountdown = () => {
    if (!disconnectCountdown || !countdownEndTime) return null;

    const minutes = Math.floor(disconnectCountdown / 60);
    const seconds = disconnectCountdown % 60;

    return (
      <div className="flex justify-center items-center gap-1 py-1">
        <span className="font-ui text-lg font-bold text-[#ff0000]">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
        <p className="text-sm font-ui tracking-tight">
          Opponent Disconnected: Lifeline Activated: {opponentLifelines}/3
        </p>
      </div>
    );
  };

  // Add this function near your other functions
  const handleManualSign = async () => {
    if (!isConnected || !userAddress || !roomCode) {
      console.error("❌ Cannot sign: wallet not connected or no room code");
      setSignatureStatus("failed");
      setSignatureMessage("Please connect your wallet first");
      return;
    }

    try {
      setIsSigning(true);
      setSignatureStatus("signing");
      setSignatureMessage("Please sign the message in your wallet...");

      const timestamp = Date.now();
      const message = `ramicoin.com : esports - i am the owner`;

      console.log("📝 Generating manual wallet signature...");
      const signature = await signMessageAsync({ message });

      const signatureData = JSON.stringify({ signature, timestamp });
      localStorage.setItem(`chess-sig-${roomCode}`, signatureData);

      setSignatureStatus("signed");
      setSignatureMessage("Signature created! Verifying with server...");

      // Now join the room with the signature
      if (socket && socket.connected) {
        socket.emit("join", {
          room: roomCode,
          name: userAddress,
          role,
          walletSignature: signature,
          signatureTimestamp: timestamp,
        });

        setSignatureStatus("verified");
        setSignatureMessage("Signature verified! Joining game...");
        setRequiresSignature(false);
      } else {
        setSignatureStatus("failed");
        setSignatureMessage("Socket not connected. Please try again.");
      }
    } catch (error: any) {
      console.error("❌ Failed to sign message:", error);
      setSignatureStatus("failed");
      setSignatureMessage(error.message || "Failed to sign message");
    } finally {
      setIsSigning(false);
    }
  };

  // Add this function to render the manual signing screen
  const renderManualSignScreen = () => {
    if (!isConnected || !userAddress) {
      return renderWalletDisconnectedScreen();
    }

    return (
      <div className="fixed inset-0 z-50 backdrop-blur-3xl flex flex-col items-center justify-center p-4 overflow-auto">
        <section
          className={`mb-10 md:mb-18 max-lg:grid max-lg:grid-cols-subgrid col-start-container-start col-end-container-end place-items-center flex flex-col items-center relative py-12 lg:pt-18 2xl:pt-10 lg:pb-[5.5rem] gap-y-4 max-lg:px-4`}
        >
          <div
            className={`mt-18 max-lg:col-content flex items-center justify-center gap-4 text-sm xs:text-base lg:text-2xl text-center`}
          >
            <div className="flex flex-col justify-center items-center">
              <Image
                src={
                  role === "creator"
                    ? "/chess/piece/alpha/wN.svg"
                    : "/chess/piece/alpha/bN.svg"
                }
                alt="player-piece"
                width={50}
                height={50}
              />
              <div
                className={`text-sm font-ui tracking-tight px-3 bg-blue-100 rounded-full`}
              >
                you
              </div>
            </div>

            <span className="font-ui tracking-tight text-sm">VS</span>

            <div className="flex flex-col justify-center items-center">
              <Image
                src={
                  role === "creator"
                    ? "/chess/piece/alpha/bN.svg"
                    : "/chess/piece/alpha/wN.svg"
                }
                alt="opponent-piece"
                width={50}
                height={50}
              />
              <div
                className={`text-sm font-ui tracking-tight px-3 bg-[#ff0000] text-white rounded-full`}
              >
                waiting
              </div>
            </div>
          </div>

          <p className="mt-5 mb-5 max-lg:col-content text-sm xs:text-base lg:text-2xl text-fern-1100 border-b-[1px] border-gray-400 text-center max-w-[30ch]">
            roomcode
          </p>
          <h1 className="max-lg:col-content text-fern-1100 font-display text-3xl xs:text-5xl lg:text-7xl col-start-7 col-end-12 font-variation-bold lg:font-variation-extrabold text-center max-w-[13ch]">
            #{roomCode || shortHash || "Loading..."}
          </h1>

          <div className="max-lg:col-content flex flex-col items-center">
            <h3 className="text-xl font-display text-fern-1100 opacity-70 text-center">
              verify you are the owner of the wallet
            </h3>

            {signatureMessage && (
              <div
                className={`text-center ${signatureStatus === "failed" ? "text-red-500" : "text-green-600"}`}
              >
                {signatureMessage}
              </div>
            )}

            <div className="flex gap-1 w-full">
              <Button
                theme="damarnotukdo"
                onClick={handleManualSign}
                disabled={isSigning}
                className="w-full"
              >
                {isSigning ? (
                  <div className="flex items-center justify-center gap-2">
                    <WhiteSpinner />
                    Signing...
                  </div>
                ) : (
                  "1. sign"
                )}
              </Button>

              {signatureStatus === "failed" && (
                <Button
                  theme="dandelion"
                  onClick={() => {
                    setSignatureStatus("idle");
                    setSignatureMessage("");
                  }}
                  className="w-full bg-gray-600 hover:bg-gray-700"
                >
                  Try Again
                </Button>
              )}

              <Button
                theme="tomato"
                onClick={() => router.push("/play/chess")}
                className="w-full bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  };

  // Add this function to render errors
  const renderErrorScreen = () => {
    if (!error) return null;

    return (
      <div className="fixed inset-0 z-50 backdrop-blur-3xl flex flex-col items-center justify-center p-4">
        <section
          className={`mb-10 md:mb-18 max-lg:grid max-lg:grid-cols-subgrid col-start-container-start col-end-container-end place-items-center flex flex-col items-center relative py-12 lg:pt-18 2xl:pt-10 lg:pb-[5.5rem] gap-y-4 max-lg:px-4`}
        >
          <h3 className="max-lg:col-content text-[#ff0000] font-display text-xl xs:text-3xl lg:text-5xl col-start-7 col-end-12 font-variation-bold lg:font-variation-extrabold text-center max-w-[13ch]">
            Error Loading Game
          </h3>
          <p className="max-lg:col-content text-sm xs:text-base lg:text-2xl text-red-500 text-center max-w-[30ch] lowercase">
            {error}
          </p>
          <div className="max-lg:col-content text-sm xs:text-base lg:text-2xl text-center max-w-[30ch]">
            <Button
              theme="dandelion"
              onClick={() => router.push("/play/chess")}
            >
              Back to Chess Lobby
            </Button>
          </div>
        </section>
      </div>
    );
  };

  // Add this useEffect for screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768); // 768px is typically md breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Update the useEffect that resolves short hash
  useEffect(() => {
    const resolveShortHash = async () => {
      if (!shortHash || !isConnected || !userAddress) return;

      try {
        console.log("🔗 Resolving short hash:", shortHash);
        setLoading(true);
        setError(null); // Clear any previous errors

        // Call the API route that resolves the short hash
        const response = await fetch(`/api/chess/links/${shortHash}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Failed to resolve link: ${response.status}`,
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to resolve game");
        }

        console.log("✅ Resolved game data:", data);

        // Determine user role
        let role: "creator" | "joiner" = "joiner";
        const isWhite =
          userAddress.toLowerCase() === data.whitePlayer.toLowerCase();
        const isBlack =
          data.blackPlayer &&
          userAddress.toLowerCase() === data.blackPlayer.toLowerCase();

        if (isWhite) {
          role = "creator";
        } else if (isBlack) {
          role = "joiner";
        } else if (!data.blackPlayer || data.blackPlayer.trim() === "") {
          role = "joiner"; // Anyone can join if slot empty
        } else {
          setError("You are not authorized to join this game.");
          setLoading(false);
          return;
        }

        setResolvedGameData({
          roomCode: data.roomCode,
          role,
          currency: data.currency || "USDT",
          gameAmount: parseFloat(data.amount) || 0.0,
        });

        setLoading(false);
        setError(null); // Clear error on success
      } catch (err: any) {
        console.error("❌ Failed to resolve short hash:", err);
        setError(err.message || "Failed to load game");
        setLoading(false);
      }
    };

    resolveShortHash();
  }, [shortHash, isConnected, userAddress]);

  // // Replace the existing verifyAndJoin useEffect with this:
  // useEffect(() => {
  //   const verifyAndJoin = async () => {
  //     if (!isConnected || !userAddress || !socket || !roomCode) return;

  //     try {
  //       // Clear any previous error messages
  //       setWaitingMessage("Verifying wallet...");

  //       // Get or create signature
  //       let signatureData = localStorage.getItem(`chess-sig-${roomCode}`);
  //       let needsNewSignature = false;

  //       if (signatureData) {
  //         // Check if existing signature is still valid
  //         try {
  //           const parsed = JSON.parse(signatureData);
  //           const isRecent = Date.now() - parsed.timestamp < 5 * 60 * 1000; // 5 minutes
  //           if (!isRecent) {
  //             console.log("🔄 Signature expired, getting new one");
  //             needsNewSignature = true;
  //           }
  //         } catch (error) {
  //           needsNewSignature = true;
  //         }
  //       } else {
  //         needsNewSignature = true;
  //       }

  //       if (needsNewSignature) {
  //         // Generate new signature
  //         const timestamp = Date.now();
  //         const message = `ramicoin.com : esports - i am the owner`;

  //         console.log("📝 Generating new wallet signature...");
  //         const signature = await signMessageAsync({ message });
  //         signatureData = JSON.stringify({ signature, timestamp });
  //         localStorage.setItem(`chess-sig-${roomCode}`, signatureData);
  //       }

  //       const { signature, timestamp } = JSON.parse(signatureData!);

  //       console.log("📤 Sending join request with wallet verification:", {
  //         room: roomCode,
  //         name: userAddress,
  //         role,
  //         signatureLength: signature.length,
  //         timestamp,
  //       });

  //       // Wait for socket connection
  //       if (socket.connected) {
  //         socket.emit("join", {
  //           room: roomCode,
  //           name: userAddress,
  //           role,
  //           walletSignature: signature,
  //           signatureTimestamp: timestamp,
  //         });
  //       } else {
  //         console.log("⏳ Socket not connected, waiting...");
  //         setWaitingMessage("Connecting to game server...");
  //       }
  //     } catch (error) {
  //       console.error("❌ Failed to verify wallet:", error);
  //       setWaitingMessage(
  //         "Wallet verification failed. Please reconnect and sign the message."
  //       );
  //     }
  //   };

  //   if (isConnected && userAddress && roomCode) {
  //     console.log("🔐 Starting wallet verification...");
  //     verifyAndJoin();
  //   }
  // }, [isConnected, userAddress, socket, roomCode, role, signMessageAsync]);

  // Replace the existing verifyAndJoin useEffect with this:
  useEffect(() => {
    const checkSignature = async () => {
      if (!isConnected || !userAddress || !socket || !roomCode) return;

      // Check if we already have a valid signature
      const signatureData = localStorage.getItem(`chess-sig-${roomCode}`);
      let hasValidSignature = false;

      if (signatureData) {
        try {
          const parsed = JSON.parse(signatureData);
          const isRecent = Date.now() - parsed.timestamp < 5 * 60 * 1000; // 5 minutes
          if (isRecent) {
            hasValidSignature = true;
            console.log("✅ Found valid existing signature");

            // Auto-join if we have a valid signature
            if (socket.connected) {
              socket.emit("join", {
                room: roomCode,
                name: userAddress,
                role,
                walletSignature: parsed.signature,
                signatureTimestamp: parsed.timestamp,
              });
              setRequiresSignature(false);
            }
          } else {
            // Signature expired, need new one
            console.log("🔄 Signature expired, requiring new one");
            setRequiresSignature(true);
          }
        } catch (error) {
          console.log("🔄 Invalid signature data, requiring new one");
          setRequiresSignature(true);
        }
      } else {
        // No signature at all, need one
        console.log("🔄 No signature found, requiring manual signing");
        setRequiresSignature(true);
      }
    };

    checkSignature();
  }, [isConnected, userAddress, socket, roomCode, role]);

  // In GamePlay.tsx, add cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up stored signature when leaving game
      if (roomCode) {
        localStorage.removeItem(`chess-sig-${roomCode}`);
      }
    };
  }, [roomCode]);

  // Update the cleanup function
  useEffect(() => {
    const cleanupExpiredSignatures = () => {
      const now = Date.now();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("chess-sig-")) {
          try {
            const data = JSON.parse(localStorage.getItem(key)!);
            if (now - data.timestamp > 30 * 60 * 1000) {
              // 30 minutes
              localStorage.removeItem(key);
            }
          } catch (error) {
            localStorage.removeItem(key);
          }
        }
      }
    };

    // Run cleanup on component mount
    cleanupExpiredSignatures();

    return () => {
      // Clean up stored signature when leaving game
      if (roomCode) {
        localStorage.removeItem(`chess-sig-${roomCode}`);
      }
    };
  }, [roomCode]);

  const getKingInCheckSquare = useCallback((game: Chess) => {
    if (!game.inCheck()) return null;

    const turn = game.turn();
    const board = game.board();

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece && piece.type === "k" && piece.color === turn) {
          const file = String.fromCharCode(97 + j);
          const rank = 8 - i;
          return `${file}${rank}`;
        }
      }
    }
    return null;
  }, []);

  // Add this helper function
  const formatAddress = (address: string) => {
    if (!address) return "Anonymous";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getPieceImage = (move: string, color: "white" | "black") => {
    if (!move) return null;

    let pieceType = "p";
    if (move.startsWith("N")) pieceType = "n";
    else if (move.startsWith("B")) pieceType = "b";
    else if (move.startsWith("R")) pieceType = "r";
    else if (move.startsWith("Q")) pieceType = "q";
    else if (move.startsWith("K")) pieceType = "k";

    const pieceColor = color === "white" ? "w" : "b";
    const imagePath = `/chess/piece/alpha/${pieceColor}${pieceType.toUpperCase()}.svg`;

    return (
      <Image
        src={imagePath}
        alt={`${color} ${pieceType}`}
        width={20}
        height={20}
        className="inline-block"
      />
    );
  };

  const formatMoveDisplay = (move: string, color: "white" | "black") => {
    if (!move) return null;

    // Clean up the move notation
    let displayText = move;

    // Remove any arrow notation
    displayText = displayText.replace(/→/g, "");

    // For SAN notation, it's already good
    // For from-to notation (e.g., "a2→a4"), extract just the destination
    if (move.includes("→")) {
      displayText = move.split("→")[1];
    }

    // Determine piece type for image
    let pieceType = "p"; // default pawn

    if (move.startsWith("N")) pieceType = "n";
    else if (move.startsWith("B")) pieceType = "b";
    else if (move.startsWith("R")) pieceType = "r";
    else if (move.startsWith("Q")) pieceType = "q";
    else if (move.startsWith("K")) pieceType = "k";
    else if (move.includes("O-O")) {
      pieceType = "k"; // castle
      displayText = move.includes("O-O-O") ? "O-O-O" : "O-O";
    }

    const pieceColor = color === "white" ? "w" : "b";
    const imagePath = `/chess/piece/alpha/${pieceColor}${pieceType.toUpperCase()}.svg`;

    return (
      <div className="flex items-center justify-center gap-1 bg-white w-24 rounded-sm h-6">
        <div className="h-6 flex items-center">
          {!move.includes("O-O") && (
            <Image
              src={imagePath}
              alt={`${color} ${pieceType}`}
              width={20}
              height={20}
              className="inline-block"
            />
          )}
        </div>
        <div className="h-6 flex items-center pt-1">
          <span className="text-sm font-ui font-normal leading-none">
            {displayText}
          </span>
        </div>
      </div>
    );
  };

  const boardOrientation = playerColor;

  // Add this to prevent board reset
  const [boardLocked, setBoardLocked] = useState(false);

  useEffect(() => {
    // Lock board orientation when game starts
    if (gameReady && !boardLocked) {
      setBoardLocked(true);
    }
  }, [gameReady, boardLocked]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const getCurrentTurn = () =>
    gameRef.current.turn() === "w" ? "white" : "black";

  const resetGame = useCallback(() => {
    const newGame = new Chess();
    gameRef.current = newGame;
    setFen(newGame.fen());
    setMoveFrom("");
    setOptionSquares({});
    setCheckSquares({});

    // Clear move history completely
    setMoveHistory([]);
    setLastMoveIndex(-1);

    // Reset timer
    setWhiteTime(timerMinutes * 60);
    setBlackTime(timerMinutes * 60);
    setActiveTimer("white");
    setTimerRunning(false);

    // Clear game result
    setGameResult(null);
    setDrawOffered(false);
    setDrawOfferFrom(null);

    console.log("🔄 Game reset - move history cleared");
  }, [timerMinutes]);

  const [gameResult, setGameResult] = useState<{
    winner: string | null;
    reason: string;
  } | null>(null);

  // Track wallet connection changes
  useEffect(() => {
    if (isConnected && userAddress) {
      setWalletConnected(true);
      setMyName(userAddress);

      // If game was already started and wallet reconnects, don't reset
      if (gameStartedBeforeDisconnect) {
        console.log("✅ Wallet reconnected, game state preserved");
      }
    } else {
      setWalletConnected(false);

      // If game was started and wallet disconnects, mark it
      if (gameReady || timerRunning) {
        setGameStartedBeforeDisconnect(true);
        console.log(
          "⚠️ Wallet disconnected during game - waiting for reconnect",
        );
      }
    }
  }, [isConnected, userAddress, gameReady, timerRunning]);

  // Simplify the wallet disconnect logic
  // Simplify wallet disconnect - don't auto-resign
  useEffect(() => {
    const handleWalletDisconnect = () => {
      if (!isConnected && gameReady && timerRunning && !gameResult) {
        console.log("⚠️ Wallet disconnected during active game");

        // Notify opponent
        socket?.emit("network-status", {
          room: roomCode,
          status: "network-error",
        });

        // Show message but don't auto-resign
        setWaitingMessage(
          "Wallet disconnected. Reconnect to continue playing.",
        );
        setGameReady(false); // Pause the game
      }
    };

    return handleWalletDisconnect();
  }, [
    isConnected,
    gameReady,
    timerRunning,
    gameResult,
    playerColor,
    roomCode,
    socket,
  ]);

  // Add this useEffect to handle wallet reconnection and refresh game state
  useEffect(() => {
    if (isConnected && userAddress && socket && gameReady) {
      console.log("✅ Wallet reconnected - refreshing game state");

      // Request fresh game state from server
      socket.emit("request-game-state", { room: roomCode });

      // Also re-emit join to ensure proper room status
      socket.emit("player-status-update", {
        room: roomCode,
        status: "online",
      });

      socket.emit("network-status", {
        room: roomCode,
        status: "online",
      });
    }
  }, [isConnected, userAddress, gameReady, roomCode, socket]);

  // At the top of your component, check if room is already completed
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isCompleted = urlParams.get("completed") === "true";

    if (isCompleted) {
      setGameResult({
        winner: null,
        reason: "Game already completed. This room is closed.",
      });
      setLoading(false);
      setGameReady(false);
    }
  }, []);

  useEffect(() => {
    const fetchContractData = async () => {
      if (!roomCode || !userAddress) return;

      setIsFetchingContract(true);
      try {
        const orderData = await fetchContractOrderByRoomCode(roomCode);
        setContractOrder(orderData);

        console.log("📋 Contract order loaded:", {
          orderId: orderData?.orderId,
          creator: orderData?.creator,
          accepter: orderData?.accepter,
          status: orderData?.status,
          amount: orderData?.amount,
        });
      } catch (error) {
        console.error("❌ Failed to fetch contract order:", error);
      } finally {
        setIsFetchingContract(false);
      }
    };

    fetchContractData();
  }, [roomCode, userAddress, fetchContractOrderByRoomCode]);

  useEffect(() => {
    initSounds();
  }, [initSounds]);

  useEffect(() => {
    if (movesContainerRef.current && moveHistory.length > 0) {
      const container = movesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [moveHistory.length]);

  // Socket and game logic
  useEffect(() => {
    // Don't connect socket if wallet is not connected
    if (!isConnected || !userAddress) {
      console.log("⏳ Waiting for wallet connection...");

      // If game was started and wallet disconnects, notify opponent
      if (gameStartedBeforeDisconnect && socket) {
        socket.emit("player-status-update", {
          room: roomCode,
          status: "network-error",
        });
      }

      return;
    }

    console.log("✅ Wallet connected:", userAddress);

    socket = io(SOCKET_URL, {
      path: "/socket.io/",
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      transports: ["websocket", "polling"],
    });

    // In your socket connection setup in GamePlayUI.tsx, add:
    socket.on("connect_error", (error: Error) => {
      console.error("❌ Socket connection error:", error.message);
      setMyConnectionStatus("network-error");
      setWaitingMessage(`Connection error: ${error.message}`);

      // Try to reconnect
      setTimeout(() => {
        if (!socket?.connected) {
          console.log("🔄 Attempting to reconnect...");
          socket?.connect();
        }
      }, 3000);
    });

    socket.on("error", (error: Error) => {
      console.error("❌ Socket error:", error.message);
      setMyConnectionStatus("network-error");
      setWaitingMessage(`Socket error: ${error.message}`);
    });

    // Also add a timeout for connection
    const connectionTimeout = setTimeout(() => {
      if (!socket?.connected) {
        console.log("⏰ Socket connection timeout");
        setMyConnectionStatus("network-error");
        setWaitingMessage("Connection timeout. Please refresh the page.");
      }
    }, 10000);

    socket.on("connect", async () => {
      clearTimeout(connectionTimeout);
      console.log("✅ Connected to server, socket ID:", socket?.id);
      setMyConnectionStatus("online");
      setConnectionEstablished(true);

      // Check if we need manual signature
      const signatureData = localStorage.getItem(`chess-sig-${roomCode}`);
      if (signatureData) {
        try {
          const { signature, timestamp } = JSON.parse(signatureData);
          const isRecent = Date.now() - timestamp < 5 * 60 * 1000;

          if (isRecent) {
            console.log("📤 Auto-joining with existing signature");
            socket?.emit("join", {
              room: roomCode,
              name: userAddress,
              role,
              walletSignature: signature,
              signatureTimestamp: timestamp,
            });
          } else {
            setRequiresSignature(true);
          }
        } catch (error) {
          setRequiresSignature(true);
        }
      } else {
        setRequiresSignature(true);
      }
    });

    socket.on("player-joined", ({ name }: { name: string }) => {
      console.log("🎉 Player joined:", name);
      setOpponentConnected(true);
      setOpponentName(name);
      setOpponentRealStatus("online");

      // Clear any waiting messages
      setWaitingMessage("");

      // If creator receives player-joined, game should start soon
      if (role === "creator") {
        console.log("👑 Creator: Opponent has joined, game should start soon");
        setWaitingMessage("Opponent joined! Starting game...");
      }
    });

    // Add this handler
    socket.on("opponent-waiting", (data: { role: string; message: string }) => {
      console.log("👀 Opponent is waiting for you:", data.message);
      // Update waiting message
      setWaitingMessage("Opponent is waiting. Game will start when you join.");
    });

    // Add this handler for unauthorized access
    socket.on("unauthorized", (data: { message: string }) => {
      console.error("❌ Unauthorized access:", data.message);
      setWaitingMessage(`Unauthorized: ${data.message}`);
      setGameReady(false);
      setLoading(false);

      // Optionally redirect after a delay
      setTimeout(() => {
        router.push("/play/chess");
      }, 3000);
    });

    socket.on("room-creation-failed", (data: { message: string }) => {
      console.error("❌ Room creation failed:", data.message);
      alert(data.message);
      router.push("/play/chess");
    });

    // Add this new event handler - RIGHT AFTER "connect" handler
    socket.on("invalid-wallet", (data: InvalidWalletData) => {
      console.error("❌ Invalid wallet error:", data.message);
      setLoading(false);
      setGameReady(false);
    });

    // Inside your socket.on("connect") section, add:
    socket.on(
      "waiting-for-opponent",
      (data: { role: string; opponentRole: string; message: string }) => {
        console.log("⏳ Waiting for opponent:", data.message);
        setGameReady(false);
        setWaitingMessage(data.message);
        setLoading(true);
      },
    );

    // Ensure this is typed correctly (around line 140-150)
    socket.on("timer-start", (data: TimerStartData) => {
      console.log("⏱️ Timer started by server");

      // Reset timer refs
      lastUpdateRef.current = Date.now();

      setActiveTimer(data.activeTimer);
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);
      setTimerRunning(true);
    });

    // In your GamePlay.tsx, update the socket.on("game-ready") handler:

    socket.on("game-ready", (data: GameReadyData) => {
      console.log("✅ Game is ready, both players online!", data);

      // CRITICAL: Set all game-ready states
      setGameReady(true);
      setLoading(false);
      setTimerRunning(true); // Start timer immediately

      // Initialize lifelines
      setMyLifelines(3);
      setOpponentLifelines(3);

      // Set opponent name
      if (role === "creator") {
        setOpponentName(data.joinerName);
      } else {
        setOpponentName(data.creatorName);
      }

      console.log("🎮 Game state set to ready, timer should start...");
    });

    // FIX: Make start-game handler more robust
    socket.on("start-game", () => {
      console.log("🎮 Server says: Game starting now!");
      setGameReady(true);
      setTimerRunning(true);
      setActiveTimer("white");
      setLoading(false);
      setWaitingMessage("");
    });

    // FIX: Add handler for turn corrections
    socket.on("turn-corrected", (data: TurnCorrectedData) => {
      console.log("🔄 Server corrected turn:", data);

      try {
        const newGame = new Chess();
        newGame.load(data.fen);
        gameRef.current = newGame;
        setFen(data.fen);
        setActiveTimer(data.activeTimer);
        setWhiteTime(data.whiteTime);
        setBlackTime(data.blackTime);
        setTimerRunning(true);
        setGameReady(true); // Ensure game is marked as ready

        console.log("✅ Turn correction applied:", data.activeTimer);
      } catch (error) {
        console.error("❌ Failed to apply turn correction:", error);
      }
    });

    // Add handler for invalid moves
    socket.on("invalid-move", (data: InvalidMoveData) => {
      console.error("❌ Invalid move:", data.message);
      alert(`Not your turn! It's ${data.expectedTurn}'s turn.`);

      // Request correct game state
      socket?.emit("request-game-state", { room: roomCode });
    });

    socket.on("opponent-disconnected", (data: { message: string }) => {
      console.log("🔌 Opponent disconnected:", data.message);
      setGameReady(false);
      setWaitingMessage(data.message);
      setOpponentRealStatus("disconnected");
    });

    // Handle opponent disconnect with details
    socket.on(
      "opponent-disconnected-details",
      (data: {
        status: string;
        reason: string;
        remainingLifelines: number;
        role: "creator" | "joiner";
        countdownStart: number;
        countdownDuration: number;
        reconnectWindow: number;
      }) => {
        console.log("⚠️ Opponent disconnected with details:", data);

        // Determine if it's my opponent or me
        const isOpponent = data.role !== role;
        if (isOpponent) {
          setOpponentLifelines(data.remainingLifelines);
          setDisconnectCountdown(data.countdownDuration / 1000);
          setCountdownEndTime(Date.now() + data.countdownDuration);

          // Show countdown UI
          setWaitingMessage(
            `Opponent disconnected. ${data.remainingLifelines} lifelines remaining. Reconnect within ${Math.floor(data.countdownDuration / 1000 / 60)} minutes.`,
          );
        }
      },
    );

    // Handle opponent reconnection
    socket.on(
      "opponent-reconnected",
      (data: {
        status: string;
        role: "creator" | "joiner";
        remainingLifelines: number;
        reconnectionTime: number;
      }) => {
        console.log("✅ Opponent reconnected:", data);

        const isOpponent = data.role !== role;
        if (isOpponent) {
          setOpponentLifelines(data.remainingLifelines);
          setDisconnectCountdown(null);
          setCountdownEndTime(null);
          setWaitingMessage("");

          // Resume game if it was paused
          if (!timerRunning && gameReady) {
            setTimerRunning(true);
          }
        }
      },
    );

    // Handle my lifeline updates
    socket.on(
      "lifeline-update",
      (data: { player: "white" | "black"; remainingLifelines: number }) => {
        if (data.player === playerColor) {
          setMyLifelines(data.remainingLifelines);
        } else {
          setOpponentLifelines(data.remainingLifelines);
        }
      },
    );

    socket.on("reconnect", (attemptNumber: number) => {
      console.log(`🔁 Reconnected to server (attempt ${attemptNumber})`);
      setIsReconnecting(false);
      setMyConnectionStatus("online");

      // Sync timer immediately
      syncTimerWithServer();

      // Notify server we're back online
      socket?.emit("player-status-update", {
        room: roomCode,
        status: "online",
      });

      socket?.emit("request-game-state", { room: roomCode });
    });

    socket.on("reconnecting", (attemptNumber: number) => {
      console.log(`🔄 Reconnecting to server (attempt ${attemptNumber})`);
      setIsReconnecting(true);
      setReconnectAttempts(attemptNumber);
      setMyConnectionStatus("reconnecting");

      // Show user-friendly message
      setWaitingMessage(`Reconnecting... (Attempt ${attemptNumber}/10)`);

      // Notify server we're reconnecting
      socket?.emit("player-status-update", {
        room: roomCode,
        status: "reconnecting",
      });
    });

    socket.on("reconnect_error", (error: Error) => {
      console.error("❌ Reconnection error:", error);
      setMyConnectionStatus("network-error");

      socket?.emit("player-status-update", {
        room: roomCode,
        status: "network-error",
      });
    });

    socket.on("reconnect_failed", () => {
      console.error("❌ Failed to reconnect to server");
      setIsReconnecting(false);
      setMyConnectionStatus("disconnected");

      socket?.emit("player-status-update", {
        room: roomCode,
        status: "disconnected",
      });
    });

    // Handle opponent disconnect with details
    socket.on(
      "opponent-disconnected-details",
      (data: {
        status: string;
        reason: string;
        remainingLifelines: number;
        role: "creator" | "joiner";
        countdownStart: number;
        countdownDuration: number;
        reconnectWindow: number;
      }) => {
        console.log("⚠️ Opponent disconnected with details:", data);

        setOpponentLifelines(data.remainingLifelines);
        setDisconnectCountdown(data.countdownDuration / 1000); // Convert to seconds
        setCountdownEndTime(Date.now() + data.countdownDuration);

        // Show countdown UI
        setWaitingMessage(
          `Opponent disconnected. ${data.remainingLifelines} lifelines remaining. Reconnect within ${data.countdownDuration / 1000 / 60} minutes.`,
        );
      },
    );

    // Handle opponent reconnection
    socket.on(
      "opponent-reconnected",
      (data: {
        status: string;
        role: "creator" | "joiner";
        remainingLifelines: number;
        reconnectionTime: number;
      }) => {
        console.log("✅ Opponent reconnected:", data);

        setOpponentLifelines(data.remainingLifelines);
        setDisconnectCountdown(null);
        setCountdownEndTime(null);
        setWaitingMessage("");

        // Resume game if it was paused
        if (!timerRunning && gameReady) {
          setTimerRunning(true);
        }
      },
    );

    // Handle my lifeline updates
    socket.on(
      "lifeline-update",
      (data: { player: "white" | "black"; remainingLifelines: number }) => {
        if (data.player === playerColor) {
          setMyLifelines(data.remainingLifelines);
        } else {
          setOpponentLifelines(data.remainingLifelines);
        }
      },
    );

    // CRITICAL FIX: Handle game-state event properly
    socket.on("game-state", (gameState: any) => {
      console.log("🎮 Received game state from server:", {
        hasGameState: !!gameState,
        fen: gameState?.fen?.substring(0, 30) + "...",
        timerRunning: gameState?.timerRunning,
        gameReady: gameState ? true : false,
      });

      if (gameState) {
        // If we receive a valid game state, the game is ready
        if (restoreGameState(gameState)) {
          setGameReady(true);
          setLoading(false);
          setTimerRunning(gameState.timerRunning || false);

          // Clear any local storage to avoid conflicts
          localStorage.removeItem(`chess-game-${roomCode}`);
          console.log("✅ Game state restored successfully, game is ready!");
        } else {
          console.log("⚠️ Failed to restore game state, starting fresh");
          // Start fresh game
          gameRef.current = new Chess();
          setFen(gameRef.current.fen());
          setGameReady(true);
          setLoading(false);
          setTimerRunning(true);
        }
      } else {
        console.log(
          "❌ No valid game state from server, staying in waiting mode",
        );
        // Don't set gameReady to false here - just stay in current state
      }

      // Force a state update to refresh the UI
      setTimeout(() => {
        setMoveHistory((prev) => [...prev]); // Force re-render
      }, 100);
    });

    // FIX: Update timer-start handler to set gameReady
    socket.on("timer-start", (data: TimerStartData) => {
      console.log("⏱️ Timer started by server - GAME IS READY!", {
        whiteTime: data.whiteTime,
        blackTime: data.blackTime,
        activeTimer: data.activeTimer,
      });

      // Set timer state from server
      setActiveTimer(data.activeTimer);
      setWhiteTime(data.whiteTime);
      setBlackTime(data.blackTime);
      setTimerRunning(true);
      setGameReady(true); // CRITICAL: Set gameReady to true
      setLoading(false);

      console.log(
        `Timer set from server: White ${formatTime(data.whiteTime)}, Black ${formatTime(data.blackTime)}, Active: ${data.activeTimer}`,
      );
    });

    // Add server-side timeout event
    socket.on("timeout", (data: { winner: string }) => {
      console.log("⏰ Server timeout event:", data);

      setTimerRunning(false);
      setGameResult({
        winner: data.winner,
        reason: "Time out",
      });

      if (playerColor === data.winner) {
        triggerWinnerConfetti();
      } else {
        triggerLoserConfetti();
      }
    });

    socket.on("timer-paused", (data: { reason: string }) => {
      console.log(`⏸️ Timer paused: ${data.reason}`);
      setTimerRunning(false);

      // Show message to user
      if (gameReady && !gameResult) {
        setWaitingMessage(`Timer paused: ${data.reason}`);
      }
    });

    socket.on("timer-resumed", () => {
      console.log("▶️ Timer resumed");
      if (gameReady && !gameResult) {
        setTimerRunning(true);
        // Request updated game state
        socket?.emit("request-game-state", { room: roomCode });
      }
    });

    socket.on("disconnect", () => {
      setMyConnectionStatus("disconnected");
      setLoading(false);
    });

    socket.on("invalid-room", () => {
      // Instead of redirecting immediately, show a message and let user decide
      setWaitingMessage(
        "Room not found or has expired. Please check the room code.",
      );
      setGameReady(false);
      setLoading(false);
    });

    socket.on("player-joined", ({ name }: { name: string }) => {
      setOpponentConnected(true);
      setOpponentName(name);
      setOpponentRealStatus("online");
      setTimerRunning(true);
      setActiveTimer("white");
    });

    socket.on("room-creator", ({ name }: { name: string }) => {
      setOpponentConnected(true);
      setOpponentName(name);
      setOpponentRealStatus("online");
      setTimerRunning(true);
      setActiveTimer("white");
    });

    socket.on("opponent-status-update", (data: { status: string }) => {
      console.log(`📊 Opponent status updated: ${data.status}`);
      setOpponentRealStatus(data.status as any);
    });

    // Add event to validate game state
    socket.on("validate-game-state", () => {
      console.log("🔄 Server requested game state validation");
      validateGameState();
    });

    socket.on(
      "opponent-move",
      (move: { from: string; to: string; promotion?: string }) => {
        console.log("📥 Opponent move received:", move);

        const newGame = new Chess(gameRef.current.fen());

        // Validate it's actually opponent's turn
        const currentTurn = newGame.turn();
        const opponentColor = playerColor === "white" ? "black" : "white";
        const expectedTurn = opponentColor === "white" ? "w" : "b";

        if (currentTurn !== expectedTurn) {
          console.warn(`⚠️ Opponent move turn mismatch!`);
          socket?.emit("request-game-state", { room: roomCode });
          return;
        }

        const moveOptions: any = {
          from: move.from,
          to: move.to,
        };

        if (move.promotion) {
          moveOptions.promotion = move.promotion;
        }

        const result = newGame.move(move);

        if (!result) {
          console.error("Received invalid move:", move);
          return;
        }

        gameRef.current = newGame;
        setFen(newGame.fen());
        setMoveFrom("");
        setOptionSquares({});
        setActiveTimer(newGame.turn() === "w" ? "white" : "black");

        if (result.captured) {
          playCaptureSound();
        } else {
          playMoveSound();
        }

        if (newGame.inCheck()) {
          const kingSquare = getKingInCheckSquare(newGame);
          if (kingSquare) {
            setCheckSquares({
              [kingSquare]: {
                background: "rgba(255, 0, 0, 0.4)",
                borderRadius: "4px",
              },
            });
          }
        } else {
          setCheckSquares({});
        }

        const moveNotation = result.san;

        // FIX: Use the immediate function to ensure history is updated
        const opponentColorName = playerColor === "white" ? "black" : "white";
        addMoveToHistoryImmediately(moveNotation, opponentColorName);

        if (newGame.isCheckmate()) {
          setTimerRunning(false);
          const winnerColor = newGame.turn() === "w" ? "black" : "white";
          setGameResult({ winner: winnerColor, reason: "Checkmate" });

          if (playerColor === winnerColor) {
            triggerWinnerConfetti();
          } else {
            triggerLoserConfetti();
          }

          // Get the full move history for PGN generation
          const currentMoveHistory = [...moveHistory];

          setTimeout(() => {
            socket?.emit("end-room", {
              room: roomCode,
              winner: winnerColor,
              reason: "Checkmate",
              finalFen: newGame.fen(), // Send final FEN
              moveHistory: currentMoveHistory, // Send move history for PGN
            });
          }, 5000);
        }

        // ADD THIS FOR STALEMATE DETECTION
        else if (newGame.isStalemate()) {
          setTimerRunning(false);
          setGameResult({ winner: null, reason: "Stalemate" });
          triggerDrawConfetti();

          const currentMoveHistory = [...moveHistory];

          setTimeout(() => {
            socket?.emit("end-room", {
              room: roomCode,
              winner: null,
              reason: "Stalemate",
              finalFen: newGame.fen(),
              moveHistory: currentMoveHistory,
            });
          }, 5000);
        }
      },
    );

    // In your client socket setup, add this event handler:
    socket.on("room-completed", (data: { message: string }) => {
      console.log("🏁 Room completed:", data.message);
      setWaitingMessage(`Game already completed: ${data.message}`);
      setGameReady(false);
      setLoading(false);

      // Show a message that game is over
      setGameResult({
        winner: null,
        reason: "Game already completed. This room is closed.",
      });
    });

    socket.on("restart", () => {
      resetGame();
    });

    socket.on(
      "end-room",
      async (endData: { winner?: string; reason?: string }) => {
        console.log("🎯 Game ended:", endData);

        // CRITICAL: Preserve the current board state
        const currentFen = gameRef.current.fen();

        setTimerRunning(false);
        setGameResult({
          winner: endData?.winner || null,
          reason: endData?.reason || "Room ended",
        });

        // Notify server game is completed
        socket?.emit("game-completed", { room: roomCode });

        // Update URL to prevent rejoining
        const newUrl = `${window.location.pathname}?room=${roomCode}&completed=true`;
        window.history.replaceState(null, "", newUrl);

        // Refresh contract data when game ends
        try {
          if (roomCode && userAddress) {
            const orderData = await fetchContractOrderByRoomCode(roomCode);
            setContractOrder(orderData);
          }
        } catch (error) {
          console.error(
            "Failed to refresh contract data after game end:",
            error,
          );
        }

        // Log final board state
        console.log("🏁 Final board FEN:", currentFen);

        // If I won, log it for debugging
        if (endData?.winner === playerColor) {
          console.log("🏆 You won this game!");
        }
      },
    );

    // Add this socket handler for verification success
    socket.on("verification-success", () => {
      console.log("✅ Wallet verification successful!");
      setSignatureStatus("verified");
      setSignatureMessage("Wallet verified! Game starting soon...");
      setRequiresSignature(false);
    });

    socket.on("verification-failed", (data: { message: string }) => {
      setSignatureStatus("failed");
      setSignatureMessage(`Verification failed: ${data.message}`);
      setRequiresSignature(true);

      localStorage.removeItem(`chess-sig-${roomCode}`);
    });

    socket.on("offer-draw", ({ from }: { from: string }) => {
      setDrawOffered(true);
      setDrawOfferFrom(from as "white" | "black");
    });

    socket.on("draw-accepted", () => {
      setTimerRunning(false);
      setGameResult({ winner: null, reason: "Draw by agreement" });
      triggerDrawConfetti();
      setDrawOffered(false);
      setDrawOfferFrom(null);
    });

    socket.on("draw-declined", () => {
      setDrawOffered(false);
      setDrawOfferFrom(null);
    });

    socket.on(
      "player-resigned",
      ({ player, winner }: { player: string; winner: string }) => {
        setTimerRunning(false);
        setGameResult({
          winner,
          reason: `${player === "white" ? "White" : "Black"} resigned`,
        });

        if (winner === playerColor) {
          triggerWinnerConfetti();
        } else {
          triggerLoserConfetti();
        }
      },
    );

    socket.emit("request-room-info", { room: roomCode });

    socket.on(
      "room-info",
      ({
        creatorName,
        joinerName,
      }: {
        creatorName: string;
        joinerName: string;
      }) => {
        if (role === "creator") {
          setMyName(creatorName);
          setOpponentName(joinerName || "Opponent");
        } else {
          setMyName(joinerName);
          setOpponentName(creatorName || "Opponent");
        }
      },
    );

    socket.on("game-state-corrected", (correctedState: any) => {
      console.log("🔄 Server corrected game state due to turn mismatch");

      if (restoreGameState(correctedState)) {
        console.log("✅ Corrected game state applied");
      }
    });

    return () => {
      console.log("🧹 Cleaning up socket connection");
      if (socket) {
        socket.removeAllListeners(); // FIX: Use removeAllListeners() instead of off()
        socket.disconnect();
        socket = undefined;
      }
    };
  }, [roomCode, role, isConnected, userAddress, gameStartedBeforeDisconnect]);

  // Timer logic
  // Update the timer useEffect
  useEffect(() => {
    // Only start timer if game is ready and running
    if (!gameReady || !timerRunning || gameResult) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    // Use more precise timer with elapsed time calculation
    let lastUpdateTime = Date.now();

    timerIntervalRef.current = setInterval(() => {
      if (!timerRunning || !gameReady || gameResult) return;

      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastUpdateTime) / 1000);

      if (elapsedSeconds < 1) return; // Skip if less than 1 second

      lastUpdateTime = now;

      // Update based on active timer
      if (activeTimer === "white") {
        const newWhiteTime = Math.max(0, whiteTime - elapsedSeconds);
        setWhiteTime(newWhiteTime);

        if (newWhiteTime <= 0) {
          handleTimeOut("white");
        }
      } else {
        const newBlackTime = Math.max(0, blackTime - elapsedSeconds);
        setBlackTime(newBlackTime);

        if (newBlackTime <= 0) {
          handleTimeOut("black");
        }
      }
    }, 500); // Check every 500ms instead of 1000ms for better accuracy

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [gameReady, timerRunning, activeTimer, whiteTime, blackTime, gameResult]);

  // Add periodic timer sync
  useEffect(() => {
    if (!gameReady || !timerRunning || gameResult) return;

    // Sync timer with server every 30 seconds to prevent drift
    const syncInterval = setInterval(() => {
      if (socket?.connected) {
        socket.emit("request-game-state", { room: roomCode });
      }
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [gameReady, timerRunning, gameResult, roomCode, socket]);

  useEffect(() => {
    if (!gameResult) {
      setDrawOffered(false);
      setDrawOfferFrom(null);
    }
  }, [gameResult]);

  // Connection status management - track MY connection and share with opponent
  useEffect(() => {
    const handleOnline = () => {
      console.log("✅ Internet connection restored");
      setMyConnectionStatus("online");

      // Immediately notify opponent
      if (socket) {
        socket.emit("player-status-update", {
          room: roomCode,
          status: "online",
        });
        // Also send immediate network status
        socket.emit("network-status", {
          room: roomCode,
          status: "online",
        });
      }
    };

    const handleOffline = () => {
      console.log("❌ Internet connection lost - IMMEDIATE UPDATE");
      setMyConnectionStatus("network-error");

      // Try to send immediate network error status before socket disconnects
      if (socket && socket.connected) {
        socket.emit("network-status", {
          room: roomCode,
          status: "network-error",
        });
      }

      // Also try the regular status update
      if (socket) {
        socket.emit("player-status-update", {
          room: roomCode,
          status: "network-error",
        });
      }
    };

    const handleBeforeUnload = () => {
      console.log("🔄 Page is refreshing - telling opponent");
      setMyConnectionStatus("refreshing");

      // Immediately notify opponent that we're refreshing
      if (socket) {
        socket.emit("player-status-update", {
          room: roomCode,
          status: "refreshing",
        });
        socket.emit("network-status", {
          room: roomCode,
          status: "refreshing",
        });
      }
    };

    // Browser online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Socket connection status handlers
    const handleConnect = () => {
      console.log("✅ Socket connected");
      setMyConnectionStatus("online");
      setIsReconnecting(false);
      setReconnectAttempts(0);

      // Notify opponent we're back online
      socket?.emit("player-status-update", {
        room: roomCode,
        status: "online",
      });
      socket?.emit("network-status", {
        room: roomCode,
        status: "online",
      });
    };

    const handleDisconnect = (reason: string) => {
      console.log("❌ Socket disconnected:", reason);

      if (reason === "io server disconnect") {
        setMyConnectionStatus("disconnected");
      } else {
        setMyConnectionStatus("network-error");
      }

      // Notify opponent about our status if possible
      if (socket && socket.connected) {
        socket.emit("player-status-update", {
          room: roomCode,
          status: myConnectionStatus,
        });
      }
    };

    const handleReconnect = (attemptNumber: number) => {
      console.log(`🔁 Socket reconnected (attempt ${attemptNumber})`);
      setMyConnectionStatus("online");
      setIsReconnecting(false);

      // Notify opponent we reconnected
      socket?.emit("player-status-update", {
        room: roomCode,
        status: "online",
      });
      socket?.emit("network-status", {
        room: roomCode,
        status: "online",
      });
    };

    const handleReconnectAttempt = (attemptNumber: number) => {
      console.log(`🔄 Reconnecting (attempt ${attemptNumber})`);
      setMyConnectionStatus("reconnecting");
      setIsReconnecting(true);
      setReconnectAttempts(attemptNumber);

      // Notify opponent we're reconnecting
      socket?.emit("player-status-update", {
        room: roomCode,
        status: "reconnecting",
      });
    };

    const handleReconnectError = (error: any) => {
      console.error("❌ Reconnection error:", error);
      setMyConnectionStatus("network-error");

      socket?.emit("player-status-update", {
        room: roomCode,
        status: "network-error",
      });
    };

    const handleReconnectFailed = () => {
      console.error("❌ Reconnection failed");
      setMyConnectionStatus("disconnected");
      setIsReconnecting(false);

      socket?.emit("player-status-update", {
        room: roomCode,
        status: "disconnected",
      });
    };

    // NEW: Handle immediate network status updates from opponent
    const handleOpponentNetworkStatus = (data: { status: string }) => {
      console.log(`🌐 IMMEDIATE Opponent network status: ${data.status}`);
      setOpponentRealStatus(data.status as any);
    };

    // Set up socket event listeners
    if (socket) {
      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("reconnect", handleReconnect);
      socket.on("reconnecting", handleReconnectAttempt);
      socket.on("reconnect_error", handleReconnectError);
      socket.on("reconnect_failed", handleReconnectFailed);
      socket.on("opponent-network-status", handleOpponentNetworkStatus);
    }

    return () => {
      // Clean up browser events
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Clean up socket events
      if (socket) {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("reconnect", handleReconnect);
        socket.off("reconnecting", handleReconnectAttempt);
        socket.off("reconnect_error", handleReconnectError);
        socket.off("reconnect_failed", handleReconnectFailed);
        socket.off("opponent-network-status", handleOpponentNetworkStatus);
      }
    };
  }, [socket, roomCode, myConnectionStatus]);

  // Add this socket event handler
  useEffect(() => {
    if (!socket) return;

    // Handle game ended due to lifeline exhaustion
    const handleGameEnded = (data: {
      winner: "white" | "black";
      reason: string;
      details: {
        disconnectedRole: "creator" | "joiner";
        remainingLifelines: number;
        reconnectionAttempted: boolean;
      };
    }) => {
      console.log("🏁 Game ended due to lifeline exhaustion:", data);

      // Stop timer
      setTimerRunning(false);

      // Determine if I won or lost
      const iWon = data.winner === playerColor;

      setGameResult({
        winner: data.winner,
        reason: data.reason,
      });

      // Show appropriate confetti
      if (iWon) {
        triggerWinnerConfetti();
      } else {
        triggerLoserConfetti();
      }

      // Update waiting message
      setWaitingMessage(`Game over: ${data.reason}`);

      // Clear any countdown
      setDisconnectCountdown(null);
      setCountdownEndTime(null);
    };

    // Also handle end-room event for consistency
    const handleEndRoom = (data: {
      winner?: "white" | "black";
      reason?: string;
    }) => {
      console.log("🎯 Room ended:", data);

      if (data.winner !== undefined) {
        setTimerRunning(false);
        setGameResult({
          winner: data.winner,
          reason: data.reason || "Game ended",
        });

        if (data.winner === playerColor) {
          triggerWinnerConfetti();
        } else {
          triggerLoserConfetti();
        }
      }
    };

    socket.on("game-ended", handleGameEnded);
    socket.on("end-room", handleEndRoom);

    return () => {
      socket?.off("game-ended", handleGameEnded);
      socket?.off("end-room", handleEndRoom);
    };
  }, [socket, playerColor]);

  // Share my status with opponent whenever it changes - MORE AGGRESSIVE
  useEffect(() => {
    if (!socket) return;

    console.log(`📤 Sharing my status change: ${myConnectionStatus}`);

    // Emit my current status to opponent using both methods
    socket.emit("player-status-update", {
      room: roomCode,
      status: myConnectionStatus,
    });

    // === ADD THIS SECTION ===
    // For critical status changes, also use the immediate network status
    if (
      myConnectionStatus === "network-error" ||
      myConnectionStatus === "refreshing"
    ) {
      socket.emit("network-status", {
        room: roomCode,
        status: myConnectionStatus,
      });
    }
    // === END OF ADDED SECTION ===
  }, [myConnectionStatus, socket, roomCode]);

  // Track opponent's status from socket events
  useEffect(() => {
    if (!socket) return;

    // When opponent updates their status
    const handleOpponentStatusUpdate = (data: { status: string }) => {
      console.log(`📊 Opponent status updated: ${data.status}`);
      setOpponentRealStatus(data.status as any);
    };

    // Handle immediate network status from opponent
    const handleOpponentNetworkStatus = (data: { status: string }) => {
      console.log(`🌐 IMMEDIATE Opponent network status: ${data.status}`);
      setOpponentRealStatus(data.status as any);
    };

    // When opponent joins
    const handlePlayerJoined = ({ name }: { name: string }) => {
      setOpponentConnected(true);
      setOpponentName(name);
      setOpponentRealStatus("online");
    };

    socket.on("opponent-status-update", handleOpponentStatusUpdate);
    socket.on("opponent-network-status", handleOpponentNetworkStatus);
    socket.on("player-joined", handlePlayerJoined);
    socket.on("room-creator", handlePlayerJoined);

    return () => {
      if (socket) {
        socket.off("opponent-status-update", handleOpponentStatusUpdate);
        socket.off("opponent-network-status", handleOpponentNetworkStatus);
        socket.off("player-joined", handlePlayerJoined);
        socket.off("room-creator", handlePlayerJoined);
      }
    };
  }, [socket]);

  const getWalletSignature = async (
    roomCode: string,
  ): Promise<{ signature: string; timestamp: number } | null> => {
    if (!userAddress || !isConnected || !roomCode) {
      console.log(
        "❌ Cannot get signature: missing userAddress, connection, or roomCode",
      );
      return null;
    }

    try {
      const timestamp = Date.now();
      // CRITICAL: Use the EXACT same message format as server expects
      const message = `ramicoin.com esports chess: ${roomCode}\nTimestamp: ${timestamp}\n\nSign this message to verify your wallet ownership.`;

      console.log("🔐 Requesting wallet signature for:", {
        roomCode,
        timestamp,
        address: userAddress,
      });

      const signature = await signMessageAsync({ message });

      console.log("✅ Wallet signature received:", {
        signature: signature.substring(0, 20) + "...",
        timestamp,
      });

      return { signature, timestamp };
    } catch (error) {
      console.error("❌ Failed to get wallet signature:", error);
      setWaitingMessage("Please sign the wallet message to verify ownership.");
      return null;
    }
  };

  // Add this function in GamePlay.tsx
  const checkGameReadiness = () => {
    if (!socket || !roomCode || !isConnected || !userAddress) return;

    console.log("🔄 Manually checking game readiness");

    // Re-emit join to trigger server-side game ready check
    const signatureData = localStorage.getItem(`chess-sig-${roomCode}`);
    if (signatureData) {
      const { signature, timestamp } = JSON.parse(signatureData);
      socket.emit("join", {
        room: roomCode,
        name: userAddress,
        role,
        walletSignature: signature,
        signatureTimestamp: timestamp,
      });
    }

    // Request fresh room info
    socket.emit("request-room-info", { room: roomCode });

    // Request game state
    socket.emit("request-game-state", { room: roomCode });
  };

  const handleClaimWinnings = async () => {
    if (!contractOrder || !contractOrder.orderId || !gameResult) return;

    setIsClaiming(true);
    try {
      console.log("💰 Claiming winnings for order:", contractOrder.orderId);

      // Check if current user is the winner
      const isWinner = gameResult.winner === playerColor;
      if (!isWinner) {
        alert("Only the winner can claim winnings");
        return;
      }

      // Check if the user is the winner according to contract
      const isContractWinner =
        (playerColor === "white" && contractOrder.winner === "white") ||
        (playerColor === "black" && contractOrder.winner === "black");

      if (!isContractWinner) {
        alert("You are not the winner according to the smart contract");
        return;
      }

      // Check if winner has already withdrawn
      const hasWithdrawn =
        playerColor === "white"
          ? contractOrder.creatorWithdrawn
          : contractOrder.accepterWithdrawn;

      if (hasWithdrawn) {
        alert("Winnings have already been claimed");
        return;
      }

      // Call completeGame on smart contract
      await handleCompleteGame(contractOrder.orderId);

      alert(
        "✅ Winnings claimed successfully! Funds will be transferred to your wallet.",
      );
    } catch (error: any) {
      console.error("❌ Failed to claim winnings:", error);
      alert(error.message || "Failed to claim winnings. Please try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      const gameState = {
        roomCode,
        playerColor,
        fen: gameRef.current.fen(),
        moveHistory,
        whiteTime,
        blackTime,
        timerRunning,
        activeTimer,
        lastReconnect: Date.now(),
      };
      localStorage.setItem(`chess-game-${roomCode}`, JSON.stringify(gameState));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    roomCode,
    playerColor,
    fen,
    moveHistory,
    whiteTime,
    blackTime,
    timerRunning,
    activeTimer,
  ]);

  // Network detection helper
  useEffect(() => {
    const handleNetworkChange = () => {
      if (!navigator.onLine) {
        console.log("🚨 Network offline detected - immediate update");
        setMyConnectionStatus("network-error");

        // Try to send immediate update before socket potentially disconnects
        if (socket && socket.connected) {
          socket.emit("network-status", {
            room: roomCode,
            status: "network-error",
          });
        }
      }
    };

    // Listen for network status changes
    window.addEventListener("online", () => {
      console.log("✅ Network online detected");
      setMyConnectionStatus("online");
    });

    window.addEventListener("offline", handleNetworkChange);

    return () => {
      window.removeEventListener("online", () => {});
      window.removeEventListener("offline", handleNetworkChange);
    };
  }, [socket, roomCode]);

  // In GamePlay.tsx, add this to detect page unload:
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log("🔄 Page is being refreshed or closed");

      // Store game state for potential restoration
      const gameState = {
        roomCode,
        playerColor,
        fen: gameRef.current.fen(),
        moveHistory,
        whiteTime,
        blackTime,
        timerRunning,
        activeTimer,
        lastReconnect: Date.now(),
      };
      localStorage.setItem(`chess-game-${roomCode}`, JSON.stringify(gameState));

      // Notify server we're refreshing (not disconnecting wallet)
      if (socket) {
        socket.emit("player-status-update", {
          room: roomCode,
          status: "refreshing",
        });
        socket.emit("network-status", {
          room: roomCode,
          status: "refreshing",
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    roomCode,
    playerColor,
    fen,
    moveHistory,
    whiteTime,
    blackTime,
    timerRunning,
    activeTimer,
    socket,
  ]);

  // In GamePlay.tsx, add heartbeat
  useEffect(() => {
    if (!socket || !gameReady) return;

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      if (socket && socket.connected) {
        socket?.emit("heartbeat");
      }
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [socket, gameReady]);

  // FIX: Add this useEffect to request game state on mount
  useEffect(() => {
    if (socket?.connected && isConnected && userAddress && roomCode) {
      // Request game state after a short delay
      const timeoutId = setTimeout(() => {
        console.log("📥 Requesting initial game state for room:", roomCode);
        socket?.emit("request-game-state", { room: roomCode });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [socket, isConnected, userAddress, roomCode]);

  // Add this useEffect to handle reconnection properly
  useEffect(() => {
    if (!socket || !gameReady) return;

    const handleReconnect = () => {
      console.log("🔄 Reconnected - requesting fresh game state");

      // Wait a moment then request game state
      setTimeout(() => {
        socket?.emit("request-game-state", { room: roomCode });
        socket?.emit("player-status-update", {
          room: roomCode,
          status: "online",
        });

        // FIX: Also send validate game state to fix any inconsistencies
        socket?.emit("validate-game-state", { room: roomCode });

        // If timer was running, resume it
        if (timerRunning) {
          socket?.emit("resume-timer", { room: roomCode });
        }
      }, 1000);
    };

    socket.on("reconnect", handleReconnect);

    return () => {
      socket?.off("reconnect", handleReconnect);
    };
  }, [socket, gameReady, roomCode, timerRunning]);

  // Add this to handle network reconnection and game state sync
  useEffect(() => {
    if (socket?.connected && myConnectionStatus === "online") {
      // When we come back online, immediately sync with server
      setTimeout(() => {
        console.log("🌐 Network reconnected - syncing game state");
        socket?.emit("request-game-state", { room: roomCode });
        socket?.emit("validate-game-state", { room: roomCode });
      }, 1000);
    }
  }, [myConnectionStatus, socket, roomCode]);

  useEffect(() => {
    if (!socket) return;

    socket.on(
      "require-reverification",
      async (data: { room: string; address: string }) => {
        if (data.room === roomCode && data.address === userAddress) {
          console.log("🔄 Re-verification required");

          // Get new signature using the function
          const signatureData = await getWalletSignature(roomCode);
          if (signatureData) {
            socket?.emit("reverify-wallet", {
              room: roomCode,
              name: userAddress,
              role,
              walletSignature: signatureData.signature,
              signatureTimestamp: signatureData.timestamp,
            });
          }
        }
      },
    );

    return () => {
      socket?.off("require-reverification");
    };
  }, [socket, roomCode, userAddress, role, getWalletSignature]);

  // Helper function to render MY status (for MY section)
  const renderMyStatus = () => {
    const statusConfig = {
      online: {
        text: "online",
      },
      reconnecting: {
        text: `offline (${reconnectAttempts}/5)`,
      },
      disconnected: {
        text: "offline",
      },
      "network-error": {
        text: "offline",
      },
      refreshing: {
        text: "offline",
      },
    };

    const config = statusConfig[myConnectionStatus];

    return (
      <div
        className={`flex-1 p-1 rounded-sm text-center font-ui tracking-normal flex justify-center items-center`}
      >
        <span className="text-xs">{config.text}</span>
      </div>
    );
  };

  // Add this function to sync timer
  const syncTimerWithServer = () => {
    if (!socket || !gameReady) return;

    console.log("🔄 Syncing timer with server");
    socket.emit("request-game-state", { room: roomCode });
  };

  const manualRejoinGame = () => {
    if (!socket || !isConnected || !userAddress) return;

    console.log("🔄 Manually rejoining game");

    // Re-emit join with current data
    socket.emit("join", {
      room: roomCode,
      name: userAddress,
      role,
    });

    // Request game state
    socket.emit("request-game-state", { room: roomCode });

    // Update status
    socket.emit("player-status-update", {
      room: roomCode,
      status: "online",
    });
  };

  // Add timeout handler
  const handleTimeOut = (timedOutColor: "white" | "black") => {
    console.log(`⏰ Timeout: ${timedOutColor}`);

    setTimerRunning(false);
    const winnerColor = timedOutColor === "white" ? "black" : "white";
    setGameResult({ winner: winnerColor, reason: "Time out" });

    if (playerColor === winnerColor) {
      triggerWinnerConfetti();
    } else {
      triggerLoserConfetti();
    }

    socket?.emit("end-room", {
      room: roomCode,
      winner: winnerColor,
      reason: "Time out",
    });
  };

  // Helper function to render OPPONENT status (for OPPONENT section)
  const renderOpponentStatus = () => {
    const statusConfig = {
      online: {
        text: "online",
      },
      reconnecting: {
        text: "offline",
      },
      disconnected: {
        text: "offline",
      },
      "network-error": {
        text: "offline",
      },
      refreshing: {
        text: "offline",
      },
    };

    const config = statusConfig[opponentRealStatus];

    return (
      <div
        className={`flex-1 p-1 rounded-sm text-center font-ui tracking-normal flex justify-center items-center`}
      >
        <span className="text-xs">{config.text}</span>
      </div>
    );
  };

  function onSquareClick(square: string) {
    // ADD THIS CHECK - FIRST THING IN FUNCTION
    if (!isConnected || !userAddress) {
      console.error("❌ Wallet not connected - cannot make move");
      return;
    }

    // Don't allow moves if game is not ready
    if (!gameReady || !timerRunning || gameResult) return;

    // CRITICAL FIX: Validate it's actually the player's turn
    const currentTurn = gameRef.current.turn(); // 'w' or 'b'
    const isMyTurn =
      (playerColor === "white" && currentTurn === "w") ||
      (playerColor === "black" && currentTurn === "b");

    if (!isMyTurn) {
      console.warn(
        `⚠️ Not your turn! Current turn: ${currentTurn}, Your color: ${playerColor}`,
      );

      // Request fresh game state from server
      socket?.emit("request-game-state", { room: roomCode });

      // Also emit validate game state to server
      socket?.emit("validate-game-state", { room: roomCode });
      return;
    }

    // CRITICAL FIX: Validate timer activeTimer matches the turn
    const expectedActiveTimer = currentTurn === "w" ? "white" : "black";
    if (activeTimer !== expectedActiveTimer) {
      console.warn(
        `🔄 Timer mismatch! Fixing: ${activeTimer} -> ${expectedActiveTimer}`,
      );
      setActiveTimer(expectedActiveTimer);

      // Notify server about the mismatch
      if (socket?.connected) {
        socket.emit("validate-game-state", { room: roomCode });
      }
    }

    if (!moveFrom) {
      const piece = gameRef.current.get(square as any);
      const isPlayerPiece =
        piece &&
        ((playerColor === "white" && piece.color === "w") ||
          (playerColor === "black" && piece.color === "b"));

      if (isPlayerPiece && piece.color === gameRef.current.turn()) {
        const moves = gameRef.current.moves({
          square: square as any,
          verbose: true,
        });

        if (moves.length === 0) {
          setOptionSquares({});
          return;
        }

        const newSquares: Record<string, React.CSSProperties> = {};
        moves.forEach((move) => {
          newSquares[move.to] = {
            background:
              gameRef.current.get(move.to as any) &&
              gameRef.current.get(move.to as any)?.color !==
                gameRef.current.get(square as any)?.color
                ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
                : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
            borderRadius: "50%",
          };
        });
        newSquares[square] = {
          background: "rgba(255, 255, 0, 0.4)",
        };
        setOptionSquares(newSquares);
        setMoveFrom(square);
      }
      return;
    }

    const moves = gameRef.current.moves({
      square: moveFrom as any,
      verbose: true,
    });
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square);

    if (!foundMove) {
      const piece = gameRef.current.get(square as any);
      const isPlayerPiece =
        piece &&
        ((playerColor === "white" && piece.color === "w") ||
          (playerColor === "black" && piece.color === "b"));

      if (isPlayerPiece && piece && piece.color === gameRef.current.turn()) {
        const moves = gameRef.current.moves({
          square: square as any,
          verbose: true,
        });

        if (moves.length === 0) {
          setOptionSquares({});
          setMoveFrom("");
          return;
        }

        const newSquares: Record<string, React.CSSProperties> = {};
        moves.forEach((move) => {
          newSquares[move.to] = {
            background:
              gameRef.current.get(move.to as any) &&
              gameRef.current.get(move.to as any)?.color !==
                gameRef.current.get(square as any)?.color
                ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
                : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
            borderRadius: "50%",
          };
        });
        newSquares[square] = {
          background: "rgba(255, 255, 0, 0.4)",
        };
        setOptionSquares(newSquares);
        setMoveFrom(square);
      } else {
        setMoveFrom("");
        setOptionSquares({});
      }
      return;
    }

    try {
      const newGame = new Chess(gameRef.current.fen());

      const moveOptions: any = {
        from: moveFrom,
        to: square,
      };

      const piece = newGame.get(moveFrom as any);
      const isPawn = piece?.type === "p";
      const isPromotionRank = square[1] === "1" || square[1] === "8";

      if (isPawn && isPromotionRank) {
        moveOptions.promotion = "q";
      }

      const moveResult = newGame.move(moveOptions);

      gameRef.current = newGame;
      setFen(newGame.fen());
      setMoveFrom("");
      setOptionSquares({});

      if (moveResult.captured) {
        playCaptureSound();
      } else {
        playMoveSound();
      }

      if (newGame.inCheck()) {
        const kingSquare = getKingInCheckSquare(newGame);
        if (kingSquare) {
          setCheckSquares({
            [kingSquare]: {
              background: "rgba(255, 0, 0, 0.4)",
              borderRadius: "4px",
            },
          });
        }
      } else {
        setCheckSquares({});
      }

      const moveNotation = moveResult.san;

      // FIX: First add move to local history
      const updatedHistory = addMoveToHistoryImmediately(
        moveNotation,
        playerColor,
      );

      // FIX: Calculate new timer values
      const newActiveTimer = newGame.turn() === "w" ? "white" : "black";
      setActiveTimer(newActiveTimer);

      // Update local timer values
      let newWhiteTime = whiteTime;
      let newBlackTime = blackTime;

      if (activeTimer === "white") {
        newWhiteTime = Math.max(0, whiteTime - 1);
        setWhiteTime(newWhiteTime);
      } else {
        newBlackTime = Math.max(0, blackTime - 1);
        setBlackTime(newBlackTime);
      }

      const moveToEmit: any = {
        from: moveFrom,
        to: square,
        fen: newGame.fen(),
        history: updatedHistory,
        whiteTime: playerColor === "white" ? whiteTime - 1 : whiteTime,
        blackTime: playerColor === "black" ? blackTime - 1 : blackTime,
        activeTimer: newActiveTimer,
        timerRunning: timerRunning,
      };

      if (moveResult.promotion) {
        moveToEmit.promotion = moveResult.promotion;
      }

      socket?.emit("move", {
        room: roomCode,
        move: moveToEmit,
      });

      // Check for game end
      if (newGame.isCheckmate()) {
        setTimerRunning(false);
        const winnerColor = newGame.turn() === "w" ? "black" : "white";
        setGameResult({ winner: winnerColor, reason: "Checkmate" });

        if (playerColor === winnerColor) {
          triggerWinnerConfetti();
        } else {
          triggerLoserConfetti();
        }

        // Get the full move history for PGN generation
        const currentMoveHistory = [...moveHistory];

        setTimeout(() => {
          socket?.emit("end-room", {
            room: roomCode,
            winner: winnerColor,
            reason: "Checkmate",
            finalFen: newGame.fen(), // Send final FEN
            moveHistory: currentMoveHistory, // Send move history for PGN
          });
        }, 2000);
      }
      // ADD THIS SECTION FOR STALEMATE DETECTION
      else if (newGame.isStalemate()) {
        setTimerRunning(false);
        setGameResult({ winner: null, reason: "Stalemate" });
        triggerDrawConfetti();

        const currentMoveHistory = [...moveHistory];

        setTimeout(() => {
          socket?.emit("end-room", {
            room: roomCode,
            winner: null,
            reason: "Stalemate",
            finalFen: newGame.fen(),
            moveHistory: currentMoveHistory,
          });
        }, 2000);
      }
    } catch (e) {
      const piece = gameRef.current.get(square as any);
      const isPlayerPiece =
        piece &&
        ((playerColor === "white" && piece.color === "w") ||
          (playerColor === "black" && piece.color === "b"));

      if (isPlayerPiece && piece && piece.color === gameRef.current.turn()) {
        const moves = gameRef.current.moves({
          square: square as any,
          verbose: true,
        });

        if (moves.length > 0) {
          const newSquares: Record<string, React.CSSProperties> = {};
          moves.forEach((move) => {
            newSquares[move.to] = {
              background:
                gameRef.current.get(move.to as any) &&
                gameRef.current.get(move.to as any)?.color !==
                  gameRef.current.get(square as any)?.color
                  ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
                  : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
              borderRadius: "50%",
            };
          });
          newSquares[square] = {
            background: "rgba(255, 255, 0, 0.4)",
          };
          setOptionSquares(newSquares);
          setMoveFrom(square);
        }
      } else {
        setMoveFrom("");
        setOptionSquares({});
      }
    }
  }

  const triggerWinnerConfetti = () => {
    const burstCount = 2;
    const burstDelay = 800;

    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 80,
          origin: { x: 0, y: 0.2 },
          colors: ["#ff0000", "#ffff00", "#ffa500", "#ff00ff"],
          shapes: ["circle", "star"],
          startVelocity: 45,
          gravity: 0.8,
          scalar: 0.6,
          ticks: 200,
          zIndex: 100,
          decay: 0.92,
        });

        confetti({
          particleCount: 80,
          angle: 120,
          spread: 80,
          origin: { x: 1, y: 0.2 },
          colors: ["#00ff00", "#0000ff", "#00ffff", "#0080ff"],
          shapes: ["circle", "square"],
          startVelocity: 45,
          gravity: 0.8,
          scalar: 0.6,
          ticks: 200,
          zIndex: 100,
          decay: 0.92,
        });

        confetti({
          particleCount: 40,
          angle: 75,
          spread: 60,
          origin: { x: 0.2, y: 0.1 },
          colors: ["#ff0000", "#ffff00"],
          startVelocity: 40,
          gravity: 0.7,
          scalar: 0.7,
          ticks: 180,
        });

        confetti({
          particleCount: 40,
          angle: 105,
          spread: 60,
          origin: { x: 0.8, y: 0.1 },
          colors: ["#00ff00", "#00ffff"],
          startVelocity: 40,
          gravity: 0.7,
          scalar: 0.7,
          ticks: 180,
        });

        setTimeout(() => {
          confetti({
            particleCount: 60,
            spread: 180,
            origin: { x: 0.5, y: 0.5 },
            colors: ["#ffffff", "#ffff00", "#ffa500"],
            shapes: ["circle", "star"],
            startVelocity: 30,
            gravity: 0.9,
            scalar: 0.8,
            ticks: 150,
          });
        }, 300);
      }, i * burstDelay);
    }
  };

  const triggerLoserConfetti = () => {
    const burstCount = 5;
    const burstDelay = 1000;

    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 100,
          origin: { x: 0, y: 0.1 },
          colors: ["#333333", "#555555"],
          gravity: 1.8,
          scalar: 0.6,
          ticks: 120,
          startVelocity: 35,
          decay: 0.94,
        });

        confetti({
          particleCount: 80,
          angle: 60,
          spread: 100,
          origin: { x: 1, y: 0.1 },
          colors: ["#444444", "#666666"],
          gravity: 1.8,
          scalar: 0.6,
          ticks: 120,
          startVelocity: 35,
          decay: 0.94,
        });

        setTimeout(() => {
          confetti({
            particleCount: 40,
            spread: 360,
            origin: { x: 0.5, y: 0.4 },
            colors: ["#222222"],
            gravity: 2,
            scalar: 0.4,
            ticks: 80,
            startVelocity: 20,
          });
        }, 400);
      }, i * burstDelay);
    }
  };

  const triggerDrawConfetti = () => {
    const burstCount = 5;
    const burstDelay = 700;

    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => {
        confetti({
          particleCount: 70,
          angle: 65,
          spread: 70,
          origin: { x: 0, y: 0.15 },
          colors: ["#ffd700", "#ffa500"],
          startVelocity: 38,
          gravity: 0.7,
          scalar: 1.1,
          ticks: 200,
        });

        confetti({
          particleCount: 70,
          angle: 115,
          spread: 70,
          origin: { x: 1, y: 0.15 },
          colors: ["#ffff00", "#ffed4e"],
          startVelocity: 38,
          gravity: 0.7,
          scalar: 1.1,
          ticks: 200,
        });

        setTimeout(() => {
          confetti({
            particleCount: 60,
            spread: 120,
            origin: { x: 0.5, y: 0.4 },
            colors: ["#ffd700", "#ffff00", "#ffa500"],
            shapes: ["star"],
            startVelocity: 25,
            gravity: 0.8,
            scalar: 1.2,
            ticks: 180,
          });
        }, 350);
      }, i * burstDelay);
    }
  };

  const renderWalletDisconnectedScreen = () => {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-4">
        <section
          className={`mb-10 md:mb-18 flex flex-col items-center relative py-12 lg:pt-18 2xl:pt-10 lg:pb-[5.5rem] gap-y-4 px-4`}
        >
          <p className="mt-18 text-sm xs:text-base lg:text-2xl text-red-500 text-center max-w-[30ch]">
            please connect your wallet to play
          </p>
          <div className="flex justify-center">
            <Button theme="dandelion" onClick={handleConnectWallet}>
              Connect Wallet
            </Button>
          </div>
        </section>
      </div>
    );
  };

  const renderInvalidRoomCodeScreen = () => {
    // Check if wallet is not connected
    if (!isConnected || !userAddress) {
      return renderWalletDisconnectedScreen();
    }

    return (
      <div className="fixed inset-0 z-50 backdrop-blur-3xl flex flex-col items-center justify-center p-4">
        <section
          className={`mb-10 md:mb-18 max-lg:grid max-lg:grid-cols-subgrid col-start-container-start col-end-container-end place-items-center flex flex-col items-center relative py-12 lg:pt-18 2xl:pt-10 lg:pb-[5.5rem] gap-y-4 max-lg:px-4`}
        >
          <p className="mt-18 mb-5 max-lg:col-content text-sm xs:text-base lg:text-2xl text-fern-1100 border-b-[1px] border-gray-400 text-center max-w-[30ch]">
            roomcode
          </p>
          <h1 className="max-lg:col-content text-fern-1100 font-display text-3xl xs:text-5xl lg:text-7xl col-start-7 col-end-12 font-variation-bold lg:font-variation-extrabold text-center max-w-[13ch]">
            #{roomCode}
          </h1>

          <h3 className="max-lg:col-content text-[#ff0000] font-display text-xl xs:text-3xl lg:text-5xl col-start-7 col-end-12 font-variation-bold lg:font-variation-extrabold text-center max-w-[13ch]">
            room error
          </h3>
          <p className="max-lg:col-content text-sm xs:text-base lg:text-2xl text-fern-1100 text-center max-w-[30ch] tracking-tight">
            {waitingMessage}
          </p>
          {/* </div> */}
          <p className="max-lg:col-content text-sm xs:text-base lg:text-2xl text-center max-w-[30ch]">
            <Button
              theme="dandelion"
              onClick={() => router.push("/play/chess")}
            >
              home
            </Button>
          </p>
        </section>
      </div>
    );
  };

  const renderWaitingScreen = () => {
    if (!isConnected || !userAddress) {
      return renderWalletDisconnectedScreen();
    }

    // Use shortHash if roomCode is not available yet
    const displayRoomCode = roomCode || shortHash || "Loading...";

    return (
      <div className="fixed inset-0 z-50 backdrop-blur-3xl flex flex-col items-center justify-center p-4 overflow-auto">
        <section
          className={`mb-10 md:mb-18 max-lg:grid max-lg:grid-cols-subgrid col-start-container-start col-end-container-end place-items-center flex flex-col items-center relative py-12 lg:pt-18 2xl:pt-10 lg:pb-[5.5rem] gap-y-4 max-lg:px-4`}
        >
          <div
            className={`mt-18 max-lg:col-content flex items-center justify-center gap-4 text-sm xs:text-base lg:text-2xl text-center`}
          >
            <div className="flex flex-col justify-center items-center">
              {/* Left piece */}
              <Image
                src={
                  role === "creator"
                    ? "/chess/piece/alpha/wN.svg"
                    : "/chess/piece/alpha/bN.svg"
                }
                alt="left-piece"
                width={50}
                height={50}
              />
              <div
                className={`text-sm font-ui tracking-tight px-3 bg-blue-100 rounded-full`}
              >
                you
              </div>
            </div>

            {/* VS */}
            <span className="font-ui tracking-tight text-sm">VS</span>

            <div className="flex flex-col justify-center items-center">
              {/* Right piece */}
              <Image
                src={
                  role === "creator"
                    ? "/chess/piece/alpha/bN.svg"
                    : "/chess/piece/alpha/wN.svg"
                }
                alt="right-piece"
                width={50}
                height={50}
              />
              <div
                className={`text-sm font-ui tracking-tight px-3 ${opponentConnected ? "bg-green-500 text-white" : "bg-[#ff0000] text-white"} rounded-full`}
              >
                {opponentConnected ? "online" : "offline"}
              </div>
            </div>
          </div>

          <p className="mt-5 mb-5 max-lg:col-content text-sm xs:text-base lg:text-2xl text-fern-1100 border-b-[1px] border-gray-400 text-center max-w-[30ch]">
            roomcode
          </p>
          <h1 className="max-lg:col-content text-fern-1100 font-display text-3xl xs:text-5xl lg:text-7xl col-start-7 col-end-12 font-variation-bold lg:font-variation-extrabold text-center max-w-[13ch]">
            #{displayRoomCode}
          </h1>

          <p className="max-lg:col-content text-sm xs:text-base lg:text-2xl text-red-500 text-center max-w-[30ch] lowercase">
            {waitingMessage || "Waiting for opponent to join..."}
          </p>
          <div className="max-lg:col-content text-sm xs:text-base lg:text-2xl text-center max-w-[30ch]">
            <BlackSpinner />
          </div>
        </section>
      </div>
    );
  };

  {
    /* {gameReady} */
  }
  const addMoveToHistoryImmediately = (
    move: string,
    color: "white" | "black",
  ) => {
    console.log(`📝 Adding move to history: ${color} - ${move}`);

    setMoveHistory((prev) => {
      const newHistory = [...prev];

      if (color === "white") {
        // White's turn - add new pair
        newHistory.push({ white: move, black: "" });
      } else {
        // Black's turn - update last pair or add new
        if (newHistory.length > 0) {
          const lastIndex = newHistory.length - 1;
          const lastMove = newHistory[lastIndex];

          if (lastMove.white && !lastMove.black) {
            // Fill in black move
            newHistory[lastIndex] = { ...lastMove, black: move };
          } else {
            // White hasn't moved in this pair yet (shouldn't happen)
            newHistory.push({ white: "", black: move });
          }
        } else {
          // First move is black (unusual but possible)
          newHistory.push({ white: "", black: move });
        }
      }

      console.log("📊 Updated move history:", newHistory);
      return newHistory;
    });
  };

  // Update the existing addMoveToHistory to use this pattern
  const addMoveToHistory = useCallback(
    (move: string, color: "white" | "black") => {
      console.log(`📝 Adding move to history: ${color} - ${move}`);

      setMoveHistory((prev) => {
        const newHistory = [...prev];

        if (color === "white") {
          newHistory.push({ white: move, black: "" });
        } else {
          if (newHistory.length > 0) {
            const lastIndex = newHistory.length - 1;
            const lastMove = newHistory[lastIndex];

            if (lastMove.white && !lastMove.black) {
              newHistory[lastIndex] = { ...lastMove, black: move };
            } else {
              newHistory.push({ white: "", black: move });
            }
          } else {
            newHistory.push({ white: "", black: move });
          }
        }

        setLastMoveIndex(newHistory.length - 1);
        console.log("📊 Move history updated:", newHistory);
        return newHistory;
      });
    },
    [],
  );

  const convertMoveHistoryToPairs = useCallback(
    (moveHistory: any[]): { white: string; black: string }[] => {
      if (!Array.isArray(moveHistory)) {
        console.error("❌ Invalid move history format:", moveHistory);
        return [];
      }

      console.log("🔄 Converting move history to pairs:", moveHistory);

      const pairs: { white: string; black: string }[] = [];

      // Group moves into white-black pairs
      for (let i = 0; i < moveHistory.length; i++) {
        const move = moveHistory[i];

        // Get move notation - prioritize SAN, fallback to from-to
        let moveNotation = "";
        if (move.san) {
          moveNotation = move.san;
        } else if (move.from && move.to) {
          moveNotation = `${move.from}${move.to}`;
        } else {
          continue; // Skip invalid move
        }

        if (i % 2 === 0) {
          // White's move (even index)
          pairs.push({ white: moveNotation, black: "" });
        } else {
          // Black's move (odd index)
          const pairIndex = Math.floor(i / 2);

          if (pairIndex < pairs.length) {
            // Update existing pair
            pairs[pairIndex] = { ...pairs[pairIndex], black: moveNotation };
          } else {
            // Shouldn't happen, but handle it
            pairs.push({ white: "", black: moveNotation });
          }
        }
      }

      console.log("✅ Converted pairs:", pairs);
      return pairs;
    },
    [],
  );

  const restoreGameState = useCallback(
    (gameState: any) => {
      console.log("🔄 Attempting to restore game state:", {
        hasGameState: !!gameState,
        hasFen: !!gameState?.fen,
        timerRunning: gameState?.timerRunning,
      });

      if (!gameState || !gameState.fen) {
        console.log("⚠️ No valid game state to restore, starting fresh");
        // Start fresh game
        const newGame = new Chess();
        gameRef.current = newGame;
        setFen(newGame.fen());
        setMoveHistory([]);
        setWhiteTime(timerMinutes * 60);
        setBlackTime(timerMinutes * 60);
        setTimerRunning(false);
        return true; // Return true to indicate we handled it (fresh start)
      }

      try {
        const restoredGame = new Chess();
        restoredGame.load(gameState.fen);
        gameRef.current = restoredGame;
        setFen(gameState.fen);

        // Restore timer if available
        if (
          gameState.whiteTime !== undefined &&
          gameState.blackTime !== undefined
        ) {
          setWhiteTime(gameState.whiteTime);
          setBlackTime(gameState.blackTime);
          setTimerRunning(gameState.timerRunning || false);
          setActiveTimer(gameState.activeTimer || "white");
        }

        // Restore move history if available
        if (gameState.moveHistory && Array.isArray(gameState.moveHistory)) {
          const convertedPairs = convertMoveHistoryToPairs(
            gameState.moveHistory,
          );
          setMoveHistory(convertedPairs);
        }

        console.log("✅ Game state restored successfully");
        return true;
      } catch (error) {
        console.error("❌ Failed to restore game state:", error);
        return false;
      }
    },
    [convertMoveHistoryToPairs],
  );

  const getMergedSquareStyles = useCallback((): Record<
    string,
    React.CSSProperties
  > => {
    const mergedStyles: Record<string, React.CSSProperties> = {};

    Object.entries(checkSquares).forEach(([square, style]) => {
      mergedStyles[square] = { ...style };
    });

    Object.entries(optionSquares).forEach(([square, style]) => {
      if (!mergedStyles[square]) {
        mergedStyles[square] = { ...style };
      } else {
        mergedStyles[square] = {
          ...mergedStyles[square],
          ...style,
          background: mergedStyles[square].background,
        };
      }
    });

    return mergedStyles;
  }, [checkSquares, optionSquares]);

  const validateGameState = useCallback(() => {
    if (!gameReady || !fen) return false;

    try {
      const chess = new Chess(fen);
      const currentTurn = chess.turn() === "w" ? "white" : "black";

      // Check if activeTimer matches the actual turn
      if (activeTimer !== currentTurn) {
        console.warn(
          `🔄 Turn mismatch detected! Fixing: ${activeTimer} -> ${currentTurn}`,
        );
        setActiveTimer(currentTurn);

        // Also check if it's actually the player's turn
        const isMyTurn =
          (playerColor === "white" && chess.turn() === "w") ||
          (playerColor === "black" && chess.turn() === "b");

        if (!isMyTurn && timerRunning) {
          console.log(`⏳ Not your turn, it's ${currentTurn}'s turn`);
        }

        return false;
      }

      return true;
    } catch (error) {
      console.error("❌ Failed to validate game state:", error);
      return false;
    }
  }, [gameReady, fen, activeTimer, playerColor, timerRunning]);

  // Add this effect to periodically check if game should have started
  useEffect(() => {
    if (!gameReady && socket?.connected && isConnected && userAddress) {
      // Check every 2 seconds if game should have started
      const interval = setInterval(() => {
        console.log("🔄 Checking if game should have started...");
        socket?.emit("request-game-state", { room: roomCode });
        socket?.emit("request-room-info", { room: roomCode });
      }, 2000);

      // Clear after 30 seconds
      setTimeout(() => {
        clearInterval(interval);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [gameReady, socket, isConnected, userAddress, roomCode]);

  // Add this useEffect to auto-detect game readiness
  useEffect(() => {
    if (!socket || !isConnected || !userAddress || gameReady) return;

    // If we have a valid game state in localStorage, try to restore it
    const savedGameState = localStorage.getItem(`chess-game-${roomCode}`);
    if (savedGameState) {
      try {
        const gameState = JSON.parse(savedGameState);
        console.log("🔄 Found saved game state, attempting to restore");
        if (restoreGameState(gameState)) {
          setGameReady(true);
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ Failed to restore saved game state:", error);
      }
    }

    // Request game state immediately
    const timeoutId = setTimeout(() => {
      console.log("📥 Initial game state request for room:", roomCode);
      socket?.emit("request-game-state", { room: roomCode });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [socket, isConnected, userAddress, roomCode, gameReady, restoreGameState]);

  // Add this useEffect to periodically check game state
  useEffect(() => {
    if (!socket || !isConnected || !userAddress || gameReady || gameResult)
      return;

    // Check every 3 seconds if game should have started
    const checkInterval = setInterval(() => {
      if (!gameReady && socket?.connected) {
        console.log("🔄 Periodic game state check...");
        socket?.emit("request-game-state", { room: roomCode });
        socket?.emit("request-room-info", { room: roomCode });
      }
    }, 3000);

    return () => clearInterval(checkInterval);
  }, [socket, isConnected, userAddress, gameReady, gameResult, roomCode]);

  // Add periodic game state validation
  useEffect(() => {
    if (!gameReady || !timerRunning || gameResult) return;

    // Validate game state every 10 seconds to prevent drift
    const validateInterval = setInterval(() => {
      if (socket?.connected) {
        // Request fresh game state from server
        socket.emit("request-game-state", { room: roomCode });

        // Also validate locally
        validateGameState();
      }
    }, 10000);

    return () => clearInterval(validateInterval);
  }, [
    gameReady,
    timerRunning,
    gameResult,
    roomCode,
    socket,
    validateGameState,
  ]);

  // Add game state validation every 5 seconds
  useEffect(() => {
    if (!gameReady || !timerRunning || gameResult) return;

    const validationInterval = setInterval(() => {
      validateGameState();
    }, 5000);

    return () => clearInterval(validationInterval);
  }, [gameReady, timerRunning, gameResult, validateGameState]);

  // Add these socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Handle lifeline updates
    const handleLifelinesUpdated = (data: {
      creatorLifelines: number;
      joinerLifelines: number;
    }) => {
      console.log("📊 Lifelines updated:", data);

      if (role === "creator") {
        setMyLifelines(data.creatorLifelines);
        setOpponentLifelines(data.joinerLifelines);
      } else {
        setMyLifelines(data.joinerLifelines);
        setOpponentLifelines(data.creatorLifelines);
      }
    };

    // Handle opponent disconnect with countdown
    const handleOpponentDisconnectedDetails = (data: {
      status: string;
      reason: string;
      remainingLifelines: number;
      role: "creator" | "joiner";
      countdownStart: number;
      countdownDuration: number;
      reconnectWindow: number;
    }) => {
      console.log("⚠️ Opponent disconnected with details:", data);

      // Determine if it's my opponent
      const isOpponent = data.role !== role;
      if (isOpponent) {
        setOpponentLifelines(data.remainingLifelines);
        setDisconnectCountdown(data.countdownDuration / 1000); // Convert to seconds
        setCountdownEndTime(Date.now() + data.countdownDuration);

        // Show message
        setWaitingMessage(
          `Opponent disconnected. ${data.remainingLifelines} lifelines remaining. Reconnect within 30 seconds.`,
        );

        // Pause timer locally
        setTimerRunning(false);
      }
    };

    // Handle opponent reconnection
    const handleOpponentReconnected = (data: {
      status: string;
      role: "creator" | "joiner";
      remainingLifelines: number;
      reconnectionTime: number;
    }) => {
      console.log("✅ Opponent reconnected:", data);

      const isOpponent = data.role !== role;
      if (isOpponent) {
        setOpponentLifelines(data.remainingLifelines);
        setDisconnectCountdown(null);
        setCountdownEndTime(null);
        setWaitingMessage("");

        // Resume timer
        if (gameReady && !gameResult) {
          setTimerRunning(true);
        }
      }
    };

    // Handle new countdown (for subsequent lifelines)
    const handleNewCountdownStarted = (data: {
      role: "creator" | "joiner";
      remainingLifelines: number;
      countdownDuration: number;
    }) => {
      const isOpponent = data.role !== role;
      if (isOpponent) {
        setOpponentLifelines(data.remainingLifelines);
        setDisconnectCountdown(data.countdownDuration / 1000);
        setCountdownEndTime(Date.now() + data.countdownDuration);

        setWaitingMessage(
          `Opponent didn't reconnect. ${data.remainingLifelines} lifelines remaining. New 2-minute countdown started.`,
        );
      }
    };

    socket.on("lifelines-updated", handleLifelinesUpdated);
    socket.on(
      "opponent-disconnected-details",
      handleOpponentDisconnectedDetails,
    );
    socket.on("opponent-reconnected", handleOpponentReconnected);
    socket.on("new-countdown-started", handleNewCountdownStarted);

    return () => {
      socket?.off("lifelines-updated", handleLifelinesUpdated);
      socket?.off(
        "opponent-disconnected-details",
        handleOpponentDisconnectedDetails,
      );
      socket?.off("opponent-reconnected", handleOpponentReconnected);
      socket?.off("new-countdown-started", handleNewCountdownStarted);
    };
  }, [socket, role, gameReady, gameResult]);

  // Add this effect for countdown timer
  useEffect(() => {
    if (!disconnectCountdown || !countdownEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(
        0,
        Math.floor((countdownEndTime - now) / 1000),
      );

      if (remaining <= 0) {
        setDisconnectCountdown(null);
        setCountdownEndTime(null);
      } else {
        setDisconnectCountdown(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [disconnectCountdown, countdownEndTime]);

  // In client
  useEffect(() => {
    if (!socket || !gameReady) return;

    const syncInterval = setInterval(() => {
      socket?.emit("get-lifelines", { room: roomCode });
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [socket, gameReady, roomCode]);

  // game action modals
  // Draw Offer Modal Component
  const DrawOfferModal = ({
    onClose,
    onConfirm,
  }: {
    onClose: () => void;
    onConfirm: () => void;
  }) => {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute -top-16 left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[#ede4de] text-lg font-bold lowercase shadow-md hover:bg-[#ede4de]"
          >
            ×
          </button>

          <div className="flex w-full max-w-[300px] lg:max-w-[500px] flex-col gap-4 rounded-sm bg-[#ede4de] p-5">
            <div className="flex w-full items-center gap-3 bg-[#c7c5c4]/50 rounded-sm py-3">
              <div className="h-14 w-14 shrink-0">
                <Image
                  src="/chess/piece/alpha/wN.svg"
                  width={56}
                  height={56}
                  alt="ramicoin"
                  className="h-full w-full rounded-sm object-cover"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-ui font-bold tracking-tight text-xl sm:text-2xl lg:text-3xl truncate">
                  ramicoin.com
                </span>
                <span className="text-sm opacity-70">esports</span>
              </div>
            </div>

            <div className="border-t border-dashed border-neutral-700" />

            <div className="grid grid-cols-2 gap-4 px-2 font-ui tracking-wide text-black">
              <div>
                <span className="text-xs opacity-70">roomcode:</span>
                <span className="block text-lg">
                  #{roomCode || shortHash || "Loading..."}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs opacity-70">game size:</span>
                <span className="block text-lg">
                  {gameAmount} {currency}
                </span>
              </div>
            </div>

            <div className="px-2 font-ui">
              <span className="text-xs opacity-70">player:</span>
              <span className="block break-all text-sm">
                {userAddress ? userAddress : "Not connected"}
              </span>
            </div>

            <div className="border-t border-dashed border-neutral-700" />
          </div>

          <Button theme="magenta" className="mt-1 w-full" onClick={onConfirm}>
            Send Draw Request
          </Button>
        </div>
      </div>
    );
  };

  // Cancel Draw Modal Component
  const CancelDrawModal = ({
    onClose,
    onConfirm,
  }: {
    onClose: () => void;
    onConfirm: () => void;
  }) => {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute -top-16 left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[#ede4de] text-lg font-bold lowercase shadow-md hover:bg-[#ede4de]"
          >
            ×
          </button>

          <div className="flex w-full max-w-[300px] lg:max-w-[500px] flex-col gap-4 rounded-sm bg-[#ede4de] p-5">
            <div className="flex w-full items-center gap-3 bg-[#c7c5c4]/50 rounded-sm py-3">
              <div className="h-14 w-14 shrink-0">
                <Image
                  src="/chess/piece/alpha/wN.svg"
                  width={56}
                  height={56}
                  alt="ramicoin"
                  className="h-full w-full rounded-sm object-cover"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-ui font-bold tracking-tight text-xl sm:text-2xl lg:text-3xl truncate">
                  ramicoin.com
                </span>
                <span className="text-sm opacity-70">esports</span>
              </div>
            </div>

            <div className="border-t border-dashed border-neutral-700" />

            <div className="grid grid-cols-2 gap-4 px-2 font-ui tracking-wide text-black">
              <div>
                <span className="text-xs opacity-70">roomcode:</span>
                <span className="block text-lg">
                  #{roomCode || shortHash || "Loading..."}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs opacity-70">game size:</span>
                <span className="block text-lg">
                  {gameAmount} {currency}
                </span>
              </div>
            </div>

            <div className="px-2 font-ui">
              <span className="text-xs opacity-70">player:</span>
              <span className="block break-all text-sm">
                {userAddress ? userAddress : "Not connected"}
              </span>
            </div>

            <div className="px-2 font-ui">
              <span className="text-xs opacity-70">
                cancel your draw request
              </span>
            </div>

            <div className="border-t border-dashed border-neutral-700" />
          </div>

          <Button
            theme="damarnotukdo"
            className="mt-1 w-full"
            onClick={onConfirm}
          >
            Cancel Draw Request
          </Button>
        </div>
      </div>
    );
  };

  // Accept Draw Modal Component
  const AcceptDrawModal = ({
    onClose,
    onConfirm,
  }: {
    onClose: () => void;
    onConfirm: () => void;
  }) => {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute -top-16 left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[#ede4de] text-lg font-bold lowercase shadow-md hover:bg-[#ede4de]"
          >
            ×
          </button>

          <div className="flex w-full max-w-[300px] lg:max-w-[500px] flex-col gap-4 rounded-sm bg-[#ede4de] p-5">
            <div className="flex w-full items-center gap-3 bg-[#c7c5c4]/50 rounded-sm py-3">
              <div className="h-14 w-14 shrink-0">
                <Image
                  src="/chess/piece/alpha/wN.svg"
                  width={56}
                  height={56}
                  alt="ramicoin"
                  className="h-full w-full rounded-sm object-cover"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-ui font-bold tracking-tight text-xl sm:text-2xl lg:text-3xl truncate">
                  ramicoin.com
                </span>
                <span className="text-sm opacity-70">esports</span>
              </div>
            </div>

            <div className="border-t border-dashed border-neutral-700" />

            <div className="grid grid-cols-2 gap-4 px-2 font-ui tracking-wide text-black">
              <div>
                <span className="text-xs opacity-70">roomcode:</span>
                <span className="block text-lg">
                  #{roomCode || shortHash || "Loading..."}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs opacity-70">game size:</span>
                <span className="block text-lg">
                  {gameAmount} {currency}
                </span>
              </div>
            </div>

            <div className="px-2 font-ui">
              <span className="text-xs opacity-70">opponent:</span>
              <span className="block break-all text-sm">
                {opponentName ? opponentName : "opponent"}
              </span>
            </div>

            <div className="px-2 font-ui">
              <span className="text-xs opacity-70">offered draw</span>
            </div>

            <div className="border-t border-dashed border-neutral-700" />
          </div>

          <Button theme="magenta" className="mt-1 w-full" onClick={onConfirm}>
            Accept Draw
          </Button>
        </div>
      </div>
    );
  };

  // Decline Draw Modal Component
  const DeclineDrawModal = ({
    onClose,
    onConfirm,
  }: {
    onClose: () => void;
    onConfirm: () => void;
  }) => {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute -top-16 left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[#ede4de] text-lg font-bold lowercase shadow-md hover:bg-[#ede4de]"
          >
            ×
          </button>

          <div className="flex w-full max-w-[300px] lg:max-w-[500px] flex-col gap-4 rounded-sm bg-[#ede4de] p-5">
            <div className="flex w-full items-center gap-3 bg-[#c7c5c4]/50 rounded-sm py-3">
              <div className="h-14 w-14 shrink-0">
                <Image
                  src="/chess/piece/alpha/wN.svg"
                  width={56}
                  height={56}
                  alt="ramicoin"
                  className="h-full w-full rounded-sm object-cover"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-ui font-bold tracking-tight text-xl sm:text-2xl lg:text-3xl truncate">
                  ramicoin.com
                </span>
                <span className="text-sm opacity-70">esports</span>
              </div>
            </div>

            <div className="border-t border-dashed border-neutral-700" />

            <div className="grid grid-cols-2 gap-4 px-2 font-ui tracking-wide text-black">
              <div>
                <span className="text-xs opacity-70">roomcode:</span>
                <span className="block text-lg">
                  #{roomCode || shortHash || "Loading..."}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs opacity-70">game size:</span>
                <span className="block text-lg">
                  {gameAmount} {currency}
                </span>
              </div>
            </div>

            <div className="px-2 font-ui">
              <span className="text-xs opacity-70">opponent:</span>
              <span className="block break-all text-sm">
                {opponentName ? opponentName : "opponent"}
              </span>
            </div>

            <div className="px-2 font-ui">
              <span className="text-xs opacity-70">offered draw</span>
            </div>

            <div className="border-t border-dashed border-neutral-700" />
          </div>

          <Button theme="tomato" className="mt-1 w-full" onClick={onConfirm}>
            Decline Draw
          </Button>
        </div>
      </div>
    );
  };

  // Resign Modal Component
  const ResignModal = ({
    onClose,
    onConfirm,
  }: {
    onClose: () => void;
    onConfirm: () => void;
  }) => {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute -top-16 left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[#ede4de] text-lg font-bold lowercase shadow-md hover:bg-[#ede4de]"
          >
            ×
          </button>

          <div className="flex w-full max-w-[300px] lg:max-w-[500px] flex-col gap-4 rounded-sm bg-[#ede4de] p-5">
            <div className="flex w-full items-center gap-3 bg-[#c7c5c4]/50 rounded-sm py-3">
              <div className="h-14 w-14 shrink-0">
                <Image
                  src="/chess/piece/alpha/wN.svg"
                  width={56}
                  height={56}
                  alt="ramicoin"
                  className="h-full w-full rounded-sm object-cover"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-ui font-bold tracking-tight text-xl sm:text-2xl lg:text-3xl truncate">
                  ramicoin.com
                </span>
                <span className="text-sm opacity-70">esports</span>
              </div>
            </div>

            <div className="border-t border-dashed border-neutral-700" />

            <div className="grid grid-cols-2 gap-4 px-2 font-ui tracking-wide text-black">
              <div>
                <span className="text-xs opacity-70">roomcode:</span>
                <span className="block text-lg">
                  #{roomCode || shortHash || "Loading..."}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs opacity-70">game size:</span>
                <span className="block text-lg">
                  {gameAmount} {currency}
                </span>
              </div>
            </div>

            <div className="px-2 font-ui">
              <span className="text-xs opacity-70">player:</span>
              <span className="block break-all text-sm">
                {userAddress ? userAddress : <BlackSpinner />}
              </span>
            </div>

            <div className="px-2 font-ui">
              <span className="text-xs opacity-70 text-red-600">
                you will lose this game
              </span>
            </div>

            <div className="border-t border-dashed border-neutral-700" />
          </div>

          <Button theme="tomato" className="mt-1 w-full" onClick={onConfirm}>
            Confirm Resign
          </Button>
        </div>
      </div>
    );
  };

  const offerDraw = () => {
    // ADD THIS CHECK
    if (!isConnected || !userAddress) {
      console.error("❌ Wallet not connected - cannot offer draw");
      return;
    }

    // Don't allow draw if game is not ready
    if (!gameReady) return;

    setShowDrawOfferModal(true);
  };

  const handleDrawOfferConfirm = () => {
    setDrawOffered(true);
    setDrawOfferFrom(playerColor);

    socket?.emit("offer-draw", {
      room: roomCode,
      from: playerColor,
    });

    setShowDrawOfferModal(false);
  };

  const handleCancelDrawConfirm = () => {
    socket?.emit("decline-draw", { room: roomCode });
    setDrawOffered(false);
    setDrawOfferFrom(null);
    setShowCancelDrawModal(false);
  };

  const acceptDraw = () => {
    if (!isConnected || !userAddress) {
      console.error("❌ Wallet not connected - cannot accept draw");
      return;
    }

    if (!gameReady) return;

    setShowAcceptDrawModal(true);
  };

  const declineDraw = () => {
    // Don't allow decline draw if game is not ready
    if (!gameReady) return;

    // If it's my own draw offer, show cancel modal
    if (drawOffered && drawOfferFrom === playerColor) {
      setShowCancelDrawModal(true);
    } else {
      // For opponent's draw offer, show decline modal
      setShowDeclineDrawModal(true);
    }
  };

  const handleAcceptDrawConfirm = () => {
    socket?.emit("accept-draw", { room: roomCode });
    socket?.emit("game-completed", { room: roomCode });

    setTimerRunning(false);
    setGameResult({ winner: null, reason: "Draw by agreement" });
    setDrawOffered(false);
    setDrawOfferFrom(null);
    setShowAcceptDrawModal(false);
  };

  const handleDeclineDrawConfirm = () => {
    socket?.emit("decline-draw", { room: roomCode });
    setDrawOffered(false);
    setDrawOfferFrom(null);
    setShowDeclineDrawModal(false);
  };

  // const resignGame = () => {
  //   // ADD THIS CHECK
  //   if (!isConnected || !userAddress) {
  //     console.error("❌ Wallet not connected - cannot offer draw");
  //     return;
  //   }
  //   // Don't allow resign if game is not ready
  //   if (!gameReady) return;

  //   if (
  //     !confirm(
  //       "Are you sure you want to resign? This will end the game and your opponent will win."
  //     )
  //   ) {
  //     return;
  //   }

  //   const winner = playerColor === "white" ? "black" : "white";

  //   socket?.emit("resign", {
  //     room: roomCode,
  //     player: playerColor,
  //     winner: winner,
  //   });

  //   // Notify server game is completed
  //   socket?.emit("game-completed", { room: roomCode });

  //   setTimerRunning(false);
  //   setGameResult({ winner, reason: `${playerColor} resigned` });
  // };

  const resignGame = () => {
    if (!isConnected || !userAddress) {
      console.error("❌ Wallet not connected - cannot resign");
      return;
    }

    if (!gameReady) return;

    setShowResignModal(true);
  };

  const handleResignConfirm = () => {
    const winner = playerColor === "white" ? "black" : "white";

    socket?.emit("resign", {
      room: roomCode,
      player: playerColor,
      winner: winner,
    });

    socket?.emit("game-completed", { room: roomCode });

    setTimerRunning(false);
    setGameResult({ winner, reason: `${playerColor} resigned` });
    setShowResignModal(false);
  };

  // Add this helper function for manual resync
  const manualResync = () => {
    if (!socket) return;

    console.log("🔄 Manually resyncing game state");

    // Request fresh game state
    socket.emit("request-game-state", { room: roomCode });

    // Also validate game state on server
    socket.emit("validate-game-state", { room: roomCode });

    // Validate locally
    validateGameState();

    alert("Game state resynced with server");
  };

  // Add a resync button component (optional, add wherever you want in the UI)
  const renderResyncButton = () => {
    if (!gameReady || gameResult) return null;

    return (
      <button
        onClick={manualResync}
        className="px-3 py-1 bg-gray-200 text-gray-800 text-xs rounded hover:bg-gray-300 mt-2"
        title="Resync game state"
      >
        🔄 Resync Game
      </button>
    );
  };

  const renderOpponentDrawStatus = () => {
    const gameActive = timerRunning && !gameResult;

    if (!gameActive) return null;

    if (drawOffered && drawOfferFrom === playerColor) {
      return (
        <div className="flex gap-1 p-2">
          <div className="text-xs text-white flex justify-center items-center bg-pink-600 rounded-sm px-3 py-2">
            <WhiteSpinner />
            <span className="ml-2 flex justify-center items-center">
              {!isSmallScreen ? "Draw offer sent" : "sent"}
            </span>
          </div>
        </div>
      );
    }

    if (drawOffered && drawOfferFrom !== playerColor) {
      return (
        <div className="flex gap-1 p-2">
          <div className="text-xs text-white flex justify-center items-center bg-gradient-to-r from-blue-500 to-purple-500 rounded-sm px-3 py-2">
            <WhiteSpinner />
            <span className="ml-2 flex justify-center items-center">
              {!isSmallScreen ? "Match draw request" : "draw"}
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderMyDrawButtons = () => {
    const gameActive = timerRunning && !gameResult;

    if (!gameActive) return null;

    if (drawOffered) {
      if (drawOfferFrom === playerColor) {
        return (
          <button
            type="button"
            onClick={() => setShowCancelDrawModal(true)}
            className="text-white bg-black font-medium rounded-sm text-sm px-4 py-2 w-full"
          >
            {!isSmallScreen ? "Cancel Draw" : "×"}
          </button>
        );
      } else {
        return (
          <div className="flex gap-1 w-full">
            <button
              type="button"
              onClick={() => setShowAcceptDrawModal(true)}
              className={`text-white bg-blue-500 font-normal font-ui tracking-tight rounded-sm text-xs focus:outline-none hover:bg-blue-700 transition-colors flex-1 ${!isSmallScreen ? "px-1 py-1" : "px-4 py-2"}`}
            >
              {!isSmallScreen ? "Accept Draw" : "✓"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeclineDrawModal(true)}
              className={`text-white bg-purple-500 font-normal font-ui tracking-tight rounded-sm text-xs focus:outline-none hover:bg-purple-700 transition-colors flex-1 ${!isSmallScreen ? "px-1 py-1" : "px-4 py-2"}`}
            >
              {!isSmallScreen ? "Decline Draw" : "×"}
            </button>
          </div>
        );
      }
    }

    return (
      <button
        type="button"
        onClick={offerDraw}
        disabled={!gameActive}
        className="text-white bg-[#ff8400] font-medium font-ui tracking-tighter rounded-sm text-sm px-4 py-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e67600] transition-colors w-full"
      >
        {isSmallScreen ? "D" : "Offer Draw"}
      </button>
    );
  };

  const renderMyResignButton = () => {
    const gameActive = timerRunning && !gameResult;

    if (!gameActive) return null;

    return (
      <button
        type="button"
        onClick={() => setShowResignModal(true)}
        disabled={!gameActive}
        className={`text-white bg-[#ff0000] font-normal font-ui tracking-tighter rounded-sm text-sm px-4 py-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#cc0000] transition-colors w-full ${drawOffered && drawOfferFrom !== playerColor ? "hidden" : ""}`}
      >
        {isSmallScreen ? "R" : "Resign"}
      </button>
    );
  };

  const extractMoveNotation = (move: string): string => {
    if (!move) return "";

    // Remove piece indicators for display
    if (move.includes("→")) {
      return move.split("→")[1];
    }

    // Handle SAN notation
    if (move.includes("x")) {
      return move.replace(/^[NBRQK]?/, "");
    }

    // Handle castling
    if (move.includes("O-O")) {
      return move;
    }

    return move.replace(/^[NBRQK]/, "");
  };

  const renderPieceImage = (move: string) => {
    if (!move || move.includes("O-O")) return null;

    let pieceType = "p"; // default pawn

    if (move.startsWith("N")) pieceType = "n";
    else if (move.startsWith("B")) pieceType = "b";
    else if (move.startsWith("R")) pieceType = "r";
    else if (move.startsWith("Q")) pieceType = "q";
    else if (move.startsWith("K")) pieceType = "k";

    // Determine color based on move notation (simplistic)
    const isWhiteMove = !move.includes("x") && move.toLowerCase() === move;
    const pieceColor = isWhiteMove ? "w" : "b";
    const imagePath = `/chess/piece/alpha/${pieceColor}${pieceType.toUpperCase()}.svg`;

    return (
      <Image
        src={imagePath}
        alt={`${pieceColor === "w" ? "white" : "black"} ${pieceType}`}
        width={20}
        height={20}
        className="inline-block"
      />
    );
  };

  // Update the renderGameOverScreen to show proper message
  const renderGameOverScreen = () => {
    if (!gameResult) return null;

    const iWon = gameResult.winner === playerColor;

    return (
      <section
        className={`mb-10 md:mb-18 max-lg:grid max-lg:grid-cols-subgrid col-start-container-start col-end-container-end place-items-center flex flex-col items-center relative py-12 lg:pt-18 2xl:pt-10 lg:pb-[5.5rem] gap-y-4 max-lg:px-4`}
      >
        <p className="mt-9 lg:mt-1 max-lg:col-content text-sm xs:text-base lg:text-2xl text-red-500 text-center max-w-[30ch]">
          🔥
        </p>
        <h1 className="max-lg:col-content text-fern-1100 font-display text-3xl xs:text-5xl lg:text-7xl col-start-7 col-end-12 font-variation-bold lg:font-variation-extrabold text-center max-w-[13ch]">
          game over
        </h1>
        <p className="italic tracking-wide max-lg:col-content text-sm xs:text-base lg:text-2xl text-fern-1100 border-b-[1px] border-gray-400 text-center max-w-[30ch]">
          claim winnings from orders page
        </p>
        {/* <div className="flex flex-col justify-center items-center"> */}
        <div className="max-lg:col-content text-sm xs:text-base lg:text-2xl text-red-500 text-center max-w-[30ch]">
          <Button
            className="mt-5 lowercase"
            theme="dandelion"
            onClick={() => router.push("/play/chess")}
          >
            Claim Winnings
          </Button>
        </div>
      </section>
    );
  };

  return (
    <>
      <Image
        src="/rami/bigbeat.svg"
        width={962}
        height={46}
        className="col-start-1 col-end-3 row-start-1 max-w-[initial] justify-self-end self-start mt-3 drop-shadow-placed hidden lg:block"
        alt="Game Header"
        priority
      />

      {!isConnected || !userAddress ? (
        renderWalletDisconnectedScreen()
      ) : error ? (
        renderErrorScreen()
      ) : requiresSignature ? (
        renderManualSignScreen()
      ) : !gameReady && loading ? (
        renderWaitingScreen()
      ) : waitingMessage.includes("Room not found") ||
        waitingMessage.includes("invalid") ||
        waitingMessage.includes("already completed") ||
        waitingMessage.includes("already ended") ? (
        renderInvalidRoomCodeScreen()
      ) : gameResult ? (
        renderGameOverScreen()
      ) : (
        <article className="grid grid-cols-subgrid col-content pb-18 gap-y-18">
          {/* Left Column - Chess Board */}
          <div className="col-start-content-start max-lg:col-end-content-end lg:col-span-5 xl:col-span-7 2xl:col-span-6">
            {isSmallScreen && renderDisconnectCountdown()}
            <div className="chess-container w-full flex flex-col items-center">
              {isSmallScreen && (
                <div className=" flex justify-between items-center w-full">
                  {/* opponent info */}
                  <div className="flex justify-center items-center space-x-2 mb-4">
                    <div className="w-11 h-11 rounded-sm p-2 bg-[#000000]/5 flex items-center justify-center">
                      <span
                        className={`block rounded-full w-4 h-4 bg-green-500`}
                      ></span>
                    </div>
                    <div className="flex flex-col justify-start items-start overflow-hidden">
                      <span className="truncate text-[0.85rem] font-display overflow-hidden w-[90%]">
                        {contractOrder && role === "creator"
                          ? contractOrder.accepter &&
                            contractOrder.accepter !==
                              "0x0000000000000000000000000000000000000000"
                            ? formatAddress(contractOrder.accepter)
                            : "Waiting for opponent..."
                          : contractOrder?.creator
                            ? formatAddress(contractOrder.creator)
                            : opponentName}
                      </span>
                      <span className="text-xs font-display opacity-70 italic">
                        {getCurrentTurn() ===
                        (playerColor === "white" ? "black" : "white")
                          ? `opponent's turn`
                          : "waiting ..."}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="flex justify-start items-start w-full gap-1 ml-3">
                        {renderOpponentDrawStatus()}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="block text-3xl font-ui pt-1 font-semibold text-black tracking-wide">
                          {formatTime(
                            playerColor === "white" ? blackTime : whiteTime,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="w-full max-w-[768px] flex justify-center">
                <Chessboard
                  id="ChessBoard"
                  animationDuration={200}
                  boardWidth={Math.min(550, window.innerWidth - 40)}
                  position={fen}
                  onSquareClick={(square) => {
                    if (gameResult) return;
                    onSquareClick(square);
                  }}
                  customSquareStyles={getMergedSquareStyles()}
                  boardOrientation={
                    boardLocked ? boardOrientation : playerColor
                  }
                  arePiecesDraggable={false}
                  customBoardStyle={{
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                />
              </div>

              {isSmallScreen && (
                <div className="flex justify-between items-center w-full mt-3">
                  {/* opponent info */}
                  <div className="flex justify-center items-center space-x-2 mb-4">
                    <div className="w-11 h-11 rounded-sm p-2 bg-[#000000]/5 flex items-center justify-center">
                      <span
                        className={`block rounded-full w-4 h-4 ${
                          getCurrentTurn() === playerColor &&
                          timerRunning &&
                          !gameResult
                            ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(0,255,0,0.7)]"
                            : "bg-gray-400"
                        }`}
                      ></span>
                    </div>
                    <div className="flex flex-col justify-start items-start overflow-hidden">
                      <span className="truncate text-[0.85rem] font-display overflow-hidden w-[90%]">
                        {userAddress
                          ? formatAddress(userAddress)
                          : "Not connected"}
                      </span>
                      <span className="text-xs font-display opacity-70 italic">
                        {getCurrentTurn() === playerColor
                          ? "your turn"
                          : `waiting ..`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline">
                    <div className="flex justify-center items-center space-x-2 mb-4">
                      <div className="w-full flex justify-between items-stretch gap-2 ml-3">
                        {renderMyDrawButtons()}
                        {renderMyResignButton()}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="block text-3xl font-ui pt-1 font-semibold text-black tracking-wide">
                          {formatTime(
                            playerColor === "white" ? whiteTime : blackTime,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-start-content-start col-end-content-end lg:col-start-6 xl:col-start-8 2xl:col-start-7 flex flex-col gap-4">
            <section className="flex flex-col gap-1">
              <>
                <div className={`${className}`}>
                  <div className="@container flex flex-col gap-10">
                    <div className="@container flex flex-col gap-6">
                      <div className="flex flex-col">
                        {/* Pool Selection Tabs */}
                        <div className="flex mb-1 bg-white rounded-t-md p-1">
                          {/* Game Data Tab */}
                          {selectedTab === "livegamefeed" ? (
                            <Button
                              theme="dandelion"
                              onClick={() => setSelectedTab("livegamefeed")}
                              className="!normal-case flex-1 py-2 px-4 rounded-tl-md text-center font-medium bg-white text-black shadow-sm"
                            >
                              Live Data
                            </Button>
                          ) : (
                            <div
                              onClick={() => setSelectedTab("livegamefeed")}
                              className="!normal-case flex-1 py-2 px-4 rounded-tl-md text-center font-medium cursor-pointer text-black/60 hover:text-black"
                            >
                              Live Data
                            </div>
                          )}

                          {/* Volume Tab */}
                          {selectedTab === "potsize" ? (
                            <Button
                              theme="dandelion"
                              onClick={() => setSelectedTab("potsize")}
                              className="!normal-case flex-1 py-2 px-4 rounded-tr-md text-center font-medium bg-white text-black shadow-sm"
                            >
                              Game Details
                            </Button>
                          ) : (
                            <div
                              onClick={() => setSelectedTab("potsize")}
                              className="!normal-case flex-1 py-2 px-4 rounded-tr-md text-center font-medium cursor-pointer text-black/60 hover:text-black"
                            >
                              Game Details
                            </div>
                          )}
                        </div>

                        {!isSmallScreen && renderDisconnectCountdown()}

                        <div className="relative">
                          <div className="outline-none font-ui w-full shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-1 py-2 rounded-b-sm">
                            <div className="py-2">
                              {/* Conditional rendering based on selected tab */}
                              {selectedTab === "livegamefeed" ? (
                                // Live Data Tab Content
                                <>
                                  {/*timer data */}
                                  {!isSmallScreen && (
                                    <div className="w-full flex justify-start items-center">
                                      {/* left - fixed-sized timer */}
                                      <div className="flex-none flex justify-center items-center">
                                        <span className="block text-6xl font-ui text-black leading-none">
                                          {formatTime(
                                            playerColor === "white"
                                              ? blackTime
                                              : whiteTime,
                                          )}
                                        </span>
                                        {/* opponent section - Show draw offer status when I offered draw */}
                                        <div className="flex justify-start items-start w-full gap-1 ml-3">
                                          {renderOpponentDrawStatus()}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* opponent player info */}
                                  {!isSmallScreen && (
                                    <div className="flex items-center space-x-2 mb-4">
                                      <div className="w-11 h-11 rounded-sm p-2 bg-[#000000]/5 flex items-center justify-center">
                                        <span
                                          className={`block rounded-full w-4 h-4 ${
                                            getCurrentTurn() ===
                                              (playerColor === "white"
                                                ? "black"
                                                : "white") && opponentConnected
                                              ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(0,255,0,0.7)]"
                                              : "bg-gray-400"
                                          }`}
                                        ></span>
                                      </div>
                                      <div className="flex flex-col justify-start items-start overflow-hidden">
                                        <span className="truncate text-[0.85rem] font-display overflow-hidden w-[90%]">
                                          {contractOrder && role === "creator"
                                            ? contractOrder.accepter &&
                                              contractOrder.accepter !==
                                                "0x0000000000000000000000000000000000000000"
                                              ? formatAddress(
                                                  contractOrder.accepter,
                                                )
                                              : "Waiting for opponent..."
                                            : contractOrder?.creator
                                              ? formatAddress(
                                                  contractOrder.creator,
                                                )
                                              : opponentName}
                                        </span>
                                        <span className="text-xs font-display opacity-70 italic">
                                          {getCurrentTurn() ===
                                          (playerColor === "white"
                                            ? "black"
                                            : "white")
                                            ? `opponent's turn`
                                            : "waiting ..."}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* time tracker of opponent */}
                                  {!isSmallScreen && (
                                    <div className="flex justify-between items-center gap-1 mb-2">
                                      {/* Lifelines at right-end of progress bar */}
                                      <div className="relative z-10 flex items-center gap-1">
                                        {[...Array(3)].map((_, i) => (
                                          <div
                                            key={`opp-progress-${i}`}
                                            className="w-4 h-4"
                                          >
                                            <Image
                                              src={
                                                i < opponentLifelines
                                                  ? "/chess/alive.svg"
                                                  : "/chess/dead.svg"
                                              }
                                              alt={
                                                i < opponentLifelines
                                                  ? "Alive"
                                                  : "Dead"
                                              }
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
                                            width: `${((playerColor === "white" ? blackTime : whiteTime) / (timerMinutes * 60)) * 100}%`,
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
                                  )}

                                  {/* ------------------------------------game moves */}
                                  <div className="relative opacity-80">
                                    <div className="outline-none font-ui w-full shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100%  rounded-xs">
                                      {/* Game moves container */}
                                      <div className="border border-white/10 rounded-sm">
                                        {/* Fixed Header */}
                                        <div className="rounded-t-xs grid grid-cols-3 gap-2 text-xs tracking-wide uppercase px-2 py-1 border-b border-white/10 bg-black/10 sticky top-0 z-10">
                                          <div className="text-center">#</div>
                                          <div className="text-center">
                                            White
                                          </div>
                                          <div className="text-center">
                                            Black
                                          </div>
                                        </div>
                                        {/* Scrollable Moves List */}

                                        <div
                                          ref={movesContainerRef}
                                          className="max-h-24 overflow-y-auto custom-scroll"
                                        >
                                          <div className="w-full">
                                            {moveHistory.length === 0 ? (
                                              <div className="text-center py-4 text-sm text-gray-500">
                                                No moves yet
                                              </div>
                                            ) : (
                                              moveHistory.map(
                                                (movePair, index) => (
                                                  <div
                                                    key={index}
                                                    className={`grid grid-cols-3 gap-2 py-2 px-2 border-b border-black/10 transition-colors duration-300 ${
                                                      index === lastMoveIndex
                                                        ? "bg-white/50 border-black"
                                                        : "hover:bg-gray-50"
                                                    }`}
                                                  >
                                                    <div className="text-sm font-display text-center flex items-center justify-center">
                                                      {index + 1}.
                                                    </div>
                                                    <div className="flex items-center justify-center min-h-[24px]">
                                                      {movePair.white ? (
                                                        <div className="flex items-center justify-center gap-1 bg-white w-24 rounded-sm h-6">
                                                          {renderPieceImage(
                                                            movePair.white,
                                                          )}
                                                          <span className="text-sm font-ui font-normal leading-none">
                                                            {extractMoveNotation(
                                                              movePair.white,
                                                            )}
                                                          </span>
                                                        </div>
                                                      ) : (
                                                        "-"
                                                      )}
                                                    </div>
                                                    <div className="flex items-center justify-center min-h-[24px]">
                                                      {movePair.black ? (
                                                        <div className="flex items-center justify-center gap-1 bg-white w-24 rounded-sm h-6">
                                                          {renderPieceImage(
                                                            movePair.black,
                                                          )}
                                                          <span className="text-sm font-ui font-normal leading-none">
                                                            {extractMoveNotation(
                                                              movePair.black,
                                                            )}
                                                          </span>
                                                        </div>
                                                      ) : (
                                                        "-"
                                                      )}
                                                    </div>
                                                  </div>
                                                ),
                                              )
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* time tracker of player */}
                                  {!isSmallScreen && (
                                    <div className="flex justify-between items-center gap-1 mt-2">
                                      {/* Lifelines at right-end of progress bar */}
                                      <div className="relative z-10 flex items-center gap-1">
                                        {[...Array(3)].map((_, i) => (
                                          <div
                                            key={`my-progress-${i}`}
                                            className="w-4 h-4"
                                          >
                                            <Image
                                              src={
                                                i < myLifelines
                                                  ? "/chess/alive.svg"
                                                  : "/chess/dead.svg"
                                              }
                                              alt={
                                                i < myLifelines
                                                  ? "Alive"
                                                  : "Dead"
                                              }
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
                                            width: `${((playerColor === "white" ? whiteTime : blackTime) / (timerMinutes * 60)) * 100}%`,
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
                                  )}

                                  {/* you - player info */}
                                  {!isSmallScreen && (
                                    <div className="flex items-center space-x-2 mt-4">
                                      <div className="w-11 h-11 rounded-sm p-2 bg-[#000000]/5 flex items-center justify-center">
                                        <span
                                          className={`block rounded-full w-4 h-4 ${
                                            getCurrentTurn() === playerColor &&
                                            timerRunning &&
                                            !gameResult
                                              ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(0,255,0,0.7)]"
                                              : "bg-gray-400"
                                          }`}
                                        ></span>
                                      </div>
                                      <div className="flex flex-col justify-start items-start overflow-hidden">
                                        <span className="truncate text-[0.85rem] font-display overflow-hidden w-[90%]">
                                          {userAddress
                                            ? formatAddress(userAddress)
                                            : "Not connected"}
                                        </span>
                                        <span className="text-xs font-display opacity-70 italic">
                                          {getCurrentTurn() === playerColor
                                            ? "your turn"
                                            : `waiting ..`}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/*timer data */}
                                  {!isSmallScreen && (
                                    <div className="w-full flex justify-start items-center mt-2">
                                      {/* left - fixed-sized timer */}
                                      <div className="flex-none flex justify-between items-center w-full">
                                        <span className="block text-6xl font-ui text-black leading-none">
                                          {formatTime(
                                            playerColor === "white"
                                              ? whiteTime
                                              : blackTime,
                                          )}
                                        </span>
                                        {/* offer draw or resign */}
                                        {/* current player section - BUTTONS IN COLUMN */}
                                        <div className="w-full flex flex-col justify-between items-stretch gap-2 ml-3">
                                          {renderMyDrawButtons()}
                                          {renderMyResignButton()}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                // Game Details Tab Content
                                <div className="relative">
                                  {/* main */}
                                  <div className="p-2">
                                    {/* gameid */}
                                    <div className="flex justify-between items-center w-full">
                                      <span className="text-black/50 text-lg font-display">
                                        Game ID:
                                      </span>
                                      <div className="flex justify-center items-center">
                                        <span className="mr-2 mt-1 flex items-stretch h-full text-lg">
                                          #{roomCode}
                                        </span>
                                        <button className="rounded-xs px-4 py-1 bg-blue-600 font-ui text-xs text-white/90">
                                          copy ID
                                        </button>
                                      </div>
                                    </div>
                                    {/* divider */}
                                    <div className="mt-2 h-px bg-black/15"></div>

                                    {/* player sides + game size */}
                                    <div className="mt-6 flex flex-col space-y-4">
                                      <div
                                        className={`relative border border-l-4 rounded-sm px-1 py-3 flex flex-col space-y-3 justify-start items-start overflow-hidden ${
                                          (gameResult as any)?.winner ===
                                          "white"
                                            ? "bg-white border-green-800"
                                            : (gameResult as any)?.winner ===
                                                "black"
                                              ? "bg-red-100 border-red-600"
                                              : "bg-white border-gray-300"
                                        }`}
                                      >
                                        {/* winner/loser tag */}
                                        {gameResult && (
                                          <div
                                            className={`absolute top-1 right-1 font-ui text-sm px-4 py-1 rounded-xs shadow ${
                                              (gameResult as any).winner ===
                                              "white"
                                                ? "bg-green-600 text-white"
                                                : "bg-red-600 text-white"
                                            }`}
                                          >
                                            {(gameResult as any).winner ===
                                            "white"
                                              ? "WON"
                                              : "LOST"}
                                          </div>
                                        )}

                                        {/* white player */}
                                        <div className="flex justify-start items-center">
                                          <Image
                                            src="/chess/piece/alpha/wN.svg"
                                            alt="w"
                                            width={45}
                                            height={45}
                                          />
                                          <div className="flex flex-col justify-start">
                                            <span className="text-xs opacity-65 font-normal">
                                              Playing as white:
                                            </span>
                                            <div className="flex flex-col justify-start items-start">
                                              <span className="text-sm font-ui tracking-tighter opacity-85">
                                                {contractOrder?.creator
                                                  ? formatAddress(
                                                      contractOrder.creator,
                                                    )
                                                  : role === "creator"
                                                    ? formatAddress(
                                                        userAddress || "",
                                                      )
                                                    : opponentName}
                                              </span>
                                              <span className="text-sm font-ui tracking-tighter">
                                                {gameAmount} {currency}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div
                                        className={`relative border border-l-4 rounded-sm px-1 py-3 flex flex-col space-y-3 justify-start items-start overflow-hidden ${
                                          (gameResult as any)?.winner ===
                                          "black"
                                            ? "bg-white border-green-800"
                                            : (gameResult as any)?.winner ===
                                                "white"
                                              ? "bg-red-100 border-red-600"
                                              : "bg-white border-gray-300"
                                        }`}
                                      >
                                        {/* winner/loser tag */}
                                        {gameResult && (
                                          <div
                                            className={`absolute top-1 right-1 font-ui text-sm px-4 py-1 rounded-xs shadow ${
                                              (gameResult as any).winner ===
                                              "black"
                                                ? "bg-green-600 text-white"
                                                : "bg-red-600 text-white"
                                            }`}
                                          >
                                            {(gameResult as any).winner ===
                                            "black"
                                              ? "WON"
                                              : "LOST"}
                                          </div>
                                        )}

                                        {/* black player */}
                                        <div className="flex justify-start items-center">
                                          <Image
                                            src="/chess/piece/alpha/bN.svg"
                                            alt="b"
                                            width={45}
                                            height={45}
                                          />
                                          <div className="flex flex-col justify-start">
                                            <span className="text-xs opacity-65 font-normal">
                                              Playing as Black:
                                            </span>
                                            <div className="flex flex-col justify-start items-start">
                                              <span className="text-sm font-ui tracking-tighter opacity-85">
                                                {contractOrder?.accepter &&
                                                contractOrder.accepter !==
                                                  "0x0000000000000000000000000000000000000000"
                                                  ? formatAddress(
                                                      contractOrder.accepter,
                                                    )
                                                  : role === "joiner"
                                                    ? formatAddress(
                                                        userAddress || "",
                                                      )
                                                    : opponentName}
                                              </span>
                                              <span className="text-sm font-ui tracking-tighter">
                                                {gameAmount} {currency}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* divider */}
                                    <div className="mt-4 h-px bg-black/15"></div>

                                    {/* Game Result Section - Only show when game is over */}
                                    {gameResult ? (
                                      <div className="flex justify-center items-center w-full gap-y-3">
                                        <div className="flex flex-col justify-center items-center w-full gap-y-1">
                                          {/* Result Message */}
                                          <div className="text-center mb-1 mt-3">
                                            <p className="text-sm text-gray-600 mt-1">
                                              {(gameResult as any).winner ===
                                              playerColor
                                                ? "Congratulations!"
                                                : (gameResult as any).winner
                                                  ? "Better luck next time!"
                                                  : "Game ended in a draw"}
                                            </p>
                                          </div>

                                          {/* Winnings Display */}
                                          <div className="flex justify-center items-baseline py-4">
                                            <span className="text-3xl font-ui tracking-normal text-green-600 font-bold">
                                              {(gameResult as any).winner ===
                                              playerColor
                                                ? `+${winningAmount.toFixed(2)} ${currency}`
                                                : `+0 ${currency}`}
                                            </span>
                                            <span
                                              className={`flex justify-stretch items-baseline gap-1 text-sm font-display ml-2 ${
                                                (gameResult as any).winner ===
                                                playerColor
                                                  ? "text-[#26a17b]"
                                                  : "text-gray-500"
                                              }`}
                                            >
                                              [
                                              {(gameResult as any).winner ===
                                              playerColor
                                                ? `+${((playerProfit / gameAmount) * 100).toFixed(0)}%`
                                                : "+0%"}
                                              ]
                                            </span>
                                          </div>

                                          {/* Claim Button - Only show if player won */}
                                          {(gameResult as any)?.winner ===
                                            playerColor &&
                                            contractOrder && (
                                              <Button
                                                theme="dandelion"
                                                className="w-full !normal-case text-lg"
                                                onClick={handleClaimWinnings}
                                                disabled={isClaiming}
                                              >
                                                {isClaiming ? (
                                                  <div className="flex items-center justify-center gap-2">
                                                    <WhiteSpinner />
                                                    Claiming...
                                                  </div>
                                                ) : (
                                                  "Claim Winnings"
                                                )}
                                              </Button>
                                            )}

                                          {isFetchingContract && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                                              <div className="flex flex-col items-center gap-2">
                                                <WhiteSpinner />
                                                <span className="text-sm text-gray-600">
                                                  Loading contract data...
                                                </span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      /* Show game in progress message when no result */
                                      <div className="flex flex-col justify-center items-center w-full gap-y-3 py-5">
                                        <div className="flex flex-col justify-center items-center w-full gap-y-1">
                                          <span className="text-lg font-display text-center opacity-65 italic lowercase">
                                            game in progress...
                                          </span>
                                          <div className=" text-sm text-gray-600 text-center">
                                            <p>expected win amount</p>
                                            <span className="text-3xl font-ui tracking-normal text-green-600 font-bold">
                                              {winningAmount.toFixed(2)}{" "}
                                              {currency}
                                            </span>
                                          </div>
                                          <Link
                                            href="/play/chess"
                                            target="_blank"
                                            className="flex justify-center items-center text-xl underline line-clamp-1 mt-2 text-red-600"
                                          >
                                            <span>
                                              claim winnings at orders page
                                            </span>
                                          </Link>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
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
        </article>
      )}

      {/* Draw Offer Modal */}
      {showDrawOfferModal && (
        <DrawOfferModal
          onClose={() => setShowDrawOfferModal(false)}
          onConfirm={handleDrawOfferConfirm}
        />
      )}

      {/* Cancel Draw Modal */}
      {showCancelDrawModal && (
        <CancelDrawModal
          onClose={() => setShowCancelDrawModal(false)}
          onConfirm={handleCancelDrawConfirm}
        />
      )}

      {/* Accept Draw Modal */}
      {showAcceptDrawModal && (
        <AcceptDrawModal
          onClose={() => setShowAcceptDrawModal(false)}
          onConfirm={handleAcceptDrawConfirm}
        />
      )}

      {/* Decline Draw Modal */}
      {showDeclineDrawModal && (
        <DeclineDrawModal
          onClose={() => setShowDeclineDrawModal(false)}
          onConfirm={handleDeclineDrawConfirm}
        />
      )}

      {/* Resign Modal */}
      {showResignModal && (
        <ResignModal
          onClose={() => setShowResignModal(false)}
          onConfirm={handleResignConfirm}
        />
      )}
    </>
  );
}

