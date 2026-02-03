"use client";

import { Header, Title, Column, Description } from "@/components/page";
import Button from "@/components/ButtonsUI/button";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

// Wallet connection & balances
import { useAccount } from "wagmi";
import { useSignMessage } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import BlackSpinner from "@/components/Old/Spinners/BlackSpin";

// Chess Context
import { useChess } from "@/context/chesscontext";

// Global Context for balances
import { useGlobal } from "@/context/global";

// Transaction icons
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import BnbBalance from "@/components/ButtonsUI/bnbBalance";
import CustomSpinner from "@/components/Old/Spinners/Custom/CustomSpinner";

// Contract addresses
const USDT_ADDRESS = "0x4f237c860870A7a564B2db707c60Ee2eb36Cd7e6";
const RAMI_ADDRESS = "0xc457860F15aeEdd626F3006a116ca80ec4fE2e60";

// Define order type
interface ChessOrder {
  orderNumber: string;
  size: string;
  coin: string;
  expiryTime: string;
  roomName: string;
  creatorName: string;
  createdAt: number;
  anonymousLink?: string; // ADD THIS: Single anonymous link for both players
  shortHash?: string; // ADD THIS: Short hash for the link
  status?: string;
  joinerName?: string;
  gameLink?: string;
  // Smart contract fields
  contractOrderId?: number;
  contractToken?: string;
  contractStatus?: number;
  contractAccepter?: string;
  contractCreator?: string;
  contractAmount?: bigint;
  contractExpiresAt?: number;
  contractCreatedAt?: number;
  // UI helper fields
  isMyOrder?: boolean;
  canAccept?: boolean;
  canCancel?: boolean;
  formattedAmount?: string;
  // Game result fields
  gameResult?: {
    winner: "white" | "black";
    winnerAddress?: string;
    loserAddress?: string;
    isDraw?: boolean;
  };
  // Add claim-related fields
  winnerWithdrawn?: boolean;
  loserWithdrawn?: boolean;
  creatorWithdrawn?: boolean;
  accepterWithdrawn?: boolean;
}

const CURRENCY_OPTIONS = [
  {
    value: "USDT",
    label: "USDT",
    image: "/chess/ocoins/usdt.svg",
    minAmount: "1",
  },
  {
    value: "RAMI",
    label: "RAMI",
    image: "/chess/ocoins/rlogo.svg",
    minAmount: "100",
  },
];

