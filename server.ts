import { createServer } from "http";
import { Server as IOServer } from "socket.io";
import { createClient } from "@supabase/supabase-js";
import { ethers } from "ethers";
import { config } from "dotenv";
import express from "express"; // ADD THIS
import cors from "cors"; // ADD THIS
import { Chess } from "chess.js";
import crypto from "crypto";
import { customAlphabet } from "nanoid";

// Link Generation Module - Single source of truth
class GameLinkManager {
  private static readonly SHORT_HASH_LENGTH = 8;
  private static readonly HASH_ALPHABET =
    "abcdefghijklmnopqrstuvwxyz0123456789";
  private static readonly BASE_URL = "play/chess/live";

  // Generate short hash from room code (deterministic)
  static generateShortHash(roomCode: string): string {
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256").update(roomCode).digest("hex");
    return hash.substring(0, this.SHORT_HASH_LENGTH);
  }

  // Generate random short hash (for anonymous links)
  static generateRandomShortHash(): string {
    const { customAlphabet } = require("nanoid");
    const nanoid = customAlphabet(this.HASH_ALPHABET, this.SHORT_HASH_LENGTH);
    return nanoid();
  }

  // Generate complete game link
  static generateGameLink(shortHash: string): string {
    return `/${this.BASE_URL}/${shortHash}`;
  }

  // Validate short hash format
  static isValidShortHash(hash: string): boolean {
    if (!hash || typeof hash !== "string") return false;
    if (hash.length !== this.SHORT_HASH_LENGTH) return false;
    return /^[a-z0-9]{8}$/.test(hash);
  }
}

// Generate short hash for anonymous links (8 characters)
const generateShortHash = (): string => {
  const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);
  return nanoid();
};

// Generate short hash from room code (deterministic)
const generateShortHashFromRoom = (roomCode: string): string => {
  const hash = crypto.createHash("sha256").update(roomCode).digest("hex");
  return hash.substring(0, 8); // First 8 chars
};
// Load environment variables based on environment
if (process.env.NODE_ENV !== "production") {
  config(); // Only load .env file in development
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add this with your other constants at the top of server.ts
const DEFAULT_TIMER_MINUTES = 15; // Add this line
const TIMER_SYNC_INTERVAL = 1000; // Sync every second

// In server.ts, add a ping system
const playerHeartbeats: Record<string, number> = {};

// Update the rooms interface to better track lifelines
interface RoomInfo {
  creatorName: string;
  joinerName?: string;
  creatorSocketId?: string;
  joinerSocketId?: string;
  creatorPresent: boolean;
  joinerPresent: boolean;
  gameReady: boolean;
  creatorLifelines: number;
  joinerLifelines: number;
  lastDisconnectTime?: number;
  disconnectCountdown?: NodeJS.Timeout;
  disconnectReason?: string;
  disconnectRole?: "creator" | "joiner"; // Track who disconnected
  isReconnecting?: boolean; // Track if currently in reconnection window
}

interface JoinData {
  room: string;
  name: string;
  role: "creator" | "joiner";
  walletSignature: string;
  signatureTimestamp: number;
}

// Update the TimerStartData interface
interface TimerStartData {
  activeTimer: "white" | "black";
  whiteTime: number; // in seconds
  blackTime: number; // in seconds
  timestamp: number; // when timer was started
}

// ADD THESE NEW INTERFACES
interface GameReadyData {
  creatorName: string;
  joinerName: string;
  roomCode: string;
}

interface WaitingForOpponentData {
  role: string;
  opponentRole: string;
  message: string;
}

interface OpponentWaitingData {
  role: string;
  message: string;
}

// Update the GameTimerState interface to include gamePausedAt
interface GameTimerState {
  whiteTime: number;
  blackTime: number;
  activeTimer: "white" | "black";
  timerRunning: boolean;
  lastUpdated: number; // timestamp when timer was last updated
  gamePausedAt?: number; // timestamp when game was paused - MAKE THIS OPTIONAL
  gameStartTime?: number; // when game actually started
  syncInterval?: NodeJS.Timeout;
}

const rooms: Record<
  string,
  {
    creatorName: string;
    joinerName?: string;
    creatorSocketId?: string;
    joinerSocketId?: string;
    creatorPresent: boolean;
    joinerPresent: boolean;
    gameReady: boolean;
    // ADD THESE FOR LIFELINES
    creatorLifelines: number; // 3, 2, 1, 0
    joinerLifelines: number; // 3, 2, 1, 0
    lastDisconnectTime?: number; // When opponent disconnected
    disconnectCountdown?: NodeJS.Timeout; // Timer reference
    disconnectReason?: string; // Why opponent disconnected
    disconnectRole?: "creator" | "joiner"; // Track who disconnected - ADD THIS
    isReconnecting?: boolean; // Track if currently in reconnection window - ADD THIS
  }
> = {};

// Store active rooms separately for the orders list
const activeRooms: Record<string, any> = {};

// Store game states for reconnection
const gameStates: Record<string, any> = {};
const gameTimers: Record<string, GameTimerState> = {};

// Store player statuses
const playerStatuses: Record<
  string,
  {
    status:
      | "online"
      | "disconnected"
      | "reconnecting"
      | "refreshing"
      | "network-error";
    room?: string;
  }
> = {};

const completedRooms: Set<string> = new Set();

// Database functions
async function createChessGame(gameData: any) {
  // Generate short hash using the centralized manager
  const shortHash = GameLinkManager.generateRandomShortHash();
  const gameLink = GameLinkManager.generateGameLink(shortHash);

  const { data, error } = await supabase
    .from("chess_games")
    .insert([
      {
        room_id: gameData.room_id,
        white_player: gameData.white_player,
        black_player: gameData.black_player || "Waiting...",
        game_currency: gameData.game_currency,
        game_size: gameData.game_size,
        game_status: "active",
        time_control_minutes: gameData.time_control_minutes || 15,
        created_at: new Date().toISOString(),
        short_hash: shortHash, // Store short hash
        gamelink: gameLink, // Store complete link
      },
    ])
    .select();

  if (error) {
    console.error("Error creating game:", error);
    return null;
  }

  return data[0];
}

async function updateGameWithResult(
  roomId: string,
  gameData: {
    winner?: string | null;
    loser?: string | null;
    reason: string;
    finalFen?: string;
    pgn?: string;
    resultType: string;
    moveHistory?: any[];
  }
) {

  const canUpdate = await canUpdateGame(roomId);
  if (!canUpdate) {
    return null;
  }

  // Get current game state - BUT DON'T TRUST IT COMPLETELY
  const currentGame = await getGameByRoomId(roomId);
  if (!currentGame) {
    return null;
  }

  // CRITICAL: Validate both players exist and are different
  if (currentGame.white_player === currentGame.black_player) {
    // Try to get correct players from memory
    const roomInfo = rooms[roomId];
    if (roomInfo) {
      
    }
  }

  // FIX: DO NOT use currentGame.black_player if it's corrupted
  const updateData: any = {
    game_status: "completed",
    reason: gameData.reason,
    game_result_type: gameData.resultType,
    ended_at: new Date().toISOString(),
    move_history: gameData.moveHistory || [],
    total_moves: gameData.moveHistory?.length || 0,
    white_player: currentGame.white_player, // Keep original
    black_player: currentGame.black_player, // Keep original (even if it looks wrong, don't change it here)
  };

  // Only set winner/loser if game wasn't a draw
  if (gameData.resultType !== "draw") {
    updateData.winner = gameData.winner || null;
    updateData.loser = gameData.loser || null;
  } else {
    updateData.winner = null;
    updateData.loser = null;
  }

  if (gameData.finalFen) updateData.final_fen = gameData.finalFen;
  if (gameData.pgn) updateData.pgn_text = gameData.pgn;

  if (gameData.moveHistory) {
    updateData.move_history = gameData.moveHistory;
    updateData.total_moves = gameData.moveHistory.length;
  }

  const { data, error } = await supabase
    .from("chess_games")
    .update(updateData)
    .eq("room_id", roomId)
    .select();

  if (error) {
    console.error("❌ Error updating game result:", error);
    return null;
  }

  return data[0];
}

async function getGameByRoomId(roomId: string) {
  const { data, error } = await supabase
    .from("chess_games")
    .select("*")
    .eq("room_id", roomId)
    .single();

  if (error) {
    console.error("Error fetching game:", error);
    return null;
  }

  return data;
}

async function addMoveToGame(roomId: string, moveData: any) {
  // First get current game
  const game = await getGameByRoomId(roomId);
  if (!game) return null;

  const currentMoves = game.move_history || [];

  try {
    // Create a chess instance to generate SAN
    const chess = new Chess();

    // Replay all previous moves to get to current position
    if (currentMoves.length > 0) {
      for (const move of currentMoves) {
        chess.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion || "q",
        });
      }
    }

    // Make the current move and get SAN
    const result = chess.move({
      from: moveData.from,
      to: moveData.to,
      promotion: moveData.promotion || "q",
    });

    const newMove = {
      from: moveData.from,
      to: moveData.to,
      promotion: moveData.promotion,
      san: result.san, // Store SAN notation
      timestamp: new Date().toISOString(),
    };

    const updatedMoves = [...currentMoves, newMove];

    const { error: supabaseError } = await supabase
      .from("chess_games")
      .update({
        move_history: updatedMoves,
        total_moves: updatedMoves.length,
      })
      .eq("room_id", roomId);

    if (supabaseError) {
      console.error("Error adding move:", supabaseError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error generating SAN:", error);
    // Fallback: store without SAN
    const newMove = {
      from: moveData.from,
      to: moveData.to,
      promotion: moveData.promotion,
      timestamp: new Date().toISOString(),
    };

    const updatedMoves = [...currentMoves, newMove];

    const { error: supabaseError } = await supabase
      .from("chess_games")
      .update({
        move_history: updatedMoves,
        total_moves: updatedMoves.length,
      })
      .eq("room_id", roomId);

    if (supabaseError) {
      console.error("Error adding move:", supabaseError);
      return false;
    }

    return true;
  }
}

// Add this function to verify wallet signatures
const SIGNING_MESSAGE = (roomCode: string, timestamp: number) =>
  `ramicoin.com : esports - i am the owner`;

async function verifyWalletSignature(
  address: string,
  signature: string,
  roomCode: string,
  timestamp: number
): Promise<boolean> {
  try {
    // CRITICAL: Use the EXACT same message format
    const message = `ramicoin.com : esports - i am the owner`;

    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // Check if recovered address matches provided address
    const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();

    // Verify timestamp (within 5 minutes)
    const isRecent = Date.now() - timestamp < 5 * 60 * 1000;

    return isValid && isRecent;
  } catch (error) {
    console.error("❌ Wallet verification failed:", error);
    return false;
  }
}

// Add timeout handler
async function handleTimeout(roomId: string) {

  const timer = gameTimers[roomId];
  if (!timer) return;

  const winner = timer.activeTimer === "white" ? "black" : "white";

  // Stop timer
  timer.timerRunning = false;
  if (timer.syncInterval) {
    clearInterval(timer.syncInterval);
  }

  // End the game
  await handleGameEnd(roomId, "timeout", winner);

  // Notify clients
  io.to(roomId).emit("timeout", { winner });
}

async function verifyRoomAuthorization(
  roomId: string,
  address: string,
  role: "creator" | "joiner"
): Promise<boolean> {
  try {
    const game = await getGameByRoomId(roomId);

    if (!game) {
      return false;
    }

    if (game.game_status === "completed" || game.game_status === "cancelled") {
      return false;
    }

    // For CREATOR: Must be the white player in database
    if (role === "creator") {
      const isCreator =
        game.white_player &&
        game.white_player.toLowerCase() === address.toLowerCase();

      if (!isCreator) {
       
      }
      return isCreator;
    }

    // For JOINER: Must be the black player in database OR the slot must be empty
    else if (role === "joiner") {
      // If black player slot is empty, anyone can join as joiner
      if (!game.black_player || game.black_player.trim() === "") {
       
        return true;
      }

      // If slot is taken, must be the same address
      const isJoiner =
        game.black_player.toLowerCase() === address.toLowerCase();

      if (!isJoiner) {
        
      }
      return isJoiner;
    }

    return false;
  } catch (error) {
    console.error("Error verifying room authorization:", error);
    return false;
  }
}

// Create Express app
const expressApp = express();
expressApp.use(cors());
expressApp.use(express.json());

// Health check endpoint
expressApp.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Chess Socket Server",
    timestamp: new Date().toISOString(),
    supabase: "connected",
  });
});

