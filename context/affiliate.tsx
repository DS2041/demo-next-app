'use client'

import { createContext, useContext, useReducer, useMemo, useCallback, useEffect, useState } from 'react'
import {
    useAccount,
    useReadContracts,
    useWriteContract,
} from 'wagmi'
import AFFILIATEABI from '@/ABI/AffiliateABI.json'
import USDTABI from '@/ABI/UsdtABI.json'
import RAMIABI from '@/ABI/RamiABI.json'
import { parseUnits, type Address, type Abi } from 'viem'

type TransactionState = {
    status: 'idle' | 'approving' | 'purchasing' | 'success' | 'error' | 'generating'
    hash?: string
    message?: string
}

type AffiliateState = {
    usdtAmount: string
    ramiAmount: string
    referralCode: string
    generatedCode: string
    referrer: string
    referralCount: number
    salesVolume: number
    totalEarnings: number
    usdtBalance: number | undefined
    ramiBalance: number | undefined
    commissionRate: number
    minPurchase: number
    minRamiPurchase: number
    ramiPrice: number
    totalSales: number
    totalUsers: number
    exists: boolean
    isValidReferralCode: boolean
    referralCodeExists: boolean
    allowance: number
    referralLink: string
    transaction: TransactionState
}

type AffiliateContextType = {
    state: AffiliateState
    isAmountValid: boolean
    isRamiAmountValid: boolean
    isLoading: boolean
    handleUSDTChange: (value: string) => void
    handleRAMIChange: (value: string) => void
    handleReferralCodeChange: (value: string) => void
    handleGenerateCode: () => Promise<void>
    handlePurchase: () => Promise<void>
    handleApproveUSDT: () => Promise<void>
    clearTransaction: () => void
}

const MIN_RAMI_PURCHASE = 200
const USDT_EXCHANGE_RATE = 0.005
const CONTRACT_ADDRESSES = {
    AFFILIATE: '0x16B22DaE19a1187944A40D0B6f4e128590A4e502' as Address,
    USDT: '0x4f237c860870A7a564B2db707c60Ee2eb36Cd7e6' as Address,
    RAMI: '0xc457860F15aeEdd626F3006a116ca80ec4fE2e60' as Address,
}

function affiliateReducer(state: AffiliateState, action: any): AffiliateState {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.value }
        case 'BATCH_UPDATE':
            return { ...state, ...action.payload }
        case 'TX_START':
            return {
                ...state,
                transaction: {
                    status: action.payload.status,
                    message: action.payload.message
                }
            }
        case 'TX_SUCCESS':
            return {
                ...state,
                transaction: {
                    status: 'success',
                    hash: action.payload.hash,
                    message: action.payload.message
                }
            }
        case 'TX_ERROR':
            return {
                ...state,
                transaction: {
                    status: 'error',
                    message: action.payload.message
                }
            }
        case 'CLEAR_TX':
            return { ...state, transaction: { status: 'idle' } }
        default:
            return state
    }
}

const initialState: AffiliateState = {
    usdtAmount: '',
    ramiAmount: '',
    referralCode: '',
    generatedCode: '',
    referrer: '',
    referralCount: 0,
    salesVolume: 0,
    totalEarnings: 0,
    usdtBalance: undefined,
    ramiBalance: undefined,
    commissionRate: 0,
    minPurchase: MIN_RAMI_PURCHASE / 200,
    minRamiPurchase: MIN_RAMI_PURCHASE,
    ramiPrice: USDT_EXCHANGE_RATE,
    totalSales: 0,
    totalUsers: 0,
    exists: false,
    isValidReferralCode: false,
    referralCodeExists: false,
    allowance: 0,
    referralLink: '',
    transaction: { status: 'idle' }
}

const AffiliateContext = createContext<AffiliateContextType | null>(null)

