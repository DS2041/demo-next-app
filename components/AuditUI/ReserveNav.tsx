'use client'

const ReserveNavbar = ({ className = 'w-full' }) => {

    return (

        <>
            <div className={`${className} mb-3`}>
                <div className="@container flex flex-col gap-10">
                    <div className="@container flex flex-col gap-6">
                        <div className="flex flex-col">
                            <div className='flex justify-between items-center'>
                                <span
                                    className="w-6 h-6 font-sans text-xl font-medium text-fern-1100 leading-none"
                                >
                                </span>
                                <p className="text-lg text-ui-body font-medium leading-none">
                                    Buying Bitcoin Daily
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ReserveNavbar;