"use client";

import React from "react";
import { useParams } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useGetSettlementDetailsQuery } from "@/redux/settlements/settlementsApi";

const toNumber = (value) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const formatINR = (value) => `₹${Number(toNumber(value), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatStatusDate = (value) => {
    if (!value) return "—";

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return String(value).toUpperCase();

    return parsedDate
        .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        .toUpperCase();
};

const formatBookingDate = (value) => {
    if (!value) return "—";

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;

    return parsedDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).replace(/\s/g, "-");
};

const formatIsoDate = (value) => {
    if (!value) return "—";

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;

    return parsedDate.toISOString().split("T")[0];
};

const capitalize = (value) => {
    if (!value) return "Pending";
    return value.charAt(0).toUpperCase() + value.slice(1);
};

const SettlementsDetails = () => {
    const params = useParams();
    const settlementId = Array.isArray(params?.id) ? params.id[0] : params?.id;

    const {
        data,
        isLoading,
        isFetching,
        isError,
    } = useGetSettlementDetailsQuery(settlementId, {
        skip: !settlementId,
    });

    const settlement = data?.data ?? {};
    const transferDetails = settlement?.bankAccount ?? {};
    const bookingBreakdown = settlement?.lineItems ?? [];

    const statusDate = settlement?.processedAt || settlement?.periodTo;
    const transferDate = settlement?.processedAt || settlement?.periodTo;
    const statusLabel = capitalize(settlement?.status);
    const paymentMethod = settlement?.paymentMethod ? String(settlement.paymentMethod).toUpperCase() : "N/A";

    const footerTransferText = settlement?.adminNotes
        || `Transferred via ${paymentMethod} on ${formatIsoDate(transferDate)}`;

    return (
        <section className="w-full pt-15">
            <div className="relative mx-auto mt-8 flex w-full max-w-330 flex-col gap-6 px-4 lg:flex-row lg:items-start lg:gap-8 lg:px-6">
                <Navbar />

                <section className="w-full overflow-hidden rounded-3xl border border-[#e8e8ef] bg-white shadow-[0_10px_36px_rgba(42,48,82,0.08)] lg:max-w-232.5">
                    <div className="">
                        <div className="mx-auto w-full max-w-full overflow-hidden rounded-2xl border border-[#ecebf3] bg-[#fbfbfd] shadow-[0_8px_24px_rgba(41,46,71,0.08)]">
                            <div className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_auto] md:items-start">
                                <h2 className="text-[14px] font-semibold text-[#6D5EF6]">Settlement Details</h2>
                                <p className="max-w-61.25 text-[11px] leading-4 text-[#7A788C] md:text-right">
                                    Get complete visibility into your revenue, settlements, and payout schedules — fast, clear, and reliable.
                                </p>
                            </div>

                            {isLoading || isFetching ? (
                                <div className="px-5 py-14 text-center text-[13px] font-medium text-[#8D8BA1]">Loading settlement details...</div>
                            ) : isError || !settlementId ? (
                                <div className="px-5 py-14 text-center text-[13px] font-medium text-[#8D8BA1]">
                                    Unable to fetch settlement details. Please try again.
                                </div>
                            ) : (
                                <>
                                    <div className="bg-[#10B981] px-4 py-2 text-center text-[10px] font-semibold tracking-[1px] text-white uppercase">
                                        ⦿ {statusLabel} on {formatStatusDate(statusDate)}
                                    </div>

                                    <div className="px-5 pb-5 pt-4">
                                        <div className="text-center">
                                            <p className="text-[11px] font-medium text-[#868399]">Net Amount Settled</p>
                                            <p className="mt-0.5 text-[44px] leading-none font-semibold text-[#2A2A36]">
                                                {formatINR(settlement?.netAmount)}
                                            </p>
                                        </div>

                                        <div className="mx-auto mt-4 w-full max-w-71.25 rounded-xl border border-[#ECEBF3] bg-white px-3.5 py-3">
                                            <div className="space-y-1.5 text-[11px]">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[#8C8AA0]">Gross Amount</p>
                                                    <p className="font-semibold text-[#262635]">{formatINR(settlement?.grossAmount)}</p>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <p className="text-[#8C8AA0]">Platform Fee</p>
                                                    <p className="font-semibold text-[#EF4444]">-{formatINR(settlement?.totalPlatformFee)}</p>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <p className="text-[#8C8AA0]">Total Refunded</p>
                                                    <p className="font-semibold text-[#EF4444]">-{formatINR(settlement?.totalRefunded)}</p>
                                                </div>
                                            </div>

                                            <div className="mt-2 border-t border-dashed border-[#E5E4EF] pt-2">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <p className="font-semibold text-[#5D5B71]">Total Payout</p>
                                                    <p className="font-semibold text-[#262635]">{formatINR(settlement?.netAmount)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mx-auto mt-5 w-full max-w-92.5">
                                            <p className="mb-2 text-[10px] font-semibold tracking-[1.2px] text-[#7F7C93] uppercase">Transfer Details</p>

                                            <div className="rounded-xl border border-[#ECEBF3] bg-white px-3.5 py-3">
                                                <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
                                                    <div>
                                                        <p className="text-[9px] font-semibold tracking-[0.8px] text-[#A2A0B2] uppercase">Bank Name</p>
                                                        <p className="mt-0.5 text-[11px] font-medium text-[#2B2B3A]">{transferDetails?.bankName || "—"}</p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[9px] font-semibold tracking-[0.8px] text-[#A2A0B2] uppercase">Account</p>
                                                        <p className="mt-0.5 text-[11px] font-medium text-[#2B2B3A]">{transferDetails?.accountNumber || "—"}</p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[9px] font-semibold tracking-[0.8px] text-[#A2A0B2] uppercase">IFSC</p>
                                                        <p className="mt-0.5 text-[11px] font-medium text-[#2B2B3A]">{transferDetails?.ifscCode || "—"}</p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[9px] font-semibold tracking-[0.8px] text-[#A2A0B2] uppercase">UPI ID</p>
                                                        <p className="mt-0.5 text-[11px] font-medium text-[#2B2B3A]">{transferDetails?.upiId || "—"}</p>
                                                    </div>

                                                    <div>
                                                        <p className="text-[9px] font-semibold tracking-[0.8px] text-[#A2A0B2] uppercase">Transaction Ref</p>
                                                        <p className="mt-0.5 text-[11px] font-medium text-[#2B2B3A]">{settlement?.transactionReference || "—"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mx-auto mt-4 w-full max-w-92.5">
                                            <p className="mb-2 text-[10px] font-semibold tracking-[1.2px] text-[#7F7C93] uppercase">
                                                Booking Breakdown ({bookingBreakdown.length})
                                            </p>

                                            <div className="space-y-2">
                                                {bookingBreakdown.length > 0 ? (
                                                    bookingBreakdown.map((item) => (
                                                        <article key={item.id || item.referenceCode} className="rounded-xl border border-[#ECEBF3] bg-white px-3.5 py-3">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="text-[13px] font-semibold text-[#2A2A36]">{item?.referenceCode || "—"}</p>
                                                                    <p className="mt-0.5 text-[10px] font-medium text-[#8D8BA1]">{item?.studioName || "Studio"} • {formatBookingDate(item?.bookingDate)}</p>
                                                                </div>

                                                                <div className="text-right">
                                                                    <p className="text-[14px] font-semibold text-[#2A2A36]">{formatINR(item?.settledAmount)}</p>
                                                                    <p className="text-[9px] font-semibold tracking-[0.8px] text-[#A2A0B2] uppercase">Net Total</p>
                                                                </div>
                                                            </div>

                                                            <div className="mt-2 grid grid-cols-3 gap-2 border-t border-dashed border-[#E5E4EF] pt-2">
                                                                <div>
                                                                    <p className="text-[9px] font-medium text-[#A09DB0]">Gross</p>
                                                                    <p className="mt-0.5 text-[10px] font-semibold text-[#5D5B71]">{formatINR(item?.grossAmount)}</p>
                                                                </div>

                                                                <div>
                                                                    <p className="text-[9px] font-medium text-[#A09DB0]">Fee</p>
                                                                    <p className="mt-0.5 text-[10px] font-semibold text-[#EF4444]">-{formatINR(item?.platformFee)}</p>
                                                                </div>

                                                                <div>
                                                                    <p className="text-[9px] font-medium text-[#A09DB0]">Refunds</p>
                                                                    <p className="mt-0.5 text-[10px] font-semibold text-[#EF4444]">
                                                                        {toNumber(item?.refundedAmount) > 0 ? `-${formatINR(item?.refundedAmount)}` : formatINR(0)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </article>
                                                    ))
                                                ) : (
                                                    <div className="rounded-xl border border-dashed border-[#d9d8e7] bg-[#fafafe] px-4 py-6 text-center text-[12px] font-medium text-[#8d8aa0]">
                                                        No booking line items found for this settlement.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <p className="mt-4 text-center text-[9px] font-semibold tracking-[1px] text-[#B0AEC0] uppercase">
                                            {footerTransferText}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            <div className="mx-auto mt-7 max-w-full px-0 sm:px-0">
                <Footer />
            </div>
        </section>
    );
};

export default SettlementsDetails;