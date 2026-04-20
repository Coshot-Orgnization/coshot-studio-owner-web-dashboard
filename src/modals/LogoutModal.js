"use client";

import React from "react";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";

const LogoutModal = ({ isOpen, onClose, onConfirm, isLoading = false }) => {
    useBodyScrollLock(isOpen);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/45 px-4">
            <div className="relative w-full max-w-md sm:max-w-135 rounded-2xl bg-white px-6 pb-8 pt-5 shadow-[0_20px_60px_rgba(15,23,42,0.28)] sm:px-8">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close logout modal"
                    className="absolute right-3 top-2 text-2xl leading-none text-[#6D5EF6] transition hover:opacity-80 cursor-pointer"
                >
                    ×
                </button>

                <h2 className="text-2xl sm:text-[26px] font-semibold leading-tight text-[#333333]">Log Out?</h2>

                <p className="mt-4 sm:mt-5 max-w-110 text-sm sm:text-[16px] font-semibold leading-[1.35] text-[#6D5EF6]">
                    You’ll be logged out from this device. Your bookings, wallet, and profile will remain secure.
                </p>

                <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row sm:gap-5">
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onConfirm}
                        className="h-12 w-full sm:w-sm rounded-full bg-linear-to-r from-[#F65B5A] to-[#E92C5A] px-4 text-base sm:text-[17px] font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                    >
                        {isLoading ? "Logging Out..." : "Yes, Log Out"}
                    </button>

                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onClose}
                        className="h-12 w-full sm:w-sm rounded-full bg-linear-to-r from-[#1E3A8A] to-[#6D5EF6] px-4 text-base sm:text-[17px] font-medium text-white disabled:cursor-not-allowed cursor-pointer disabled:opacity-70 bg-[linear-gradient(95.53deg,#1E3A8A_0%,#6D5EF6_40%,#1E3A8A_100%)] bg-size-[300%_100%] transition-all duration-500 ease-in-out hover:bg-position-[100%_0]"
                    >
                        Stay Logged In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutModal;