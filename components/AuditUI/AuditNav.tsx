'use client'

import Image from 'next/image'
import CalendarModal from './CalenderModal';
import { useRamicoin } from "@/context/trackrecord";

const AuditNavbar = ({ className = 'w-full' }) => {

    const {
        selectedDateObj,
        setIsCalendarOpen,
        formatDate,
    } = useRamicoin();

    const selectedDate = formatDate(selectedDateObj);

    return (

        <>
            <div className={`${className} mb-3`}>
                <div className="@container flex flex-col gap-10">
                    <div className="@container flex flex-col gap-6">
                        <div className="flex flex-col">
                            <div className='flex justify-between items-center'>
                                <button
                                    onClick={() => setIsCalendarOpen(true)}
                                    className="w-6 h-6 font-sans text-xl font-medium text-fern-1100 leading-none"
                                >
                                    <Image src="/rami/calender.svg" alt='-' width={40} height={40} priority/>
                                </button>
                                <p className="text-lg text-ui-body font-medium leading-none">
                                    {selectedDate}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <CalendarModal />
            </div>
        </>
    )
}

export default AuditNavbar;