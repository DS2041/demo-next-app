// chess.types.ts
export type TransactionState = {
  status:
    | "idle"
    | "approving"
    | "creatingOrder"
    | "acceptingOrder"
    | "cancellingOrder"
    | "completingGame"
    | "success"
    | "error";
  hash?: string;
  message?: string;
};

export type ContractOrderDetails = {
  orderId: number;
  creator: string;
  token: string;
  amount: bigint;
  expiresAt: number;
  status: number;
  accepter: string;
  winner: string;
  roomCode: string;
  createdAt: number;
  creatorWithdrawn: boolean;
  accepterWithdrawn: boolean;
};

export type ChessState = {
  // Input fields
  stakeAmount: string;
  selectedCurrency: "USDT" | "RAMI";

  // Balances (will be updated from global context)
  usdtBalance: number;
  ramiBalance: number;

  // Allowances
  usdtAllowance: number;
  ramiAllowance: number;

  // Loading states
  usdtLoading: boolean;
  ramiLoading: boolean;

  // Transaction
  transaction: TransactionState;

  // Orders from contract
  activeOrderIds: number[];

  // Contract order details by room code
  contractOrdersByRoomCode: Record<string, ContractOrderDetails>;
  contractOrdersLoading: boolean;
};

export type ChessContextType = {
  state: ChessState;
  isAmountValid: boolean;
  isLoading: boolean;
  handleStakeAmountChange: (value: string) => void;
  handleCurrencyChange: (currency: "USDT" | "RAMI") => void;
  handleApproveToken: (token: "USDT" | "RAMI") => Promise<void>;
  handleCreateOrder: (
    roomCode: string,
    amount: string,
    currency: "USDT" | "RAMI"
  ) => Promise<void>;
  handleAcceptOrder: (orderId: number) => Promise<void>;
  handleCancelOrder: (orderId: number) => Promise<void>;
  handleCompleteGame: (orderId: number) => Promise<void>;
  handleDrawGame: (orderId: number) => Promise<void>;
  clearTransaction: () => void;
  refetchData: () => void;
  updateBalances: (usdtBalance: number, ramiBalance: number) => void;
  fetchContractOrderByRoomCode: (
    roomCode: string
  ) => Promise<ContractOrderDetails | null>;
  getOrderIdByRoomCode: (roomCode: string) => Promise<number | null>;
  batchFetchContractOrders: (roomCodes: string[]) => Promise<void>;
};

export interface ChessOrder {
  orderNumber: string;
  size: string;
  coin: string;
  expiryTime: string;
  roomName: string;
  creatorName: string;
  createdAt: number;
  anonymousLink?: string;
  shortHash?: string;
  status?: string;
  joinerName?: string;
  gameLink?: string;
  game_result_type?: string;
  reason?: string;

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
    winner: "white" | "black" | "DRAW";
    winnerAddress?: string;
    loserAddress?: string;
  };

  // Claim-related fields
  winnerWithdrawn?: boolean;
  loserWithdrawn?: boolean;
  creatorWithdrawn?: boolean;
  accepterWithdrawn?: boolean;
}

export type MenuOption = "menu" | "my orders" | "global" | "completed";

// Gameplay UI Types
export interface InvalidWalletData {
  message: string;
}

export interface GameReadyData {
  creatorName: string;
  joinerName: string;
  roomCode: string;
}

export interface TimerStartData {
  activeTimer: "white" | "black";
  whiteTime: number;
  blackTime: number;
}

export interface TurnCorrectedData {
  activeTimer: "white" | "black";
  fen: string;
  whiteTime: number;
  blackTime: number;
}

export interface InvalidMoveData {
  message: string;
  expectedTurn: "white" | "black";
}

export interface GameResult {
  winner: string | null;
  reason: string;
}

export type ConnectionStatus =
  | "online"
  | "disconnected"
  | "reconnecting"
  | "refreshing"
  | "network-error";

// Socket Event Types
export interface OpponentDisconnectedDetails {
  status: string;
  reason: string;
  remainingLifelines: number;
  role: "creator" | "joiner";
  countdownStart: number;
  countdownDuration: number;
  reconnectWindow: number;
}

export interface OpponentReconnectedData {
  status: string;
  role: "creator" | "joiner";
  remainingLifelines: number;
  reconnectionTime: number;
}

export interface LifelineUpdateData {
  player: "white" | "black";
  remainingLifelines: number;
}

export interface GameEndedData {
  winner: "white" | "black";
  reason: string;
  details: {
    disconnectedRole: "creator" | "joiner";
    remainingLifelines: number;
    reconnectionAttempted: boolean;
  };
}

export interface MoveData {
  from: string;
  to: string;
  fen?: string;
  history?: Array<{ white: string; black: string }>;
  whiteTime?: number;
  blackTime?: number;
  activeTimer?: "white" | "black";
  timerRunning?: boolean;
  promotion?: string;
  san?: string;
}

export interface RoomInfo {
  creatorName: string;
  joinerName: string;
  roomCode: string;
}

export interface WalletSignature {
  signature: string;
  timestamp: number;
}

// Database API Response Types
export interface DatabaseOrder {
  room_id: string;
  game_size: number;
  game_currency: string;
  created_at: string | number;
  white_player: string;
  gamelink: string;
  short_hash: string;
  game_status: string;
  black_player: string;
  winner?: string;
  loser?: string;
  game_result_type?: string;
  reason?: string;
}

export interface DatabaseResponse {
  success: boolean;
  orders?: DatabaseOrder[];
  error?: string;
}

// Contract Addresses
export const CHESS_CONTRACT_ADDRESS =
  "0x67E43F1AAE5A3028Be622d8d22EAbf2600AA1c3c" as const;
export const USDT_ADDRESS =
  "0x4f237c860870A7a564B2db707c60Ee2eb36Cd7e6" as const;
export const RAMI_ADDRESS =
  "0xc457860F15aeEdd626F3006a116ca80ec4fE2e60" as const;

// Currency Options
export const CURRENCY_OPTIONS = [
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
] as const;

// Room Validation Types
export interface RoomValidationRequest {
  roomCode: string;
  walletAddress: string;
  walletSignature: string;
  signatureTimestamp: number;
  action: "create" | "join";
}

export interface RoomValidationResponse {
  valid: boolean;
  canCreate?: boolean;
  canJoin?: boolean;
  error?: string;
}

// Game Creation Types
export interface CreateOrderData {
  roomCode: string;
  gameAmount: string;
  gameCurrency: string;
  roomName: string;
  creatorName: string;
}

// Move History Types
export interface MovePair {
  white: string;
  black: string;
}

export interface MoveHistory {
  moveHistory: MovePair[];
  currentMoveIndex: number;
}

// Winnings Calculation Types
export interface WinningsCalculation {
  winningAmount: number;
  playerProfit: number;
  roi: number;
  hostFee: number;
}

// Game Confetti Types
export interface ConfettiConfig {
  particleCount: number;
  angle: number;
  spread: number;
  origin: { x: number; y: number };
  colors: string[];
  shapes?: ("circle" | "star" | "square")[];
  startVelocity: number;
  gravity: number;
  scalar: number;
  ticks: number;
  zIndex?: number;
  decay?: number;
}

// Socket Event Callbacks
export type SocketEventHandler = (data: any) => void;

// Reconnect Types
export interface ReconnectState {
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastReconnectTime: number | null;
}

// Timer Types
export interface TimerState {
  whiteTime: number;
  blackTime: number;
  timerRunning: boolean;
  activeTimer: "white" | "black";
  lastUpdateTime: number;
}

// Draw Offer Types
export interface DrawOffer {
  offered: boolean;
  from: "white" | "black" | null;
  timestamp: number;
}

// Claim Types
export interface ClaimState {
  isClaiming: boolean;
  claimOrderId: string | null;
  claimStatus: "idle" | "processing" | "success" | "error";
  claimMessage?: string;
}

// Game Status Types
export type GameStatus =
  | "waiting"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "drawn"
  | "timed_out"
  | "resigned";

// Player Role Types
export type PlayerRole = "creator" | "joiner";
export type PlayerColor = "white" | "black";

// Game Resolution Types
export interface ResolvedGameData {
  roomCode: string;
  role: PlayerRole;
  currency: string;
  gameAmount: number;
}

// Board Orientation Types
export type BoardOrientation = "white" | "black";

// Piece Types for Chess.js
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export type PieceColor = "w" | "b";
export type Piece = {
  type: PieceType;
  color: PieceColor;
};

// Square Styles for Chessboard
export type SquareStyles = Record<string, React.CSSProperties>;

// Game Action Types
export type GameAction =
  | "move"
  | "draw"
  | "resign"
  | "offer_draw"
  | "accept_draw"
  | "decline_draw"
  | "cancel_draw";

// Validation Response Types
export interface ValidationResponse {
  success: boolean;
  error?: string;
  data?: any;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Network Status Types
export interface NetworkStatus {
  myStatus: ConnectionStatus;
  opponentStatus: ConnectionStatus;
  lastUpdate: number;
}

// Lifeline State
export interface LifelineState {
  myLifelines: number;
  opponentLifelines: number;
  disconnectCountdown: number | null;
  countdownEndTime: number | null;
}

// Short Hash Resolution
export interface ShortHashResolution {
  success: boolean;
  roomCode: string;
  whitePlayer: string;
  blackPlayer: string;
  currency: string;
  amount: number;
  error?: string;
}
