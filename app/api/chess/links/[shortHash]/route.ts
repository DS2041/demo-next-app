import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { shortHash: string } }
) {
  try {
    const shortHash = params.shortHash;

    if (!shortHash || shortHash.length !== 8) {
      return NextResponse.json({ error: "Invalid link" }, { status: 400 });
    }

    // Find the game by short hash
    const { data: game, error } = await supabase
      .from("chess_games")
      .select(
        "room_id, white_player, black_player, game_status, short_hash, game_currency, game_size"
      )
      .eq("short_hash", shortHash)
      .single();

    if (error || !game) {
      console.error("Game not found for hash:", shortHash, error);
      return NextResponse.json(
        { error: "Game not found or link expired" },
        { status: 404 }
      );
    }

    // Check if game is still active
    if (game.game_status === "completed" || game.game_status === "cancelled") {
      return NextResponse.json(
        {
          success: true,
          roomCode: game.room_id,
          whitePlayer: game.white_player,
          blackPlayer: game.black_player,
          currency: game.game_currency,
          amount: game.game_size,
          status: game.game_status,
          completed: true,
          message: "This game has already ended",
        },
        { status: 410 }
      );
    }

    // Return the room code and game data
    return NextResponse.json({
      success: true,
      roomCode: game.room_id,
      whitePlayer: game.white_player,
      blackPlayer: game.black_player,
      currency: game.game_currency,
      amount: game.game_size,
      status: game.game_status,
      completed: false,
      needsVerification: true,
    });
  } catch (error: any) {
    console.error("Error resolving short link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