export function AffiliateProvider({ children }: { children: React.ReactNode }) {
    const { address: userAddress } = useAccount()
    const [state, dispatch] = useReducer(affiliateReducer, initialState)
    const { writeContractAsync } = useWriteContract()

    // Upstash Redis
    const [initialLoad, setInitialLoad] = useState(true)

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                console.log('Fetching initial totalSales from Redis...')
                const response = await fetch('/api/sales')
                const data = await response.json()

                if (typeof data.totalSales === 'number') {
                    console.log('Received totalSales:', data.totalSales)
                    dispatch({ type: 'SET_FIELD', field: 'totalSales', value: data.totalSales })
                } else {
                    console.warn('Invalid totalSales response:', data)
                }
            } catch (error) {
                console.error('Failed to fetch initial total sales', error)
            } finally {
                setInitialLoad(false)
            }
        }

        fetchInitialData()
    }, [])

    // Update Redis whenever blockchain totalSales changes
    useEffect(() => {
        if (initialLoad) return // Skip first update

        const updateRedis = async () => {
            try {
                console.log('Updating Redis with totalSales:', state.totalSales)
                await fetch('/api/updateTotalFundsRaised', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newTotalFundsRaised: state.totalSales })
                })
            } catch (error) {
                console.error('Redis update failed:', error)
            }
        }

        updateRedis()
    }, [state.totalSales, initialLoad]);

    const contracts = useMemo(() => [
        {
            address: CONTRACT_ADDRESSES.AFFILIATE,
            abi: AFFILIATEABI as Abi,
            functionName: 'totalSalesVolume' as const
        },
        {
            address: CONTRACT_ADDRESSES.AFFILIATE,
            abi: AFFILIATEABI as Abi,
            functionName: 'userCount' as const
        },
        {
            address: CONTRACT_ADDRESSES.AFFILIATE,
            abi: AFFILIATEABI as Abi,
            functionName: 'users' as const,
            args: [userAddress as Address]
        },
        {
            address: CONTRACT_ADDRESSES.USDT,
            abi: USDTABI as Abi,
            functionName: 'balanceOf' as const,
            args: [userAddress as Address]
        },
        {
            address: CONTRACT_ADDRESSES.RAMI,
            abi: RAMIABI as Abi,
            functionName: 'balanceOf' as const,
            args: [userAddress as Address]
        },
        {
            address: CONTRACT_ADDRESSES.USDT,
            abi: USDTABI as Abi,
            functionName: 'allowance' as const,
            args: [userAddress as Address, CONTRACT_ADDRESSES.AFFILIATE]
        },
        {
            address: CONTRACT_ADDRESSES.AFFILIATE,
            abi: AFFILIATEABI as Abi,
            functionName: 'referralCodes',
            args: [state.referralCode]
        }
    ], [userAddress, state.referralCode])

    const { data: contractData, refetch } = useReadContracts({
        contracts,
        query: { enabled: !!userAddress }
    })

    const isLoading = useMemo(
        () => (contractData ?? []).some(c => {
            const status = (c as { status: 'pending' | 'success' | 'error' }).status
            return status === 'pending'
        }),
        [contractData]
    )

    useMemo(() => {
        if (!contractData) return

        const [
            totalSalesVolume,
            totalUserCount,
            userData,
            usdtBalance,
            ramiBalance,
            allowance,
            referralCodeResult
        ] = contractData

        const batchUpdate: Partial<AffiliateState> = {
            totalSales: Number(totalSalesVolume?.result || 0) / 1e18,
            totalUsers: Number(totalUserCount?.result || 0),
            usdtBalance: usdtBalance?.result !== undefined ? Number(usdtBalance.result) / 1e18 : undefined,
            ramiBalance: ramiBalance?.result !== undefined ? Number(ramiBalance.result) / 1e18 : undefined,
            allowance: Number(allowance?.result || 0) / 1e18,
            referralCodeExists: !!referralCodeResult?.result &&
                referralCodeResult.result.toString() !== '0x0000000000000000000000000000000000000000'
        }

        if (userData?.result) {
            const [
                referralCode,
                referrer,
                referralCount,
                salesVolume,
                totalRamicoinEarned,
                exists
            ] = userData.result as [string, string, bigint, bigint, bigint, boolean]

            Object.assign(batchUpdate, {
                generatedCode: referralCode || '',
                referrer: referrer || '',
                referralCount: Number(referralCount),
                salesVolume: Number(salesVolume) / 1e18,
                totalEarnings: Number(totalRamicoinEarned) / 1e18,
                exists,
                referralLink: referralCode ? `${window.location.origin}/buy?referral=${referralCode}` : ''
            })
        }

        dispatch({ type: 'BATCH_UPDATE', payload: batchUpdate })
    }, [contractData])

    const [isAmountValid, isRamiAmountValid] = useMemo(() => [
        state.usdtBalance !== undefined &&
        parseFloat(state.usdtAmount) >= state.minPurchase &&
        parseFloat(state.usdtAmount) <= state.usdtBalance,

        state.ramiBalance !== undefined &&
        parseFloat(state.ramiAmount) >= state.minRamiPurchase &&
        parseFloat(state.ramiAmount) <= state.ramiBalance
    ], [state.usdtAmount, state.ramiAmount, state.usdtBalance, state.ramiBalance])

    const handleTransaction = useCallback(async (txConfig: any, successMessage: string) => {
        try {
            dispatch({
                type: 'TX_START',
                payload: {
                    status: txConfig.functionName === 'approve' ? 'approving' : txConfig.functionName === 'generateReferralCode' ? 'generating' : 'purchasing',
                    message: 'Confirm transaction in wallet...'
                }
            })

            const hash = await writeContractAsync(txConfig)

            dispatch({
                type: 'TX_SUCCESS',
                payload: {
                    hash,
                    message: successMessage
                }
            })

            // Wait for blockchain confirmation and state update
            await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

            // Refetch data to update balances and allowance
            refetch()

            // Continue polling until data is updated
            let retries = 0;
            const maxRetries = 10;
            const pollInterval = 1000; // 1 second

            const pollData = async () => {
                await new Promise(resolve => setTimeout(resolve, pollInterval));
                refetch();
                retries++;

                if (retries < maxRetries) {
                    pollData();
                }
            };

            pollData();

            return hash
        } catch (error) {
            dispatch({
                type: 'TX_ERROR',
                payload: { message: 'Transaction failed. Please try again' }
            })
            console.error(error)
            return null
        }
    }, [writeContractAsync])

    const handleGenerateCode = useCallback(async () => {
        await handleTransaction(
            {
                address: CONTRACT_ADDRESSES.AFFILIATE,
                abi: AFFILIATEABI as Abi,
                functionName: 'generateReferralCode',
            },
            'Referral code generated successfully!' // Success message added
        )
        refetch()
    }, [handleTransaction, refetch])

    const handleApproveUSDT = useCallback(async () => {
        const usdtValue = parseUnits("100000000000000000000000000000000000000000", 18)
        const hash = await handleTransaction({
            address: CONTRACT_ADDRESSES.USDT,
            abi: USDTABI as Abi,
            functionName: 'approve',
            args: [CONTRACT_ADDRESSES.AFFILIATE, usdtValue]
        }, 'USDT approval successful!')

        if (hash) refetch()
    }, [handleTransaction, refetch])

    const handlePurchase = useCallback(async () => {
        // prevent self referral
        if (state.referralCode === state.generatedCode) {
            dispatch({
                type: 'TX_ERROR',
                payload: { message: 'Self-referral is not allowed' }
            });
            return;
        }

        // Validate referral code format first
        if (!state.referralCode || !state.isValidReferralCode) {
            dispatch({
                type: 'TX_ERROR',
                payload: { message: 'Valid 6-character referral code required' }
            })
            return
        }

        // Validate code existence on-chain
        if (!state.referralCodeExists) {
            dispatch({
                type: 'TX_ERROR',
                payload: { message: 'Referral code does not exist' }
            })
            return
        }
        
        if (!userAddress || !state.usdtAmount) return

        const usdtValue = parseUnits(state.usdtAmount, 18)
        const hash = await handleTransaction({
            address: CONTRACT_ADDRESSES.AFFILIATE,
            abi: AFFILIATEABI as Abi,
            functionName: 'purchase',
            args: [usdtValue, state.referralCode || '']
        }, 'Investment successful! Tokens will arrive shortly')

        if (hash) {
            dispatch({ type: 'SET_FIELD', field: 'usdtAmount', value: '' })
            dispatch({ type: 'SET_FIELD', field: 'referralCode', value: '' })
            refetch()

            try {
                await fetch('/api/updateTotalFundsRaised', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newTotalFundsRaised: state.totalSales })
                });
            } catch (error) {
                console.error('Redis update failed:', error);
            }
        }
    }, [userAddress, state.usdtAmount, state.referralCode, state.isValidReferralCode, state.referralCodeExists, state.totalSales, handleTransaction, refetch])

    useEffect(() => {
        const fetchInitialTotalSales = async () => {
            try {
                const response = await fetch('/api/sales');
                const data = await response.json();
                if (typeof data.totalSales === 'number') {
                    dispatch({ type: 'SET_FIELD', field: 'totalSales', value: data.totalSales });
                }
            } catch (error) {
                console.error('Failed to fetch initial total sales', error);
            }
        };

        fetchInitialTotalSales();
    }, []);
    
    const clearTransaction = useCallback(() => {
        dispatch({ type: 'CLEAR_TX' })
    }, [])

    const handleUSDTChange = useCallback((value: string) => {
        dispatch({ type: 'SET_FIELD', field: 'usdtAmount', value })
        dispatch({
            type: 'SET_FIELD',
            field: 'ramiAmount',
            value: value ? (parseFloat(value) / USDT_EXCHANGE_RATE).toFixed(1) : ''
        })
    }, [])

    const handleRAMIChange = useCallback((value: string) => {
        dispatch({ type: 'SET_FIELD', field: 'ramiAmount', value })
        dispatch({
            type: 'SET_FIELD',
            field: 'usdtAmount',
            value: value ? (parseFloat(value) * USDT_EXCHANGE_RATE).toFixed(3) : ''
        })
    }, [])

    const handleReferralCodeChange = useCallback((value: string) => {
        const sanitizedValue = value
            .replace(/[^A-Za-z0-9]/g, '') // Remove non-alphabetic characters
            .toUpperCase()
            .slice(0, 6); // Explicitly limit to 6 characters

        dispatch({ type: 'SET_FIELD', field: 'referralCode', value: sanitizedValue })
        dispatch({
            type: 'SET_FIELD',
            field: 'isValidReferralCode',
            value: sanitizedValue.length === 6
        })
    }, [])

    const contextValue = useMemo(() => ({
        state,
        isAmountValid,
        isRamiAmountValid,
        isLoading,
        clearTransaction,
        handleUSDTChange,
        handleRAMIChange,
        handleReferralCodeChange,
        handleGenerateCode,
        handleApproveUSDT,
        handlePurchase
    }), [
        state, isAmountValid, isRamiAmountValid, isLoading, clearTransaction,
        handleUSDTChange, handleRAMIChange, handleReferralCodeChange,
        handleGenerateCode, handleApproveUSDT, handlePurchase
    ])

    return (
        <AffiliateContext.Provider value={contextValue}>
            {children}
        </AffiliateContext.Provider>
    )
}

export const useAffiliate = () => {
    const context = useContext(AffiliateContext)
    if (!context) throw new Error('useAffiliate must be used within AffiliateProvider')
    return context
}