// Root endpoint
expressApp.get("/", (req, res) => {
  res.json({
    message: "Chess Backend Server",
    endpoints: ["/health", "/socket.io/"],
    docs: "WebSocket server for real-time chess games",
  });
});

// Create HTTP server with Express
const server = createServer(expressApp);


// Update the io initialization:
const io = new IOServer(server, {
  path: "/socket.io/",
  cors: {
    origin: [
      "https://demo-next-app-production.up.railway.app",
      "http://localhost:3000",  // For local development
    ],
    credentials: true,
    methods: ["GET", "POST"]
  },
  allowEIO3: true, // ADD THIS for Socket.io v4 compatibility
});

io.on("connection", (socket) => {

  // Simple middleware for this socket only
  socket.use((packet: any, next: any) => {
    const eventName = packet[0];

    // Allow these events without verification
    const allowedWithoutVerification = [
      "join",
      "connect",
      "disconnect",
      "reconnect",
      "reconnecting",
      "reconnect_error",
      "reconnect_failed",
      "error",
      "connect_error",
      "ping",
      "pong",
      "heartbeat",
      "network-status",
      "player-status-update",
    ];

    // For non-allowed events, check verification
    if (!allowedWithoutVerification.includes(eventName)) {
      if (!socket.data?.verifiedAddress) {
        return next(new Error("Unauthorized: Wallet not verified"));
      }
    }

    next();
  });

  // Send current active rooms to newly connected client
  socket.emit("active-rooms", Object.values(activeRooms));
 

  // Handle wallet re-verification
  socket.on("reverify-wallet", async (data: JoinData) => {
    const { room, name, walletSignature, signatureTimestamp } = data;


    // Verify the wallet signature
    if (
      !(await verifyWalletSignature(
        name,
        walletSignature,
        room,
        signatureTimestamp
      ))
    ) {
      console.error("❌ Re-verification failed for:", name);
      socket.emit("invalid-wallet", {
        message: "Wallet re-verification failed. Please reconnect.",
      });
      return;
    }

    // Update socket data with new verification
    socket.data = {
      ...socket.data,
      verifiedAddress: name,
      room,
      verifiedAt: Date.now(),
    };


    // Send updated game state
    const gameState = gameStates[room];
    const timerState = calculateAdjustedTimer(room);

    if (gameState) {
      socket.emit("game-state", {
        ...gameState,
        whiteTime: timerState?.whiteTime || gameState.whiteTime,
        blackTime: timerState?.blackTime || gameState.blackTime,
        timerRunning: timerState?.timerRunning || false,
        activeTimer: timerState?.activeTimer || "white",
      });
    }
  });

  // Handle player status updates
  socket.on("player-status-update", ({ room, status }) => {
    

    // Store the player's status
    playerStatuses[socket.id] = {
      status,
      room,
    };

    // Notify other players in the room
    if (room) {
      socket.to(room).emit("opponent-status-update", { status });
    }
  });

  // Add heartbeat handler
  socket.on("heartbeat", () => {
    playerHeartbeats[socket.id] = Date.now();
  });

  // Handle immediate network status updates
  socket.on("network-status", ({ room, status }) => {
   

    // Update player status immediately
    playerStatuses[socket.id] = {
      status,
      room,
    };

    // Immediately notify other players in the room
    if (room) {
      socket.to(room).emit("opponent-network-status", { status });
    }
  });

  setInterval(async () => {
    const now = Date.now();
    for (const [socketId, lastBeat] of Object.entries(playerHeartbeats)) {
      if (now - lastBeat > 300000) {
        // 5 minutes no heartbeat (increased from 2)

        const playerStatus = playerStatuses[socketId];
        if (playerStatus && playerStatus.room) {
          const room = playerStatus.room;
          const gameFromDB = await getGameByRoomId(room);

          // Only consider ending game after 10 minutes of no activity
          if (gameFromDB && gameFromDB.game_status === "active") {
            // Check when was the last move
            const lastMove =
              gameFromDB.move_history?.[gameFromDB.move_history.length - 1];
            const lastMoveTime = lastMove
              ? new Date(lastMove.timestamp).getTime()
              : gameFromDB.created_at;

            // If no activity for 10 minutes total, then consider abandoned
            if (now - lastMoveTime > 600000) {
            }
          }
        }
      }
    }
  }, 60000); // Check every minute instead of 30 seconds

  socket.on("join", async (data: JoinData) => {
    const { room, name, role, walletSignature, signatureTimestamp } = data;

    // ========== CRITICAL WALLET VERIFICATION ==========
    const verificationResult = await verifyWalletSignature(
      name,
      walletSignature,
      room,
      signatureTimestamp
    );

    if (!verificationResult) {
      console.error("❌ Wallet signature verification failed for:", name, {
        room,
        role,
        signatureTimestamp,
        currentTime: Date.now(),
      });

      socket.emit("invalid-wallet", {
        message:
          "Wallet verification failed. Please reconnect and sign the message.",
        details: "Signature verification failed",
      });

      // Send detailed error for debugging
      socket.emit("verification-failed", {
        message: "Please sign the wallet message again",
        room,
        address: name,
      });

      socket.disconnect();
      return;
    }
    // ========== END VERIFICATION ==========

    // ========== CRITICAL: ROOM AUTHORIZATION CHECK ==========
    const isAuthorized = await verifyRoomAuthorization(room, name, role);

    if (!isAuthorized) {
      console.error(
        `❌ Unauthorized access attempt: ${name} as ${role} in room ${room}`
      );
      socket.emit("unauthorized", {
        message: `You are not authorized to join this room as ${role}.`,
      });
      socket.disconnect();
      return;
    }
    // ========== END AUTHORIZATION CHECK ==========

    // ========== CRITICAL: ROOM COMPLETION CHECK ==========
    if (completedRooms.has(room)) {
      socket.emit("room-completed", {
        message: "This game has already been completed and cannot be rejoined",
      });
      return;
    }

    // CHECK 2: If game exists in database and is completed, reject the join
    const gameFromDB = await getGameByRoomId(room);
    if (gameFromDB && gameFromDB.game_status === "completed") {
      completedRooms.add(room); // Mark as completed in memory too
      socket.emit("room-completed", {
        message: "This game has already ended",
      });
      return;
    }
    // ========== END COMPLETION CHECK ==========

    // Check if room exists in database
    if (!gameFromDB) {
      socket.emit("invalid-room");
      return;
    }

    // Join the socket room
    socket.join(room);

    // Store wallet verification info for this socket
    socket.data = {
      ...socket.data,
      verifiedAddress: name,
      room,
      role,
      verifiedAt: Date.now(),
    };


    // Set initial status
    playerStatuses[socket.id] = {
      status: "online",
      room,
    };

    // CRITICAL FIX: Send immediate heartbeat
    playerHeartbeats[socket.id] = Date.now();

    // ========== ROOM SETUP BASED ON ROLE ==========
    if (role === "creator") {
      // Check if room already exists in memory
      if (!rooms[room]) {
        rooms[room] = {
          creatorName: name,
          creatorSocketId: socket.id,
          creatorPresent: true,
          joinerPresent: false,
          gameReady: false,
          // ADD THESE NEW PROPERTIES
          creatorLifelines: 3,
          joinerLifelines: 3,
        };
      } else {
        // Clean up any stale disconnect handlers for this player
        cleanupStaleDisconnectHandlers(room, socket.id);

        rooms[room].creatorName = name;
        rooms[room].creatorSocketId = socket.id;
        rooms[room].creatorPresent = true;
        // Ensure lifelines exist
        if (rooms[room].creatorLifelines === undefined) {
          rooms[room].creatorLifelines = 3;
        }
        if (rooms[room].joinerLifelines === undefined) {
          rooms[room].joinerLifelines = 3;
        }
      }
    } else if (role === "joiner") {
      let creatorName = gameFromDB.white_player || "";

      // Check if room already exists in memory
      if (!rooms[room]) {
        rooms[room] = {
          creatorName: creatorName,
          joinerName: name,
          joinerSocketId: socket.id,
          creatorPresent: false, // Creator not present yet
          joinerPresent: true,
          gameReady: false,
          // ADD THESE NEW PROPERTIES
          creatorLifelines: 3,
          joinerLifelines: 3,
        };
      } else {
        rooms[room].joinerName = name;
        rooms[room].joinerSocketId = socket.id;
        rooms[room].joinerPresent = true;
        // Ensure lifelines exist
        if (rooms[room].creatorLifelines === undefined) {
          rooms[room].creatorLifelines = 3;
        }
        if (rooms[room].joinerLifelines === undefined) {
          rooms[room].joinerLifelines = 3;
        }
      }

      // Update database with joiner's name
      try {
        const { error } = await supabase
          .from("chess_games")
          .update({ black_player: name })
          .eq("room_id", room);

        if (!error) {
        }
      } catch (error) {
        console.error("❌ Failed to update black player:", error);
      }

      // Notify creator that joiner has joined
      socket.to(room).emit("player-joined", { name });

      // Send creator name to joiner
      if (!creatorName && rooms[room]) {
        creatorName = rooms[room].creatorName || "";
      }

      socket.emit("room-creator", { name: creatorName });
    }

    const roomInfo = rooms[room];

    if (roomInfo) {
      // Determine player role
      const isCreator = data.role === "creator";
      const lifelineKey = isCreator ? "creatorLifelines" : "joinerLifelines";

      // If player has zero lifelines, they can't rejoin - game is over
      if (roomInfo[lifelineKey] <= 0) {

        // Determine winner (opponent wins)
        const winner = isCreator ? "black" : "white";

        // Notify this player that game is over
        socket.emit("game-ended", {
          winner: winner,
          reason: "You ran out of lifelines. Game over.",
          details: {
            disconnectedRole: data.role,
            remainingLifelines: 0,
            reconnectionAttempted: true,
          },
        });

        // Also notify if opponent is still connected
        socket.to(room).emit("game-ended", {
          winner: winner,
          reason: `${data.role} tried to rejoin but ran out of lifelines`,
          details: {
            disconnectedRole: data.role,
            remainingLifelines: 0,
            reconnectionAttempted: true,
          },
        });

        return;
      }
    }

    if (!roomInfo) {
      console.error("❌ Room info not found for room:", room);
      return;
    }

    // CRITICAL FIX: Check if game should start NOW
    const bothPresent = roomInfo.creatorPresent && roomInfo.joinerPresent;

    // ========== GAME START LOGIC ==========
    if (bothPresent && !roomInfo.gameReady) {

      // Mark game as ready
      roomInfo.gameReady = true;

      // Initialize game state if it doesn't exist
      if (!gameStates[room]) {
        const initialGame = new Chess();
        gameStates[room] = {
          fen: initialGame.fen(),
          moveHistory: [],
          whiteTime: DEFAULT_TIMER_MINUTES * 60,
          blackTime: DEFAULT_TIMER_MINUTES * 60,
          timerRunning: false,
          activeTimer: "white",
          lastUpdated: Date.now(),
        };
      }

      // Initialize timer if it doesn't exist
      if (!gameTimers[room]) {
        const initialTime = DEFAULT_TIMER_MINUTES * 60;
        gameTimers[room] = {
          whiteTime: initialTime,
          blackTime: initialTime,
          activeTimer: "white",
          timerRunning: true, // CRITICAL: Start the timer!
          lastUpdated: Date.now(),
          gameStartTime: Date.now(),
        };

        // Start server-side timer synchronization
        startTimerSync(room);

       
      } else if (!gameTimers[room].timerRunning) {
        // If timer exists but isn't running, start it
        gameTimers[room].timerRunning = true;
        gameTimers[room].lastUpdated = Date.now();
        startTimerSync(room);
      }

      // ========== EMIT GAME START EVENTS ==========
      // CRITICAL: Send game-ready event first
      io.to(room).emit("game-ready", {
        creatorName: roomInfo.creatorName,
        joinerName: roomInfo.joinerName,
        roomCode: room,
      } as GameReadyData);

      // Then send start-game event
      io.to(room).emit("start-game");

      // Then send timer-start with current timer state
      const currentTimer = calculateAdjustedTimer(room) || gameTimers[room];
      io.to(room).emit("timer-start", {
        activeTimer: currentTimer.activeTimer,
        whiteTime: currentTimer.whiteTime,
        blackTime: currentTimer.blackTime,
        timestamp: Date.now(),
      } as TimerStartData);

      // Finally send the current game state
      const currentGameState = gameStates[room];
      io.to(room).emit("game-state", {
        ...currentGameState,
        whiteTime: currentTimer.whiteTime,
        blackTime: currentTimer.blackTime,
        timerRunning: currentTimer.timerRunning,
        activeTimer: currentTimer.activeTimer,
      });

    }
    // ========== GAME ALREADY READY (RECONNECTION) ==========
    else if (roomInfo.gameReady) {

      // Send current game state
      const currentGameState = gameStates[room];
      const currentTimer = calculateAdjustedTimer(room);

      if (currentGameState) {
        socket.emit("game-state", {
          ...currentGameState,
          whiteTime: currentTimer?.whiteTime || currentGameState.whiteTime,
          blackTime: currentTimer?.blackTime || currentGameState.blackTime,
          timerRunning: currentTimer?.timerRunning || false,
          activeTimer: currentTimer?.activeTimer || "white",
        });
      }

      // Send timer state if available
      if (currentTimer) {
        socket.emit("timer-start", {
          activeTimer: currentTimer.activeTimer,
          whiteTime: currentTimer.whiteTime,
          blackTime: currentTimer.blackTime,
          timestamp: Date.now(),
        } as TimerStartData);
      }

      // Notify that game is already ready
      socket.emit("game-ready", {
        creatorName: roomInfo.creatorName,
        joinerName: roomInfo.joinerName,
        roomCode: room,
      } as GameReadyData);
    }
    // ========== WAITING FOR OPPONENT ==========
    else {
      const waitingMessage = `Waiting for ${
        role === "creator" ? "joiner" : "creator"
      } to join`;

      socket.emit("waiting-for-opponent", {
        role,
        opponentRole: role === "creator" ? "joiner" : "creator",
        message: waitingMessage,
      } as WaitingForOpponentData);

      // If creator is waiting and joiner already exists, notify them
      if (role === "creator" && roomInfo.joinerName) {
        socket.emit("opponent-waiting", {
          role: "creator",
          message: "Creator is waiting for you",
        });
      }
    }

    // ========== SEND ROOM INFO ==========
    socket.emit("room-info", {
      creatorName: roomInfo.creatorName || "",
      joinerName: roomInfo.joinerName || "",
    });

    // Notify other player in room about online status
    socket.to(room).emit("opponent-status-update", { status: "online" });
  });

  // Handle room creation for orders list
  socket.on("create-room", async (roomData) => {

    // ========== CRITICAL: CHECK IF USER IS ALREADY IN AN ACTIVE ROOM ==========
    const existingGame = await supabase
      .from("chess_games")
      .select("*")
      .or(
        `white_player.eq.${roomData.creatorName},black_player.eq.${roomData.creatorName}`
      )
      .neq("game_status", "completed")
      .neq("game_status", "cancelled");

    if (existingGame.data && existingGame.data.length > 0) {
      socket.emit("room-creation-failed", {
        message: "You already have an active game. Please complete it first.",
      });
      return;
    }
    // ========== END DUPLICATE CHECK ==========

    // CHECK: Don't create if room already exists and is completed
    const existingRoom = await getGameByRoomId(roomData.roomCode);
    if (existingRoom && existingRoom.game_status === "completed") {
      socket.emit("room-completed", {
        message: "This room code has already been used for a completed game",
      });
      return;
    }

    // Create game record in database when room is created
    try {
      const gameRecord = await createChessGame({
        room_id: roomData.roomCode,
        white_player: roomData.creatorName, // Creator is white
        black_player: "", // Will be updated when joiner joins
        game_currency: roomData.gameCurrency || "USDT", // Use dynamic currency
        game_size: parseFloat(roomData.gameAmount) || 0.0, // Store the actual amount
        time_control_minutes: 15, // Default time control
      });

      if (!gameRecord) {
        throw new Error("Failed to create game record");
      }

      // Store in activeRooms with the generated link
      activeRooms[roomData.roomCode] = {
        ...roomData,
        createdAt: Date.now(),
        gameAmount: roomData.gameAmount,
        gameCurrency: roomData.gameCurrency,
        anonymousLink: gameRecord.gamelink, // Single link for both players
        shortHash: gameRecord.short_hash,
      };

    } catch (error) {
      console.error("❌ Failed to create game record:", error);
    }

    // Broadcast to ALL clients
    io.emit("room-created", activeRooms[roomData.roomCode]);
  });

  // Get active rooms for orders list
  socket.on("get-active-rooms", () => {
    

    // Send rooms with gamelink
    const roomsWithLinks = Object.values(activeRooms).map((room) => ({
      ...room,
      anonymousLink: room.anonymousLink || `/play/chess/live/${room.shortHash}`,
    }));

    socket.emit("active-rooms", roomsWithLinks);

    // ADD THIS - Emit a specific event to stop the spinner for this client
    socket.emit("refresh-complete");
  });

  socket.on("request-room-info", ({ room }) => {
    // Check if room is completed first
    if (completedRooms.has(room)) {
      socket.emit("room-info", {
        creatorName: "Game Completed",
        joinerName: "Cannot join completed game",
      });
      return;
    }
    const roomObj = rooms[room] || {};
    socket.emit("room-info", {
      creatorName: roomObj.creatorName || "",
      joinerName: roomObj.joinerName || "",
    });
  });

  // Add cancel-room handler
  socket.on("cancel-room", async ({ room }) => {

    // MARK AS COMPLETED
    completedRooms.add(room);

    // Remove from active rooms
    if (activeRooms[room]) {
      delete activeRooms[room];
    }

    // Update database
    try {
      const { error } = await supabase
        .from("chess_games")
        .update({
          game_status: "cancelled",
          ended_at: new Date().toISOString(),
          reason: "Cancelled by creator",
        })
        .eq("room_id", room);

      if (error) throw error;
    } catch (error) {
      console.error("❌ Failed to cancel game:", error);
    }

    // Notify all clients
    io.emit("room-ended", room);
  });

  // Update the move event handler to validate turn
  socket.on("move", async ({ room, move }) => {

    // Verify sender is authorized for this room
    const verifiedAddress = socket.data?.verifiedAddress;
    const socketRoom = socket.data?.room;

    if (!verifiedAddress || socketRoom !== room) {
      console.error(`❌ Unauthorized move attempt from ${socket.id}`);
      socket.emit("unauthorized", { message: "Not authorized to make moves" });
      return;
    }

    // Get current game to verify it's the player's turn
    const game = await getGameByRoomId(room);
    if (!game) {
      console.error(`❌ Game not found: ${room}`);
      return;
    }

    // Verify player is part of this game
    const isWhite =
      verifiedAddress.toLowerCase() === game.white_player?.toLowerCase();
    const isBlack =
      verifiedAddress.toLowerCase() === game.black_player?.toLowerCase();

    if (!isWhite && !isBlack) {
      console.error(`❌ Player ${verifiedAddress} not in game ${room}`);
      socket.emit("unauthorized", { message: "You are not part of this game" });
      return;
    }

    // Validate the move's turn
    if (move.fen) {
      try {
        const chessGame = new Chess();
        chessGame.load(move.fen);
        const expectedTurn = chessGame.turn();
        const moveTurn = move.activeTimer === "white" ? "w" : "b";

        if (expectedTurn !== moveTurn) {
          console.warn(
            `⚠️ Turn mismatch! Expected ${expectedTurn}, got ${moveTurn}. Rejecting move.`
          );

          // Send correction to the player who made the move
          socket.emit("invalid-move", {
            message: "Not your turn",
            expectedTurn: expectedTurn === "w" ? "white" : "black",
          });

          // Request correct game state
          socket.emit("request-game-state", { room });
          return; // Don't process the move
        }
      } catch (error) {
        console.error("❌ Failed to validate move turn:", error);
      }
    }

    // Update timer
    if (gameTimers[room]) {
      const timer = gameTimers[room];

      // Only update times if they're reasonable (not drastically different)
      if (move.whiteTime !== undefined && move.blackTime !== undefined) {
        const timeDiffWhite = Math.abs(timer.whiteTime - move.whiteTime);
        const timeDiffBlack = Math.abs(timer.blackTime - move.blackTime);

        if (timeDiffWhite < 60 && timeDiffBlack < 60) {
          // Within 60 seconds
          timer.whiteTime = move.whiteTime;
          timer.blackTime = move.blackTime;
        }
      }

      // Switch active timer
      timer.activeTimer = timer.activeTimer === "white" ? "black" : "white";
      timer.lastUpdated = Date.now();
    }

    // Save game state
    if (move.fen) {
      gameStates[room] = {
        fen: move.fen,
        moveHistory: move.history || gameStates[room]?.moveHistory || [],
        whiteTime: gameTimers[room]?.whiteTime || DEFAULT_TIMER_MINUTES * 60,
        blackTime: gameTimers[room]?.blackTime || DEFAULT_TIMER_MINUTES * 60,
        timerRunning: gameTimers[room]?.timerRunning || true,
        activeTimer: gameTimers[room]?.activeTimer || "white",
        lastUpdated: Date.now(),
      };
    }

    // Forward move to opponent
    socket.to(room).emit("opponent-move", {
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      fen: move.fen, // Send FEN to opponent too
    });

    // Save to database
    try {
      await addMoveToGame(room, {
        from: move.from,
        to: move.to,
        promotion: move.promotion,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Failed to save move:", error);
    }
  });

  // Add new event for game state validation
  socket.on("validate-game-state", ({ room }) => {
    validateAndFixGameState(room);
  });

  // Updated disconnect handler in socket.io
  socket.on("disconnect", async (reason: string) => {
    console.log("🔌 Client disconnected:", socket.id, "Reason:", reason);

    const playerStatus = playerStatuses[socket.id];
    if (playerStatus && playerStatus.room) {
      const room = playerStatus.room;
      const roomInfo = rooms[room];

      // ADD THIS CHECK:
      if (!roomInfo) {
        console.log(`❌ Room info not found for ${room} during disconnect`);
        delete playerStatuses[socket.id];
        delete playerHeartbeats[socket.id];
        return;
      }

      // CHECK: If room is already completed, don't process disconnect
      if (completedRooms.has(room)) {
        console.log(
          `✅ Room ${room} already completed, skipping disconnect processing`
        );
        delete playerStatuses[socket.id];
        delete playerHeartbeats[socket.id];
        return;
      }

      // Update player status
      playerStatuses[socket.id] = {
        ...playerStatus,
        status: "disconnected",
      };

      // Determine player role
      const isCreator = roomInfo?.creatorSocketId === socket.id;
      const role = isCreator ? "creator" : "joiner";
      const lifelineKey = isCreator ? "creatorLifelines" : "joinerLifelines";

      console.log(`🔌 ${role} disconnected from room ${room}`);

      // Set reconnecting state
      roomInfo.isReconnecting = true;
      roomInfo.disconnectRole = role;

      // Store disconnect time for countdown
      roomInfo.lastDisconnectTime = Date.now();
      roomInfo.disconnectReason = reason;

      // CRITICAL: Pause the timer when a player disconnects
      if (gameTimers[room] && gameTimers[room].timerRunning) {
        console.log(
          `⏸️ Pausing timer due to player disconnect in room: ${room}`
        );
        gameTimers[room].timerRunning = false;
        gameTimers[room].gamePausedAt = Date.now();

        // Clear sync interval
        if (gameTimers[room].syncInterval) {
          clearInterval(gameTimers[room].syncInterval);
          delete gameTimers[room].syncInterval;
        }

        // Notify both players that timer is paused
        io.to(room).emit("timer-paused", {
          reason: `${role} disconnected. ${roomInfo[lifelineKey]} lifelines remaining.`,
          disconnectedRole: role,
          remainingLifelines: roomInfo[lifelineKey],
          reconnectionWindow: 30000, // 2 minutes in ms
        });
      }

      // Notify opponent with lifeline info
      socket.to(room).emit("opponent-disconnected-details", {
        status: "disconnected",
        reason: reason,
        remainingLifelines: roomInfo[lifelineKey],
        role: role,
        countdownStart: Date.now(),
        countdownDuration: 30000, // 2 minutes in ms
        reconnectWindow: 30000, // 2 minutes in ms
      });

      // Sync lifelines to all clients
      syncLifelinesToClients(room);

      // Start the 2-minute countdown
      if (roomInfo.disconnectCountdown) {
        clearTimeout(roomInfo.disconnectCountdown);
      }

      // Update the disconnect timeout logic to properly handle game ending
      roomInfo.disconnectCountdown = setTimeout(async () => {
        // Check if player is still disconnected
        const currentSocketId = isCreator
          ? roomInfo.creatorSocketId
          : roomInfo.joinerSocketId;

        const isSameSocketStillDisconnected = currentSocketId === socket.id;

        if (isSameSocketStillDisconnected) {
          console.log(
            `⏰ 2-minute reconnection window expired for ${role} in ${room}`
          );

          // Deduct lifeline
          const oldLifelines = roomInfo[lifelineKey];
          roomInfo[lifelineKey] = Math.max(0, oldLifelines - 1);

          console.log(
            `📉 ${role} lost a lifeline: ${oldLifelines} → ${roomInfo[lifelineKey]} remaining`
          );

          // Sync lifelines to all clients
          syncLifelinesToClients(room);

          // CRITICAL: Check if player is OUT OF LIFELINES
          if (roomInfo[lifelineKey] <= 0) {
            console.log(`🚫 ${role} out of lifelines in ${room}. Game over.`);

            // Determine winner (opponent wins)
            const winner = role === "creator" ? "black" : "white";

            console.log(
              `🏆 Winner declared: ${winner} because ${role} ran out of lifelines`
            );

            // Clear any pending countdown
            if (roomInfo.disconnectCountdown) {
              clearTimeout(roomInfo.disconnectCountdown);
              delete roomInfo.disconnectCountdown;
            }

            // Mark room as completed
            completedRooms.add(room);

            // Stop timer if it's running
            if (gameTimers[room]) {
              gameTimers[room].timerRunning = false;
              if (gameTimers[room].syncInterval) {
                clearInterval(gameTimers[room].syncInterval);
                delete gameTimers[room].syncInterval;
              }
            }

            // Determine winner details
            let winnerName = "";
            let loserName = "";

            if (winner === "white") {
              winnerName = roomInfo.creatorName;
              loserName = roomInfo.joinerName || "Player";
            } else {
              winnerName = roomInfo.joinerName || "Player";
              loserName = roomInfo.creatorName;
            }

            // Get current game state for PGN/FEN
            const gameState = gameStates[room];
            let finalFen = gameState?.fen || "";
            const moveHistory = gameState?.moveHistory || [];

            // Update database with result
            try {
              await updateGameWithResult(room, {
                winner: winnerName,
                loser: loserName,
                reason: "Player left the game",
                resultType: "disconnect",
                finalFen: finalFen,
                moveHistory: moveHistory,
              });
              console.log(
                `✅ Game result saved to database: ${winnerName} wins`
              );
            } catch (error) {
              console.error("❌ Failed to save game result:", error);
            }

            // Notify both players that game ended
            io.to(room).emit("game-ended", {
              winner: winner,
              reason: `${role} disconnected and ran out of lifelines`,
              details: {
                disconnectedRole: role,
                remainingLifelines: 0,
                reconnectionAttempted: false,
              },
            });

            // Also emit end-room event for consistency
            io.to(room).emit("end-room", {
              winner: winner,
              reason: "Player left the game (out of lifelines)",
            });

            // Clean up the room
            cleanupRoom(room);

            return; // IMPORTANT: Exit here to prevent further countdowns
          } else {
            // Still have lifelines - start another 2-minute countdown
            console.log(
              `⏱️ ${role} has ${roomInfo[lifelineKey]} lifelines left, starting new countdown`
            );

            roomInfo.lastDisconnectTime = Date.now();

            // Notify clients about new countdown
            io.to(room).emit("new-countdown-started", {
              role,
              remainingLifelines: roomInfo[lifelineKey],
              countdownDuration: 30000,
            });

            // Restart countdown
            roomInfo.disconnectCountdown = setTimeout(async () => {
              // Check if still disconnected
              const currentSocketIdAfter = isCreator
                ? roomInfo.creatorSocketId
                : roomInfo.joinerSocketId;

              if (currentSocketIdAfter === socket.id) {
                // Deduct another lifeline
                roomInfo[lifelineKey] = Math.max(0, roomInfo[lifelineKey] - 1);
                syncLifelinesToClients(room);

                console.log(
                  `📉 ${role} lost another lifeline: ${roomInfo[lifelineKey]} remaining`
                );

                // Check if out of lifelines
                if (roomInfo[lifelineKey] <= 0) {
                  console.log(`🚫 ${role} out of lifelines. Game over.`);

                  const winner = role === "creator" ? "black" : "white";

                  // Clear countdown
                  if (roomInfo.disconnectCountdown) {
                    clearTimeout(roomInfo.disconnectCountdown);
                    delete roomInfo.disconnectCountdown;
                  }

                  // Mark as completed
                  completedRooms.add(room);

                  // Stop timer
                  if (gameTimers[room]) {
                    gameTimers[room].timerRunning = false;
                    if (gameTimers[room].syncInterval) {
                      clearInterval(gameTimers[room].syncInterval);
                      delete gameTimers[room].syncInterval;
                    }
                  }

                  // Determine winner details
                  let winnerName = "";
                  let loserName = "";

                  if (winner === "white") {
                    winnerName = roomInfo.creatorName;
                    loserName = roomInfo.joinerName || "Player";
                  } else {
                    winnerName = roomInfo.joinerName || "Player";
                    loserName = roomInfo.creatorName;
                  }

                  // Update database
                  const gameState = gameStates[room];
                  let finalFen = gameState?.fen || "";
                  const moveHistory = gameState?.moveHistory || [];

                  try {
                    await updateGameWithResult(room, {
                      winner: winnerName,
                      loser: loserName,
                      reason: "Player left the game",
                      resultType: "disconnect",
                      finalFen: finalFen,
                      moveHistory: moveHistory,
                    });
                  } catch (error) {
                    console.error("❌ Failed to save game result:", error);
                  }

                  // Notify players
                  io.to(room).emit("game-ended", {
                    winner: winner,
                    reason: `${role} disconnected and ran out of lifelines`,
                    details: {
                      disconnectedRole: role,
                      remainingLifelines: 0,
                      reconnectionAttempted: false,
                    },
                  });

                  io.to(room).emit("end-room", {
                    winner: winner,
                    reason: "Player left the game (out of lifelines)",
                  });

                  // Clean up
                  cleanupRoom(room);
                } else {
                  // Still have lifelines, continue countdown recursively
                  roomInfo.lastDisconnectTime = Date.now();
                  io.to(room).emit("new-countdown-started", {
                    role,
                    remainingLifelines: roomInfo[lifelineKey],
                    countdownDuration: 30000,
                  });

                  // Continue with next countdown
                  roomInfo.disconnectCountdown = setTimeout(async () => {
                    if (
                      currentSocketIdAfter === socket.id &&
                      roomInfo[lifelineKey] > 0
                    ) {
                      roomInfo[lifelineKey] = Math.max(
                        0,
                        roomInfo[lifelineKey] - 1
                      );
                      syncLifelinesToClients(room);

                      console.log(
                        `📉 ${role} lost final lifeline: ${roomInfo[lifelineKey]} remaining`
                      );

                      if (roomInfo[lifelineKey] <= 0) {
                        const winner = role === "creator" ? "black" : "white";

                        // Clear countdown
                        if (roomInfo.disconnectCountdown) {
                          clearTimeout(roomInfo.disconnectCountdown);
                          delete roomInfo.disconnectCountdown;
                        }

                        // Mark as completed
                        completedRooms.add(room);

                        // Stop timer
                        if (gameTimers[room]) {
                          gameTimers[room].timerRunning = false;
                          if (gameTimers[room].syncInterval) {
                            clearInterval(gameTimers[room].syncInterval);
                            delete gameTimers[room].syncInterval;
                          }
                        }

                        // Determine winner details
                        let winnerName = "";
                        let loserName = "";

                        if (winner === "white") {
                          winnerName = roomInfo.creatorName;
                          loserName = roomInfo.joinerName || "Player";
                        } else {
                          winnerName = roomInfo.joinerName || "Player";
                          loserName = roomInfo.creatorName;
                        }

                        // Update database
                        const gameState = gameStates[room];
                        let finalFen = gameState?.fen || "";
                        const moveHistory = gameState?.moveHistory || [];

                        try {
                          await updateGameWithResult(room, {
                            winner: winnerName,
                            loser: loserName,
                            reason: "Player left the game",
                            resultType: "disconnect",
                            finalFen: finalFen,
                            moveHistory: moveHistory,
                          });
                        } catch (error) {
                          console.error(
                            "❌ Failed to save game result:",
                            error
                          );
                        }

                        // Notify players
                        io.to(room).emit("game-ended", {
                          winner: winner,
                          reason: `${role} disconnected and ran out of lifelines`,
                          details: {
                            disconnectedRole: role,
                            remainingLifelines: 0,
                            reconnectionAttempted: false,
                          },
                        });

                        io.to(room).emit("end-room", {
                          winner: winner,
                          reason: "Player left the game (out of lifelines)",
                        });

                        // Clean up
                        cleanupRoom(room);
                      }
                    }
                  }, 30000);
                }
              }
            }, 30000);
          }
        } else {
          console.log(`✅ ${role} reconnected successfully before timeout`);
          if (roomInfo) {
            roomInfo.isReconnecting = false;
          }
        }
      }, 30000); // 2 minutes = 120,000ms

      console.log(
        `⏱️ Started 2-minute countdown for ${role} in ${room}. ${roomInfo[lifelineKey]} lifelines remaining.`
      );
    }

    // Clean up heartbeat
    delete playerHeartbeats[socket.id];
  });

  socket.on("request-game-state", async ({ room }) => {
    console.log(
      "📥 Game state requested for room:",
      room,
      "by socket:",
      socket.id
    );

    let gameState = gameStates[room];

    // Calculate adjusted timer if game is running
    const adjustedTimer = calculateAdjustedTimer(room);

    // Get move history from database for accurate history
    const gameFromDB = await getGameByRoomId(room);
    const dbMoveHistory = gameFromDB?.move_history || [];

    if (gameState || adjustedTimer) {
      const responseState = {
        ...gameState,
        // Use adjusted timer values if available
        whiteTime:
          adjustedTimer?.whiteTime ||
          gameState?.whiteTime ||
          DEFAULT_TIMER_MINUTES * 60,
        blackTime:
          adjustedTimer?.blackTime ||
          gameState?.blackTime ||
          DEFAULT_TIMER_MINUTES * 60,
        timerRunning:
          adjustedTimer?.timerRunning || gameState?.timerRunning || false,
        activeTimer:
          adjustedTimer?.activeTimer || gameState?.activeTimer || "white",
        fen: gameState?.fen || new Chess().fen(),
        moveHistory: dbMoveHistory, // Use database move history instead of memory
      };

      socket.emit("game-state", responseState);
      console.log("📤 Sent game state to client for room:", room);
    } else {
      console.log("❌ No game state found for room:", room);
      socket.emit("game-state", null);
    }
  });

  socket.on("restart", ({ room }) => {
    socket.to(room).emit("restart");
  });

  // Add this helper function
  function cleanupCompletedRoom(roomId: string) {
    if (completedRooms.has(roomId)) {
      completedRooms.delete(roomId);
      console.log(`🧹 Cleaned up completed room ${roomId} from tracking`);
    }
  }

  // Add this helper function to clean up stale disconnect handlers
  function cleanupStaleDisconnectHandlers(roomId: string, socketId: string) {
    const roomInfo = rooms[roomId];
    if (!roomInfo) return;

    // Check if there's a disconnect countdown for this specific socket
    if (roomInfo.disconnectCountdown) {
      console.log(
        `🧹 Cleaning up stale disconnect handler for ${socketId} in ${roomId}`
      );
      clearTimeout(roomInfo.disconnectCountdown);
      delete roomInfo.disconnectCountdown;
    }

    // Also clear disconnect tracking
    delete roomInfo.lastDisconnectTime;
    delete roomInfo.disconnectReason;
    delete roomInfo.isReconnecting;
    delete roomInfo.disconnectRole;
  }

  function startTimerSync(roomId: string) {
    // Clear any existing interval
    if (gameTimers[roomId]?.syncInterval) {
      clearInterval(gameTimers[roomId].syncInterval);
      delete gameTimers[roomId].syncInterval;
    }

    const intervalId = setInterval(() => {
      const timer = gameTimers[roomId];
      if (!timer || !timer.timerRunning || timer.gamePausedAt) return;

      const now = Date.now();
      const timeElapsed = Math.floor((now - timer.lastUpdated) / 1000);

      if (timeElapsed > 0) {
        if (timer.activeTimer === "white") {
          timer.whiteTime = Math.max(0, timer.whiteTime - timeElapsed);
        } else {
          timer.blackTime = Math.max(0, timer.blackTime - timeElapsed);
        }
        timer.lastUpdated = now;

        // Check for timeout
        if (
          (timer.activeTimer === "white" && timer.whiteTime <= 0) ||
          (timer.activeTimer === "black" && timer.blackTime <= 0)
        ) {
          handleTimeout(roomId);
        }

        // CRITICAL: Update the game state with current timer values
        if (gameStates[roomId]) {
          gameStates[roomId].whiteTime = timer.whiteTime;
          gameStates[roomId].blackTime = timer.blackTime;
          gameStates[roomId].timerRunning = timer.timerRunning;
          gameStates[roomId].activeTimer = timer.activeTimer;
        }
      }
    }, TIMER_SYNC_INTERVAL);

    gameTimers[roomId].syncInterval = intervalId;
  }

  // Update the calculateAdjustedTimer function to handle paused state:
  function calculateAdjustedTimer(roomId: string): GameTimerState | null {
    const timerState = gameTimers[roomId];
    if (!timerState) return null;

    // If timer is paused, return the state as-is
    if (!timerState.timerRunning || timerState.gamePausedAt) {
      return { ...timerState };
    }

    const now = Date.now();
    const timeElapsed = Math.floor((now - timerState.lastUpdated) / 1000);

    if (timeElapsed <= 1) return { ...timerState };

    const adjustedState = { ...timerState };

    if (timerState.activeTimer === "white") {
      adjustedState.whiteTime = Math.max(0, timerState.whiteTime - timeElapsed);
    } else {
      adjustedState.blackTime = Math.max(0, timerState.blackTime - timeElapsed);
    }

    // Update the actual timer in memory too
    timerState.whiteTime = adjustedState.whiteTime;
    timerState.blackTime = adjustedState.blackTime;
    timerState.lastUpdated = now;

    return adjustedState;
  }

  // Add this function to validate and fix game state
  function validateAndFixGameState(roomId: string) {
    const gameState = gameStates[roomId];
    const timerState = gameTimers[roomId];

    if (!gameState || !timerState) return;

    try {
      const chess = new Chess();
      chess.load(gameState.fen);
      const actualTurn = chess.turn() === "w" ? "white" : "black";

      // Fix timer if it doesn't match actual turn
      if (timerState.activeTimer !== actualTurn) {
        console.log(
          `🔄 Auto-fixing turn mismatch in ${roomId}: ${timerState.activeTimer} -> ${actualTurn}`
        );
        timerState.activeTimer = actualTurn;

        // Notify clients
        io.to(roomId).emit("turn-corrected", {
          activeTimer: actualTurn,
          fen: gameState.fen,
          whiteTime: timerState.whiteTime,
          blackTime: timerState.blackTime,
        });
      }
    } catch (error) {
      console.error("❌ Error validating game state:", error);
    }
  }

  // Add this function to sync lifelines to clients
  function syncLifelinesToClients(roomId: string) {
    const roomInfo = rooms[roomId];
    if (!roomInfo) return;

    // Emit lifeline updates to both players
    io.to(roomId).emit("lifelines-updated", {
      creatorLifelines: roomInfo.creatorLifelines,
      joinerLifelines: roomInfo.joinerLifelines,
      creatorSocketId: roomInfo.creatorSocketId,
      joinerSocketId: roomInfo.joinerSocketId,
    });
  }

  // FIX: Add a function to update room presence
  function updateRoomPresence(
    roomId: string,
    socketId: string,
    role: "creator" | "joiner",
    isPresent: boolean
  ) {
    if (!rooms[roomId]) return;

    if (role === "creator") {
      rooms[roomId].creatorPresent = isPresent;
      if (!isPresent) {
        rooms[roomId].creatorSocketId = undefined;
      }
    } else {
      rooms[roomId].joinerPresent = isPresent;
      if (!isPresent) {
        rooms[roomId].joinerSocketId = undefined;
      }
    }

    console.log(`👥 Room ${roomId} presence updated:`, {
      creatorPresent: rooms[roomId].creatorPresent,
      joinerPresent: rooms[roomId].joinerPresent,
    });
  }

  // Update end-room handler
  socket.on("end-room", async ({ room, winner, reason }) => {
    console.log("🎯 END-ROOM EVENT:", { room, winner, reason });

    // Map reason to result type
    let resultType:
      | "checkmate"
      | "draw"
      | "resign"
      | "timeout"
      | "disconnect"
      | "cancelled";

    if (reason?.toLowerCase().includes("checkmate")) resultType = "checkmate";
    else if (reason?.toLowerCase().includes("draw")) resultType = "draw";
    else if (reason?.toLowerCase().includes("resign")) resultType = "resign";
    else if (reason?.toLowerCase().includes("time")) resultType = "timeout";
    else if (reason?.toLowerCase().includes("disconnect"))
      resultType = "disconnect";
    else if (reason?.toLowerCase().includes("cancel")) resultType = "cancelled";
    else resultType = "draw";

    // Use unified handler
    await handleGameEnd(room, resultType, winner as any);
  });

  socket.on("resign", async ({ room, player, winner }) => {
    console.log(`Player ${player} resigned in room ${room}`);

    await handleGameEnd(room, "resign", winner as any);

    // Emit specific resign event to room
    io.to(room).emit("player-resigned", { player, winner });
  });

  socket.on("accept-draw", async ({ room }) => {
    console.log(`Draw accepted in room ${room}`);

    await handleGameEnd(room, "draw", null);

    // Emit draw accepted to room
    io.to(room).emit("draw-accepted");
  });

  socket.on("check-room", ({ room }) => {
    const clients = io.sockets.adapter.rooms.get(room);
    socket.emit("room-exists", !!clients);
  });

  // Draw and resignation handlers
  socket.on("offer-draw", ({ room, from }) => {
    console.log(`Draw offered in room ${room} by ${from}`);
    socket.to(room).emit("offer-draw", { from });
  });

  socket.on("decline-draw", ({ room }) => {
    console.log(`Draw declined in room ${room}`);
    socket.to(room).emit("draw-declined");
  });

  // Update the pause-timer handler:
  socket.on("pause-timer", ({ room }) => {
    console.log(`⏸️ Pausing timer for room: ${room}`);

    if (gameTimers[room]) {
      gameTimers[room].timerRunning = false;
      gameTimers[room].gamePausedAt = Date.now(); // Now this is allowed

      // Also clear the sync interval
      if (gameTimers[room].syncInterval) {
        clearInterval(gameTimers[room].syncInterval);
        delete gameTimers[room].syncInterval;
      }

      // Also update game state
      if (gameStates[room]) {
        gameStates[room].timerRunning = false;
      }
    }
  });

  // Update the resume-timer handler:
  socket.on("resume-timer", ({ room }) => {
    console.log(`▶️ Resuming timer for room: ${room}`);

    if (gameTimers[room]) {
      gameTimers[room].timerRunning = true;
      gameTimers[room].lastUpdated = Date.now();
      delete gameTimers[room].gamePausedAt; // Now this is allowed

      // Restart the sync interval
      startTimerSync(room);

      // Also update game state
      if (gameStates[room]) {
        gameStates[room].timerRunning = true;
      }
    }
  });

  // Add this with your other socket handlers
  socket.on("game-completed", ({ room }) => {
    console.log(`✅ Game ${room} marked as completed by client`);
    completedRooms.add(room);
  });

  // Update reconnection handler
  socket.on("reconnect", (attemptNumber) => {
    console.log(
      `🔁 Player reconnected: ${socket.id} (attempt ${attemptNumber})`
    );

    // Get stored verification data
    const verifiedAddress = socket.data?.verifiedAddress;
    const room = socket.data?.room;
    const role = socket.data?.role;

    if (verifiedAddress && room) {
      // Update socket ID in room info
      const roomInfo = rooms[room];

      // ADD CHECK HERE TOO:
      if (!roomInfo) {
        console.log(`❌ Room info not found for ${room} during reconnect`);
        return;
      }

      // Check if player has zero lifelines
      const isCreator = role === "creator";
      const lifelineKey = isCreator ? "creatorLifelines" : "joinerLifelines";

      if (roomInfo[lifelineKey] <= 0) {
        console.log(
          `❌ ${role} (${verifiedAddress}) reconnected but has zero lifelines. Game already over.`
        );

        // Determine winner
        const winner = isCreator ? "black" : "white";

        // Notify player
        socket.emit("game-ended", {
          winner: winner,
          reason: "You ran out of lifelines. Game over.",
          details: {
            disconnectedRole: role,
            remainingLifelines: 0,
            reconnectionAttempted: true,
          },
        });

        return;
      }

      if (roomInfo) {
        if (role === "creator") {
          roomInfo.creatorSocketId = socket.id;
          roomInfo.creatorPresent = true;
        } else {
          roomInfo.joinerSocketId = socket.id;
          roomInfo.joinerPresent = true;
        }

        // Clear reconnection state
        roomInfo.isReconnecting = false;

        // Clear disconnect countdown if it exists
        if (roomInfo.disconnectCountdown) {
          clearTimeout(roomInfo.disconnectCountdown);
          delete roomInfo.disconnectCountdown;
          console.log(`✅ Cleared disconnect countdown for ${role} in ${room}`);
        }

        // Clear any stored disconnect time
        delete roomInfo.lastDisconnectTime;
        delete roomInfo.disconnectReason;

        // Sync lifelines
        syncLifelinesToClients(room);
      }
    }
  });

  // Add this handler to ensure both players see lifeline updates
  socket.on("get-lifelines", ({ room }) => {
    const roomInfo = rooms[room];
    if (roomInfo) {
      socket.emit("lifelines-updated", {
        creatorLifelines: roomInfo.creatorLifelines,
        joinerLifelines: roomInfo.joinerLifelines,
      });
    }
  });
});

// Add this new function
async function handleGameEnd(
  roomId: string,
  reason:
    | "checkmate"
    | "draw"
    | "resign"
    | "timeout"
    | "disconnect"
    | "cancelled",
  winner?: "white" | "black" | null,
  moveHistory?: any[]
) {
  console.log(
    `🏁 Handling game end: ${roomId} - ${reason} - winner: ${winner}`
  );

  // Check if room is already completed
  if (completedRooms.has(roomId)) {
    console.log(`✅ Room ${roomId} already completed, skipping`);
    return;
  }

  // For disconnect reasons, double-check if both players are actually gone
  if (reason === "disconnect") {
    const roomInfo = rooms[roomId];
    if (roomInfo) {
      // Check if opponent is still present
      const opponentPresent =
        winner === "white" ? roomInfo.joinerPresent : roomInfo.creatorPresent;

      if (opponentPresent) {
        console.log(
          `⏳ Opponent is still present, waiting a bit more before ending game`
        );
        // Add extra delay for opponent to make a move
        return;
      }
    }
  }

  // Mark as completed immediately to prevent other updates
  completedRooms.add(roomId);
  console.log(`📌 Marked room ${roomId} as completed`);

  // Get game data from database
  const gameFromDB = await getGameByRoomId(roomId);
  if (!gameFromDB) {
    console.error("❌ Game not found:", roomId);
    return;
  }

  // Determine players
  let whitePlayer = gameFromDB.white_player;
  let blackPlayer = gameFromDB.black_player || "Player";

  // Fix corrupted data from memory if needed
  if (whitePlayer === blackPlayer) {
    const roomInfo = rooms[roomId];
    if (roomInfo) {
      if (roomInfo.creatorName && roomInfo.creatorName !== whitePlayer) {
        whitePlayer = roomInfo.creatorName;
      }
      if (roomInfo.joinerName && roomInfo.joinerName !== blackPlayer) {
        blackPlayer = roomInfo.joinerName;
      }
    }
  }

  // Determine winner/loser
  let winnerName = "";
  let loserName = "";

  if (winner === "white") {
    winnerName = whitePlayer;
    loserName = blackPlayer;
  } else if (winner === "black") {
    winnerName = blackPlayer;
    loserName = whitePlayer;
  }

  // Generate FEN and PGN from move history
  let finalFen = "";
  let pgnText = "";
  let gameMoveHistory = moveHistory || gameFromDB.move_history || [];

  // Reconstruct the game to get final FEN
  try {
    const chess = new Chess();

    // Replay all moves to get final position
    if (gameMoveHistory.length > 0) {
      for (const move of gameMoveHistory) {
        try {
          chess.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion || "q",
          });
        } catch (error) {
          console.warn(`⚠️ Failed to replay move:`, move, error);
        }
      }
    }

    // Get final FEN
    finalFen = chess.fen();

    // Generate PGN
    pgnText = generatePGN(
      whitePlayer,
      blackPlayer,
      gameMoveHistory,
      winner || null,
      reason
    );

    console.log("📊 Generated game data:", {
      fen: finalFen,
      pgnLength: pgnText.length,
      totalMoves: gameMoveHistory.length,
    });
  } catch (error) {
    console.error("❌ Failed to generate FEN/PGN:", error);
    // Fallback to current game state if available
    const gameState = gameStates[roomId];
    if (gameState && gameState.fen) {
      finalFen = gameState.fen;
    }
  }

  // Update database
  const result = await updateGameWithResult(roomId, {
    winner: reason === "draw" ? null : winnerName,
    loser: reason === "draw" ? null : loserName,
    reason: getReasonText(reason),
    resultType: reason,
    moveHistory: moveHistory || gameFromDB.move_history || [],
    finalFen: finalFen,
    pgn: pgnText,
  });

  // Clean up memory
  cleanupRoom(roomId);

  // Emit to room that game ended
  io.to(roomId).emit("end-room", {
    winner: winner || null,
    reason: getReasonText(reason),
  });

  // Leave the room
  io.socketsLeave(roomId);

  return result;
}

