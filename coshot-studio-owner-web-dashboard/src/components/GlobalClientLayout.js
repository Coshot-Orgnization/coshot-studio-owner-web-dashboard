"use client";

import React, { useEffect, useState } from 'react';
import { SidebarProvider } from '../context/SidebarContext';
import Sidebar from './Sidebar';
import Header from './Header';
import ProtectedRoute from './ProtectedRoute';
import NoInternetConnectionPage from './NoInternetConnectionPage';
import CommonPageLoader from './CommonPageLoader';

const GlobalClientLayout = ({ children }) => {
    const [isOnline, setIsOnline] = useState(true);
    const [isUiLoading, setIsUiLoading] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleUiLoaded = () => setIsUiLoading(false);

        if (document.readyState === 'complete') {
            handleUiLoaded();
            return;
        }

        window.addEventListener('load', handleUiLoaded);

        const fallbackTimeout = setTimeout(handleUiLoaded, 1500);

        return () => {
            window.removeEventListener('load', handleUiLoaded);
            clearTimeout(fallbackTimeout);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateOnlineStatus = () => setIsOnline(window.navigator.onLine);

        updateOnlineStatus();

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    if (isUiLoading) {
        return <CommonPageLoader />;
    }

    return (
        <SidebarProvider>
            <div className="relative min-h-screen">
                <Sidebar />
                <Header />
                <div className="flex-1 w-full" suppressHydrationWarning>
                    <ProtectedRoute>
                        {children}
                    </ProtectedRoute>
                </div>

                {!isOnline ? <NoInternetConnectionPage /> : null}
            </div>
        </SidebarProvider>
    );
};

export default GlobalClientLayout;
