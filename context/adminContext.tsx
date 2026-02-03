'use client'

import { createContext, useContext, useReducer, useMemo, useCallback } from 'react'
import { useAccount, useReadContracts, useWriteContract } from 'wagmi'
import USDTABI from '@/ABI/UsdtABI.json'
import RAMIABI from '@/ABI/RamiABI.json'
import StakingABI from '@/ABI/StakingABI.json'
import { type Address, type Abi } from 'viem'

type AdminTransactionState = {
    status: 'idle' | 'approving' | 'depositing' | 'withdrawingBurn' | 'withdrawingReserve' | 'transferring' | 'success' | 'error'
    hash?: string
    message?: string
}

type AdminState = {
    depositAmount: string
    transferAmount: string
    withdrawAddress: string
    usdtBalance: number | undefined
    ramiBalance: number | undefined
    usdtAllowance: number
    burnPool: number
    reservePool: number
    transaction: AdminTransactionState
}

type AdminContextType = {
    state: AdminState
    isDepositValid: boolean
    isTransferValid: boolean
    isWithdrawValid: boolean
    isLoading: boolean
    handleDepositAmountChange: (value: string) => void
    handleTransferAmountChange: (value: string) => void
    handleWithdrawAddressChange: (value: string) => void
    handleDepositUSDT: () => Promise<void>
    handleWithdrawBurnPool: () => Promise<void>
    handleWithdrawReservePool: () => Promise<void>
    handleTransferToBurn: () => Promise<void>
    clearTransaction: () => void
    refetchData: () => void
}

const contractAddresses = {
    USDT: '0x4f237c860870A7a564B2db707c60Ee2eb36Cd7e6' as `0x${string}`,
    RAMI: '0xc457860F15aeEdd626F3006a116ca80ec4fE2e60' as `0x${string}`,
    STAKING: '0x08b8605194371805e01f6876cA299C38BC6DD79e' as `0x${string}`,
    BURN: '0x000000000000000000000000000000000000dEaD' as `0x${string}`,
}

