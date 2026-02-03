"use client";

import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
} from "react";

import {
  TransactionState,
  ContractOrderDetails,
  ChessState,
  ChessContextType,
} from "@/types/chess";

import { useAccount, useReadContracts, useWriteContract } from "wagmi";
import ChessABI from "@/ABI/ChessABI.json";
import USDTABI from "@/ABI/UsdtABI.json";
import RAMIABI from "@/ABI/RamiABI.json";
import { type Address, type Abi, createPublicClient, custom } from "viem";
import { bsc } from "viem/chains";

const CHESS_CONTRACT_ADDRESS =
  "0x11d14929b2bB444582ac6Db60e07117b09723B27" as `0x${string}`;
const USDT_ADDRESS =
  "0x4f237c860870A7a564B2db707c60Ee2eb36Cd7e6" as `0x${string}`;
const RAMI_ADDRESS =
  "0xc457860F15aeEdd626F3006a116ca80ec4fE2e60" as `0x${string}`;

// OPTION 1: Simple custom transport using fetch
const createAnkrTransport = () => {
  return custom({
    request: async ({ method, params }) => {
      try {
        const response = await fetch("/api/ankr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method,
            params,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        return data.result;
      } catch (error) {
        console.error("Ankr transport error:", error);
        throw error;
      }
    },
  });
};

// Create public client with Ankr transport
const publicClient = createPublicClient({
  chain: bsc,
  transport: createAnkrTransport(),
});

function chessReducer(state: ChessState, action: any): ChessState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "BATCH_UPDATE":
      return { ...state, ...action.payload };
    case "TX_START":
      return {
        ...state,
        transaction: {
          status: action.payload.status,
          message: action.payload.message,
        },
      };
    case "TX_SUCCESS":
      return {
        ...state,
        transaction: {
          status: "success",
          hash: action.payload.hash,
          message: action.payload.message,
        },
      };
    case "TX_ERROR":
      return {
        ...state,
        transaction: {
          status: "error",
          message: action.payload.message,
        },
      };
    case "CLEAR_TX":
      return {
        ...state,
        transaction: {
          status: "idle",
          hash: undefined,
          message: undefined,
        },
      };
    case "SET_CONTRACT_ORDER":
      return {
        ...state,
        contractOrdersByRoomCode: {
          ...state.contractOrdersByRoomCode,
          [action.payload.roomCode]: action.payload.orderDetails,
        },
      };
    case "SET_CONTRACT_ORDERS_LOADING":
      return {
        ...state,
        contractOrdersLoading: action.payload,
      };
    case "BATCH_SET_CONTRACT_ORDERS":
      return {
        ...state,
        contractOrdersByRoomCode: {
          ...state.contractOrdersByRoomCode,
          ...action.payload,
        },
      };
    default:
      return state;
  }
}

const initialState: ChessState = {
  stakeAmount: "",
  selectedCurrency: "RAMI",
  usdtBalance: 0,
  ramiBalance: 0,
  usdtAllowance: 0,
  ramiAllowance: 0,
  usdtLoading: true,
  ramiLoading: true,
  transaction: {
    status: "idle",
    hash: undefined,
    message: undefined,
  },
  activeOrderIds: [],
  contractOrdersByRoomCode: {},
  contractOrdersLoading: false,
};

const ChessContext = createContext<ChessContextType | null>(null);

