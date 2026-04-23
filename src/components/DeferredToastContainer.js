"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ToastContainer = dynamic(
    () => import("react-toastify").then((module) => module.ToastContainer),
    { ssr: false }
);

export default function DeferredToastContainer() {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        let timeoutId;
        let idleId;

        const enableToasts = () => setShouldRender(true);

        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
            idleId = window.requestIdleCallback(enableToasts, { timeout: 1200 });
        } else {
            timeoutId = window.setTimeout(enableToasts, 600);
        }

        return () => {
            if (typeof window !== "undefined" && idleId && "cancelIdleCallback" in window) {
                window.cancelIdleCallback(idleId);
            }

            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
        };
    }, []);

    if (!shouldRender) return null;

    return <ToastContainer />;
}
