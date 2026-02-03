'use client'

import { useGlobal } from '@/context/global'

export default function BnbBalance() {

    const { state } = useGlobal()

    return (
        <p className='flex justify-start items-center space-x-1'>
            <span className="bg-gray-100 text-gray-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-sm dark:bg-gray-700 dark:text-gray-300">
                <span className={`text-md opacity-80 leading-none flex items-center font-ui text-[#000000]`}>
                    <span className="text-sm flex items-center ml-1 text-ui-body mr-1">My Balance:</span>
                    {state?.bnbBalance?.toFixed(3) ?? '0.00'}
                    <span className="text-sm flex items-center ml-1 text-ui-body">BNB</span>
                </span>
            </span>
        </p>
    )
}
