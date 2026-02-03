import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Use service role key for server-side operations
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey
);

// Type definitions
interface ChessGame {
  id: number;
  room_id: string;
  timestamp: string;
  white_player: string;
  black_player: string;
  game_currency: string;
  game_size: number;
  winner: string | null;
  loser: string | null;
  game_status: string;
  reason: string | null;
  move_history: any;
  total_moves: number;
  created_at: string;
  ended_at: string | null;
  time_control_minutes: number;
  final_fen: string | null;
  pgn_text: string | null;
  game_result_type: string | null;
  gamelink: string | null;
}

interface OrderData {
  roomCode: string;
  gameAmount: string;
  gameCurrency: string;
  roomName: string;
  creatorName: string;
}

// Update the GET function:

export async function GET(request: NextRequest) {
  try {
    console.log("📥 GET request received at /api/fetchchessorders");

    // Fetch data from chess_games table - include all necessary fields
    const { data, error } = await supabase
      .from("chess_games")
      .select(
        "id, room_id, game_currency, game_size, created_at, white_player, black_player, gamelink, short_hash, game_status, timestamp, winner, loser, game_result_type, reason"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Supabase error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch orders",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${data?.length || 0} orders from Supabase`);

    return NextResponse.json({
      success: true,
      orders: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error("❌ Server error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📥 POST request received at /api/fetchchessorders");
    const body: OrderData = await request.json();

    console.log("📝 Creating order with data:", {
      roomCode: body.roomCode,
      gameCurrency: body.gameCurrency,
      gameSize: body.gameAmount,
      creatorName: body.creatorName,
    });

    // ========== Check if room already exists ==========
    const { data: existingRoom, error: checkError } = await supabase
      .from("chess_games")
      .select("room_id, game_status")
      .eq("room_id", body.roomCode)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error("❌ Error checking existing room:", checkError);
      // Continue anyway, don't fail the whole process
    }

    let data: any[] | null = null;
    let error: any = null;

    // Generate short hash
    const generateShortHash = () => {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(body.roomCode).digest('hex');
      return hash.substring(0, 8);
    };

    const shortHash = generateShortHash();
    const gameLink = `/play/chess/live/${shortHash}`;

    // If room exists and is cancelled/completed, update it
    if (existingRoom && (existingRoom.game_status === "cancelled" || existingRoom.game_status === "completed")) {
      console.log(`🔄 Updating existing ${existingRoom.game_status} room ${body.roomCode}`);
      
      const updateResult = await supabase
        .from("chess_games")
        .update({
          game_currency: body.gameCurrency,
          game_size: parseFloat(body.gameAmount),
          white_player: body.creatorName,
          black_player: "", // Reset joiner
          short_hash: shortHash,
          gamelink: gameLink,
          game_status: "waiting",
          created_at: new Date().toISOString(),
          ended_at: null,
          reason: null,
          winner: null,
          loser: null,
          game_result_type: null,
        })
        .eq("room_id", body.roomCode)
        .select();
      
      data = updateResult.data;
      error = updateResult.error;
    } else {
      // Check if room exists with any other status
      if (existingRoom) {
        console.log(`❌ Room ${body.roomCode} already exists with status: ${existingRoom.game_status}`);
        return NextResponse.json(
          {
            success: false,
            error: "Room already exists",
            message: `Room ${body.roomCode} already exists in database. Please generate a new room code.`,
            existingStatus: existingRoom.game_status,
          },
          { status: 409 }
        );
      }
      
      console.log(`🆕 Creating new room ${body.roomCode}`);
      
      const insertResult = await supabase
        .from("chess_games")
        .insert([
          {
            room_id: body.roomCode,
            game_currency: body.gameCurrency,
            game_size: parseFloat(body.gameAmount),
            white_player: body.creatorName,
            black_player: "", // Empty initially
            short_hash: shortHash,
            gamelink: gameLink,
            game_status: "waiting",
            created_at: new Date().toISOString(),
          },
        ])
        .select();
      
      data = insertResult.data;
      error = insertResult.error;
    }

    if (error) {
      console.error("❌ Supabase error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create/update order in database",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    // Check if data is null or empty
    if (!data || data.length === 0) {
      console.error("❌ No data returned from Supabase operation");
      return NextResponse.json(
        {
          success: false,
          error: "No data returned from database",
          message: "Database operation succeeded but no data was returned",
        },
        { status: 500 }
      );
    }

    console.log("✅ Database order created/updated:", {
      room_id: data[0].room_id,
      game_status: data[0].game_status,
      game_link: data[0].gamelink,
    });

    return NextResponse.json({
      success: true,
      order: data[0],
      gameLink: gameLink,
      shortHash: shortHash,
      action: existingRoom ? "updated" : "created",
    });
  } catch (error: any) {
    console.error("❌ Server error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ DELETE request received at /api/fetchchessorders");

    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get("roomCode");

    console.log("Cancelling room:", roomCode);

    if (!roomCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Room code is required",
        },
        { status: 400 }
      );
    }

    // First, check if the game exists and its current status
    const { data: existingGame, error: fetchError } = await supabase
      .from("chess_games")
      .select("*")
      .eq("room_id", roomCode)
      .single();

    if (fetchError) {
      console.error("Error fetching game:", fetchError);
      return NextResponse.json(
        {
          success: false,
          error: "Game not found",
          details: fetchError.message,
        },
        { status: 404 }
      );
    }

    console.log("🔍 Existing game found:", {
      room_id: existingGame.room_id,
      game_status: existingGame.game_status,
      ended_at: existingGame.ended_at,
    });

    // Check if game is already cancelled or completed
    if (existingGame.game_status === "cancelled") {
      console.log(`⚠️ Game ${roomCode} is already cancelled`);
      return NextResponse.json({
        success: true,
        message: `Order ${roomCode} is already cancelled`,
        order: existingGame,
      });
    }

    if (existingGame.game_status === "completed") {
      console.log(`⚠️ Game ${roomCode} is already completed`);
      return NextResponse.json(
        {
          success: false,
          error: "Cannot cancel a completed game",
          order: existingGame,
        },
        { status: 400 }
      );
    }

    console.log("Updating order status to 'cancelled' for room:", roomCode);

    // Update the game_status to "cancelled" and add ended_at timestamp
    const { data, error } = await supabase
      .from("chess_games")
      .update({
        game_status: "cancelled",
        ended_at: new Date().toISOString(),
        // You might want to add a reason field if you have one
        reason: existingGame.reason || "Cancelled by creator",
      })
      .eq("room_id", roomCode)
      .select() // Add this to get the updated data back
      .single(); // Add this to get single record

    if (error) {
      console.error("❌ Supabase update error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to cancel order",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log(
      `✅ Order ${roomCode} cancelled successfully. New status:`,
      data.game_status
    );

    return NextResponse.json({
      success: true,
      message: `Order ${roomCode} cancelled successfully`,
      order: data,
    });
  } catch (error: any) {
    console.error("❌ Server error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// In your api/fetchchessorders/route.ts, update the PATCH function:

export async function PATCH(request: NextRequest) {
  try {
    console.log("🔄 PATCH request received at /api/fetchchessorders");

    const body = await request.json();
    const { roomCode, joinerName } = body;

    console.log("📝 Updating game:", {
      roomCode,
      joinerName,
    });

    if (!roomCode || !joinerName) {
      return NextResponse.json(
        {
          success: false,
          error: "Room code and joiner name are required",
        },
        { status: 400 }
      );
    }

    // First, check if the game exists
    const { data: existingGame, error: fetchError } = await supabase
      .from("chess_games")
      .select("*")
      .eq("room_id", roomCode)
      .single();

    if (fetchError) {
      console.error("Error fetching game:", fetchError);
      return NextResponse.json(
        {
          success: false,
          error: "Game not found",
          details: fetchError.message,
        },
        { status: 404 }
      );
    }

    console.log("🔍 Existing game found:", {
      room_id: existingGame.room_id,
      white_player: existingGame.white_player,
      black_player: existingGame.black_player,
      game_status: existingGame.game_status,
    });

    // Check if game already has a joiner
    if (existingGame.black_player && existingGame.black_player.trim() !== "") {
      console.log("⚠️ Game already has joiner:", existingGame.black_player);
      return NextResponse.json(
        {
          success: false,
          error: "Game already has a joiner",
          joiner: existingGame.black_player,
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      black_player: joinerName,
      game_status: "in_progress",
    };

    console.log("📤 Update data:", updateData);

    // Update the game
    const { data, error } = await supabase
      .from("chess_games")
      .update(updateData)
      .eq("room_id", roomCode)
      .select();

    if (error) {
      console.error("❌ Supabase update error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update order",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ Game updated successfully:", {
      room_id: data[0].room_id,
      white_player: data[0].white_player,
      black_player: data[0].black_player,
      game_status: data[0].game_status,
    });

    return NextResponse.json({
      success: true,
      order: data[0],
      message: "Game updated successfully",
    });
  } catch (error: any) {
    console.error("❌ Server error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
