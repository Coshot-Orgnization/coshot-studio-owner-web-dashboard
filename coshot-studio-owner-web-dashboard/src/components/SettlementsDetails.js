"use client";

import React from "react";
import { useParams } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useGetSettlementDetailsQuery } from "@/redux/settlements/settlementsApi";
import { formatAmount } from "@/helpers/formatAmount";

const toNumber = (value) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const formatINR = (value) => `₹${formatAmount(toNumber(value), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

                                        <div className="mx-auto mt-4 w-full max-w-80 rounded-xl border border-[#ECEBF3] bg-white px-3.5 py-3">
                                            <div className="space-y-1.5 text-[11px]">
                                                <p className="text-[#64748B]">SETTLEMENT BREAKDOWN </p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className="text-[#8C8AA0]">Gross Amount</p>
                                                    <p className="font-semibold text-[#262635]">{formatINR(settlement?.grossAmount)}</p>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <p className="text-[#8C8AA0]">Refunds</p>
                                                    <p className="font-semibold text-[#EF4444]">-{formatINR(settlement?.totalRefunded)}</p>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <p className="text-[#8C8AA0]">Commission ({toNumber(settlement?.commissionPercent)}%)</p>
                                                    <p className="font-semibold text-[#EF4444]">-{formatINR(settlement?.commissionAmount)}</p>
                                                </div>
                                                <hr className="border-dashed text-[#8C8AA0]" />
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[#8C8AA0]">Net Amount</p>
                                                    <p className="font-semibold text-[#262635]">{formatINR(settlement?.netAmount)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 justify-center mt-5">
                                            {settlement?.operationalCount > 0 && <div className="w-full text-center">
                                                <p className="text-[#64748B]">Operational Count:- {settlement?.operationalCount}</p>
                                                {settlement?.lineItems?.operational?.map((item, index) => {
                                                    return (
                                                        <div className="mx-auto mt-4 w-full max-w-80 rounded-xl border border-[#ECEBF3] bg-white px-3.5 py-3" key={index}>
                                                            <div className="space-y-1.5 text-[11px]">
                                                                <p className="text-[#64748B] text-[16px]">{item?.studioName}</p>
                                                                <div className="flex items-center justify-between mt-1">
                                                                    <p className="text-[#8C8AA0]">Gross Amount</p>
                                                                    <p className="font-semibold text-[#262635]">{formatINR(item?.grossAmount)}</p>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[#8C8AA0]">Refunds</p>
                                                                    <p className="font-semibold text-[#EF4444]">-{formatINR(item?.totalRefunded)}</p>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[#8C8AA0]">Commission</p>
                                                                    <p className="font-semibold text-[#EF4444]">-{formatINR(item?.commission)}</p>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[#8C8AA0]">Settled Amount</p>
                                                                    <p className="font-semibold text-[#262635]">{formatINR(item?.settledAmount)}</p>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[#8C8AA0]">Completed At</p>
                                                                    <p className="font-semibold text-[#262635]">{formatBookingDate(item?.completedAt)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            }
                                            {settlement?.cancellationCount > 0 && <div className="w-full text-center">
                                                <p className="text-[#64748B]">Cancellation Count:- {settlement?.cancellationCount}</p>
                                                {settlement?.lineItems?.cancellation?.map((item, index) => {
                                                    return (
                                                        <div className="mx-auto mt-4 w-full max-w-80 rounded-xl border border-[#ECEBF3] bg-white px-3.5 py-3" key={index}>
                                                            <div className="space-y-1.5 text-[11px]">
                                                                <p className="text-[#64748B] text-[16px]">{item?.studioName}</p>
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[#8C8AA0]">Booked At</p>
                                                                    <p className="font-semibold text-[#262635]">{formatBookingDate(item?.bookingDate)}</p>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[#8C8AA0]">Cancelled At</p>
                                                                    <p className="font-semibold text-[#262635]">{formatBookingDate(item?.cancelledAt)}</p>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[#8C8AA0]">Owner Share</p>
                                                                    <p className="font-semibold text-[#262635]">{formatINR(item?.studioOwnerAmount)}</p>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[#8C8AA0]">Policy Title</p>
                                                                    <p className="font-semibold text-[#262635]">{item?.policyTitle}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>}
                                        </div>

                                        <div className="mx-auto mt-5 w-full max-w-80">
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