"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Footer from "./Footer";
import Navbar from "./Navbar";
import { useCreateStudioMutation, useGetStudioDetailsQuery } from "@/redux/studios/studiosApi";
import { showErrorToast, showSuccessToast } from "@/helpers/toast";
import { formatAmount } from "@/helpers/formatAmount";

const roundedInputClass =
    "mt-2 h-11.5 w-full rounded-full border border-[#dedde7] bg-white px-5 text-[14px] text-[#5e5b71] shadow-[0_8px_20px_rgba(46,35,85,0.06)] outline-hidden [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const DiscountPreview = ({ hours, discount, pricePerHour }) => {
    const gross = hours * pricePerHour;
    const discountAmount = Math.round((gross * discount) / 100);
    const net = gross - discountAmount;

    return (
        <div className="mt-2 text-[12px] leading-4 text-[#6f6b84]">
            <p className="font-semibold text-[#5b5671]">Price Preview <span className="font-normal italic text-[#88839c]">(Auto-calculated)</span></p>
            <p>
                {hours} hours × ₹{formatAmount(pricePerHour)} = ₹{formatAmount(gross)}
                <span className="pl-4">Discount ({discount}%) = -₹{formatAmount(discountAmount)}</span>
            </p>
            <p className="font-semibold text-[#4e4967]">Total: ₹{formatAmount(net)}</p>
        </div>
    );
};