function adminReducer(state: AdminState, action: any): AdminState {
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

const initialState: AdminState = {
    depositAmount: '',
    transferAmount: '',
    withdrawAddress: '',
    usdtBalance: undefined,
    ramiBalance: undefined,
    usdtAllowance: 0,
    burnPool: 0,
    reservePool: 0,
    transaction: { status: 'idle' }
}

const AdminContext = createContext<AdminContextType | null>(null)

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const { address: userAddress } = useAccount()
    const [state, dispatch] = useReducer(adminReducer, initialState)
    const { writeContractAsync } = useWriteContract()

    const contracts = useMemo(() => [
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
        },
        {
            address: contractAddresses.USDT,
            abi: USDTABI as Abi,
            functionName: 'allowance',
            args: [userAddress as Address, contractAddresses.STAKING]
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
            burnPoolData,
            reservePoolData,
            usdtBalance,
            ramiBalance,
            usdtAllowance
        ] = contractData

        const batchUpdate: Partial<AdminState> = {
            burnPool: burnPoolData.result ? Number(burnPoolData.result as bigint) / 1e18 : 0,
            reservePool: reservePoolData.result ? Number(reservePoolData.result as bigint) / 1e18 : 0,
            usdtBalance: usdtBalance?.result !== undefined ? Number(usdtBalance.result) / 1e18 : undefined,
            ramiBalance: ramiBalance?.result !== undefined ? Number(ramiBalance.result) / 1e18 : undefined,
            usdtAllowance: usdtAllowance?.result !== undefined ? Number(usdtAllowance.result) / 1e18 : 0,
        }

        dispatch({ type: 'BATCH_UPDATE', payload: batchUpdate })
    }, [contractData])

    const [isDepositValid, isTransferValid, isWithdrawValid] = useMemo(() => [
        !!state.usdtBalance &&
        parseFloat(state.depositAmount) > 0 &&
        parseFloat(state.depositAmount) <= state.usdtBalance,

        !!state.ramiBalance &&
        parseFloat(state.transferAmount) > 0 &&
        parseFloat(state.transferAmount) <= state.ramiBalance,

        state.withdrawAddress.length > 0 &&
        /^0x[a-fA-F0-9]{40}$/.test(state.withdrawAddress)
    ], [state.depositAmount, state.transferAmount, state.withdrawAddress, state.usdtBalance, state.ramiBalance])

    const handleTransaction = useCallback(async (txConfig: any, successMessage: string, customStatus?: AdminTransactionState['status']) => {
        try {
            // Use custom status if provided, otherwise map from function name
            const status = customStatus ||
                (txConfig.functionName === 'approve' ? 'approving' :
                    txConfig.functionName === 'depositUSDT' ? 'depositing' :
                        txConfig.functionName === 'withdrawBurnPool' ? 'withdrawingBurn' :
                            txConfig.functionName === 'withdrawReservePool' ? 'withdrawingReserve' :
                                txConfig.functionName === 'transfer' ? 'transferring' :
                                    txConfig.functionName as AdminTransactionState['status'])

            dispatch({
                type: 'TX_START',
                payload: {
                    status,
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

            await new Promise(resolve => setTimeout(resolve, 2000))
            refetch()

            return hash
        } catch (error) {
            dispatch({
                type: 'TX_ERROR',
                payload: { message: 'Transaction failed. Please try again' }
            })
            console.error(error)
            return null
        }
    }, [writeContractAsync, refetch])

    const handleDepositUSDT = useCallback(async () => {
        const amount = parseFloat(state.depositAmount)
        if (!amount || !userAddress) return

        const amountInWei = BigInt(amount * 1e18)

        // Check if we already have sufficient allowance
        if (state.usdtAllowance < amount) {
            // First approve USDT spending
            const approveHash = await handleTransaction({
                address: contractAddresses.USDT,
                abi: USDTABI as Abi,
                functionName: 'approve',
                args: [contractAddresses.STAKING, amountInWei]
            }, 'USDT approval successful!', 'approving')

            if (!approveHash) return
        }

        // Then deposit USDT
        const hash = await handleTransaction({
            address: contractAddresses.STAKING,
            abi: StakingABI as Abi,
            functionName: 'depositUSDT',
            args: [amountInWei]
        }, 'USDT deposited successfully!', 'depositing')

        if (hash) {
            dispatch({ type: 'SET_FIELD', field: 'depositAmount', value: '' })
            refetch()
        }
    }, [state.depositAmount, state.usdtAllowance, userAddress, handleTransaction, refetch])

    const handleWithdrawBurnPool = useCallback(async () => {
        if (!state.withdrawAddress) return

        await handleTransaction({
            address: contractAddresses.STAKING,
            abi: StakingABI as Abi,
            functionName: 'withdrawBurnPool',
            args: [state.withdrawAddress as Address]
        }, 'Burn pool withdrawn successfully!')
    }, [state.withdrawAddress, handleTransaction])

    const handleWithdrawReservePool = useCallback(async () => {
        if (!state.withdrawAddress) return

        await handleTransaction({
            address: contractAddresses.STAKING,
            abi: StakingABI as Abi,
            functionName: 'withdrawReservePool',
            args: [state.withdrawAddress as Address]
        }, 'Reserve pool withdrawn successfully!')
    }, [state.withdrawAddress, handleTransaction])

    const handleTransferToBurn = useCallback(async () => {
        const amount = parseFloat(state.transferAmount)
        if (!amount || !userAddress) return

        const hash = await handleTransaction({
            address: contractAddresses.RAMI,
            abi: RAMIABI as Abi,
            functionName: 'transfer',
            args: [contractAddresses.BURN, BigInt(amount * 1e18)]
        }, 'RAMI transferred to burn address successfully!')

        if (hash) {
            dispatch({ type: 'SET_FIELD', field: 'transferAmount', value: '' })
            refetch()
        }
    }, [state.transferAmount, userAddress, handleTransaction, refetch])

    const clearTransaction = useCallback(() => {
        dispatch({ type: 'CLEAR_TX' })
    }, [])

    const handleDepositAmountChange = useCallback((value: string) => {
        dispatch({ type: 'SET_FIELD', field: 'depositAmount', value })
    }, [])

    const handleTransferAmountChange = useCallback((value: string) => {
        dispatch({ type: 'SET_FIELD', field: 'transferAmount', value })
    }, [])

    const handleWithdrawAddressChange = useCallback((value: string) => {
        dispatch({ type: 'SET_FIELD', field: 'withdrawAddress', value })
    }, [])

    const refetchData = useCallback(() => {
        refetch()
    }, [refetch])

    const contextValue = useMemo(() => ({
        state,
        isDepositValid,
        isTransferValid,
        isWithdrawValid,
        isLoading,
        clearTransaction,
        handleDepositAmountChange,
        handleTransferAmountChange,
        handleWithdrawAddressChange,
        handleDepositUSDT,
        handleWithdrawBurnPool,
        handleWithdrawReservePool,
        handleTransferToBurn,
        refetchData
    }), [
        state, isDepositValid, isTransferValid, isWithdrawValid, isLoading, clearTransaction,
        handleDepositAmountChange, handleTransferAmountChange, handleWithdrawAddressChange,
        handleDepositUSDT, handleWithdrawBurnPool, handleWithdrawReservePool,
        handleTransferToBurn, refetchData
    ])

    return (
        <AdminContext.Provider value={contextValue}>
            {children}
        </AdminContext.Provider>
    )
}

export const useAdmin = () => {
    const context = useContext(AdminContext)
    if (!context) throw new Error('useAdmin must be used within AdminProvider')
    return context
}