export function ChessProvider({ children }: { children: React.ReactNode }) {
  const { address: userAddress } = useAccount();
  const [state, dispatch] = useReducer(chessReducer, initialState);
  const { writeContractAsync } = useWriteContract();

  // Only fetch allowances and active orders - balances come from global context
  const contracts = useMemo(
    () => [
      // USDT allowance for chess contract
      {
        address: USDT_ADDRESS,
        abi: USDTABI as Abi,
        functionName: "allowance",
        args: [userAddress as Address, CHESS_CONTRACT_ADDRESS],
      },
      // RAMI allowance for chess contract
      {
        address: RAMI_ADDRESS,
        abi: RAMIABI as Abi,
        functionName: "allowance",
        args: [userAddress as Address, CHESS_CONTRACT_ADDRESS],
      },
      // Get active orders from chess contract
      {
        address: CHESS_CONTRACT_ADDRESS,
        abi: ChessABI as Abi,
        functionName: "getActiveOrders",
        args: [],
      },
    ],
    [userAddress]
  );

  const { data: contractData, refetch } = useReadContracts({
    contracts,
    query: { enabled: !!userAddress },
  });

  const isLoading = useMemo(
    () =>
      (contractData ?? []).some((c) => {
        const status = (c as { status: "pending" | "success" | "error" })
          .status;
        return status === "pending";
      }),
    [contractData]
  );

  // Update state from contract data (allowances and orders only)
  useMemo(() => {
    if (!contractData) return;

    const [usdtAllowanceData, ramiAllowanceData, activeOrdersData] =
      contractData;

    const batchUpdate: Partial<ChessState> = {
      usdtAllowance: usdtAllowanceData.result
        ? Number(usdtAllowanceData.result as bigint) / 1e18
        : 0,
      ramiAllowance: ramiAllowanceData.result
        ? Number(ramiAllowanceData.result as bigint) / 1e18
        : 0,
      usdtLoading: false,
      ramiLoading: false,
      activeOrderIds: activeOrdersData.result
        ? (activeOrdersData.result as bigint[]).map((id) => Number(id))
        : [],
    };

    dispatch({ type: "BATCH_UPDATE", payload: batchUpdate });
  }, [contractData]);

  const handleTransaction = useCallback(
    async (txConfig: any, successMessage: string) => {
      try {
        // Map function names to statuses
        const statusMap: Record<string, TransactionState["status"]> = {
          approve: "approving",
          createOrder: "creatingOrder",
          acceptOrder: "acceptingOrder",
          cancelOrder: "cancellingOrder",
          completeGame: "completingGame",
        };

        dispatch({
          type: "TX_START",
          payload: {
            status: statusMap[txConfig.functionName] || txConfig.functionName,
            message: "Confirm transaction in wallet...",
          },
        });

        const hash = await writeContractAsync(txConfig);

        // If we get a hash, transaction was sent to blockchain
        dispatch({
          type: "TX_SUCCESS",
          payload: {
            hash,
            message: successMessage,
          },
        });

        // Wait for blockchain confirmation and state update
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Refetch data to update allowances and orders
        refetch();

        // Continue polling until data is updated
        let retries = 0;
        const maxRetries = 10;
        const pollInterval = 1000;

        const pollData = async () => {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          refetch();
          retries++;

          if (retries < maxRetries) {
            pollData();
          }
        };

        pollData();

        return hash;
      } catch (error: any) {
        console.error("Transaction error details:", error);

        // IMPORTANT: Check for specific rejection errors
        const errorMessage = error?.message?.toLowerCase() || "";

        if (
          errorMessage.includes("user rejected") ||
          errorMessage.includes("rejected the request") ||
          errorMessage.includes("user denied") ||
          errorMessage.includes("action rejected") ||
          errorMessage.includes("cancelled") ||
          error?.code === 4001 || // MetaMask user rejected
          error?.code === "ACTION_REJECTED"
        ) {
          dispatch({
            type: "TX_ERROR",
            payload: {
              message: "Transaction rejected by user. Order was not created.",
            },
          });
          return null;
        }

        let userFriendlyMessage = "Transaction failed. Please try again";

        // Extract specific error messages
        if (errorMessage.includes("insufficient funds")) {
          userFriendlyMessage = "Insufficient funds for transaction";
        } else if (errorMessage.includes("allowance")) {
          userFriendlyMessage =
            "Insufficient token allowance. Please approve first";
        } else if (errorMessage.includes("order not active")) {
          userFriendlyMessage = "Order is no longer active";
        } else if (errorMessage.includes("order already accepted")) {
          userFriendlyMessage =
            "Order has already been accepted by another player";
        } else if (errorMessage.includes("cannot accept own order")) {
          userFriendlyMessage = "You cannot accept your own order";
        } else if (errorMessage.includes("order expired")) {
          userFriendlyMessage = "Order has expired";
        } else if (errorMessage.includes("not order creator")) {
          userFriendlyMessage = "Only order creator can cancel";
        } else if (errorMessage.includes("invalid order id")) {
          userFriendlyMessage = "Invalid order ID";
        }

        dispatch({
          type: "TX_ERROR",
          payload: { message: userFriendlyMessage },
        });
        return null;
      }
    },
    [writeContractAsync, refetch]
  );

  // Fetch contract order details by room code
  const fetchContractOrderByRoomCode = useCallback(
    async (roomCode: string): Promise<ContractOrderDetails | null> => {
      try {
        dispatch({ type: "SET_CONTRACT_ORDERS_LOADING", payload: true });

        // First get order ID by room code
        let orderId;
        try {
          orderId = (await publicClient.readContract({
            address: CHESS_CONTRACT_ADDRESS,
            abi: ChessABI as Abi,
            functionName: "getOrderIdByRoomCode",
            args: [roomCode],
          })) as bigint;

          console.log("Order ID from contract:", Number(orderId));

          // If orderId is 0, the room doesn't exist yet
          if (Number(orderId) === 0) {
            console.log(`Room ${roomCode} not found on contract (orderId = 0)`);
            return null;
          }
        } catch (readError: any) {
          // Check if it's a "Room code not found" error
          if (readError.message?.includes("Room code not found")) {
            console.log(
              `Room ${roomCode} not found on contract (expected for new rooms)`
            );
            return null;
          }
          console.error("Failed to read contract:", readError);
          return null;
        }

        // Get order details
        const details = (await publicClient.readContract({
          address: CHESS_CONTRACT_ADDRESS,
          abi: ChessABI as Abi,
          functionName: "getOrderDetails",
          args: [orderId],
        })) as any[];

        const gameOrder = (await publicClient.readContract({
          address: CHESS_CONTRACT_ADDRESS,
          abi: ChessABI as Abi,
          functionName: "gameOrders",
          args: [orderId],
        })) as any[];

        const orderDetails: ContractOrderDetails = {
          orderId: Number(orderId),
          creator: gameOrder[1] as string,
          token: gameOrder[2] as string,
          amount: gameOrder[3] as bigint,
          createdAt: Number(gameOrder[4]),
          expiresAt: Number(gameOrder[5]),
          accepter: gameOrder[6] as string,
          winner: gameOrder[7] as string,
          roomCode: gameOrder[11] as string,
          status: Number(gameOrder[8]),
          creatorWithdrawn: gameOrder[9] as boolean,
          accepterWithdrawn: gameOrder[10] as boolean,
        };

        dispatch({
          type: "SET_CONTRACT_ORDER",
          payload: { roomCode, orderDetails },
        });

        return orderDetails;
      } catch (error: any) {
        // Don't log as error if it's just "Room code not found"
        if (!error.message?.includes("Room code not found")) {
          console.error(
            `Error fetching contract order for room ${roomCode}:`,
            error
          );
        }
        return null;
      } finally {
        dispatch({ type: "SET_CONTRACT_ORDERS_LOADING", payload: false });
      }
    },
    [publicClient]
  );

  // Batch fetch multiple contract orders
  const batchFetchContractOrders = useCallback(
    async (roomCodes: string[]): Promise<void> => {
      try {
        dispatch({ type: "SET_CONTRACT_ORDERS_LOADING", payload: true });

        const orders: Record<string, ContractOrderDetails> = {};

        // Process each room code
        for (const roomCode of roomCodes) {
          try {
            const orderDetails = await fetchContractOrderByRoomCode(roomCode);
            if (orderDetails) {
              orders[roomCode] = orderDetails;
            }
          } catch (error) {
            console.error(`Error fetching order for ${roomCode}:`, error);
            continue;
          }
        }

        dispatch({
          type: "BATCH_SET_CONTRACT_ORDERS",
          payload: orders,
        });
      } catch (error) {
        console.error("Error in batch fetching contract orders:", error);
      } finally {
        dispatch({ type: "SET_CONTRACT_ORDERS_LOADING", payload: false });
      }
    },
    [fetchContractOrderByRoomCode]
  );

  // Get order ID by room code
  const getOrderIdByRoomCode = useCallback(
    async (roomCode: string): Promise<number | null> => {
      try {
        const orderId = (await publicClient.readContract({
          address: CHESS_CONTRACT_ADDRESS,
          abi: ChessABI as Abi,
          functionName: "getOrderIdByRoomCode",
          args: [roomCode],
        })) as bigint;

        return orderId ? Number(orderId) : null;
      } catch (error) {
        console.error(`Error getting order ID for room ${roomCode}:`, error);
        return null;
      }
    },
    [publicClient]
  );

  const handleApproveToken = useCallback(
    async (token: "USDT" | "RAMI") => {
      if (!userAddress) return;

      const tokenAddress = token === "USDT" ? USDT_ADDRESS : RAMI_ADDRESS;
      const tokenABI = token === "USDT" ? USDTABI : RAMIABI;

      // Use max approval amount
      const maxApproval = "100000000000000000000000000000000000000000";

      await handleTransaction(
        {
          address: tokenAddress,
          abi: tokenABI as Abi,
          functionName: "approve",
          args: [CHESS_CONTRACT_ADDRESS, BigInt(maxApproval)],
        },
        `${token} approval successful!`
      );

      refetch();
    },
    [userAddress, handleTransaction, refetch]
  );

  const handleCreateOrder = useCallback(
    async (roomCode: string, amount: string, currency: "USDT" | "RAMI") => {
      if (!userAddress || !roomCode || !amount) return;

      const tokenAddress = currency === "USDT" ? USDT_ADDRESS : RAMI_ADDRESS;
      const amountInWei = BigInt(Math.floor(parseFloat(amount) * 1e18));

      const hash = await handleTransaction(
        {
          address: CHESS_CONTRACT_ADDRESS,
          abi: ChessABI as Abi,
          functionName: "createOrder",
          args: [tokenAddress, amountInWei, roomCode],
        },
        "Order created successfully!"
      );

      // Only clear fields and refetch if transaction was successful
      if (hash) {
        dispatch({ type: "SET_FIELD", field: "stakeAmount", value: "" });
        refetch();
      }
      // If hash is null, transaction was rejected or failed - do nothing
    },
    [userAddress, handleTransaction, refetch]
  );

  const handleAcceptOrder = useCallback(
    async (orderId: number) => {
      if (!userAddress) return;

      await handleTransaction(
        {
          address: CHESS_CONTRACT_ADDRESS,
          abi: ChessABI as Abi,
          functionName: "acceptOrder",
          args: [BigInt(orderId)],
        },
        "Order accepted successfully!"
      );

      refetch();
    },
    [userAddress, handleTransaction, refetch]
  );

  const handleCancelOrder = useCallback(
    async (orderId: number): Promise<void> => {
      if (!userAddress) return;

      const hash = await handleTransaction(
        {
          address: CHESS_CONTRACT_ADDRESS,
          abi: ChessABI as Abi,
          functionName: "cancelOrder",
          args: [BigInt(orderId)],
        },
        "Order cancelled successfully!"
      );
    },
    [userAddress, handleTransaction, refetch]
  );

  const handleCompleteGame = useCallback(
    async (orderId: number) => {
      if (!userAddress) return;

      await handleTransaction(
        {
          address: CHESS_CONTRACT_ADDRESS,
          abi: ChessABI as Abi,
          functionName: "completeGame",
          args: [BigInt(orderId)],
        },
        "Game completed successfully!"
      );

      refetch();
    },
    [userAddress, handleTransaction, refetch]
  );

  const handleDrawGame = useCallback(
    async (orderId: number) => {
      if (!userAddress) return;

      await handleTransaction(
        {
          address: CHESS_CONTRACT_ADDRESS,
          abi: ChessABI as Abi,
          functionName: "completeGame",
          args: [BigInt(orderId)],
        },
        "Draw refund claimed successfully!"
      );

      refetch();
    },
    [userAddress, handleTransaction, refetch]
  );

  const isAmountValid = useMemo(() => {
    const amount = parseFloat(state.stakeAmount);
    if (!amount || amount <= 0) return false;

    const minAmount = state.selectedCurrency === "RAMI" ? 100 : 1;
    if (amount < minAmount) return false;

    // Use balance from state (which should be updated from global context)
    const balance =
      state.selectedCurrency === "RAMI" ? state.ramiBalance : state.usdtBalance;
    if (!balance || amount > balance) return false;

    return true;
  }, [
    state.stakeAmount,
    state.selectedCurrency,
    state.ramiBalance,
    state.usdtBalance,
  ]);

  const clearTransaction = useCallback(() => {
    dispatch({
      type: "CLEAR_TX",
      payload: { status: "idle", hash: undefined, message: undefined },
    });
  }, []);

  const handleStakeAmountChange = useCallback((value: string) => {
    dispatch({ type: "SET_FIELD", field: "stakeAmount", value });
  }, []);

  const handleCurrencyChange = useCallback((currency: "USDT" | "RAMI") => {
    dispatch({ type: "SET_FIELD", field: "selectedCurrency", value: currency });
  }, []);

  const refetchData = useCallback(() => {
    refetch();
  }, [refetch]);

  const updateBalances = useCallback(
    (usdtBalance: number, ramiBalance: number) => {
      dispatch({
        type: "BATCH_UPDATE",
        payload: {
          usdtBalance,
          ramiBalance,
        },
      });
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      state,
      isAmountValid,
      isLoading,
      handleStakeAmountChange,
      handleCurrencyChange,
      handleApproveToken,
      handleCreateOrder,
      handleAcceptOrder,
      handleCancelOrder,
      handleCompleteGame,
      handleDrawGame,
      clearTransaction,
      refetchData,
      updateBalances,
      fetchContractOrderByRoomCode,
      getOrderIdByRoomCode,
      batchFetchContractOrders,
    }),
    [
      state,
      isAmountValid,
      isLoading,
      handleStakeAmountChange,
      handleCurrencyChange,
      handleApproveToken,
      handleCreateOrder,
      handleAcceptOrder,
      handleCancelOrder,
      handleCompleteGame,
      handleDrawGame, // Add this
      clearTransaction,
      refetchData,
      updateBalances,
      fetchContractOrderByRoomCode,
      getOrderIdByRoomCode,
      batchFetchContractOrders,
    ]
  );

  return (
    <ChessContext.Provider value={contextValue}>
      {children}
    </ChessContext.Provider>
  );
}

export const useChess = () => {
  const context = useContext(ChessContext);
  if (!context) throw new Error("useChess must be used within ChessProvider");
  return context;
};
