// app/api/room/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add this function to verify wallet signatures
const SIGNING_MESSAGE = (roomCode: string, timestamp: number) =>
  `ramicoin.com : esports - i am the owner`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      roomCode, 
      walletAddress, 
      walletSignature, 
      signatureTimestamp,
      action = 'join' // 'join', 'create', or 'verify'
    } = body;

    if (!roomCode || !walletAddress) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Room code and wallet address are required' 
      });
    }

    // 1. Verify wallet signature if provided
    if (walletSignature && signatureTimestamp) {
      try {
        const message = SIGNING_MESSAGE(roomCode, signatureTimestamp);
        const recoveredAddress = ethers.verifyMessage(message, walletSignature);
        const isSignatureValid = recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
        const isRecent = Date.now() - signatureTimestamp < 5 * 60 * 1000;
        
        if (!isSignatureValid || !isRecent) {
          return NextResponse.json({ 
            valid: false, 
            error: 'Invalid or expired wallet signature' 
          });
        }
      } catch (error) {
        console.error('Signature verification failed:', error);
        return NextResponse.json({ 
          valid: false, 
          error: 'Signature verification failed' 
        });
      }
    }

    // 2. Check room existence and status
    const { data: room, error } = await supabase
      .from('chess_games')
      .select('*')
      .eq('room_id', roomCode)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        valid: false, 
        error: 'Database error' 
      });
    }

    if (!room) {
      // Room doesn't exist
      if (action === 'create') {
        return NextResponse.json({ 
          valid: true, 
          canCreate: true,
          roomStatus: 'available',
          message: 'Room code is available'
        });
      }
      return NextResponse.json({ 
        valid: false, 
        error: 'Room not found' 
      });
    }

    // Room exists, check status
    const roomStatus = {
      exists: true,
      status: room.game_status,
      isCompleted: room.game_status === 'completed',
      isCancelled: room.game_status === 'cancelled',
      isActive: room.game_status === 'active' || room.game_status === 'in_progress',
      creator: room.white_player,
      joiner: room.black_player,
      isCreator: walletAddress.toLowerCase() === room.white_player?.toLowerCase(),
      isJoiner: walletAddress.toLowerCase() === room.black_player?.toLowerCase(),
      canJoin: !room.black_player || walletAddress.toLowerCase() === room.black_player?.toLowerCase(),
      canPlay: (walletAddress.toLowerCase() === room.white_player?.toLowerCase() || 
               walletAddress.toLowerCase() === room.black_player?.toLowerCase()) &&
               room.game_status === 'in_progress'
    };

    // Determine response based on action
    let response: any = { valid: true, ...roomStatus };

    switch (action) {
      case 'create':
        response = { 
          valid: false, 
          error: 'Room already exists',
          ...roomStatus
        };
        break;
        
      case 'join':
        if (roomStatus.isCompleted || roomStatus.isCancelled) {
          response = { 
            valid: false, 
            error: 'Room is no longer active',
            ...roomStatus
          };
        } else if (!roomStatus.canJoin) {
          response = { 
            valid: false, 
            error: 'Room already has a joiner',
            ...roomStatus
          };
        }
        break;
        
      case 'play':
        if (!roomStatus.canPlay) {
          response = { 
            valid: false, 
            error: 'You are not authorized to play in this room',
            ...roomStatus
          };
        }
        break;
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}