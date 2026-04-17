"use client";

import React, { useEffect } from "react";

const NoInternetConnectionPage = () => {
    useEffect(() => {
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    return (
        <div className="fixed inset-0 z-120 flex w-full items-center justify-center bg-white/30 px-4 py-10 backdrop-blur-xs">
            <div className="w-full max-w-2xl rounded-3xl border border-[#DEE3FF] bg-white/95 px-6 py-10 text-center shadow-[0_16px_40px_rgba(30,35,64,0.16)] sm:px-10">
                <div className="mx-auto flex items-center justify-center">
                    <img
                        src="/images/noInternet.png"
                        alt="No Internet Connection"
                        className="h-68 w-50"
                    />
                </div>
                <h1 className="text-2xl font-semibold text-[#1E2340] sm:text-3xl">No Internet Connection</h1>
                <p className="mx-auto mt-3 max-w-xl text-sm text-[#5B617B] sm:text-base">
                    Your internet connection seems to be unavailable right now. Please check your network and try again.
                </p>

                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="customButton mt-7 shadow-[0_8px_18px_rgba(68,75,203,0.30)]"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
};

export default NoInternetConnectionPage;