"use client";

import React, { useState } from "react";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";
import { showErrorToast } from "@/helpers/toast";

const WarningModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Unsaved Changes",
    message = "You have unsaved changes. Please save before leaving, or your updates may be lost.",
    confirmText = "Proceed Without Saving",
    cancelText = "Go Back & Save",
    showReasonField = false,
    minReasonLength = 0,
}) => {
    const [reason, setReason] = useState("");
    useBodyScrollLock(isOpen);

    const trimmedReason = reason.trim();
    const isReasonInvalid = showReasonField && trimmedReason.length < minReasonLength;

    const handleConfirm = () => {
        if (showReasonField) {
            if (!trimmedReason) {
                showErrorToast("Please enter a reason for deletion.");
                return;
            }

            if (isReasonInvalid) {
                showErrorToast(`Reason must be at least ${minReasonLength} characters.`);
                return;
            }

            onConfirm(trimmedReason);
            setReason("");
            return;
        }

        onConfirm();
    };

    const handleClose = () => {
        setReason("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/45 px-4">
            <div className="relative w-full max-w-md sm:max-w-135 rounded-2xl bg-white px-6 pb-8 pt-5 shadow-[0_20px_60px_rgba(15,23,42,0.28)] sm:px-8">
                <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Close warning modal"
                    className="absolute right-3 top-2 text-xl leading-none text-[#6D5EF6] transition hover:opacity-80 cursor-pointer"
                >
                    ×
                </button>

                <h2 className="text-2xl sm:text-[26px] font-semibold leading-tight text-[#333333]">{title}</h2>

                <p className="mt-4 sm:mt-5 max-w-110 text-sm sm:text-[16px] font-semibold leading-[1.35] text-[#6D5EF6]">
                    {message}
                </p>

                {showReasonField && (
                    <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium text-[#333333]">
                            Reason
                        </label>
                        <textarea
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="Please share your reason"
                            rows={4}
                            className="w-full rounded-xl border border-[#d8d7e2] px-3 py-2 text-sm text-[#333333] outline-none focus:border-[#6D5EF6]"
                        />
                        <p className={`mt-1 text-xs ${isReasonInvalid ? "text-red-500" : "text-[#7c7a90]"}`}>
                            Minimum {minReasonLength} characters
                        </p>
                    </div>
                )}

                <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row sm:gap-5">
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className={`h-12 w-full sm:w-sm rounded-full bg-linear-to-r from-[#F65B5A] to-[#E92C5A] px-4 text-base sm:text-[17px] font-medium text-white transition hover:opacity-95 cursor-pointer ${isReasonInvalid ? "opacity-90" : ""}`}
                    >
                        {confirmText}
                    </button>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="h-12 w-full sm:w-sm rounded-full bg-linear-to-r from-[#1E3A8A] to-[#6D5EF6] px-4 text-base sm:text-[17px] font-medium text-white transition hover:opacity-95 cursor-pointer"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WarningModal;