// Add this new helper function to generate PGN
function generatePGN(
  whitePlayer: string,
  blackPlayer: string,
  moveHistory: any[],
  winner: "white" | "black" | null,
  resultType: string
): string {
  try {
    const chess = new Chess();
    let pgnLines: string[] = [];

    // PGN Header
    pgnLines.push(`[Event "Online Chess Game"]`);
    pgnLines.push(`[Site "Chess Platform"]`);
    pgnLines.push(`[Date "${new Date().toISOString().split("T")[0]}"]`);
    pgnLines.push(`[White "${whitePlayer}"]`);
    pgnLines.push(`[Black "${blackPlayer}"]`);
    pgnLines.push(`[Result "${getPGNResult(winner, resultType)}"]`);
    pgnLines.push(`[WhiteElo ""]`);
    pgnLines.push(`[BlackElo ""]`);
    pgnLines.push(`[Variant "Standard"]`);
    pgnLines.push("");

    // Moves
    let movesText = "";
    for (let i = 0; i < moveHistory.length; i++) {
      const move = moveHistory[i];

      // Every 2 moves (1 white + 1 black), increment move number
      if (i % 2 === 0) {
        movesText += `${Math.floor(i / 2) + 1}. `;
      }

      // Add the move notation (prefer SAN, fallback to from-to)
      if (move.san) {
        movesText += `${move.san} `;
      } else if (move.from && move.to) {
        movesText += `${move.from}-${move.to} `;
      }
    }

    pgnLines.push(movesText.trim());
    pgnLines.push(getPGNResult(winner, resultType));

    return pgnLines.join("\n");
  } catch (error) {
    console.error("❌ Failed to generate PGN:", error);
    return `[Game result: ${getReasonText(resultType)}]`;
  }
}

// Add this helper function for PGN results
function getPGNResult(
  winner: "white" | "black" | null,
  resultType: string
): string {
  if (resultType === "draw" || winner === null) {
    return "1/2-1/2";
  } else if (winner === "white") {
    return "1-0";
  } else if (winner === "black") {
    return "0-1";
  } else {
    return "*"; // Unknown result
  }
}

// Helper function for reason text
function getReasonText(reason: string): string {
  switch (reason) {
    case "checkmate":
      return "Checkmate";
    case "draw":
      return "Draw";
    case "resign":
      return "Resignation";
    case "timeout":
      return "Time out";
    case "disconnect":
      return "Player disconnected";
    case "cancelled":
      return "Game cancelled";
    default:
      return "Game completed";
  }
}

// Cleanup function
function cleanupRoom(roomId: string) {
  // Clear timer interval
  if (gameTimers[roomId]?.syncInterval) {
    clearInterval(gameTimers[roomId].syncInterval);
    delete gameTimers[roomId].syncInterval;
  }

  // Remove timer
  if (gameTimers[roomId]) {
    delete gameTimers[roomId];
  }

  if (activeRooms[roomId]) {
    delete activeRooms[roomId];
    io.emit("room-ended", roomId);
  }

  if (rooms[roomId]) {
    delete rooms[roomId];
  }

  if (gameStates[roomId]) {
    delete gameStates[roomId];
  }

  // Clean up player statuses
  Object.keys(playerStatuses).forEach((socketId) => {
    if (playerStatuses[socketId]?.room === roomId) {
      delete playerStatuses[socketId];
    }
  });
}

// Add this function with your other database functions (around line 100-120)
async function verifyDatabaseIntegrity(roomId: string) {
  console.log("🔍 VERIFYING DATABASE INTEGRITY FOR ROOM:", roomId);

  const { data, error } = await supabase
    .from("chess_games")
    .select("*")
    .eq("room_id", roomId)
    .single();

  if (error) {
    console.error("❌ Error verifying database:", error);
    return null;
  }

  console.log("📊 DATABASE VERIFICATION RESULT:", {
    id: data.id,
    white_player: data.white_player,
    black_player: data.black_player,
    winner: data.winner,
    loser: data.loser,
    game_status: data.game_status,
    created_at: data.created_at,
    ended_at: data.ended_at,
    are_players_same: data.white_player === data.black_player,
    are_winner_loser_same: data.winner === data.loser,
  });

  return data;
}

// Add this function near your other database functions
async function canUpdateGame(roomId: string): Promise<boolean> {
  const game = await getGameByRoomId(roomId);

  // Check if game exists and is active
  if (!game || game.game_status === "completed") {
    console.log(`❌ Game ${roomId} is already completed or doesn't exist`);
    return false;
  }

  // Additional checks: game must have both players
  if (!game.white_player || !game.black_player) {
    console.log(`❌ Game ${roomId} doesn't have both players yet`);
    return false;
  }

  return true;
}

// Clean up expired rooms periodically (24 hours)
setInterval(() => {
  const now = Date.now();
  Object.keys(activeRooms).forEach((roomCode) => {
    if (now - activeRooms[roomCode].createdAt > 24 * 60 * 60 * 1000) {
      // Also mark as completed
      completedRooms.add(roomCode);

      delete activeRooms[roomCode];
      io.emit("room-ended", roomCode);
      console.log(`⏰ Room ${roomCode} expired and removed`);
    }
  });
}, 60 * 1000); // Check every minute

// To:
server.listen(3001, () => {
  console.log("🚀 Chess Socket Server running on port 3001");
  console.log("📊 Supabase connected:", !!supabaseUrl);

});
