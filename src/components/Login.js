"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSendOtpMutation, useVerifyOtpMutation } from "../redux/auth/authApi";
import { showErrorToast, showSuccessToast } from "../helpers/toast";
import { useRouter } from "next/navigation";

export default function Login() {
    const [isOtpStep, setIsOtpStep] = useState(false);
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const otpRefs = useRef([]);
    const otpLength = 6;

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        mode: "onTouched",
        defaultValues: {
            phone: "",
            otp: "",
        },
    });

    const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation();
    const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();
    const isBusy = isSubmitting || isSendingOtp || isVerifyingOtp;
    const router = useRouter();

    const updateOtpValue = (digits) => {
        setValue("otp", digits.join(""), { shouldValidate: true });
    };

    const handleOtpChange = (index, value) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const nextDigits = [...otpDigits];
        nextDigits[index] = digit;
        setOtpDigits(nextDigits);
        updateOtpValue(nextDigits);

        if (digit && index < otpRefs.current.length - 1) {
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
        updateOtpValue(nextDigits);

        const nextFocusIndex = Math.min(pastedValue.length, otpLength - 1);
        otpRefs.current[nextFocusIndex]?.focus();
    };

    const handleSendOtp = async (phone) => {
        await sendOtp({ phone }).then((res) => {
            if (res?.data?.success) {
                showSuccessToast("OTP sent successfully");
                setTimeout(() => otpRefs.current[0]?.focus(), 0);
                setIsOtpStep(true);
            } else {
                showErrorToast("Failed to send OTP");
                return;
            }
        })
    };

    const handleVerifyOtp = async (phone, otp) => {
        await verifyOtp({
            phone,
            otp,
            targetRole: "studio_owner",
            platform: "web",
        }).then((res) => {

            if (res?.data?.success) {
                const { accessToken, refreshToken } = res?.data?.data || {};
                if (typeof window !== "undefined") {
                    if (accessToken) window.localStorage.setItem("auth_token", accessToken);
                    if (refreshToken) window.localStorage.setItem("refresh_token", refreshToken);
                }

                showSuccessToast("OTP verified successfully");
                setIsOtpStep(false);
                setOtpDigits(["", "", "", "", "", ""]);
                setValue("otp", "");
                setValue("phone", "");
                router.push("/");
            } else {
                showErrorToast(res?.error?.data?.message || "Failed to verify OTP");
                return;
            }
        })

    };

    const handleEditPhone = () => {
        setIsOtpStep(false);
        setOtpDigits(["", "", "", "", "", ""]);
        setValue("otp", "");
    };

    const onSubmit = async (values) => {
        if (isOtpStep) {
            if (!/^\d{6}$/.test(values.otp || "")) {
                showErrorToast("Please enter a valid 6-digit OTP");
                return;
            }

            await handleVerifyOtp(values.phone, values.otp);
            return;
        }

        await handleSendOtp(values.phone);
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-zinc-100 via-white to-zinc-50 px-6 py-16 text-zinc-900">
            <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
                <div className="space-y-4">
                    <p className="inline-flex rounded-full border border-zinc-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-600 shadow-sm">
                        Coshot
                    </p>
                    <h1 className="text-3xl font-semibold leading-tight text-zinc-900 md:text-4xl">
                        Log in securely in seconds.
                    </h1>
                    <p className="max-w-md text-sm leading-relaxed text-zinc-600 md:text-base">
                        We’ll send a one-time login code to your phone number. Your information is
                        protected and used only for secure sign-in access.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="w-full max-w-lg space-y-5 rounded-3xl border border-zinc-200 bg-white p-7 shadow-[0_10px_35px_rgba(0,0,0,0.06)]"
                >
                    <div className="space-y-1">
                        <h2 className="text-xl font-semibold text-zinc-900">
                            {isOtpStep ? "Verify your number" : "Log in"}
                        </h2>
                        <p className="text-sm text-zinc-500">
                            {isOtpStep
                                ? "Enter the 6-digit code sent to your phone"
                                : "Use your phone number to access your account"}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700" htmlFor="phone">
                            Phone number
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            placeholder="+91 98765 43210"
                            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                            disabled={isOtpStep}
                            {...register("phone", {
                                required: "Phone number is required",
                                validate: (value) => {
                                    const digitsOnly = (value || "").replace(/\D/g, "");
                                    return digitsOnly.length >= 10 || "Enter a valid phone";
                                },
                            })}
                        />
                        {errors.phone ? (
                            <p className="text-xs text-red-500">{errors.phone.message}</p>
                        ) : null}
                    </div>

                    {isOtpStep ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700" htmlFor="otp">
                                Verification code
                            </label>
                            <div className="flex items-center gap-2">
                                {otpDigits.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(element) => {
                                            otpRefs.current[index] = element;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(event) => handleOtpChange(index, event.target.value)}
                                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                                        onPaste={handleOtpPaste}
                                        className="h-12 w-12 rounded-lg border border-zinc-200 bg-zinc-50 text-center text-lg font-medium text-zinc-900 focus:border-zinc-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-200"
                                        aria-label={`OTP digit ${index + 1}`}
                                    />
                                ))}
                            </div>
                            <input
                                type="hidden"
                                {...register("otp", {
                                    validate: (value) =>
                                        !isOtpStep || /^\d{6}$/.test(value || "") || "OTP must be 6 digits",
                                })}
                            />
                            {errors.otp ? (
                                <p className="text-xs text-red-500">{errors.otp.message}</p>
                            ) : null}

                            <button
                                type="button"
                                onClick={handleEditPhone}
                                className="pt-1 text-xs font-medium text-zinc-600 underline-offset-2 transition hover:text-zinc-900 hover:underline cursor-pointer"
                            >
                                Use a different phone number
                            </button>
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={isBusy}
                        className="w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isBusy
                            ? isOtpStep
                                ? "Verifying..."
                                : "Sending..."
                            : isOtpStep
                                ? "Verify OTP"
                                : "Send Login OTP"}
                    </button>

                    <p className="text-center text-xs text-zinc-500">
                        By continuing, you agree to our Terms and Privacy Policy.
                    </p>
                </form>
            </div>
        </div>

    );
}