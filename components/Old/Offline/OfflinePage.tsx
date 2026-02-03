"use client"

export default function OfflinePage() {
    return (
        <div className="w-[100dvw] h-[100dvh] flex flex-col justify-center items-center">
            <div className="absolute w-[100dvw] h-[100dvh] flex flex-col justify-center items-center space-y-2">
                <div className="flex flex-col space-y-3 min-h-screen items-center justify-center p-4">
                    <div className="flex flex-col justify-center items-center text-center space-y-6">
                        <div className="mb-3 w-24 h-24 flex justify-center items-center">
                            <svg width="400" height="400" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><g fill="#ff0000"><path d="M8 1.992c-2.617 0-5.238.934-7.195 2.809l-.496.48a1 1 0 0 0-.032 1.41 1 1 0 0 0 1.414.028l.5-.477c3.086-2.953 8.532-2.953 11.618 0l.5.477a1 1 0 0 0 1.414-.028 1 1 0 0 0-.032-1.41l-.496-.48C13.238 2.926 10.617 1.992 8 1.992M7.969 6c-1.57.012-3.13.629-4.207 1.813l-.5.55a.997.997 0 1 0 1.476 1.344l.5-.543c1.242-1.363 3.992-1.492 5.399-.129Q10.817 9 11 9c.531 0 1.04.21 1.414.586l.223.223q.016-.016.039-.032a1 1 0 0 0 .062-1.414l-.5-.55C11.113 6.582 9.535 5.988 7.968 6M8 10a2 2 0 1 0 1.871 2.7l-.285-.286a2.01 2.01 0 0 1-.469-2.07A2 2 0 0 0 8 10m0 0" fill-opacity=".349" /><path d="M11 10a1 1 0 0 0-.707 1.707L11.586 13l-1.293 1.293a1 1 0 1 0 1.414 1.414L13 14.414l1.293 1.293a1 1 0 1 0 1.414-1.414L14.414 13l1.293-1.293a1 1 0 1 0-1.414-1.414L13 11.586l-1.293-1.293A1 1 0 0 0 11 10m0 0" /></g></svg>
                        </div>
                        <h1 className="text-4xl font-bold text-red-600">Internet Disconnected</h1>
                        <p className="mt-4 text-lg font-light text-ui-body">Please check your internet connection.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
