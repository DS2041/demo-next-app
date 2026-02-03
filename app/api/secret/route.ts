// api/secret/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { method, params } = await req.json();

    // Verify environment variable exists
    if (!process.env.INFURA_API_KEY) {
      throw new Error("Missing KEY in env");
    }

    const response = await fetch(
      "https://bsc-testnet.infura.io/v3/db464cb9aec840e9a79ba6a5d0872133",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `RPC Error: ${errorData.error?.message || "Unknown error"}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
