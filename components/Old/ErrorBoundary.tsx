'use client'

import React, { Component, ReactNode } from "react";
import Button from '@/components/ButtonsUI/button'

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Error caught by ErrorBoundary:", error, errorInfo);

        // Track API errors
        if (error.message.includes('Failed to fetch') || error.message.includes('500')) {
            console.log('Tracking API error');
            // Add your error tracking logic here
        }
    }

    handleReload = () => {
        window.location.reload(); // Reloads the page
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-[100dvw] h-[100dvh] flex flex-col justify-center items-center">
                    <div className="absolute w-[100dvw] h-[100dvh] flex flex-col justify-center items-center space-y-2">
                        <div className="flex flex-col space-y-3 min-h-screen items-center justify-center p-4">
                            <div className="flex flex-col justify-center items-center text-center space-y-6">
                                <div className="mb-3 w-24 h-24 flex justify-center items-center">
                                    <svg width="200" height="200" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M520.741 163.801a10.2 10.2 0 0 0-3.406-3.406c-4.827-2.946-11.129-1.421-14.075 3.406L80.258 856.874a10.24 10.24 0 0 0-1.499 5.335c0 5.655 4.585 10.24 10.24 10.24h846.004c1.882 0 3.728-.519 5.335-1.499 4.827-2.946 6.352-9.248 3.406-14.075L520.742 163.802zm43.703-26.674L987.446 830.2c17.678 28.964 8.528 66.774-20.436 84.452a61.45 61.45 0 0 1-32.008 8.996H88.998c-33.932 0-61.44-27.508-61.44-61.44a61.45 61.45 0 0 1 8.996-32.008l423.002-693.073c17.678-28.964 55.488-38.113 84.452-20.436a61.44 61.44 0 0 1 20.436 20.436M512 778.24c22.622 0 40.96-18.338 40.96-40.96s-18.338-40.96-40.96-40.96-40.96 18.338-40.96 40.96 18.338 40.96 40.96 40.96m0-440.32c-22.622 0-40.96 18.338-40.96 40.96v225.28c0 22.622 18.338 40.96 40.96 40.96s40.96-18.338 40.96-40.96V378.88c0-22.622-18.338-40.96-40.96-40.96" /></svg>
                                </div>
                                <h1 className="text-7xl font-variation-extrabold font-display text-fern-1100">500</h1>
                                <p className="mt-4 text-lg font-light text-ui-body">Internal Server Error</p>
                                <Button
                                    href="/"
                                    theme="dandelion"
                                    className="col-content max-w-[max-content] self-center flex-auto"
                                >
                                    Back to homepage
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