const AddPricingAndBooking = () => {
    const router = useRouter();
    const hasPrefilledRef = useRef(false);

    const [pricePerHour, setPricePerHour] = useState(0);
    const [securityDeposit, setSecurityDeposit] = useState("");
    const [minimumHours, setMinimumHours] = useState(1);
    const [overtimePrice, setOvertimePrice] = useState("");
    const [discountRows, setDiscountRows] = useState([]);
    const [createStudio] = useCreateStudioMutation();
    const studioId = typeof window !== "undefined" ? localStorage.getItem("studioId") || "" : "";
    const { data: studioDetails } = useGetStudioDetailsQuery(studioId, {
        skip: !studioId,
        refetchOnMountOrArgChange: true,
    });

    useEffect(() => {
        if (hasPrefilledRef.current || !studioDetails?.data) return;
        hasPrefilledRef.current = true;

        const details = studioDetails.data;

        queueMicrotask(() => {
            const parsedBasePrice = Number(details?.basePricePerHour);
            setPricePerHour(Number.isFinite(parsedBasePrice) && parsedBasePrice > 0 ? parsedBasePrice : 0);

            const parsedSecurityDeposit = Number(details?.securityDeposit);
            setSecurityDeposit(Number.isFinite(parsedSecurityDeposit) && parsedSecurityDeposit > 0 ? String(parsedSecurityDeposit) : "");

            const parsedMinimumHours = Number(details?.minBookingHours);
            setMinimumHours(Number.isFinite(parsedMinimumHours) && parsedMinimumHours > 0 ? parsedMinimumHours : 1);

            const parsedOvertimePrice = Number(details?.overtimePricePerHour);
            setOvertimePrice(Number.isFinite(parsedOvertimePrice) && parsedOvertimePrice > 0 ? String(parsedOvertimePrice) : "");

            const prefilledDiscounts = (details?.discountRules || [])
                .map((rule) => {
                    const hours = Number(rule?.hours || rule?.minimumHours || rule?.minHours);
                    const discountPercentage = Number(rule?.discountPercentage ?? rule?.discount ?? rule?.percentage ?? 0);

                    if (!Number.isFinite(hours) || hours <= 0) return null;

                    return {
                        hours,
                        discountPercentage: Number.isFinite(discountPercentage) ? discountPercentage : 0,
                    };
                })
                .filter(Boolean);

            if (prefilledDiscounts.length > 0) {
                setDiscountRows(prefilledDiscounts);
            }
        });
    }, [studioDetails]);

    const hasDuplicateDiscountHours = (rows) => {
        const hoursList = rows
            .map((item) => Number(item.hours))
            .filter((hours) => Number.isFinite(hours) && hours > 0);
        return new Set(hoursList).size !== hoursList.length;
    };

    const updateDiscountRow = (index, key, value) => {
        setDiscountRows((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
        );
    };

    const handleHoursBlur = () => {
        if (hasDuplicateDiscountHours(discountRows)) {
            showErrorToast("A discount rule for these hours already exists.");
        }
    };

    const addDiscountRow = () => {
        setDiscountRows((prev) => {
            const existingHours = new Set(prev.map((item) => Number(item.hours)));
            let nextHours = 2;

            while (existingHours.has(nextHours)) {
                nextHours += 1;
            }

            return [...prev, { hours: nextHours, discountPercentage: 20 }];
        });
    };

    const removeDiscountRow = (index) => {
        setDiscountRows((prev) => prev.filter((_, i) => i !== index));
    };

    const onClickHandler = async () => {
        const hasDuplicateHours = hasDuplicateDiscountHours(discountRows);

        if (hasDuplicateHours) {
            showErrorToast("You cannot add multiple discount rules for the same hours.");
            return;
        }

        if (!pricePerHour) {
            showErrorToast("Please enter a valid price per hour.");
            return;
        }

        if (!securityDeposit) {
            showErrorToast("Please enter a valid security deposit amount.");
            return;
        }

        if (!minimumHours) {
            showErrorToast("Please enter a valid minimum booking hours.");
            return;
        }

        if (overtimePrice === "") {
            showErrorToast("Please enter a valid overtime price.");
            return;
        }

        const res = await createStudio({
            studioId,
            step: 2,
            basePricePerHour: Number(pricePerHour),
            minBookingHours: minimumHours,
            overtimePricePerHour: Number(overtimePrice),
            securityDeposit: Number(securityDeposit),
            discountRules: discountRows
        })

        if (res?.data) {
            router.push("/add-studio/manage-availability")
            showSuccessToast(res?.data?.message || "Studio step saved successfully.")
        } else {
            showErrorToast(res?.error?.data?.message || "Something went wrong")
        }
    }

    return (
        <main className="min-h-screen pt-15">
            <div className="mx-auto flex w-full max-w-full flex-col gap-6 lg:flex-row lg:items-start">
                <aside className="hidden lg:block h-200 w-full rounded-tr-[300px] bg-[#F7F8FC] pr-4 lg:w-105 lg:pr-5">
                    <h2 className="mb-4 mt-4 ps-5 text-[28px] font-semibold text-[#2f2d3a] lg:mt-15">Studio Setup Steps</h2>
                    <div className="space-y-1">
                        <Navbar />
                    </div>
                </aside>

                <section className="w-full rounded-[20px] border border-[#e5e4ee] bg-white shadow-[0_10px_24px_rgba(47,42,71,0.08)] lg:w-300">
                    <div className="px-6 py-2 md:py-5 md:grid-cols-[1fr_auto] md:items-center md:px-10 flex justify-between items-center">
                        <div>
                            <h1 className="text-[20px] font-semibold text-[#6d5ef6]">Pricing &amp; Booking</h1>
                            <p className="max-w-full mt-2 text-[13px] leading-4 text-[#6f6b84]">
                                Set your pricing and offers. Guests will see transparent pricing before booking.
                            </p>
                        </div>
                        <div className="block lg:hidden">
                            <Navbar />
                        </div>
                    </div>

                    <div className="mt-1 sm:mt-4 border-t border-dashed border-[#e3e2ec]" />
                    <div className="space-y-8 px-6 py-6 md:px-10 md:py-8">
                        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                            <h3 className="text-[16px] font-semibold text-[#403c56]">Base Pricing</h3>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2 lg:gap-9">
                            <div>
                                <label className="text-[13px] font-medium text-[#4f4b63]">Price per Hour</label>
                                <input
                                    type="number"
                                    value={pricePerHour}
                                    onChange={(e) => setPricePerHour(e.target.value)}
                                    className={roundedInputClass}
                                    placeholder="(₹)"
                                />
                            </div>

                            <div>
                                <label className="text-[13px] font-medium text-[#4f4b63]">Security Deposit Amount</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={securityDeposit}
                                        onChange={(e) => setSecurityDeposit(e.target.value)}
                                        className="mt-2 h-11.5 w-full rounded-full border border-[#dedde7] bg-white pl-8 pr-5 text-[14px] text-[#5e5b71] shadow-[0_8px_20px_rgba(46,35,85,0.06)] outline-hidden [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        placeholder="0"
                                    />
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pt-2 text-[14px] text-[#5e5b71]">(₹)</span>
                                </div>

                                <p className="mt-1 text-[12px] italic text-[#88839c]">
                                    The security deposit must be returned to the guest in hand once the recording is completed, subject to no damage.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-5 sm:gap-10">
                                <div className="grid flex-1 sm:flex-none mt-1">
                                    <label className="text-[13px] font-medium text-[#4f4b63]">Minimum Booking Hours</label>
                                    <select
                                        value={minimumHours}
                                        onChange={(e) => setMinimumHours(Number(e.target.value))}
                                        className="mt-2 h-11.5 w-30 appearance-none rounded-full border border-[#dedde7] bg-white px-5 pr-10 text-[14px] text-[#5e5b71] shadow-[0_8px_20px_rgba(46,35,85,0.06)] outline-hidden"
                                        style={{
                                            backgroundImage:
                                                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237c7891' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                                            backgroundRepeat: "no-repeat",
                                            backgroundPosition: "right 14px center",
                                        }}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hr) => (
                                            <option key={hr} value={hr}>
                                                {hr}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex-1 sm:flex-none">
                                    <label className="text-[13px] font-medium text-[#4f4b63]">
                                        Overtime Price <span className="text-[11px] text-[#8d89a1]">(per hour)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={overtimePrice}
                                            onChange={(e) => setOvertimePrice(e.target.value)}
                                            className="mt-2 h-11.5 w-full sm:w-xxs rounded-full border border-[#dedde7] bg-white pl-8 pr-5 text-[14px] text-[#5e5b71] shadow-[0_8px_20px_rgba(46,35,85,0.06)] outline-hidden [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            placeholder="0"
                                        />
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pt-2 text-[14px] text-[#5e5b71]">(₹)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                            <h3 className="text-[16px] font-semibold text-[#403c56]">Discount Rules</h3>
                            <p className="text-[13px] italic text text-[#323232]">Offer discounts for longer bookings<span className="text-[#8c88a1]">(optional)</span></p>
                        </div>

                        <div className="space-y-4">
                            {discountRows.map((row, index) => (
                                <div key={index}>
                                    {/** Keeps the input controlled even if older row objects use `discount` key */}
                                    {(() => {
                                        const currentDiscount = row.discountPercentage ?? row.discount ?? 0;

                                        return (
                                            <div className="grid gap-5 md:grid-cols-[1fr_1fr_auto] md:items-end md:gap-9">
                                                <div>
                                                    {index === 0 && <label className="text-[13px] font-medium text-[#4f4b63]">Hours Booked</label>}
                                                    <input
                                                        type="number"
                                                        value={row.hours ?? ""}
                                                        onChange={(e) => {
                                                            const { value } = e.target;
                                                            updateDiscountRow(index, "hours", value === "" ? "" : Number(value));
                                                        }}
                                                        onBlur={handleHoursBlur}
                                                        className={roundedInputClass}
                                                    />
                                                </div>

                                                <div>
                                                    {index === 0 && <label className="text-[13px] font-medium text-[#4f4b63]">Discount %</label>}
                                                    <input
                                                        type="text"
                                                        value={currentDiscount === 0 ? "" : currentDiscount}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/[^0-9]/g, "");
                                                            updateDiscountRow(index, "discountPercentage", val === "" ? 0 : Number(val));
                                                        }}
                                                        className={roundedInputClass}
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeDiscountRow(index)}
                                                    className="mb-4 mr-5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ff5964] text-[12px] text-white cursor-pointer"
                                                    aria-label="Remove discount rule"
                                                >
                                                    <img src="/images/navbar/delete.png" alt="Remove" className="w-5 h-5 font-semibold" />
                                                </button>
                                            </div>
                                        );
                                    })()}

                                    <DiscountPreview
                                        hours={row.hours}
                                        discount={row.discountPercentage ?? row.discount ?? 0}
                                        pricePerHour={Number(pricePerHour) || 0}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={addDiscountRow}
                                className="rounded-full bg-[#302f35] px-4 py-2 text-[12px] font-medium text-white cursor-pointer"
                            >
                                + Add More
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-[#ecebf3] px-6 py-5 md:px-10 md:py-6">
                        <div className="flex justify-center md:justify-end">
                            <button
                                type="button"
                                className="h-12 w-full max-w-53.5 rounded-full bg-linear-to-r from-[#1e3a8a] to-[#6d5ef6] text-[18px] font-medium text-white cursor-pointer bg-[linear-gradient(95.53deg,#1E3A8A_0%,#6D5EF6_40%,#1E3A8A_100%)] bg-size-[300%_100%] transition-all duration-500 ease-in-out hover:bg-position-[100%_0]"
                                onClick={() => onClickHandler()}
                            >
                                Save & Continue
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <div className="mx-auto max-w-full px-0 sm:px-0">
                <Footer />
            </div>
        </main>
    );
};

export default AddPricingAndBooking;