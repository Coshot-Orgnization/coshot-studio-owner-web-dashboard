"use client";

import React, { useEffect, useRef, useState } from "react";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";
import Image from "next/image";

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 52;

const OtpVerificationModal = ({
    isOpen,
    targetValue = "",
    targetPrefix = "+91",
    isBusy = false,
    onClose,
    onVerify,
    onResend,
    title = "OTP VERIFICATION",
    instructionText = "Enter Verification Code",
    sentToText = "We've sent a verification code to",
    submitLabel = "Let's Go",
    submittingLabel = "Verifying...",
    expiryTextPrefix = "Code expires in",
    resendPromptText = "Didn't get OTP?",
    resendLabel = "Resend OTP",
    otpLength = OTP_LENGTH,
    initialExpirySeconds = OTP_EXPIRY_SECONDS,
}) => {
    useBodyScrollLock(isOpen);

    const [otpDigits, setOtpDigits] = useState(Array(otpLength).fill(""));
    const [expirySeconds, setExpirySeconds] = useState(initialExpirySeconds);
    const otpRefs = useRef([]);

    useEffect(() => {
        if (!isOpen || expirySeconds <= 0) return;

        const timer = setInterval(() => {
            setExpirySeconds((previousValue) => (previousValue > 0 ? previousValue - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, expirySeconds]);

    const handleOtpChange = (index, value) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const nextDigits = [...otpDigits];
        nextDigits[index] = digit;
        setOtpDigits(nextDigits);

        if (digit && index < otpLength - 1) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, event) => {
        if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (event) => {
        const pastedValue = event.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, otpLength);

        if (!pastedValue) return;

        event.preventDefault();
        const nextDigits = Array.from({ length: otpLength }, (_, idx) => pastedValue[idx] || "");
        setOtpDigits(nextDigits);

        const nextFocusIndex = Math.min(pastedValue.length, otpLength - 1);
        otpRefs.current[nextFocusIndex]?.focus();
    };

    const formatOtpExpiry = (seconds) => {
        const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
        const secs = String(seconds % 60).padStart(2, "0");
        return `${minutes}:${secs}`;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const otp = otpDigits.join("");

        if (!new RegExp(`^\\d{${otpLength}}$`).test(otp)) return;
        await onVerify?.(otp);
    };

    const handleResend = async () => {
        if (expirySeconds > 0 || isBusy) return;
        const cleared = Array(otpLength).fill("");
        setOtpDigits(cleared);
        await onResend?.();
        setExpirySeconds(initialExpirySeconds);
        setTimeout(() => otpRefs.current[0]?.focus(), 0);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-[#242528b3] px-4">
            <div className="relative w-full max-w-125 rounded-2xl bg-white px-4 pb-7 pt-6 sm:px-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-3 text-3xl text-[#8E8EAA] transition hover:text-[#69699A] cursor-pointer"
                    aria-label="Close OTP verification modal"
                >
                    ×
                </button>

                <div className="mx-auto mb-4 flex w-fit justify-center">
                    <Image
                        src="/images/logo.png"
                        alt="Coshot"
                        width={120}
                        height={36}
                        className="h-auto w-50"
                        priority
                    />
                </div>

                <h2 className="mt-9 mb-4 text-center text-[22px] font-bold uppercase leading-none tracking-[-0.02em] text-[#151515]">
                    {title}
                </h2>

                <div className="mb-4 space-y-1 text-center text-[14px] text-[#4A4A4A]">
                    <p>{instructionText}</p>
                    <p>{sentToText}</p>
                    {targetValue ? (
                        <p className="font-medium text-[#626161]">{targetPrefix ? `${targetPrefix} ` : ""}{targetValue}</p>
                    ) : null}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3 pt-2">
                        <div className="mx-auto flex w-fit items-center justify-center gap-1 sm:gap-3">
                            {otpDigits.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(element) => {
                                        otpRefs.current[index] = element;
                                    }}
                                    autoFocus={index === 0}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(event) => handleOtpChange(index, event.target.value)}
                                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                                    onPaste={handleOtpPaste}
                                    className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full border text-center text-[16px] font-semibold outline-none transition ${digit
                                        ? "border-[#545EDB] bg-white text-[#222649]"
                                        : "border-[#D4D4D9] bg-[#E7E7E7] text-[#9999A8]"
                                        } focus:border-[#545EDB] focus:bg-white`}
                                    aria-label={`OTP digit ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isBusy}
                        className="group relative mt-2 flex h-11 sm:h-13 w-full cursor-pointer items-center justify-center rounded-full bg-[#293F9B] px-5 text-[18px] sm:text-[20px] font-semibold text-white transition hover:bg-[#24378a] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <span>{isBusy ? submittingLabel : submitLabel}</span>
                        <img src="/images/rightArrow.png" alt="Continue" className="absolute right-1 h-8 w-8 sm:h-10 sm:w-10" />
                    </button>

                    <div className="space-y-1 text-center text-[13px] text-[#4E4E4E]">
                        <p>{expiryTextPrefix} {formatOtpExpiry(expirySeconds)}</p>
                        <p className="text-[11px] text-[#6A6A6A]">
                            {resendPromptText}{" "}
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={expirySeconds > 0 || isBusy}
                                className="cursor-pointer font-medium text-[#4C58E2] underline underline-offset-2 disabled:cursor-not-allowed disabled:text-[#9BA0E8]"
                            >
                                {resendLabel}
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OtpVerificationModal;