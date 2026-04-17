"use client";

import React, { useEffect, useState } from 'react';
import { SidebarProvider } from '../context/SidebarContext';
import Sidebar from './Sidebar';
import Header from './Header';
import ProtectedRoute from './ProtectedRoute';
import NoInternetConnectionPage from './NoInternetConnectionPage';

const GlobalClientLayout = ({ children }) => {
    const [isOnline, setIsOnline] = useState(true);

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
