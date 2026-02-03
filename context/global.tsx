'use client'

import { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { useAccount, useBalance, useReadContracts, useWriteContract } from 'wagmi'
import USDTABI from '@/ABI/UsdtABI.json'
import RAMIABI from '@/ABI/RamiABI.json'
import StakingABI from '@/ABI/StakingABI.json'
import { type Address, type Abi } from 'viem'

type TransactionState = {
    status: 'idle' | 'approving' | 'staking' | 'unstaking' | 'claiming' | 'success' | 'error'
    hash?: string
    message?: string
}

type StakingState = {
    unstakeAmount: string
    stakeAmount: string
    usdtLoading: boolean
    ramiLoading: boolean
    stakedBalance: number
    rewards: number
    bnbBalance: number | undefined
    usdtBalance: number | undefined
    ramiBalance: number | undefined
    allowance: number
    burnPool: number
    reservePool: number
    usdtPool: number
    remainingTime: string
    transaction: TransactionState
}

type GlobalContextType = {
    state: StakingState
    isStakeValid: boolean
    isUnstakeValid: boolean
    isLoading: boolean
    handleStakeAmountChange: (value: string) => void
    handleUnstakeAmountChange: (value: string) => void
    handleApproveStake: () => Promise<void>
    handleStake: () => Promise<void>
    handleUnstake: () => Promise<void>
    handleClaim: () => Promise<void>
    clearTransaction: () => void
    refetchData: () => void
}

const contractAddresses = {
    USDT: '0x4f237c860870A7a564B2db707c60Ee2eb36Cd7e6' as `0x${string}`,
    RAMI: '0xc457860F15aeEdd626F3006a116ca80ec4fE2e60' as `0x${string}`,
    STAKING: '0x08b8605194371805e01f6876cA299C38BC6DD79e' as `0x${string}`,
}

function stakingReducer(state: StakingState, action: any): StakingState {
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

const initialState: StakingState = {
    unstakeAmount: '',
    stakeAmount: '',
    usdtLoading: true,
    ramiLoading: true,
    stakedBalance: 0,
    rewards: 0,
    bnbBalance: undefined,
    usdtBalance: undefined,
    ramiBalance: undefined,
    allowance: 0,
    burnPool: 0,
    reservePool: 0,
    usdtPool: 0,
    remainingTime: '00:00:00',
    transaction: { status: 'idle' }
}

const GlobalContext = createContext<GlobalContextType | null>(null)

export function GlobalProvider({ children }: { children: React.ReactNode }) {
    const { address: userAddress } = useAccount()
    const [state, dispatch] = useReducer(stakingReducer, initialState)
    const { writeContractAsync } = useWriteContract()

    const { data: bnbBalanceData } = useBalance({
        address: userAddress,
    })

    type StakingResult = {
        stakedAmount: bigint
        lastStakeTime: bigint
    }

    const contracts = useMemo(() => [
        {
            address: contractAddresses.STAKING,
            abi: StakingABI as Abi,
            functionName: 'ramicoinStakers',
            args: [userAddress as Address]
        },
        {
            address: contractAddresses.STAKING,
            abi: StakingABI as Abi,
            functionName: 'getPendingRewards',
            args: [userAddress as Address]
        },
        {
            address: contractAddresses.RAMI,
            abi: RAMIABI as Abi,
            functionName: 'allowance',
            args: [userAddress as Address, contractAddresses.STAKING]
        },
        {
            address: contractAddresses.STAKING,
            abi: StakingABI as Abi,
            functionName: 'burnPool'
        },
        {
            address: contractAddresses.STAKING,
            abi: StakingABI as Abi,
            functionName: 'reservePool'
        },
        {
            address: contractAddresses.STAKING,
            abi: StakingABI as Abi,
            functionName: 'usdtPool'
        },
        {
            address: contractAddresses.USDT,
            abi: USDTABI as Abi,
            functionName: 'balanceOf',
            args: [userAddress as Address]
        },
        {
            address: contractAddresses.RAMI,
            abi: RAMIABI as Abi,
            functionName: 'balanceOf',
            args: [userAddress as Address]
        }
    ], [userAddress])

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
            stakedData,
            rewardsData,
            allowanceData,
            burnPoolData,
            reservePoolData,
            usdtPoolData,
            usdtBalance,
            ramiBalance
        ] = contractData

        const batchUpdate: Partial<StakingState> = {
            // Access stakedAmount via index [0]
            stakedBalance: stakedData.result ? Number((stakedData.result as any[])[0]) / 1e18 : 0,
            // Access lastStakeTime via index [1] if needed elsewhere
            rewards: rewardsData.result ? Number(rewardsData.result as bigint) / 1e18 : 0,
            allowance: allowanceData.result ? Number(allowanceData.result as bigint) / 1e18 : 0,
            burnPool: burnPoolData.result ? Number(burnPoolData.result as bigint) / 1e18 : 0,
            reservePool: reservePoolData.result ? Number(reservePoolData.result as bigint) / 1e18 : 0,
            usdtPool: usdtPoolData.result ? Number(usdtPoolData.result as bigint) / 1e18 : 0,
            usdtBalance: usdtBalance?.result !== undefined ? Number(usdtBalance.result) / 1e18 : undefined,
            ramiBalance: ramiBalance?.result !== undefined ? Number(ramiBalance.result) / 1e18 : undefined,
        }

        dispatch({ type: 'BATCH_UPDATE', payload: batchUpdate })
    }, [contractData])

    useEffect(() => {
        const bnbBalance = bnbBalanceData ? parseFloat(bnbBalanceData.formatted) : undefined
        dispatch({ type: 'SET_FIELD', field: 'bnbBalance', value: bnbBalance })
    }, [bnbBalanceData])
    
    useEffect(() => {
        const calculateRemainingTime = () => {
            if (!contractData) return

            const stakedResult = contractData[0]?.result as any[] | undefined
            if (!stakedResult || !stakedResult[1]) { // Check index [1] for lastStakeTime
                dispatch({ type: 'SET_FIELD', field: 'remainingTime', value: '00:00:00' })
                return
            }

            const lastStakeTime = Number(stakedResult[1]) // Access index [1]
            const unlockTime = lastStakeTime * 1000 + 172800000 // 48 hours in ms
            const now = Date.now()
            const remaining = Math.max(0, unlockTime - now)

            const hours = Math.floor(remaining / 3600000)
            const minutes = Math.floor((remaining % 3600000) / 60000)
            const seconds = Math.floor((remaining % 60000) / 1000)

            dispatch({
                type: 'SET_FIELD',
                field: 'remainingTime',
                value: `${hours.toString().padStart(2, '0')}:${minutes
                    .toString()
                    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            })
        }

        const interval = setInterval(calculateRemainingTime, 1000)
        return () => clearInterval(interval)
    }, [contractData, state.stakedBalance])

    const [isStakeValid, isUnstakeValid] = useMemo(() => [
        !!state.ramiBalance &&
        parseFloat(state.stakeAmount) > 0 &&
        parseFloat(state.stakeAmount) <= state.ramiBalance,

        state.stakedBalance > 0 &&
        parseFloat(state.unstakeAmount) > 0 &&
        parseFloat(state.unstakeAmount) <= state.stakedBalance
    ], [state.stakeAmount, state.unstakeAmount, state.ramiBalance, state.stakedBalance])

    const handleTransaction = useCallback(async (txConfig: any, successMessage: string) => {
        try {
            // Map function names to statuses
            const statusMap: Record<string, TransactionState['status']> = {
                approve: 'approving',
                stake: 'staking',
                unstake: 'unstaking',
                claim: 'claiming'
            }

            dispatch({
                type: 'TX_START',
                payload: {
                    status: statusMap[txConfig.functionName] || txConfig.functionName,
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

            // Refetch data to update balances
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

    const handleApproveStake = useCallback(async () => {
        const amount = parseFloat("100000000000000000000000000000000000000000")
        if (!amount) return

        await handleTransaction({
            address: contractAddresses.RAMI,
            abi: RAMIABI as Abi,
            functionName: 'approve',
            args: [contractAddresses.STAKING, BigInt(amount * 1e18)]
        }, 'Approval successful!')
        refetch()
    }, [handleTransaction, refetch])

    const handleStake = useCallback(async () => {
        const amount = parseFloat(state.stakeAmount)
        if (!amount || !userAddress) return

        const hash = await handleTransaction({
            address: contractAddresses.STAKING,
            abi: StakingABI as Abi,
            functionName: 'stake',
            args: [BigInt(amount * 1e18)]
        }, 'Staking successful!')

        if (hash) {
            dispatch({ type: 'SET_FIELD', field: 'stakeAmount', value: '' })
            refetch()
        }
    }, [state.stakeAmount, userAddress, handleTransaction, refetch])

    const handleUnstake = useCallback(async () => {
        const amount = parseFloat(state.unstakeAmount)
        if (!amount || !userAddress) return

        const hash = await handleTransaction({
            address: contractAddresses.STAKING,
            abi: StakingABI as Abi,
            functionName: 'unstake',
            args: [BigInt(amount * 1e18)]
        }, 'Unstaking successful!')

        if (hash) {
            dispatch({ type: 'SET_FIELD', field: 'unstakeAmount', value: '' })
            refetch()
        }
    }, [state.unstakeAmount, userAddress, handleTransaction, refetch])

    const handleClaim = useCallback(async () => {
        if (!userAddress || state.rewards <= 0) return

        await handleTransaction({
            address: contractAddresses.STAKING,
            abi: StakingABI as Abi,
            functionName: 'claim',
        }, 'Rewards claimed successfully!')
        refetch()
    }, [state.rewards, userAddress, handleTransaction, refetch])

    const clearTransaction = useCallback(() => {
        dispatch({ type: 'CLEAR_TX' })
    }, [])

    const handleStakeAmountChange = useCallback((value: string) => {
        dispatch({ type: 'SET_FIELD', field: 'stakeAmount', value })
    }, [])

    const handleUnstakeAmountChange = useCallback((value: string) => {
        dispatch({ type: 'SET_FIELD', field: 'unstakeAmount', value })
    }, [])

    const refetchData = useCallback(() => {
        refetch()
    }, [refetch])

    const contextValue = useMemo(() => ({
        state,
        isStakeValid,
        isUnstakeValid,
        isLoading,
        clearTransaction,
        handleStakeAmountChange,
        handleUnstakeAmountChange,
        handleApproveStake,
        handleStake,
        handleUnstake,
        handleClaim,
        refetchData
    }), [
        state, isStakeValid, isUnstakeValid, isLoading, clearTransaction,
        handleStakeAmountChange, handleUnstakeAmountChange,
        handleApproveStake, handleStake, handleUnstake, handleClaim, refetchData
    ])

    return (
        <GlobalContext.Provider value={contextValue}>
            {children}
        </GlobalContext.Provider>
    )
}

export const useGlobal = () => {
    const context = useContext(GlobalContext)
    if (!context) throw new Error('useGlobal must be used within GlobalProvider')
    return context
}


