import { NextRequest, NextResponse } from "next/server";

// Get Ankr API key from environment
const ANKR_URL =
  `https://rpc.ankr.com/bsc_testnet_chapel/9ac164dca6f95a4d9f12ec26df15dac9400ad8d471497218621866f1d3108007`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward the request to Ankr
    const response = await fetch(ANKR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Ankr API responded with status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Ankr API route error:", error);

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: 1,
        error: {
          code: -32603,
          message: "Internal server error",
          data: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
