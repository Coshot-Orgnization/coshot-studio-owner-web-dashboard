"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

const PUBLIC_ROUTES = ["/login"];
const HYDRATION_PENDING = "__HYDRATION_PENDING__";

const subscribeToAuthToken = (callback) => {
    if (typeof window === "undefined") return () => { };

    const handler = () => callback();
    window.addEventListener("storage", handler);
    window.addEventListener("focus", handler);

    return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener("focus", handler);
    };
};

const getAuthTokenSnapshot = () => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("auth_token") ?? "";
};

const getServerSnapshot = () => HYDRATION_PENDING;

const ProtectedRoute = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const tokenSnapshot = useSyncExternalStore(
        subscribeToAuthToken,
        getAuthTokenSnapshot,
        getServerSnapshot
    );

    const isHydrationPending = tokenSnapshot === HYDRATION_PENDING;
    const hasToken = Boolean(tokenSnapshot);
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const shouldRedirectToLogin = !isHydrationPending && !hasToken && !isPublicRoute;
    const shouldRedirectToHome = !isHydrationPending && hasToken && pathname === "/login";

    useEffect(() => {
        if (shouldRedirectToLogin) {
            router.replace("/login");
            return;
        }

        if (shouldRedirectToHome) {
            router.replace("/");
        }
    }, [router, shouldRedirectToHome, shouldRedirectToLogin]);

    if (isHydrationPending || shouldRedirectToLogin || shouldRedirectToHome) {
        return null;
    }

    return children;
};

export default ProtectedRoute;