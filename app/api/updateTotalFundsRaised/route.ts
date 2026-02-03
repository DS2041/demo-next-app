import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
        console.error('Redis credentials not set')
        return NextResponse.json({ error: 'Redis credentials not set' }, { status: 500 })
    }

    try {
        const { newTotalFundsRaised } = await request.json()

        if (typeof newTotalFundsRaised !== 'number') {
            return NextResponse.json({ error: 'Invalid total funds value' }, { status: 400 })
        }

        // Update Redis with the new value
        const response = await fetch(`${url}/set/totalSales`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTotalFundsRaised)
        })

        if (!response.ok) {
            throw new Error(`Redis update failed: ${response.status}`)
        }

        return NextResponse.json({
            success: true,
            message: 'Redis updated successfully',
            totalSales: newTotalFundsRaised
        })
    } catch (error) {
        console.error('Update total funds error:', error)
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
}