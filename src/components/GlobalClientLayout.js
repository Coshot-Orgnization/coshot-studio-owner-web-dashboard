"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from 'react';
import { SidebarProvider } from '../context/SidebarContext';

const Sidebar = dynamic(() => import('./Sidebar'));
const Header = dynamic(() => import('./Header'));
const ProtectedRoute = dynamic(() => import('./ProtectedRoute'));
const NoInternetConnectionPage = dynamic(() => import('./NoInternetConnectionPage'));
const CommonPageLoader = dynamic(() => import('./CommonPageLoader'));

const PUBLIC_ROUTES_WITHOUT_APP_SHELL = ["/login"];

const GlobalClientLayout = ({ children }) => {
    const [isOnline, setIsOnline] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const pathname = usePathname();

    const shouldUseAppShell = !PUBLIC_ROUTES_WITHOUT_APP_SHELL.includes(pathname);

    useEffect(() => {
        setIsMounted(true);
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

    return (
        <SidebarProvider>
            {shouldUseAppShell ? (
                <div className="relative min-h-screen">
                    <Sidebar />
                    <Header />
                    <div className="flex-1 w-full" suppressHydrationWarning>
                        <ProtectedRoute>
                            {children}
                        </ProtectedRoute>
                    </div>

                    {!isMounted ? <CommonPageLoader /> : null}
                    {!isOnline ? <NoInternetConnectionPage /> : null}
                </div>
            ) : (
                <>{children}</>
            )}

        </SidebarProvider>
    );
};

export default GlobalClientLayout;
