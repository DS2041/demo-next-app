import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.error('Redis credentials not set')
    return NextResponse.json({ totalSales: 0 }, { status: 500 })
  }

  try {
    const response = await fetch(`${url}/get/totalSales`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store' // Crucial: prevent caching
    })
    
    if (!response.ok) {
      throw new Error(`Redis response not OK: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Redis response:', data)
    
    // Handle different response formats
    let totalSales = 0
    if (typeof data.result === 'number') {
      totalSales = data.result
    } else if (typeof data.result === 'string') {
      totalSales = parseFloat(data.result) || 0
    } else if (data.result !== null) {
      console.warn('Unexpected Redis response format:', data)
    }
    
    return NextResponse.json({ totalSales })
  } catch (error) {
    console.error('Redis fetch error:', error)
    return NextResponse.json({ totalSales: 0 }, { status: 500 })
  }
}