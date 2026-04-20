import React from "react";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";
import { useStudioOwnerRefundStatusQuery } from "@/redux/studio-owner/studioOwnerApi";
import { useRefundStatusQuery } from "@/redux/bookings/bookingsApi";

const formatBookingDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const CancellationReasonModal = ({ booking, onClose }) => {
    const activeRole = typeof window !== "undefined" ? localStorage.getItem("activeRole") : null;
    const isHost = activeRole === "studio_owner";

    useBodyScrollLock(Boolean(booking));

    const { data: hostRefundData } = useStudioOwnerRefundStatusQuery(booking?.id, {
        skip: !booking?.id || !isHost,
    });
    const { data: userRefundData } = useRefundStatusQuery(booking?.id, {
        skip: !booking?.id || isHost,
    });

    if (!booking) return null;
    const refundData = isHost ? hostRefundData : userRefundData;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#262424a6] px-4 pt-6">
            <div className="relative w-full max-w-140 rounded-[22px] bg-white shadow-[0_22px_48px_rgba(12,18,54,0.35)]">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-3 text-2xl leading-none text-[#6f64ef] hover:opacity-80 cursor-pointer"
                    aria-label="Close cancellation reason modal"
                >
                    ×
                </button>

                <h3 className="text-[22px] font-semibold leading-7 p-5 sm:px-6 pb-2 text-[#2b2b3f]">Cancellation & Refund Status</h3>

                <div className="text-[#2b2b3f] px-5 sm:px-6">
                    <div className="mt-4 flex flex-col sm:flex-row justify-between gap-1 text-sm text-[#4b4b62] pr-4">
                        <p>
                            <span className="font-semibold text-[#2f2f3f]">Cancelled on:</span>{" "}
                            <span className="font-medium text-[#6D5EF6]">{formatBookingDate(refundData?.data?.cancelledAt)} </span>
                        </p>

                        <p>
                            <span className="font-semibold text-[#2f2f3f]">Cancelled by:</span>{" "}
                            <span className="font-medium text-[#6D5EF6] capitalize">{refundData?.data?.cancelledBy === "studio_owner" ? "Host" : refundData?.data?.cancelledBy} </span>
                        </p>
                    </div>

                    <h4 className="text-base font-semibold mt-4">Reason Provided</h4>
                    <div className=" rounded-xl py-2 text-sm text-[#4b4b62] wrap-break-word">
                        {refundData?.data?.cancellationReason || "Change of plans"}
                    </div>
                </div>

                <div className="text-[#2b2b3f] bg-[#EBE9FF] px-4 py-2 sm:px-6 sm:py-2">
                    <div className=" flex justify-between gap-1 text-sm text-[#4b4b62] pr-4">
                        <div>
                            <h4 className="text-[#2b2b3f] font-semibold mt-1">Refund Status</h4>
                            <div className=" rounded-xl py-1 text-md text-[#6D5EF6] font-semibold capitalize">
                                {refundData?.data?.refund?.status}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-[#2b2b3f] font-semibold mt-1">Refund Amount</h4>
                            <div className=" rounded-xl py-1 text-md text-[#6D5EF6] font-semibold capitalize">
                                {refundData?.data?.refund?.amount}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="my-6 flex justify-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 min-w-35 rounded-full bg-linear-to-r from-[#2f4cc3] to-[#6d5ef6] px-6 text-lg font-semibold text-white shadow-[0_10px_22px_rgba(73,87,230,0.3)] cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CancellationReasonModal;