export default function ChessGameOptions({
  className = "w-full",
  unique = "footer",
}) {
  const { open } = useAppKit();
  const { address: userAddress, isConnected } = useAccount();
  const router = useRouter();
  // In your CreateJoinGame component, add:
  const { signMessageAsync } = useSignMessage();

  // Function to sign for creating room
  const handleSignForCreateRoom = async () => {
    if (!userAddress || !isConnected || !roomCode) {
      alert("Please connect your wallet first");
      return;
    }

    const signatureKey = `create-${roomCode}`;

    // Update signature status to pending
    setOrderSignatures((prev) => ({
      ...prev,
      [signatureKey]: {
        signature: "",
        timestamp: Date.now(),
        status: "pending",
      },
    }));

    try {
      const timestamp = Date.now();
      const message = `ramicoin.com : esports - i am the owner`;

      const signature = await signMessageAsync({ message });

      // Store the signature data
      setOrderSignatures((prev) => ({
        ...prev,
        [signatureKey]: {
          signature,
          timestamp,
          status: "signed",
        },
      }));
    } catch (error: any) {
      console.error("Failed to sign message:", error);

      // Reset signature status on error
      setOrderSignatures((prev) => ({
        ...prev,
        [signatureKey]: {
          signature: "",
          timestamp: 0,
          status: "none",
        },
      }));

      if (
        error.message?.includes("rejected") ||
        error.message?.includes("User rejected")
      ) {
        alert("Message signing rejected. Please sign to continue.");
      } else {
        alert("Failed to sign message. Please try again.");
      }
    }
  };

  // Function to sign for accepting order
  const handleSignForAcceptOrder = async (order: ChessOrder) => {
    if (!order || !userAddress) return;

    // Update signature status to pending
    setOrderSignatures((prev) => ({
      ...prev,
      [order.orderNumber]: {
        signature: "",
        timestamp: Date.now(),
        status: "pending",
      },
    }));

    try {
      const timestamp = Date.now();
      const message = `ramicoin.com : esports - i am the owner`;

      const signature = await signMessageAsync({ message });

      // Store the signature data
      setOrderSignatures((prev) => ({
        ...prev,
        [order.orderNumber]: {
          signature,
          timestamp,
          status: "signed",
        },
      }));

      // Store in localStorage for later use when joining game
      localStorage.setItem(
        `chess-sig-${order.orderNumber}`,
        JSON.stringify({ signature, timestamp }),
      );
    } catch (error: any) {
      console.error("Failed to sign message:", error);

      // Reset signature status on error
      setOrderSignatures((prev) => ({
        ...prev,
        [order.orderNumber]: {
          signature: "",
          timestamp: 0,
          status: "none",
        },
      }));

      if (
        error.message?.includes("rejected") ||
        error.message?.includes("User rejected")
      ) {
        alert("Message signing rejected. Please sign to continue.");
      } else {
        alert("Failed to sign message. Please try again.");
      }
    }
  };

  // Chess Context
  const {
    state: chessState,
    isAmountValid,
    handleStakeAmountChange,
    handleCurrencyChange,
    handleApproveToken,
    handleCreateOrder,
    handleAcceptOrder: acceptOrderOnContract,
    handleCancelOrder: cancelOrderOnContract,
    handleCompleteGame, // ADD THIS LINE
    handleDrawGame,
    clearTransaction,
    refetchData: refetchChessData,
    updateBalances,
    fetchContractOrderByRoomCode,
    batchFetchContractOrders,
  } = useChess();

  // Global Context for balances
  const { state: globalState } = useGlobal();

  // Update chess context balances from global context
  useEffect(() => {
    if (
      globalState.usdtBalance !== undefined &&
      globalState.ramiBalance !== undefined
    ) {
      updateBalances(globalState.usdtBalance, globalState.ramiBalance);
    }
  }, [globalState.usdtBalance, globalState.ramiBalance, updateBalances]);

  const handleConnectWallet = () => {
    open();
  };

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [gameAmount, setGameAmount] = useState("");
  const [activeOrders, setActiveOrders] = useState<ChessOrder[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("RAMI");
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isDatabaseOnline, setIsDatabaseOnline] = useState(true);

  // Track my created rooms
  const [myCreatedRooms, setMyCreatedRooms] = useState<ChessOrder[]>([]);

  const [creatingRoom, setCreatingRoom] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);
  const [approvingOrder, setApprovingOrder] = useState<string | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

  // Modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ChessOrder | null>(null);
  // Add state for claim winnings
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  // Add this near other useState declarations (around line 125)
  type MenuOption = "menu" | "my orders" | "global" | "completed";
  const [selectedMenu, setSelectedMenu] = useState<MenuOption>("global");
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  // Add state for tracking signatures for both create and accept flows
  const [orderSignatures, setOrderSignatures] = useState<
    Record<
      string,
      {
        signature: string;
        timestamp: number;
        status: "signed" | "pending" | "none";
      }
    >
  >({});

  const handleMenuItemClick = (option: MenuOption) => {
    setSelectedMenu(option);
    if (option === "menu") {
      setIsMenuExpanded(false);
    }
  };

  // Get transaction status from chess context
  const transaction = chessState.transaction;

  // Get minimum amount for selected currency
  const getMinAmount = (currency: string) => {
    const currencyInfo = CURRENCY_OPTIONS.find(
      (curr) => curr.value === currency,
    );
    return currencyInfo?.minAmount || "1";
  };

  // Get placeholder for selected currency
  const getAmountPlaceholder = (currency: string) => {
    const minAmount = getMinAmount(currency);
    return `min. ${minAmount} ${currency}`;
  };

  // Validate amount based on selected currency
  const validateAmount = (amount: string, currency: string): boolean => {
    const minAmount = getMinAmount(currency);
    const amountNum = parseFloat(amount);
    const minAmountNum = parseFloat(minAmount);

    if (isNaN(amountNum) || amountNum < minAmountNum) {
      setAmountError(`Minimum amount for ${currency} is ${minAmount}`);
      return false;
    }

    setAmountError("");
    return true;
  };

  // Generate room code function
  const generateRoomCode = () => {
    const newRoomCode = Math.floor(
      1000000 + Math.random() * 9000000,
    ).toString();
    setRoomCode(newRoomCode);
    return newRoomCode;
  };

  // Handle room code button click
  const handleRoomCodeClick = () => {
    generateRoomCode();
  };

  // Calculate expiry time
  const calculateExpiryTime = (createdAt: string | number | Date) => {
    try {
      let createdDate: Date;

      if (typeof createdAt === "string") {
        createdDate = new Date(createdAt);
      } else if (typeof createdAt === "number") {
        createdDate = new Date(createdAt * 1000);
      } else {
        createdDate = createdAt;
      }

      if (isNaN(createdDate.getTime())) {
        console.warn("Invalid date format:", createdAt);
        return "24:00:00";
      }

      const expiryTime = new Date(createdDate.getTime() + 48 * 60 * 60 * 1000);
      const now = new Date();
      const diffMs = expiryTime.getTime() - now.getTime();

      if (diffMs <= 0) return "00:00:00";

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } catch (error) {
      console.error("Error calculating expiry time:", error);
      return "24:00:00";
    }
  };

  // Get currency symbol from token address
  const getCurrencyFromToken = (tokenAddress: string): string => {
    if (tokenAddress.toLowerCase() === USDT_ADDRESS.toLowerCase())
      return "USDT";
    if (tokenAddress.toLowerCase() === RAMI_ADDRESS.toLowerCase())
      return "RAMI";
    return "USDT";
  };

  // Confetti functions from GamePlayUI
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

  // Calculate winning amount (90% ROI from total pot)
  const calculateWinnings = (order: ChessOrder) => {
    const amount = parseFloat(order.size || "0");
    const totalPot = amount * 2;
    const hostFee = totalPot * 0.1; // 10% fee
    const winningAmount = totalPot - hostFee; // 90% remains
    const playerProfit = winningAmount - amount;

    return {
      winningAmount,
      playerProfit,
      roi: (playerProfit / amount) * 100,
      hostFee, // Optional: display the fee separately
    };
  };

  // Format amount from wei to human readable
  const formatWeiToAmount = (weiAmount: bigint | undefined): string => {
    if (!weiAmount) return "0";
    const amount = Number(weiAmount) / 1e18;
    return amount.toFixed(2);
  };

  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      const response = await fetch("/api/fetchchessorders");
      const data = await response.json();
      setIsDatabaseOnline(data.success);
      return data;
    } catch (error) {
      console.error("❌ Database connection test failed:", error);
      setIsDatabaseOnline(false);
      return null;
    }
  };

  // Fetch orders from database API
  const fetchOrdersFromDatabase = async () => {
    try {
      // Add a small delay to ensure database has updated
      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await fetch("/api/fetchchessorders", {
        cache: "no-store", // Prevent caching
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.orders && Array.isArray(data.orders)) {
        const formattedOrders: ChessOrder[] = [];
        const roomCodes: string[] = [];

        // Process each order
        for (const dbOrder of data.orders) {
          const orderNumber = dbOrder.room_id || "";
          const size = dbOrder.game_size?.toString() || "1.0";
          const coin = dbOrder.game_currency || "USDT";
          const createdAt = dbOrder.created_at || Date.now();

          const expiryTime = calculateExpiryTime(createdAt);
          const creatorName = dbOrder.white_player || "Anonymous";
          // Get the anonymous link from database (gamelink field now contains anonymous link)
          const anonymousLink = dbOrder.gamelink || "";
          const shortHash = dbOrder.short_hash || "";

          // Add game result if game is completed
          let gameResult = undefined;

          // Check for draw FIRST
          if (
            dbOrder.game_status === "completed" &&
            dbOrder.game_result_type === "draw"
          ) {
            // For draws, set a special flag
            gameResult = {
              winner: "white" as "white", // Set any value, we won't use it for draws
              isDraw: true, // Add this flag
              winnerAddress: null,
              loserAddress: null,
            };
          } else if (dbOrder.game_status === "completed" && dbOrder.winner) {
            // Determine winner color based on database
            const winnerColor =
              dbOrder.winner.toLowerCase() ===
              dbOrder.white_player.toLowerCase()
                ? "white"
                : "black";
            gameResult = {
              winner: winnerColor as "white" | "black", // Add type assertion here
              winnerAddress: dbOrder.winner,
              loserAddress: dbOrder.loser,
              isDraw: false, // Add this
            };
          }

          const baseOrder: ChessOrder = {
            orderNumber: orderNumber,
            size: size,
            coin: coin,
            expiryTime: expiryTime,
            roomName: `${size} ${coin} Chess Game`,
            creatorName: creatorName,
            createdAt: new Date(createdAt).getTime(),
            anonymousLink: anonymousLink, // Store anonymous link
            shortHash: shortHash, // Store short hash
            status: dbOrder.game_status || "waiting",
            joinerName: dbOrder.black_player || "",
            gameResult: gameResult,
          };

          formattedOrders.push(baseOrder);
          if (orderNumber) {
            roomCodes.push(orderNumber);
          }
        }

        // Batch fetch contract orders for all room codes
        if (roomCodes.length > 0) {
          await batchFetchContractOrders(roomCodes);
        }

        // Merge contract data with database orders
        const mergedOrders = formattedOrders.map((order) => {
          const contractOrder =
            chessState.contractOrdersByRoomCode[order.orderNumber];
          if (contractOrder) {
            const isMyOrder =
              userAddress &&
              contractOrder.creator.toLowerCase() === userAddress.toLowerCase();

            const isExpired =
              Math.floor(Date.now() / 1000) > contractOrder.expiresAt;
            const isAccepted =
              contractOrder.accepter &&
              contractOrder.accepter !==
                "0x0000000000000000000000000000000000000000";

            // Check database status
            const isGameInProgress = order.status === "in_progress";
            const hasJoinerInDatabase =
              order.joinerName && order.joinerName.trim() !== "";

            // Determine if cancel is possible
            const canCancel =
              isMyOrder &&
              contractOrder.status === 0 &&
              !isExpired &&
              !isAccepted &&
              !isGameInProgress &&
              !hasJoinerInDatabase;

            return {
              ...order,
              contractOrderId: contractOrder.orderId,
              contractToken: contractOrder.token,
              contractStatus: contractOrder.status,
              contractAccepter: contractOrder.accepter,
              contractCreator: contractOrder.creator,
              contractAmount: contractOrder.amount,
              contractExpiresAt: contractOrder.expiresAt,
              contractCreatedAt: contractOrder.createdAt,
              formattedAmount: formatWeiToAmount(contractOrder.amount),
              isMyOrder,
              canAccept:
                !isMyOrder &&
                contractOrder.status === 0 &&
                !isExpired &&
                !isAccepted &&
                !isGameInProgress &&
                !hasJoinerInDatabase,
              canCancel: canCancel, // Updated condition

              // Add claim-related fields
              creatorWithdrawn: contractOrder.creatorWithdrawn,
              accepterWithdrawn: contractOrder.accepterWithdrawn,
            };
          }
          return order;
        });

        setActiveOrders(mergedOrders);

        // Update my created rooms
        if (userAddress) {
          const myRooms = mergedOrders.filter((order) => order.isMyOrder);
          setMyCreatedRooms(myRooms);
        }
      } else {
        setActiveOrders([]);
        setMyCreatedRooms([]);
      }
    } catch (error) {
      console.error("❌ Error fetching orders from database:", error);
    }
  };

  // Create order in database API
  const createOrderInDatabase = async (orderData: any) => {
    try {
      const response = await fetch("/api/fetchchessorders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomCode: orderData.roomCode,
          gameAmount: orderData.gameAmount,
          gameCurrency: orderData.gameCurrency,
          roomName: orderData.roomName,
          creatorName: orderData.creatorName,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Error creating order in database:", error);
      throw error;
    }
  };

  // Delete order from database API
  const cancelOrderFromDatabase = async (roomCode: string) => {
    try {
      const response = await fetch(
        `/api/fetchchessorders?roomCode=${roomCode}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Error cancelling order from database:", error);
      throw error;
    }
  };

  const updateGameWithJoiner = async (
    roomCode: string,
    joinerAddress: string,
  ) => {
    try {
      const payload = {
        roomCode: roomCode,
        joinerName: joinerAddress,
      };

      const patchResponse = await fetch("/api/fetchchessorders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await patchResponse.json();

      return data;
    } catch (error: any) {
      console.error("❌ Error updating game in database:", error);
      throw error;
    }
  };

  // Add this effect to auto-refresh orders when an order is accepted:

  useEffect(() => {
    // Listen for successful order acceptance
    if (
      transaction.status === "success" &&
      (transaction.message?.includes("accepted") ||
        transaction.message?.includes("Accepted"))
    ) {
      // Wait a bit for blockchain confirmation
      const timer = setTimeout(() => {
        fetchOrdersFromDatabase();
        refetchChessData();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [transaction.status, transaction.message]);

  // Initialize - fetch orders from database on mount
  useEffect(() => {
    fetchOrdersFromDatabase();

    // Refresh contract data
    if (isConnected) {
      refetchChessData();
    }
  }, []);

  // Re-fetch orders when user address changes
  useEffect(() => {
    if (userAddress) {
      fetchOrdersFromDatabase();
      refetchChessData();
    }
  }, [userAddress, isConnected]);

  const handleCreateRoom = async () => {
    if (!roomCode) {
      alert(
        "Please generate a room code first by clicking the 'Room Code' button",
      );
      return;
    }

    if (!gameAmount || parseFloat(gameAmount) <= 0) {
      alert("Please enter a valid game amount");
      return;
    }

    // 1. Check if signature is needed
    const signatureKey = `create-${roomCode}`;
    const currentSignature = orderSignatures[signatureKey];

    if (!currentSignature || currentSignature.status !== "signed") {
      alert(
        "Please sign the message first by clicking the 'sign message' button.",
      );
      return;
    }

    // 2. FIRST: Check if user needs to approve tokens
    if (showApproveButton()) {
      // User needs to approve tokens first
      await handleApproveToken(selectedCurrency as "USDT" | "RAMI");
      return; // Stop here, user needs to approve
    }

    // 2. Validate amount
    if (!validateAmount(gameAmount, selectedCurrency)) {
      return;
    }

    // 4. Validate room with wallet verification
    try {
      const validationResponse = await fetch("/api/room/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          walletAddress: userAddress,
          walletSignature: currentSignature.signature,
          signatureTimestamp: currentSignature.timestamp,
          action: "create",
        }),
      });

      const validation = await validationResponse.json();

      if (!validation.valid) {
        alert(`❌ ${validation.error || "Cannot create room"}`);
        return;
      }

      if (!validation.canCreate) {
        alert(
          `❌ Room code ${roomCode} already exists. Please generate a new one.`,
        );
        return;
      }
    } catch (error) {
      console.error("Failed to validate room:", error);
      alert("Failed to validate room. Please try again.");
      return;
    }

    // 5. Check if room code already exists in contract
    try {
      const existingOrder = await fetchContractOrderByRoomCode(roomCode);
      if (existingOrder && existingOrder.orderId) {
        alert(
          "Room code already exists in smart contract. Please generate a new one.",
        );
        return;
      }
    } catch (error) {
      // Room code doesn't exist, proceed
    }

    const playerName = userAddress ? userAddress : "Creator";

    setCreatingRoom(true);

    try {
      // 6. Create order on smart contract
      const contractResult = await handleCreateOrder(
        roomCode,
        gameAmount,
        selectedCurrency as "USDT" | "RAMI",
      );

      // 7. Check transaction status
      if (chessState.transaction.status === "error") {
        throw new Error("Contract transaction failed or was rejected");
      }

      // 8. WAIT LONGER for blockchain confirmation (8-10 seconds for BSC)
      console.log("⏳ Waiting for blockchain confirmation...");
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Increased from 3000 to 8000

      // 9. Verify the order was created on-chain
      let verifiedOrder = null;
      let retries = 0;
      const maxRetries = 8;

      while (retries < maxRetries && !verifiedOrder) {
        try {
          console.log(
            `🔄 Attempting to verify order (attempt ${retries + 1}/${maxRetries})...`,
          );
          verifiedOrder = await fetchContractOrderByRoomCode(roomCode);

          if (!verifiedOrder || !verifiedOrder.orderId) {
            console.log("Order not found yet, waiting...");
            await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 2 seconds
            retries++;
          }
        } catch (error: any) {
          console.log(
            `⚠️ Verification attempt ${retries + 1} failed:`,
            error.message,
          );
          await new Promise((resolve) => setTimeout(resolve, 3000));
          retries++;
        }
      }

      if (!verifiedOrder || !verifiedOrder.orderId) {
        console.warn(
          "⚠️ Order not found on blockchain after multiple attempts, but transaction may have succeeded",
        );
        // Continue anyway - the transaction hash is proof
      } else {
        console.log("✅ Order verified on blockchain:", verifiedOrder);
      }

      // 10. Create in database
      // 10. Create in database
      const roomName = `${gameAmount} ${selectedCurrency} Chess Game`;

      const orderData = {
        roomCode,
        gameAmount,
        gameCurrency: selectedCurrency,
        roomName,
        creatorName: playerName,
      };

      try {
        const dbResponse = await createOrderInDatabase(orderData);

        if (!dbResponse.success) {
          console.warn(
            "⚠️ Database creation failed, but contract transaction succeeded",
            dbResponse,
          );

          // Check what type of error it is
          if (dbResponse.error === "Room already exists") {
            alert(
              `⚠️ Room ${roomCode} already exists in database but blockchain order was created. ` +
                `This might be a synchronization issue. The order is live on blockchain.`,
            );
          } else {
            alert(
              `⚠️ Order created on blockchain but database update failed: ${dbResponse.error || "Unknown error"}`,
            );
          }
        } else {
          console.log("✅ Database order created:", dbResponse);
          alert(
            "✅ Order created successfully on both blockchain and database!",
          );
        }
      } catch (dbError: any) {
        console.error("Database error:", dbError);

        // Extract meaningful error message
        let errorMsg = "Database update failed";
        if (dbError.message?.includes("Room already exists")) {
          errorMsg = `Room ${roomCode} already exists in database`;
        } else if (dbError.message?.includes("409")) {
          errorMsg = "Room already exists (conflict)";
        }

        alert(
          `✅ Blockchain order created but ${errorMsg}. Your order is live on-chain.`,
        );
      }

      const dbResponse = await createOrderInDatabase(orderData);

      if (!dbResponse.success) {
        console.error(
          "Database creation failed, but contract order exists:",
          verifiedOrder,
        );
        alert(
          "Order created on blockchain but failed to save to database. Please contact support.",
        );
      }

      // Clear inputs
      setGameAmount("");
      setRoomCode("");
      // Clear signature
      setOrderSignatures((prev) => {
        const newData = { ...prev };
        delete newData[`create-${roomCode}`];
        return newData;
      });

      // Refresh orders list
      setTimeout(() => {
        fetchOrdersFromDatabase();
        refetchChessData();
      }, 5000);
    } catch (error: any) {
      console.error("Failed to create order:", error);

      if (
        error.message?.includes("User rejected") ||
        error.message?.includes("user rejected") ||
        error.message?.includes("rejected")
      ) {
        alert("Transaction rejected. Order was not created.");
      } else if (error.message?.includes("Contract transaction failed")) {
        alert(
          "Contract transaction failed or was rejected. Order was not created.",
        );
      } else if (error.message?.includes("Order not found on blockchain")) {
        alert("Order creation failed on blockchain. Please try again.");
      } else {
        alert(
          error.message ||
            "Failed to create order. Please check console for details.",
        );
      }
    } finally {
      setTimeout(() => {
        setCreatingRoom(false);
      }, 1000);
    }
  };

  // Check if user needs to approve tokens for accepting an order
  const needsApprovalForOrder = (order: ChessOrder): boolean => {
    if (!userAddress) return false;

    const amountNum = parseFloat(order.size);
    const tokenAllowance =
      order.coin === "RAMI"
        ? chessState.ramiAllowance
        : chessState.usdtAllowance;

    return tokenAllowance < amountNum * 0.99;
  };

  // Function to get create button state
  const getCreateButtonState = () => {
    const signatureKey = roomCode ? `create-${roomCode}` : "";
    const signature = signatureKey ? orderSignatures[signatureKey] : null;

    if (!userAddress) {
      return {
        text: "Connect Wallet",
        theme: "dandelion" as const,
        disabled: false,
        showSpinner: false,
      };
    }

    if (creatingRoom || transaction.status === "creatingOrder") {
      return {
        text: "creating...",
        theme: "dandelion" as const,
        disabled: true,
        showSpinner: true,
      };
    }

    if (transaction.status === "success") {
      return {
        text: "order created",
        theme: "dandelion" as const,
        disabled: true,
        showSpinner: false,
      };
    }

    if (transaction.status === "error") {
      return {
        text: "Failed",
        theme: "dandelion" as const,
        disabled: false,
        showSpinner: false,
      };
    }

    if (!signature || signature.status !== "signed") {
      return {
        text: signature?.status === "pending" ? "signing" : "1. sign",
        theme: "damarnotukdo" as const,
        disabled: !roomCode || signature?.status === "pending",
        showSpinner: signature?.status === "pending",
      };
    }

    if (showApproveButton()) {
      return {
        text:
          transaction.status === "approving"
            ? "approving..."
            : `2. approve ${selectedCurrency}`,
        theme: "dandelion" as const,
        disabled: transaction.status === "approving",
        showSpinner: transaction.status === "approving",
      };
    }

    return {
      text: "3. create",
      theme: "dandelion" as const,
      disabled: !roomCode || !isAmountValid,
      showSpinner: false,
    };
  };

  // Function to get accept button state
  const getAcceptButtonState = (order: ChessOrder) => {
    const orderId = order.orderNumber;
    const signature = orderSignatures[orderId];

    if (joiningRoom === orderId) {
      return {
        text:
          chessState.transaction.status === "error" ? "Failed" : "accepting...",
        theme: "rio" as const,
        disabled: true,
        showSpinner: chessState.transaction.status !== "error",
      };
    }

    if (!signature || signature.status !== "signed") {
      return {
        text: signature?.status === "pending" ? "signing" : "1. sign",
        theme: "damarnotukdo" as const,
        disabled: false,
        showSpinner: signature?.status === "pending",
      };
    }

    if (needsApprovalForOrder(order)) {
      return {
        text: "2. approve",
        theme: "dandelion" as const,
        disabled: false,
        showSpinner: false,
      };
    }

    return {
      text: "3. pay",
      theme: "rio" as const,
      disabled: false,
      showSpinner: false,
    };
  };

  // Handle accept order click - with smart contract integration
  const handleAcceptOrderClick = async (order: ChessOrder) => {
    const orderId = order.orderNumber;
    const currentSignature = orderSignatures[orderId];

    if (!userAddress) {
      alert("Please connect your wallet first");
      return;
    }

    // Check contract status first
    const contractOrder =
      chessState.contractOrdersByRoomCode[order.orderNumber];

    if (!contractOrder) {
      alert("Contract order not found");
      return;
    }

    // Check if order is already accepted
    if (
      contractOrder.accepter &&
      contractOrder.accepter !== "0x0000000000000000000000000000000000000000"
    ) {
      alert("This order has already been accepted by another player");
      return;
    }

    // Check if user is trying to accept their own order
    if (contractOrder.creator.toLowerCase() === userAddress.toLowerCase()) {
      alert("You cannot accept your own order");
      return;
    }

    // Check if order is active on contract
    if (contractOrder.status !== 0) {
      alert("This order is no longer active");
      return;
    }

    // Check if order is expired
    const now = Math.floor(Date.now() / 1000);
    if (now > contractOrder.expiresAt) {
      alert("This order has expired");
      return;
    }

    // Check if user has sufficient balance
    const amountNum = parseFloat(order.size);
    const balance =
      getCurrencyFromToken(contractOrder.token) === "RAMI"
        ? chessState.ramiBalance || 0
        : chessState.usdtBalance || 0;

    if (balance < amountNum) {
      alert(
        `Insufficient ${getCurrencyFromToken(contractOrder.token)} balance. You need at least ${amountNum} ${getCurrencyFromToken(contractOrder.token)}`,
      );
      return;
    }

    // FLOW 1: No signature yet - trigger signing
    if (!currentSignature || currentSignature.status !== "signed") {
      await handleSignForAcceptOrder(order);
      return;
    }

    // 2. Check if approval is needed
    const tokenCurrency = getCurrencyFromToken(contractOrder.token);
    if (needsApprovalForOrder(order)) {
      setSelectedOrder(order);
      setShowApproveModal(true);
      return;
    }

    // Proceed with order acceptance
    setSelectedOrder(order);
    setShowAcceptModal(true);
  };

  // Handle approve tokens for accepting order
  const handleApproveForAcceptOrder = async () => {
    if (!selectedOrder) return;

    setApprovingOrder(selectedOrder.orderNumber);

    try {
      // Get contract order to determine which token to approve
      const contractOrder =
        chessState.contractOrdersByRoomCode[selectedOrder.orderNumber];
      if (!contractOrder) {
        throw new Error("Contract order not found");
      }

      const tokenCurrency = getCurrencyFromToken(contractOrder.token) as
        | "USDT"
        | "RAMI";

      // Approve tokens with max approval amount
      await handleApproveToken(tokenCurrency);

      // Close approve modal and open accept modal
      setShowApproveModal(false);
      setShowAcceptModal(true);
    } catch (error) {
      console.error("Failed to approve tokens:", error);
      alert("Failed to approve tokens. Please try again.");
    } finally {
      setApprovingOrder(null);
    }
  };

  // Handle confirming acceptance with smart contract integration
  const handleConfirmAccept = async () => {
    if (!selectedOrder || !userAddress) return;

    setJoiningRoom(selectedOrder.orderNumber);

    try {
      // 1. Get the contract order ID
      const contractOrder =
        chessState.contractOrdersByRoomCode[selectedOrder.orderNumber];
      if (!contractOrder || !contractOrder.orderId) {
        throw new Error("Could not find order ID for this room code");
      }

      // Get stored signature
      const signatureData = orderSignatures[selectedOrder.orderNumber];
      if (!signatureData || signatureData.status !== "signed") {
        throw new Error("Wallet signature not found. Please sign first.");
      }

      // 2. Accept order on smart contract
      await acceptOrderOnContract(contractOrder.orderId);
      // 3. Wait for blockchain confirmation
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // 4. CHECK TRANSACTION RESULT BEFORE UPDATING DATABASE
      if (chessState.transaction.status === "error") {
        // Transaction failed or was rejected
        if (
          chessState.transaction.message?.includes("rejected") ||
          chessState.transaction.message?.includes("User rejected") ||
          chessState.transaction.message?.includes("denied")
        ) {
          alert("❌ Transaction was rejected. Order was NOT accepted.");
        } else {
          alert("❌ Transaction failed. Order was NOT accepted.");
        }
        return; // Stop here, don't update database
      }

      // 5. Wait for blockchain confirmation
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 6. Verify the order was actually accepted on-chain
      const updatedOrder = await fetchContractOrderByRoomCode(
        selectedOrder.orderNumber,
      );

      if (
        !updatedOrder ||
        updatedOrder.accepter ===
          "0x0000000000000000000000000000000000000000" ||
        updatedOrder.status !== 0
      ) {
        alert(
          "⚠️ Contract acceptance may have failed. Please check transaction.",
        );
        return;
      }

      // 7. ONLY AFTER successful on-chain acceptance: Update database
      try {
        const dbResponse = await updateGameWithJoiner(
          selectedOrder.orderNumber,
          userAddress,
        );

        if (dbResponse.success) {
          alert(
            `✅ Order accepted successfully!\n\nJoiner: ${userAddress}\nStatus: in_progress`,
          );
        } else {
          console.warn(
            "⚠️ Database update response not successful:",
            dbResponse,
          );
          alert(
            "⚠️ Contract transaction succeeded but database update may have issues",
          );
        }
      } catch (dbError: any) {
        console.error("❌ Database update failed:", dbError.message);

        // Check specific error messages
        if (dbError.message?.includes("Game already has a joiner")) {
          alert(
            "✅ Contract transaction succeeded! Game already has a joiner in database.",
          );
        } else if (dbError.message?.includes("Game not found")) {
          alert("⚠️ Contract succeeded but game not found in database.");
        } else {
          alert(
            `⚠️ Contract succeeded but database update failed: ${dbError.message}`,
          );
        }
      }

      // 8. Force refresh data
      await fetchOrdersFromDatabase();
      refetchChessData();

      // Additional refresh after delay
      setTimeout(() => {
        fetchOrdersFromDatabase();
        refetchChessData();
      }, 2000);

      // 9. Close the modal
      setShowAcceptModal(false);
      setSelectedOrder(null);
    } catch (error: any) {
      console.error("❌ Failed to accept order:", error);

      // Show specific error messages
      if (error.message?.includes("insufficient allowance")) {
        alert("Insufficient token allowance. Please approve tokens first.");
      } else if (error.message?.includes("Order not active")) {
        alert("This order is no longer active.");
      } else if (error.message?.includes("Order already accepted")) {
        alert("This order has already been accepted by another player.");
      } else if (error.message?.includes("Cannot accept own order")) {
        alert("You cannot accept your own order.");
      } else if (error.message?.includes("Order expired")) {
        alert("This order has expired.");
      } else {
        alert(
          error.message ||
            "Failed to accept order. Please check console for details.",
        );
      }
    } finally {
      // Clear signature data for this order after successful acceptance
      if (chessState.transaction.status !== "error") {
        setOrderSignatures((prev) => {
          const newData = { ...prev };
          delete newData[selectedOrder.orderNumber];
          return newData;
        });
      }
      setJoiningRoom(null);
    }
  };

  // Handle cancel click - show confirmation modal with proper checks
  const handleCancelClick = (order: ChessOrder) => {
    // Check all conditions before showing cancel modal
    const contractOrder =
      chessState.contractOrdersByRoomCode[order.orderNumber];

    if (!contractOrder) {
      alert("Contract order data not available");
      return;
    }

    if (!userAddress) {
      alert("Please connect your wallet");
      return;
    }

    // Check if user is the creator
    const isCreator =
      contractOrder.creator.toLowerCase() === userAddress.toLowerCase();
    if (!isCreator) {
      alert("Only the creator can cancel this order");
      return;
    }

    // Check if order is already accepted on contract
    const isAccepted =
      contractOrder.accepter &&
      contractOrder.accepter !== "0x0000000000000000000000000000000000000000";
    if (isAccepted) {
      alert("Cannot cancel - order has already been accepted on contract");
      return;
    }

    // Check if order is expired
    const now = Math.floor(Date.now() / 1000);
    const isExpired = now > contractOrder.expiresAt;
    if (isExpired) {
      alert("Cannot cancel - order has expired");
      return;
    }

    // Check database status
    if (order.status === "in_progress") {
      alert("Cannot cancel - game is already in progress");
      return;
    }

    if (order.joinerName && order.joinerName.trim() !== "") {
      alert("Cannot cancel - someone has already joined the game");
      return;
    }

    // All checks passed, show cancel modal
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder) return;

    try {
      // Get contract order ID
      const contractOrder =
        chessState.contractOrdersByRoomCode[selectedOrder.orderNumber];
      if (!contractOrder?.orderId) {
        alert("Contract order ID not found");
        return;
      }

      setCancellingOrder(selectedOrder.orderNumber);

      // 1. Call cancel order on smart contract
      await cancelOrderOnContract(contractOrder.orderId);

      // 2. Wait a moment for transaction to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 3. Check transaction result
      if (chessState.transaction.status === "error") {
        // Transaction failed or was rejected
        if (
          chessState.transaction.message?.includes("rejected") ||
          chessState.transaction.message?.includes("User rejected") ||
          chessState.transaction.message?.includes("denied")
        ) {
          alert("❌ Transaction was rejected. Order was NOT cancelled.");
        } else {
          alert("❌ Transaction failed. Order was NOT cancelled.");
        }
        return;
      }

      // 4. Check if the contract cancellation was successful (status code 3)
      // You should verify the contract status after cancellation
      const updatedContractOrder = await fetchContractOrderByRoomCode(
        selectedOrder.orderNumber,
      );

      if (updatedContractOrder && updatedContractOrder.status === 3) {
        // 5. Update database status to "cancelled" instead of deleting
        try {
          const dbResponse = await cancelOrderFromDatabase(
            selectedOrder.orderNumber,
          );
          console.log("Database cancellation response:", dbResponse);

          if (dbResponse.success) {
            console.log(
              "✅ Database updated successfully. New status: cancelled",
            );

            // Update local state to reflect cancelled status
            setActiveOrders((prevOrders) =>
              prevOrders.map((order) =>
                order.orderNumber === selectedOrder.orderNumber
                  ? {
                      ...order,
                      status: "cancelled",
                      game_status: "cancelled",
                      contractStatus: 3,
                    }
                  : order,
              ),
            );

            // Also update myCreatedRooms if this is one of them
            setMyCreatedRooms((prevRooms) =>
              prevRooms.map((room) =>
                room.orderNumber === selectedOrder.orderNumber
                  ? { ...room, status: "cancelled", game_status: "cancelled" }
                  : room,
              ),
            );

            alert(
              "✅ Order cancelled successfully on blockchain and database!",
            );
          } else {
            console.error(
              "Database update response not successful:",
              dbResponse,
            );
            alert(
              "⚠️ Order cancelled on blockchain but database update failed.",
            );
          }
        } catch (dbError) {
          console.error("Database update failed:", dbError);
          alert("⚠️ Order cancelled on blockchain but database update failed.");
        }
      } else {
        console.error(
          "Contract order status not updated to cancelled:",
          updatedContractOrder?.status,
        );
        alert(
          "⚠️ Order cancellation on blockchain may have failed. Please check transaction.",
        );
      }
    } catch (error: any) {
      console.error("Failed to cancel order:", error);

      // Show specific error messages
      if (error.message?.includes("Not order creator")) {
        alert("You are not the creator of this order.");
      } else if (error.message?.includes("Order not active")) {
        alert("This order is no longer active.");
      } else if (error.message?.includes("Order already accepted")) {
        alert("Cannot cancel - order has already been accepted.");
      } else if (error.message?.includes("Order expired")) {
        alert("Cannot cancel - order has expired.");
      } else {
        alert(error.message || "Failed to cancel order. Please try again.");
      }
    } finally {
      setCancellingOrder(null);
      setShowCancelModal(false);
      setSelectedOrder(null);

      // Refresh data
      setTimeout(() => {
        fetchOrdersFromDatabase();
        refetchChessData();
      }, 3000);
    }
  };

  // Handle draw refund claim
  const handleClaimDrawRefund = async (order: ChessOrder) => {
    if (!order.contractOrderId || !userAddress) return;

    console.log("Starting draw refund claim for order:", order.orderNumber);
    setIsClaiming(order.orderNumber);

    try {
      // Get the current contract order data
      const contractOrder = await fetchContractOrderByRoomCode(
        order.orderNumber,
      );
      if (!contractOrder) {
        throw new Error("Could not fetch current order data");
      }

      console.log("Contract order data:", {
        winner: contractOrder.winner,
        creator: contractOrder.creator,
        accepter: contractOrder.accepter,
        creatorWithdrawn: contractOrder.creatorWithdrawn,
        accepterWithdrawn: contractOrder.accepterWithdrawn,
      });

      // Check for draw condition
      const DRAW_ADDRESS = "0x6F09eF95af0B49863225cFabA6875d9e6077fa77";
      const isDraw =
        contractOrder.winner?.toLowerCase() === DRAW_ADDRESS.toLowerCase();

      if (!isDraw) {
        alert("This game is not a draw");
        return;
      }

      // Check if user is either creator or accepter
      const userAddressLower = userAddress.toLowerCase();
      const isCreator =
        userAddressLower === contractOrder.creator.toLowerCase();
      const isAccepter =
        contractOrder.accepter &&
        contractOrder.accepter.toLowerCase() === userAddressLower;

      console.log("User check:", {
        userAddressLower,
        creator: contractOrder.creator.toLowerCase(),
        accepter: contractOrder.accepter?.toLowerCase(),
        isCreator,
        isAccepter,
      });

      if (!isCreator && !isAccepter) {
        alert("Only players involved in the game can claim refund for draw");
        return;
      }

      // Check if already withdrawn
      if (isCreator && contractOrder.creatorWithdrawn) {
        alert("You have already claimed your refund");
        return;
      }

      if (isAccepter && contractOrder.accepterWithdrawn) {
        alert("You have already claimed your refund");
        return;
      }

      console.log("Calling handleDrawGame for order:", order.contractOrderId);
      // Call draw game function
      await handleDrawGame(order.contractOrderId);

      alert(
        "✅ Refund claimed successfully! Your stake will be returned to your wallet.",
      );

      // Refresh data after claiming
      setTimeout(() => {
        fetchOrdersFromDatabase();
        refetchChessData();
      }, 3000);
    } catch (error: any) {
      console.error("❌ Failed to claim draw refund:", error);

      // Check for specific errors
      if (
        error.message?.includes("user rejected") ||
        error.message?.includes("rejected")
      ) {
        alert("Transaction was rejected");
      } else if (error.message?.includes("Game not resolved")) {
        alert("Game result is not yet verified on the blockchain");
      } else if (error.message?.includes("Not a game participant")) {
        alert("You are not a participant in this game");
      } else {
        alert(error.message || "Failed to claim refund. Please try again.");
      }
    } finally {
      setIsClaiming(null);
    }
  };

  // CLAIM WINNINGS FUNCTIONALITY - UPDATED
  const handleClaimWinnings = async (order: ChessOrder) => {
    if (!order.contractOrderId || !userAddress) return;

    setIsClaiming(order.orderNumber);

    try {
      // Get the current contract order data to check withdrawal status
      const contractOrder = await fetchContractOrderByRoomCode(
        order.orderNumber,
      );
      if (!contractOrder) {
        throw new Error("Could not fetch current order data");
      }

      // Check if the user is the winner according to the contract
      const isWinner =
        contractOrder.winner.toLowerCase() === userAddress.toLowerCase();

      if (!isWinner) {
        alert("Only the winner can claim winnings");
        return;
      }

      // Check if the user is the creator and if creator has withdrawn
      const isCreator =
        userAddress.toLowerCase() === contractOrder.creator.toLowerCase();

      if (isCreator) {
        // User is the creator and winner
        if (contractOrder.creatorWithdrawn) {
          alert("Winnings have already been claimed");
          return;
        }
      } else {
        // User is the accepter and winner
        if (contractOrder.accepterWithdrawn) {
          alert("Winnings have already been claimed");
          return;
        }
      }

      // Call completeGame on smart contract
      await handleCompleteGame(order.contractOrderId);

      // Trigger confetti for winner
      triggerWinnerConfetti();

      alert(
        "✅ Winnings claimed successfully! Funds will be transferred to your wallet.",
      );

      // Refresh data after claiming
      setTimeout(() => {
        fetchOrdersFromDatabase();
        refetchChessData();
      }, 3000);
    } catch (error: any) {
      console.error("❌ Failed to claim winnings:", error);
      alert(error.message || "Failed to claim winnings. Please try again.");
    } finally {
      setIsClaiming(null);
    }
  };

  const handleCancelAccept = () => {
    setShowAcceptModal(false);
    setSelectedOrder(null);
    // Clear signature for this order when user cancels
    if (selectedOrder) {
      setOrderSignatures((prev) => {
        const newData = { ...prev };
        delete newData[selectedOrder.orderNumber];
        return newData;
      });
    }
  };

  const handleCancelApprove = () => {
    setShowApproveModal(false);
    setSelectedOrder(null);
    // Clear signature for this order when user cancels
    if (selectedOrder) {
      setOrderSignatures((prev) => {
        const newData = { ...prev };
        delete newData[selectedOrder.orderNumber];
        return newData;
      });
    }
  };

  const handleCancelCancel = () => {
    setShowCancelModal(false);
    setSelectedOrder(null);
  };

  const clearSearch = () => {
    setSearchTerm("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Function to get coin image path
  const getCoinImage = (coin: string) => {
    const coinMap: { [key: string]: string } = {
      RAMI: "/chess/ocoins/rlogo.svg",
      USDT: "/chess/ocoins/usdt.svg",
    };
    return coinMap[coin] || "/chess/ocoins/usdt.svg";
  };

  const getGameLink = (order: ChessOrder): string => {
    // Always use the database-provided anonymous link
    if (order.anonymousLink) {
      return order.anonymousLink;
    }

    // Fallback to short hash if available
    if (order.shortHash) {
      return `/play/chess/live/${order.shortHash}`;
    }

    // Ultimate fallback (shouldn't happen)
    return `/play/chess/live/${order.orderNumber}`;
  };

  // Base filter for search term
  const baseFilteredOrders = activeOrders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.coin.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Apply menu filtering based on selectedMenu
  const filteredOrders = baseFilteredOrders.filter((order) => {
    switch (selectedMenu) {
      case "global":
        // Show all orders (no filter)
        return true;

      case "my orders":
        // Show orders where user is creator OR joiner
        if (!userAddress) return false;

        const isCreator =
          userAddress &&
          order.creatorName.toLowerCase() === userAddress.toLowerCase();

        const isJoiner =
          order.contractAccepter &&
          userAddress &&
          order.contractAccepter.toLowerCase() === userAddress.toLowerCase();

        return isCreator || isJoiner;

      case "completed":
        // Show completed orders where user is creator OR joiner
        if (!userAddress) return false;

        const isOrderCompleted =
          order.contractStatus === 1 || order.status === "completed";

        if (!isOrderCompleted) return false;

        const isCreatorCompleted =
          userAddress &&
          order.creatorName.toLowerCase() === userAddress.toLowerCase();

        const isJoinerCompleted =
          order.contractAccepter &&
          userAddress &&
          order.contractAccepter.toLowerCase() === userAddress.toLowerCase();

        return isCreatorCompleted || isJoinerCompleted;

      default:
        return true;
    }
  });

  // Refresh function - fetches from database and contract
  const refreshOrders = () => {
    setIsRefreshing(true);
    fetchOrdersFromDatabase();
    refetchChessData();

    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  // Clear signatures when user disconnects
  useEffect(() => {
    if (!isConnected) {
      setOrderSignatures({});
    }
  }, [isConnected]);

  // Add transaction effect for auto-clearing
  useEffect(() => {
    if (transaction.status === "success" || transaction.status === "error") {
      const timer = setTimeout(() => {
        clearTransaction();
        setTimeout(() => {
          refetchChessData();
          fetchOrdersFromDatabase();
        }, 1000);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [transaction.status, clearTransaction, refetchChessData]);

  // Determine if approve button should be shown for creating room
  const showApproveButton = () => {
    if (!gameAmount || parseFloat(gameAmount) <= 0) return false;

    const amountNum = parseFloat(gameAmount);
    const tokenAllowance =
      selectedCurrency === "RAMI"
        ? chessState.ramiAllowance
        : chessState.usdtAllowance;

    return tokenAllowance < amountNum * 0.99;
  };

  // Get balance for display
  const getDisplayBalance = () => {
    if (!userAddress) return "0.00";

    if (selectedCurrency === "RAMI") {
      return chessState.ramiBalance?.toFixed(2) || "0.00";
    } else {
      return chessState.usdtBalance?.toFixed(2) || "0.00";
    }
  };

  // Get loading state for balance
  const isBalanceLoading =
    selectedCurrency === "RAMI"
      ? chessState.ramiLoading
      : chessState.usdtLoading;

  // Handle amount change with context
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGameAmount(value);
    handleStakeAmountChange(value);

    if (value) {
      validateAmount(value, selectedCurrency);
    } else {
      setAmountError("");
    }
  };

  // Handle currency selection with context
  const handleCurrencySelect = (currency: "USDT" | "RAMI") => {
    setSelectedCurrency(currency);
    handleCurrencyChange(currency);
    setIsCurrencyDropdownOpen(false);
    setAmountError("");
  };

  // Helper function to get counts for each menu
  const getOrderCounts = () => {
    const globalCount = activeOrders.length;

    const myOrdersCount = userAddress
      ? activeOrders.filter((order) => {
          const isCreator =
            order.creatorName.toLowerCase() === userAddress.toLowerCase();
          const isJoiner =
            order.contractAccepter &&
            order.contractAccepter.toLowerCase() === userAddress.toLowerCase();
          return isCreator || isJoiner;
        }).length
      : 0;

    const completedCount = userAddress
      ? activeOrders.filter((order) => {
          const isOrderCompleted =
            order.contractStatus === 1 || order.status === "completed";
          if (!isOrderCompleted) return false;
          const isCreator =
            order.creatorName.toLowerCase() === userAddress.toLowerCase();
          const isJoiner =
            order.contractAccepter &&
            order.contractAccepter.toLowerCase() === userAddress.toLowerCase();
          return isCreator || isJoiner;
        }).length
      : 0;

    return { globalCount, myOrdersCount, completedCount };
  };

  // Then use it in your menu:
  const { globalCount, myOrdersCount, completedCount } = getOrderCounts();

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
      <Header>
        <Column className="md:col-span-1">
          <Title>p2p chess</Title>
          <Description>perform & get rewarded</Description>
          <div className="w-full max-w-4xl mx-auto mb-4 p-2 flex justify-center lg:justify-between items-center">
            <div className="flex justify-center items-center gap-2">
              <div className="grid grid-cols-[auto_auto] items-stretch gap-2">
                <div className="flex-shrink-0">
                  <div className="h-full flex items-center justify-center shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-4 rounded-sm min-h-[48px]">
                    <BnbBalance />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Column>
      </Header>

      <article className="grid grid-cols-subgrid col-content pb-18 gap-y-11">
        {/* Left column - Create Game */}
        <div className="col-start-content-start max-lg:col-end-content-end lg:col-span-4 xl:col-span-6 2xl:col-span-5">
          <div className={`${className}`}>
            <div className="@container flex flex-col gap-10">
              <div className="@container flex flex-col gap-6">
                <div className="flex flex-col">
                  <div className="relative">
                    <div
                      className={`flex gap-7 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-5 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}
                    >
                      {/* Create Game Section */}
                      <div className="flex flex-col w-full">
                        <div className="flex justify-between items-center">
                          <div className="tracking-normal font-ui text-xl font-normal mb-2 text-black/60">
                            Game Order
                          </div>

                          {/* Currency Balance */}
                          <div className="flex justify-start items-center space-x-1">
                            {userAddress ? (
                              isBalanceLoading ? (
                                <div className="flex justify-start items-center space-x-1">
                                  <div className="text-md opacity-80 leading-none flex items-center font-ui text-[#000000]">
                                    <BlackSpinner />
                                    <span className="text-sm flex items-center text-ui-body ml-1">
                                      {selectedCurrency}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-start items-center space-x-1">
                                  <div className="text-sm opacity-80 leading-none flex items-center font-ui text-[#000000] tracking-tight">
                                    {getDisplayBalance()}
                                    <span className="text-sm flex items-center text-ui-body ml-1">
                                      {selectedCurrency}
                                    </span>
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="flex justify-start items-center space-x-1">
                                <div className="text-sm opacity-80 leading-none flex items-center font-ui text-[#000000]">
                                  0.00
                                  <span className="text-sm flex items-center text-ui-body ml-1">
                                    {selectedCurrency}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="relative">
                          {/* room code display & generate room code button */}
                          <div className="flex items-center justify-between w-full my-3">
                            <div className="flex items-center justify-between w-full no-scrollbar focus:outline-none form-input font-ui text-lg tracking-tight text-left shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] to-[rgb(79_64_63_/_0)] px-2 py-2 rounded-sm text-[#000000] font-medium placeholder:text-lg placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]">
                              <span
                                className={`flex-1 font-display ${
                                  roomCode
                                    ? "text-2xl tracking-wide"
                                    : "text-sm tracking-tight text-gray-500"
                                }`}
                              >
                                {roomCode
                                  ? `#${roomCode}`
                                  : "create your room code"}
                              </span>

                              <button
                                className="px-6 py-2 tracking-wide font-ui shrink-0 text-xs text-white bg-black/50 hover:bg-black/80 rounded-sm"
                                onClick={handleRoomCodeClick}
                              >
                                generate
                              </button>
                            </div>
                          </div>

                          <div className="relative">
                            <input
                              className={`no-scrollbar focus:outline-none form-input font-ui w-full text-3xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-4 rounded-sm text-[#000000] font-medium placeholder:text-lg placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}
                              type="number"
                              placeholder={getAmountPlaceholder(
                                selectedCurrency,
                              )}
                              value={gameAmount}
                              onChange={handleAmountChange}
                              min={getMinAmount(selectedCurrency)}
                              step={selectedCurrency === "RAMI" ? "100" : "1"}
                            />

                            {/* Error Message */}
                            {amountError && (
                              <div className="tracking-normal absolute -bottom-7 left-0 text-[#ff0000] text-sm font-display">
                                {amountError}
                              </div>
                            )}

                            {/* CURRENCY DROPDOWN */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setIsCurrencyDropdownOpen(
                                      !isCurrencyDropdownOpen,
                                    )
                                  }
                                  disabled={!!amountError}
                                  className="bg-[#000000]/10 px-3 py-1 rounded-sm flex justify-center items-center gap-1 hover:bg-[#000000]/20 transition-colors"
                                >
                                  <div className="flex justify-center items-center">
                                    <Image
                                      src={
                                        CURRENCY_OPTIONS.find(
                                          (c) => c.value === selectedCurrency,
                                        )?.image || "/chess/ocoins/usdt.svg"
                                      }
                                      alt={selectedCurrency}
                                      width={20}
                                      height={20}
                                      className="w-5 h-5"
                                      priority
                                    />
                                  </div>
                                  <span className="flex justify-center items-center font-ui text-sm tracking-wide">
                                    {selectedCurrency}
                                  </span>
                                  <svg
                                    className={`w-4 h-4 ml-1 transition-transform ${isCurrencyDropdownOpen ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isCurrencyDropdownOpen && (
                                  <div className="absolute top-full right-0 mt-1 w-28 bg-white border border-gray-200 rounded-sm shadow-lg z-10">
                                    {CURRENCY_OPTIONS.filter(
                                      (currency) =>
                                        currency.value !== selectedCurrency,
                                    ).map((currency) => (
                                      <button
                                        key={currency.value}
                                        type="button"
                                        onClick={() =>
                                          handleCurrencySelect(
                                            currency.value as "USDT" | "RAMI",
                                          )
                                        }
                                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 transition-colors"
                                      >
                                        <Image
                                          src={currency.image}
                                          alt={currency.label}
                                          width={16}
                                          height={16}
                                          className="w-4 h-4 flex justify-center items-center"
                                        />
                                        <span className="flex justify-center items-center font-ui text-sm tracking-tight">
                                          {currency.label}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full flex flex-col gap-4 items-center justify-between">
                        {(() => {
                          const buttonState = getCreateButtonState();

                          return (
                            <Button
                              theme={buttonState.theme}
                              onClick={() => {
                                if (!userAddress) handleConnectWallet();
                                else if (
                                  !orderSignatures[`create-${roomCode}`] ||
                                  orderSignatures[`create-${roomCode}`]
                                    ?.status !== "signed"
                                )
                                  handleSignForCreateRoom();
                                else if (showApproveButton())
                                  handleApproveToken(
                                    selectedCurrency as "USDT" | "RAMI",
                                  );
                                else handleCreateRoom();
                              }}
                              disabled={buttonState.disabled}
                              className="button-dandelion select-none w-full flex-auto button-dandelion font-ui text-xl lowercase text-center tracking-tight"
                            >
                              {buttonState.showSpinner ? (
                                <div className="flex items-center justify-center gap-2">
                                  <CustomSpinner size="sm" />
                                  {buttonState.text}
                                </div>
                              ) : (
                                buttonState.text
                              )}
                            </Button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Active Orders */}
        <div className="col-start-content-start col-end-content-end lg:col-start-5 xl:col-start-7 2xl:col-start-6 flex flex-col gap-4">
          <div className={`${className}`}>
            <div className="@container flex flex-col gap-10">
              <div className="@container flex flex-col gap-6">
                <div className="flex flex-col">
                  <div className="relative">
                    <div
                      className={`flex gap-3 flex-col justify-center items-center text-center outline-none font-ui w-full text-5xl shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% px-2 py-5 rounded-sm placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]`}
                    >
                      {/* Menu Section */}
                      <div className="w-full">
                        <div className="flex gap-1 mb-3">
                          <div
                            className={`flex-1 cursor-pointer h-full py-3 flex justify-center items-center tracking-normal text-sm ${
                              selectedMenu === "global"
                                ? "bg-black text-white"
                                : "bg-gray-200 text-black hover:bg-gray-300"
                            } rounded-sm transition-colors`}
                            onClick={() => handleMenuItemClick("global")}
                          >
                            Global
                            <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                              {globalCount}
                            </span>
                          </div>
                          <div
                            className={`flex-1 cursor-pointer h-full py-3 flex justify-center items-center tracking-normal text-sm ${
                              selectedMenu === "my orders"
                                ? "bg-black text-white"
                                : "bg-gray-200 text-black hover:bg-gray-300"
                            } rounded-sm transition-colors`}
                            onClick={() => handleMenuItemClick("my orders")}
                          >
                            my
                            <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                              {myOrdersCount}
                            </span>
                          </div>
                          <div
                            className={`flex-1 cursor-pointer h-full py-3 flex justify-center items-center tracking-normal text-sm ${
                              selectedMenu === "completed"
                                ? "bg-black text-white"
                                : "bg-gray-200 text-black hover:bg-gray-300"
                            } rounded-sm transition-colors`}
                            onClick={() => handleMenuItemClick("completed")}
                          >
                            played
                            <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                              {completedCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Search Bar Section */}
                      <div className="flex flex-col w-full">
                        <div className="relative mb-3">
                          <div className="flex items-stretch gap-1">
                            {/* Search Input */}
                            <div className="flex-1 relative">
                              <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#000000]"
                                size={20}
                              />
                              <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search by room code, name..."
                                className="w-full h-full border-0 flex justify-center items-center outline-none font-ui text-lg shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% pl-11 pr-10 py-3 lg:py-5 rounded-sm placeholder-fern-1100/30 placeholder:tracking-normal placeholder:text-sm lg:placeholder:text-lg focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                              {searchTerm && (
                                <X
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                                  size={20}
                                  onClick={clearSearch}
                                />
                              )}
                            </div>

                            {/* refresh order */}
                            <div className="flex-shrink-0">
                              <Button
                                theme="cornflour"
                                onClick={refreshOrders}
                                disabled={isRefreshing}
                                className="flex justify-center items-center text-white cursor-pointer disabled:opacity-70 h-full "
                              >
                                <Image
                                  src="/chess/server/refresh.svg"
                                  alt="refresh"
                                  width={30}
                                  height={30}
                                  className={`transition-transform duration-200 ${isRefreshing ? "animate-spin" : ""}`}
                                />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Orders List - FROM DATABASE with Updated UI */}
                      {/* MODIFIED: Scroll only when more than 10 orders */}
                      <div
                        className={`w-full p-1 ${filteredOrders.length > 30 ? "max-h-96 overflow-y-auto" : "overflow-visible"}`}
                      >
                        {filteredOrders.length > 0 ? (
                          filteredOrders.map((order, index) => {
                            const contractOrder =
                              chessState.contractOrdersByRoomCode[
                                order.orderNumber
                              ];
                            const displayAmount =
                              order.formattedAmount || order.size;
                            const now = Math.floor(Date.now() / 1000);

                            // Determine button state based on contract data
                            const isExpired = contractOrder
                              ? now > contractOrder.expiresAt
                              : false;
                            const isAccepted = contractOrder
                              ? contractOrder.accepter &&
                                contractOrder.accepter !==
                                  "0x0000000000000000000000000000000000000000"
                              : false;
                            const isActive = contractOrder
                              ? contractOrder.status === 0
                              : false;
                            const isMyOrder = contractOrder
                              ? userAddress &&
                                contractOrder.creator.toLowerCase() ===
                                  userAddress.toLowerCase()
                              : false;

                            // Check if game is completed
                            const isCompleted =
                              order.contractStatus === 1 ||
                              order.status === "completed";

                            // Determine joined players count
                            const joinedCount = isAccepted ? 2 : 1;

                            // Get status color and text
                            const getStatusColor = () => {
                              if (order.status === "cancelled")
                                return "bg-red-600";
                              if (isCompleted) return "bg-purple-600";
                              if (isAccepted) return "bg-emerald-600";
                              if (isActive) return "bg-amber-600";
                              return "bg-gray-400";
                            };

                            const getStatusText = () => {
                              if (order.status === "cancelled")
                                return "Cancelled";
                              if (isCompleted) return "Order Completed";
                              if (isAccepted) return "Order Accepted";
                              if (isActive) return "Order Active";
                              return "Order Pending";
                            };

                            // Check if current user is winner
                            const isCurrentUserWhite =
                              userAddress &&
                              order.creatorName.toLowerCase() ===
                                userAddress.toLowerCase();

                            const isCurrentUserBlack =
                              userAddress &&
                              contractOrder?.accepter &&
                              contractOrder.accepter.toLowerCase() ===
                                userAddress.toLowerCase();

                            // Determine winner tag for white player
                            const getWhitePlayerResult = () => {
                              if (order.gameResult) {
                                return order.gameResult.winner === "white"
                                  ? "WON"
                                  : "LOST";
                              }
                              return null;
                            };

                            // Determine winner tag for black player
                            const getBlackPlayerResult = () => {
                              if (order.gameResult) {
                                return order.gameResult.winner === "black"
                                  ? "WON"
                                  : "LOST";
                              }
                              return null;
                            };

                            return (
                              <div key={`order-${order.orderNumber}-${index}`}>
                                {/* Add divider between orders, but not before the first one */}
                                {index > 0 && (
                                  <div className="flex items-center w-full my-8">
                                    {/* Left dashed line */}
                                    <div className="flex-1 border-t border-dashed border-[#ff0000] h-0.5 my-5" />

                                    {/* X icon */}
                                    <div className="mx-3 flex items-center justify-center">
                                      <svg
                                        className="w-4 h-4 text-[#ff0000]"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.2"
                                        strokeLinecap="round"
                                      >
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                      </svg>
                                    </div>

                                    {/* Right dashed line */}
                                    <div className="flex-1 border-t border-dashed border-[#ff0000] h-0.5" />
                                  </div>
                                )}
                                <div className="rounded-sm p-1 flex flex-col gap-1 text-ui justify-between items-center text-center outline-none text-lg shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_64_63_/_0.1)] bg-gradient-to-b from-[rgb(79_64_63_/_0.03)] from-0% to-[rgb(79_64_63_/_0)] to-100% placeholder-fern-1100/30 focus-visible:shadow-[0_-1px_rgb(79_64_63_/_0.2),_0_0_0_1px_rgb(79_127_218),_0_0_0_6px_rgb(79_127_218_/_0.08)]">
                                  {/* TOP STATUS ROW */}
                                  <div className="flex w-full justify-end gap-1 text-sm">
                                    <span className="bg-gray-400/90 text-white rounded-sm px-4 py-1 tracking-tight">
                                      Joined: {joinedCount}/2
                                    </span>
                                    <span
                                      className={`${getStatusColor()} text-white rounded-sm px-4 py-1 tracking-tight`}
                                    >
                                      {getStatusText()}
                                    </span>

                                    {/* Add Winnings Claimed tag at the top for completed games */}
                                    {isCompleted &&
                                      (() => {
                                        const contractOrder =
                                          chessState.contractOrdersByRoomCode[
                                            order.orderNumber
                                          ];
                                        if (!contractOrder || !userAddress)
                                          return null;

                                        // Check for DRAW first
                                        const DRAW_ADDRESS =
                                          "0x6F09eF95af0B49863225cFabA6875d9e6077fa77";
                                        const isDraw =
                                          contractOrder.winner?.toLowerCase() ===
                                          DRAW_ADDRESS.toLowerCase();

                                        if (isDraw) {
                                          // For DRAW: Check if EITHER player has withdrawn
                                          const hasAnyWithdrawn =
                                            contractOrder.creatorWithdrawn ||
                                            contractOrder.accepterWithdrawn;

                                          if (hasAnyWithdrawn) {
                                            return (
                                              <Image
                                                src="/chess/claimtick.svg"
                                                alt="c"
                                                width={30}
                                                height={30}
                                              />
                                            );
                                          }
                                        } else {
                                          const isWinner =
                                            contractOrder.winner &&
                                            contractOrder.winner.toLowerCase() ===
                                              userAddress.toLowerCase();

                                          if (!isWinner) return null;

                                          const isCreator =
                                            userAddress.toLowerCase() ===
                                            contractOrder.creator.toLowerCase();
                                          const hasWithdrawn = isCreator
                                            ? contractOrder.creatorWithdrawn
                                            : contractOrder.accepterWithdrawn;

                                          if (hasWithdrawn) {
                                            return (
                                              // <span className="bg-green-600 text-white rounded-sm px-4 py-1 tracking-tight">
                                              <Image
                                                src="/chess/claimtick.svg"
                                                alt="c"
                                                width={30}
                                                height={30}
                                              />
                                              // </span>
                                            );
                                          }

                                          return null;
                                        }
                                      })()}
                                  </div>

                                  {/* CONTENT */}
                                  <div className="flex flex-col gap-2 w-full">
                                    {/* DATA GRID */}
                                    <div className="grid w-full grid-cols-6 gap-0.5 rounded-sm bg-black/5 p-1">
                                      {/* Roomcode */}
                                      <div className="col-span-3 rounded-sm border border-black/10 bg-white/60 px-2 py-3">
                                        <span className="block text-sm leading-none opacity-50 lowercase tracking-tight">
                                          roomcode
                                        </span>
                                        <span className="block text-lg leading-tight font-medium tracking-tight">
                                          {order.orderNumber ? (
                                            `#${order.orderNumber}`
                                          ) : (
                                            <span className="flex items-center w-full justify-center">
                                              <BlackSpinner />
                                            </span>
                                          )}
                                        </span>
                                      </div>

                                      {/* Game ID */}
                                      <div className="col-span-3 rounded-sm border border-black/10 bg-white/60 px-2 py-3">
                                        <span className="tracking-tight block text-sm leading-none opacity-50 lowercase">
                                          gameid:
                                        </span>
                                        <span className="tracking-tight block text-lg leading-tight font-medium">
                                          {contractOrder?.orderId ? (
                                            `#${contractOrder.orderId}`
                                          ) : (
                                            <span className="flex items-center w-full justify-center">
                                              <BlackSpinner />
                                            </span>
                                          )}
                                        </span>
                                      </div>

                                      {/* Game Size */}
                                      <div className="col-span-2 rounded-sm border border-black/10 bg-white/60 px-2 py-3">
                                        <span className="tracking-tight block text-sm leading-none opacity-50 lowercase">
                                          game size:
                                        </span>
                                        <div className="tracking-tight flex items-center justify-center gap-1">
                                          {(() => {
                                            const displayAmountNum =
                                              parseFloat(displayAmount);
                                            let amountDisplay = displayAmount;
                                            let isPositive = false;
                                            let isNegative = false;
                                            let isTotalPot = false;
                                            let isUserInvolved = false;

                                            // For non-connected wallet or general viewing
                                            if (!userAddress) {
                                              // If order is active (not completed), show total pot
                                              if (
                                                !isCompleted &&
                                                order.contractStatus === 0
                                              ) {
                                                amountDisplay = `${(displayAmountNum * 2).toFixed(2)}`;
                                                isTotalPot = true;
                                              }
                                              // Otherwise show single stake amount (default)
                                            } else {
                                              // For connected wallet
                                              isUserInvolved = true;

                                              if (
                                                isCompleted &&
                                                order.gameResult
                                              ) {
                                                // Determine if user is winner or loser
                                                const isWinner = (() => {
                                                  if (
                                                    order.gameResult.winner ===
                                                    "white"
                                                  ) {
                                                    return (
                                                      userAddress.toLowerCase() ===
                                                      order.creatorName.toLowerCase()
                                                    );
                                                  } else if (
                                                    order.gameResult.winner ===
                                                    "black"
                                                  ) {
                                                    return (
                                                      order.contractAccepter &&
                                                      userAddress.toLowerCase() ===
                                                        order.contractAccepter.toLowerCase()
                                                    );
                                                  }
                                                  return false;
                                                })();

                                                const isLoser = (() => {
                                                  if (
                                                    order.gameResult.winner ===
                                                    "white"
                                                  ) {
                                                    return (
                                                      order.contractAccepter &&
                                                      userAddress.toLowerCase() ===
                                                        order.contractAccepter.toLowerCase()
                                                    );
                                                  } else if (
                                                    order.gameResult.winner ===
                                                    "black"
                                                  ) {
                                                    return (
                                                      userAddress.toLowerCase() ===
                                                      order.creatorName.toLowerCase()
                                                    );
                                                  }
                                                  return false;
                                                })();

                                                if (isWinner) {
                                                  const winnings =
                                                    calculateWinnings(order);
                                                  amountDisplay = `+${winnings.winningAmount.toFixed(2)}`;
                                                  isPositive = true;
                                                } else if (isLoser) {
                                                  amountDisplay = `-${displayAmount}`;
                                                  isNegative = true;
                                                }
                                              }
                                            }

                                            // Render with appropriate visual indicators
                                            return (
                                              <>
                                                {/* Amount Text */}
                                                <span
                                                  className={`text-lg leading-tight font-medium ${
                                                    isPositive
                                                      ? "text-green-600"
                                                      : isNegative
                                                        ? "text-red-600"
                                                        : isTotalPot
                                                          ? "text-blue-600"
                                                          : isUserInvolved
                                                            ? "text-amber-600"
                                                            : "text-gray-800"
                                                  }`}
                                                >
                                                  {amountDisplay}
                                                </span>

                                                {/* Visual Indicators */}
                                                {isPositive && (
                                                  <div className="flex items-center">
                                                    <svg
                                                      className="w-4 h-4 text-green-600"
                                                      fill="currentColor"
                                                      viewBox="0 0 20 20"
                                                    >
                                                      <path
                                                        fillRule="evenodd"
                                                        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                                                        clipRule="evenodd"
                                                      />
                                                    </svg>
                                                  </div>
                                                )}

                                                {isNegative && (
                                                  <div className="flex items-center">
                                                    <svg
                                                      className="w-4 h-4 text-red-600"
                                                      fill="currentColor"
                                                      viewBox="0 0 20 20"
                                                    >
                                                      <path
                                                        fillRule="evenodd"
                                                        d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                      />
                                                    </svg>
                                                  </div>
                                                )}

                                                {isTotalPot && !userAddress && (
                                                  <div
                                                    className="flex items-center gap-1 ml-1"
                                                    title="Total pot (2x stake)"
                                                  >
                                                    <span className="text-xs text-blue-600 font-medium">
                                                      (1.8x)
                                                    </span>
                                                  </div>
                                                )}
                                              </>
                                            );
                                          })()}
                                        </div>
                                      </div>

                                      {/* Logo */}
                                      <div className="col-span-1 rounded-sm border border-black/10 bg-white/60 p-3">
                                        <div className="relative h-full w-full">
                                          <Image
                                            src={getCoinImage(order.coin)}
                                            alt={order.coin}
                                            fill
                                            className="object-contain"
                                            priority
                                          />
                                        </div>
                                      </div>

                                      {/* Expiry */}
                                      <div className="col-span-3 rounded-sm border border-black/10 bg-white/60 px-2 py-3">
                                        <span className="tracking-tight block text-sm leading-none opacity-50 lowercase">
                                          order expires in
                                        </span>
                                        <span className="tracking-tight block text-lg leading-tight font-medium tabular-nums">
                                          {isCompleted ? "-" : order.expiryTime}
                                        </span>
                                      </div>

                                      {/* PLAYERS */}
                                      <div className="col-span-6 rounded-sm border border-black/10 bg-white/50 p-1">
                                        {/* White (Creator) */}

                                        <div
                                          className={`relative flex items-center gap-2 rounded-sm border-black/10 bg-white/70 px-3 py-2 border-l-4 
                                            ${
                                              isCompleted && order.gameResult
                                                ? order.gameResult.isDraw
                                                  ? "border-l-gray-600 border-gray-600/30" // Draw
                                                  : order.gameResult.winner ===
                                                      "white"
                                                    ? "border-l-green-600 border-green-600/30" // Winner
                                                    : "border-l-red-600 border-red-600/30" // Loser
                                                : "border-l-gray-400 border-gray-400/30" // Game not completed
                                            }
                                            `}
                                        >
                                          <Image
                                            src="/chess/piece/alpha/wN.svg"
                                            alt="White"
                                            width={40}
                                            height={40}
                                          />
                                          <div className="min-w-0 flex-1">
                                            <span className="tracking-tight block text-left text-sm opacity-50 lowercase">
                                              playing as white
                                            </span>
                                            <span className="block text-left text-xs break-all tracking-tight">
                                              {order.creatorName || "Anonymous"}
                                            </span>
                                          </div>

                                          {/* White player result tag */}
                                          {(() => {
                                            // If game is not completed and user is the white player, show "You"
                                            if (
                                              !isCompleted &&
                                              isMyOrder &&
                                              !isCurrentUserBlack
                                            ) {
                                              return (
                                                <span className="tracking-tight top-1 right-3 font-ui text-xs px-4 py-1 rounded-xs shadow bg-gray-100 text-black">
                                                  You
                                                </span>
                                              );
                                            }

                                            // If game is completed, show result for WHITE
                                            if (
                                              isCompleted &&
                                              order.gameResult
                                            ) {
                                              // Check for draw
                                              if (order.gameResult.isDraw) {
                                                return (
                                                  <span className="tracking-tight absolute top-1 right-1 font-ui text-xs px-4 py-1 rounded-xs shadow bg-gray-600 text-white">
                                                    DRAW
                                                  </span>
                                                );
                                              }

                                              // If game is completed, show result
                                              if (
                                                isCompleted &&
                                                order.gameResult
                                              ) {
                                                const isWhiteWinner =
                                                  order.gameResult.winner ===
                                                  "white";
                                                const isCurrentUserWhite =
                                                  isMyOrder &&
                                                  !isCurrentUserBlack;

                                                // If current user is white player
                                                if (isCurrentUserWhite) {
                                                  return (
                                                    <span
                                                      className={`tracking-tight absolute top-1 right-1 font-ui text-xs px-4 py-1 rounded-xs shadow ${
                                                        isWhiteWinner
                                                          ? "bg-green-600 text-white"
                                                          : "bg-red-600 text-white"
                                                      }`}
                                                    >
                                                      {isWhiteWinner
                                                        ? "YOU WON"
                                                        : "YOU LOST"}
                                                    </span>
                                                  );
                                                }

                                                // If current user is NOT white player (showing opponent's result)
                                                return (
                                                  <span
                                                    className={`tracking-tight absolute top-1 right-1 font-ui text-xs px-4 py-1 rounded-xs shadow ${
                                                      isWhiteWinner
                                                        ? "bg-green-600 text-white"
                                                        : "bg-red-600 text-white"
                                                    }`}
                                                  >
                                                    {isWhiteWinner
                                                      ? "WON"
                                                      : "LOST"}
                                                  </span>
                                                );
                                              }

                                              return null;
                                            }
                                          })()}
                                        </div>

                                        {/* Black (Joiner) */}
                                        <div
                                          className={`relative flex items-center gap-2 rounded-sm border-black/10 bg-white/70 px-3 py-2 mt-1 border-l-4 
                                            ${
                                              isCompleted && order.gameResult
                                                ? order.gameResult.isDraw
                                                  ? "border-l-gray-600 border-gray-600/30" // Draw
                                                  : order.gameResult.winner ===
                                                      "black"
                                                    ? "border-l-green-600 border-green-600/30" // Winner
                                                    : "border-l-red-600 border-red-600/30" // Loser
                                                : "border-l-gray-400 border-gray-400/30" // Game not completed
                                            }
                                          `}
                                        >
                                          <Image
                                            src="/chess/piece/alpha/bN.svg"
                                            alt="Black"
                                            width={40}
                                            height={40}
                                          />
                                          <div className="min-w-0 flex-1">
                                            <span className="tracking-tight block text-left text-sm opacity-50 lowercase">
                                              playing as black
                                            </span>
                                            <span className="block text-left text-xs break-all tracking-tight">
                                              {contractOrder?.accepter &&
                                              contractOrder.accepter !==
                                                "0x0000000000000000000000000000000000000000"
                                                ? contractOrder.accepter
                                                : "Waiting for opponent..."}
                                            </span>
                                          </div>

                                          {/* black you */}
                                          {/* Black player result tag */}
                                          {(() => {
                                            // If game is not completed and user is the black player, show "You"
                                            if (
                                              !isCompleted &&
                                              isCurrentUserBlack
                                            ) {
                                              return (
                                                <span className="tracking-tight absolute top-1 right-3 font-ui text-xs px-4 py-1 rounded-xs shadow bg-blue-100 text-blue-800">
                                                  You
                                                </span>
                                              );
                                            }

                                            // If game is completed, show result
                                            if (
                                              isCompleted &&
                                              order.gameResult
                                            ) {
                                              // Check for draw
                                              if (order.gameResult.isDraw) {
                                                return (
                                                  <span className="tracking-tight absolute top-1 right-1 font-ui text-xs px-4 py-1 rounded-xs shadow bg-gray-600 text-white">
                                                    DRAW
                                                  </span>
                                                );
                                              }

                                              // If game is completed, show result
                                              if (
                                                isCompleted &&
                                                order.gameResult
                                              ) {
                                                const isBlackWinner =
                                                  order.gameResult.winner ===
                                                  "black";
                                                const isCurrentUserBlack =
                                                  userAddress &&
                                                  order.contractAccepter &&
                                                  order.contractAccepter.toLowerCase() ===
                                                    userAddress.toLowerCase();

                                                // If current user is black player
                                                if (isCurrentUserBlack) {
                                                  return (
                                                    <span
                                                      className={`tracking-tight absolute top-1 right-1 font-ui text-xs px-4 py-1 rounded-xs shadow ${
                                                        isBlackWinner
                                                          ? "bg-green-600 text-white"
                                                          : "bg-red-600 text-white"
                                                      }`}
                                                    >
                                                      {isBlackWinner
                                                        ? "YOU WON"
                                                        : "YOU LOST"}
                                                    </span>
                                                  );
                                                }

                                                // If current user is NOT black player (showing opponent's result)
                                                return (
                                                  <span
                                                    className={`tracking-tight absolute top-1 right-1 font-ui text-xs px-4 py-1 rounded-xs shadow ${
                                                      isBlackWinner
                                                        ? "bg-green-600 text-white"
                                                        : "bg-red-600 text-white"
                                                    }`}
                                                  >
                                                    {isBlackWinner
                                                      ? "WON"
                                                      : "LOST"}
                                                  </span>
                                                );
                                              }

                                              return null;
                                            }
                                          })()}
                                        </div>
                                      </div>
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="flex gap-1 pt-2 border-t border-black/10">
                                      {isCompleted ? (
                                        // Game completed - show Claim Winnings button only for winner
                                        (() => {
                                          // Get the contract order for current status
                                          const contractOrder =
                                            chessState.contractOrdersByRoomCode[
                                              order.orderNumber
                                            ];

                                          if (!contractOrder) return null;

                                          // CHECK FOR DRAW FIRST
                                          const isDraw =
                                            contractOrder.winner?.toLowerCase() ===
                                            "0x6F09eF95af0B49863225cFabA6875d9e6077fa77";

                                          if (isDraw) {
                                            // DRAW: Show Claim Refund for both players
                                            const isUserInGame = (() => {
                                              if (
                                                !userAddress ||
                                                !contractOrder
                                              )
                                                return false;

                                              const isCreator =
                                                contractOrder.creator.toLowerCase() ===
                                                userAddress.toLowerCase();
                                              const isAccepter =
                                                contractOrder.accepter.toLowerCase() ===
                                                userAddress.toLowerCase();

                                              return isCreator || isAccepter;
                                            })();

                                            if (!isUserInGame) return null;

                                            // Check if user has already withdrawn
                                            const isCreator =
                                              userAddress?.toLowerCase() ===
                                              contractOrder.creator.toLowerCase();
                                            const hasWithdrawn = isCreator
                                              ? contractOrder.creatorWithdrawn
                                              : contractOrder.accepterWithdrawn;

                                            if (hasWithdrawn) {
                                              return (
                                                <div className="w-full text-center py-2">
                                                  <span className="text-sm text-gray-600 font-ui tracking-tight">
                                                    Refund Claimed
                                                  </span>
                                                </div>
                                              );
                                            }

                                            // Show Claim Refund button
                                            return (
                                              <Button
                                                theme="grass"
                                                className="w-full tracking-tight"
                                                onClick={() =>
                                                  handleClaimDrawRefund(order)
                                                } // Change this line
                                                disabled={
                                                  isClaiming ===
                                                  order.orderNumber
                                                }
                                              >
                                                {isClaiming ===
                                                order.orderNumber ? (
                                                  <span className="flex justify-center items-center gap-2">
                                                    <CustomSpinner size="sm" />
                                                    claiming refund
                                                  </span>
                                                ) : (
                                                  "Claim Refund"
                                                )}
                                              </Button>
                                            );
                                          }

                                          // Check if current user is the winner
                                          const isWinner =
                                            userAddress &&
                                            contractOrder.winner &&
                                            contractOrder.winner !==
                                              "0x0000000000000000000000000000000000000000" &&
                                            contractOrder.winner.toLowerCase() ===
                                              userAddress.toLowerCase();

                                          if (!isWinner) return null;

                                          // Check if user is creator
                                          const isCreator =
                                            userAddress.toLowerCase() ===
                                            contractOrder.creator.toLowerCase();

                                          // Check if winner has already withdrawn
                                          const hasWithdrawn = isCreator
                                            ? contractOrder.creatorWithdrawn
                                            : contractOrder.accepterWithdrawn;

                                          // Show claim button if:
                                          // 1. User is the winner (winner address is set and matches user)
                                          // 2. User has NOT withdrawn yet
                                          // 3. EITHER: Game is completed (contract status = 1) OR winner is set (status might still be 0)
                                          if (
                                            contractOrder.winner &&
                                            contractOrder.winner !==
                                              "0x0000000000000000000000000000000000000000" &&
                                            isWinner &&
                                            !hasWithdrawn
                                          ) {
                                            return (
                                              <Button
                                                theme="grass"
                                                className="w-full tracking-tight"
                                                onClick={() =>
                                                  handleClaimWinnings(order)
                                                }
                                                disabled={
                                                  isClaiming ===
                                                  order.orderNumber
                                                }
                                              >
                                                {isClaiming ===
                                                order.orderNumber ? (
                                                  <span className="flex justify-center items-center gap-2">
                                                    <CustomSpinner size="sm" />
                                                    claiming...
                                                  </span>
                                                ) : (
                                                  "Claim Winnings"
                                                )}
                                              </Button>
                                            );
                                          }

                                          // Show nothing if other conditions
                                          return null;
                                        })()
                                      ) : !userAddress ? (
                                        // Not connected → Connect Wallet
                                        <Button
                                          theme="dandelion"
                                          className="w-full tracking-tight"
                                          onClick={handleConnectWallet}
                                        >
                                          Connect Wallet
                                        </Button>
                                      ) : chessState.contractOrdersLoading ? (
                                        // Loading
                                        <div className="w-full text-center py-2 flex justify-center items-center">
                                          <span className="flex gap-2 tracking-wide text-sm text-gray-600">
                                            <BlackSpinner /> loading ...
                                          </span>
                                        </div>
                                      ) : !contractOrder ? (
                                        // No contract data
                                        <div className="w-full text-center py-2">
                                          <span className="text-sm text-[#ff0000] tracking-tight lowercase">
                                            Contract Data Unavailable
                                          </span>
                                        </div>
                                      ) : isExpired ? (
                                        // Expired
                                        <div className="w-full text-center py-2">
                                          <span className="text-sm text-gray-600">
                                            Order Expired
                                          </span>
                                        </div>
                                      ) : isAccepted ? (
                                        // Order has been accepted by someone
                                        (() => {
                                          // Check if current user is one of the 2 players in the game
                                          const isUserInGame = (() => {
                                            if (!userAddress || !contractOrder)
                                              return false;

                                            // Check if user is the creator
                                            const isCreator =
                                              contractOrder.creator.toLowerCase() ===
                                              userAddress.toLowerCase();

                                            // Check if user is the accepter
                                            const isAccepter =
                                              contractOrder.accepter &&
                                              contractOrder.accepter !==
                                                "0x0000000000000000000000000000000000000000" &&
                                              contractOrder.accepter.toLowerCase() ===
                                                userAddress.toLowerCase();

                                            return isCreator || isAccepter;
                                          })();

                                          if (isUserInGame) {
                                            // User is one of the 2 players - show Play Now
                                            // const gameLink = getGameLink(
                                            //   order,
                                            //   userAddress
                                            // );

                                            const gameLink = getGameLink(order);

                                            if (gameLink) {
                                              return (
                                                <Link
                                                  href={gameLink}
                                                  target="_blank"
                                                  className="w-full"
                                                >
                                                  <Button
                                                    theme="grass"
                                                    className="w-full tracking-tight"
                                                  >
                                                    Play Now
                                                  </Button>
                                                </Link>
                                              );
                                            } else {
                                              return (
                                                <div className="w-full text-center py-2">
                                                  <span className="text-sm text-gray-600">
                                                    Game in progress
                                                  </span>
                                                </div>
                                              );
                                            }
                                          } else {
                                            // User is NOT one of the 2 players - show Matching in Progress
                                            return (
                                              <div className="w-full text-center py-2">
                                                <span className="text-sm text-gray-600 font-ui tracking-tight lowercase">
                                                  Matching in Progress
                                                </span>
                                              </div>
                                            );
                                          }
                                        })()
                                      ) : !isActive ? (
                                        // Not active
                                        <div className="w-full text-center py-2">
                                          <span className="text-sm text-gray-600">
                                            x
                                          </span>
                                        </div>
                                      ) : isMyOrder ? (
                                        // Creator - Play Now or Cancel
                                        <div className="flex gap-1 w-full">
                                          {order.status === "in_progress" ||
                                          order.joinerName ? (
                                            // Game in progress - only Play button
                                            <Link
                                              href={getGameLink(order)}
                                              target="_blank"
                                              className="flex-1"
                                            >
                                              <Button
                                                theme="grass"
                                                className="w-full tracking-tight"
                                              >
                                                Play Now
                                              </Button>
                                            </Link>
                                          ) : (
                                            // Waiting - both Play and Cancel
                                            <>
                                              <Button
                                                theme="tomato"
                                                className="flex-1 tracking-tight"
                                                onClick={() =>
                                                  handleCancelClick(order)
                                                }
                                                disabled={
                                                  cancellingOrder ===
                                                  order.orderNumber
                                                }
                                              >
                                                {cancellingOrder ===
                                                order.orderNumber ? (
                                                  <span className="flex justify-center items-center gap-2">
                                                    <CustomSpinner size="sm" />
                                                    cancelling...
                                                  </span>
                                                ) : (
                                                  "cancel order"
                                                )}
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      ) : (
                                        // Not creator - Accept Order
                                        (() => {
                                          const buttonState =
                                            getAcceptButtonState(order);

                                          return (
                                            <Button
                                              theme={buttonState.theme}
                                              className="w-full tracking-tight"
                                              onClick={() =>
                                                handleAcceptOrderClick(order)
                                              }
                                              disabled={
                                                buttonState.disabled ||
                                                joiningRoom ===
                                                  order.orderNumber
                                              }
                                            >
                                              {buttonState.showSpinner ? (
                                                <span className="flex justify-center items-center gap-2">
                                                  <CustomSpinner size="sm" />
                                                  {buttonState.text}
                                                </span>
                                              ) : chessState.transaction
                                                  .status === "error" &&
                                                joiningRoom ===
                                                  order.orderNumber ? (
                                                <span className="flex justify-center items-center gap-2">
                                                  <XCircleIcon className="w-6 h-6 text-current" />
                                                  {buttonState.text}
                                                </span>
                                              ) : (
                                                buttonState.text
                                              )}
                                            </Button>
                                          );
                                        })()
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="w-full text-center py-8">
                            <p className="text-gray-500 text-sm tracking-normal font-ui">
                              {searchTerm
                                ? "No matching orders found"
                                : selectedMenu === "my orders"
                                  ? "No orders created or joined by you"
                                  : selectedMenu === "completed"
                                    ? "No completed orders found"
                                    : "No active games available"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Approve Tokens Modal for Accepting Order */}
      {showApproveModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl">
          {/* Modal wrapper */}
          <div className="relative">
            {/* Close button */}
            <button
              onClick={handleCancelApprove}
              disabled={approvingOrder === selectedOrder.orderNumber}
              className="
            absolute
            -top-16
            left-1/2 -translate-x-1/2
            flex
            h-10 w-10
            items-center
            justify-center
            rounded-full
            bg-[#ede4de]/90
            text-lg
            font-bold
            lowercase
            shadow-md
            hover:bg-[#ede4de]
            
          "
            >
              x
            </button>
            {/* Modal */}
            <div className="flex w-full max-w-[300px] lg:max-w-[500px] flex-col gap-4 rounded-sm bg-[#ede4de] p-5">
              {/* Header */}
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

              {/* Divider */}
              <div className="border-t border-dashed border-neutral-700" />

              {/* Order details */}
              <div className="grid grid-cols-2 gap-4 px-2 font-ui tracking-wide text-black">
                <div>
                  <span className="text-xs opacity-70">roomcode:</span>
                  <span className="block text-lg">
                    #{selectedOrder.orderNumber}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs opacity-70">game size:</span>
                  <span className="block text-lg">
                    {selectedOrder.size} {selectedOrder.coin}
                  </span>
                </div>
              </div>

              {/* Creator */}
              <div className="px-2 font-ui">
                <span className="text-xs opacity-70">order creator:</span>
                <span className="block break-all text-sm">
                  {selectedOrder.creatorName}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-neutral-700" />

            <Button
              theme="rio"
              className="mt-1 w-full"
              onClick={handleApproveForAcceptOrder}
              disabled={approvingOrder === selectedOrder.orderNumber}
            >
              {approvingOrder === selectedOrder.orderNumber ? (
                <span className="flex justify-center items-center gap-2">
                  <CustomSpinner size="sm" />
                  approving ...
                </span>
              ) : (
                `approve ${selectedOrder.coin}`
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Accept Order Modal */}
      {showAcceptModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl">
          {/* Modal wrapper */}
          <div className="relative">
            {/* Close button */}

            <button
              onClick={handleCancelAccept}
              disabled={joiningRoom === selectedOrder.orderNumber}
              className="
            absolute
            -top-16
            left-1/2 -translate-x-1/2
            flex
            h-10 w-10
            items-center
            justify-center
            rounded-full
            bg-[#ede4de]
            text-lg
            font-bold
            lowercase
            shadow-md
            hover:bg-[#ede4de]
            
          "
            >
              x
            </button>

            {/* Modal */}
            <div className="flex w-full max-w-[300px] lg:max-w-[500px] flex-col gap-4 rounded-sm bg-[#ede4de] p-5">
              {/* Header */}
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

              {/* Divider */}
              <div className="border-t border-dashed border-neutral-700" />

              {/* Order details */}
              <div className="grid grid-cols-2 gap-4 px-2 font-ui tracking-wide text-black">
                <div>
                  <span className="text-xs opacity-70">roomcode:</span>
                  <span className="block text-lg">
                    #{selectedOrder.orderNumber}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs opacity-70">game size:</span>
                  <span className="block text-lg">
                    {selectedOrder.size} {selectedOrder.coin}
                  </span>
                </div>
              </div>

              <div className="text-left px-2 font-ui">
                <span className="text-xs opacity-70">expiry time:</span>
                <span className="block text-lg">
                  {selectedOrder.expiryTime}
                </span>
              </div>

              {/* Creator */}
              <div className="px-2 font-ui">
                <span className="text-xs opacity-70">order creator:</span>
                <span className="block break-all text-sm">
                  {selectedOrder.creatorName}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-neutral-700" />
            </div>

            <Button
              theme="rio"
              className="mt-1 w-full"
              onClick={handleConfirmAccept}
              disabled={joiningRoom === selectedOrder.orderNumber}
            >
              {joiningRoom === selectedOrder.orderNumber ? (
                <span className="flex justify-center items-center gap-2">
                  <CustomSpinner size="sm" />
                  processing
                </span>
              ) : (
                "pay and accept"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl">
          {/* Modal wrapper */}
          <div className="relative">
            {/* Close button */}
            <button
              className="
            absolute
            -top-16
            left-1/2 -translate-x-1/2
            flex
            h-10 w-10
            items-center
            justify-center
            rounded-full
            bg-white
            text-lg
            font-bold
            lowercase
            shadow-md
            hover:bg-neutral-200
            
          "
              onClick={handleCancelCancel}
              disabled={cancellingOrder === selectedOrder.orderNumber}
            >
              x
            </button>
            {/* Modal */}
            <div className="flex w-full max-w-[300px] lg:max-w-[500px] flex-col gap-4 rounded-sm bg-[#ede4de] p-5">
              {/* Header */}
              <div className="flex w-full items-center gap-3 bg-[#c7c5c4]/50 rounded-sm py-3">
                {/* Image */}
                <div className="h-14 w-14 shrink-0">
                  <Image
                    src="/chess/piece/alpha/wN.svg"
                    width={56}
                    height={56}
                    alt="ramicoin"
                    className="h-full w-full rounded-sm object-cover"
                  />
                </div>

                {/* Text */}
                <div className="flex min-w-0 flex-1 flex-col lg:pr-4">
                  <span
                    className="
                  font-ui font-bold tracking-tight
                  text-xl sm:text-2xl lg:text-3xl
                  truncate
                  "
                  >
                    ramicoin.com
                  </span>
                  <span className="text-sm sm:text-sm opacity-70">esports</span>
                </div>
              </div>

              {/* divider */}
              <div className="w-full">
                <div className="relative flex items-center">
                  <div className="w-full border-t border-dashed border-neutral-700" />
                </div>
              </div>

              {/* Order details */}
              <div className="grid w-full grid-cols-2 gap-4 font-ui tracking-wide text-black px-2">
                <div className="flex flex-col">
                  <span className="text-xs opacity-70">roomcode:</span>
                  <span className="text-lg">#{selectedOrder.orderNumber}</span>
                </div>

                <div className="flex flex-col text-right">
                  <span className="text-xs opacity-70">refund:</span>
                  <span className="text-lg">
                    {selectedOrder.size} {selectedOrder.coin}
                  </span>
                </div>
              </div>

              {/* Creator */}
              <div className="w-full font-ui px-2">
                <span className="text-xs opacity-70">order creator:</span>
                <span className="block max-w-full break-all text-sm">
                  {/* {selectedOrder.contractCreator} */}
                  {selectedOrder.creatorName ? (
                    selectedOrder.creatorName
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CustomSpinner size="sm" />
                      <span className="text-sm">loading ...</span>
                    </div>
                  )}
                </span>
              </div>

              {/* divider */}
              <div className="w-full">
                <div className="relative flex items-center">
                  <div className="w-full border-t border-dashed border-neutral-700" />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  theme="tomato"
                  className="flex-1"
                  onClick={handleConfirmCancel}
                  disabled={cancellingOrder === selectedOrder.orderNumber}
                >
                  {cancellingOrder === selectedOrder.orderNumber ? (
                    <span className="flex justify-center items-center gap-2 lowercase">
                      <CustomSpinner size="sm" />
                      cancelling ...
                    </span>
                  ) : (
                    "Cancel Order"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
