import { imageSrcHandler } from "@/helpers/imageSrcHandler";
import React from "react";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";

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

const CancelBookingModal = ({ booking, onClose, onConfirm }) => {
    useBodyScrollLock(Boolean(booking));

    if (!booking) return null;

    const [showReasonForm, setShowReasonForm] = React.useState(false);
    const [reason, setReason] = React.useState("");

    const bookingCode = booking?.referenceCode;
    const bookedStudio = booking?.studio

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#262424a6] px-4 pt-6">
            <div className="relative w-full max-w-170 rounded-[22px] bg-white p-5 shadow-[0_22px_48px_rgba(12,18,54,0.35)] sm:p-6">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-3 text-2xl leading-none text-[#6f64ef] hover:opacity-80 cursor-pointer"
                    aria-label="Close cancel booking modal"
                >
                    ×
                </button>

                <h3 className="text-[22px] font-semibold leading-7 text-[#2b2b3f]">Cancel Booking</h3>
                <p className="mt-1 text-sm font-semibold text-[#5d52e7]">
                    Are you sure you want to cancel this booking?
                </p>

                <div className="mt-4 rounded-2xl bg-[#f4f4f7] p-3 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <img
                            src={bookedStudio.images && imageSrcHandler(bookedStudio.images[0]?.imagePath)}
                            alt={bookedStudio.name}
                            className="h-28 w-full rounded-xl object-cover sm:w-44"
                        />

                        <div className="space-y-2 text-[#2f2f3f]">
                            <p className="text-base font-semibold flex items-center gap-2">
                                <img src="/images/bookings/studioName.png" className="h-4 w-4" />
                                {bookedStudio.name}
                            </p>
                            <p className="text-sm flex items-center gap-2">
                                <img src="/images/bookings/calender.png" className="h-4 w-4" />
                                {formatBookingDate(booking.bookingDate)}
                            </p>
                            <p className="text-sm flex items-center gap-2">
                                <img src="/images/bookings/clock.png" className="h-4 w-4" />
                                {booking.startTimeFormatted} - {booking.endTimeFormatted}
                            </p>
                            <p className="text-sm flex items-center gap-2">
                                <img src="/images/bookings/duration.png" className="h-4 w-4" />
                                {booking.durationHours} hour
                            </p>
                            <p className="text-sm font-medium flex items-center gap-2">
                                <img src="/images/bookings/bookingId.png" className="h-4 w-4" />
                                {bookingCode}
                            </p>
                        </div>
                    </div>
                </div>

                {!showReasonForm ? (
                    <>
                        <div className="mt-4 text-[#2b2b3f]">
                            <h4 className="text-base font-semibold">💳 Refund Information</h4>
                            <ul className="mt-2 list-disc pl-5 text-sm leading-6 text-[#4b4b62]">
                                <li>Cancellation before 24 hours → 80% refund</li>
                                <li>Cancellation within 24 hours → No refund</li>
                            </ul>
                            <p className="mt-3 text-sm italic text-[#5b5b70]">
                                Refund will be processed to your original payment method within 5–7 business days.
                            </p>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <button
                                type="button"
                                onClick={() => setShowReasonForm(true)}
                                className="h-11 min-w-52 rounded-full bg-linear-to-r from-[#ff6f70] to-[#e9333c] px-6 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(235,61,71,0.3)] cursor-pointer"
                            >
                                Confirm Cancellation
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-11 min-w-44 rounded-full bg-linear-to-r from-[#2f4cc3] to-[#6d5ef6] px-6 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(73,87,230,0.3)] cursor-pointer"
                            >
                                Keep Booking
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mt-4 text-[#2b2b3f]">
                            <p className="text-sm font-semibold text-[#6D5EF6]">
                                Please share the reason for cancelling this booking. This helps us improve our service and support you better.
                            </p>

                            <h4 className="mt-5 text-[17px] font-semibold">Reason for Cancellation</h4>

                            <textarea
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                placeholder='“Please briefly explain why you are cancelling this booking…“ (Example: Change in schedule, pricing concern, personal emergency, etc.)'
                                className="mt-3 h-36 w-full resize-none rounded-2xl border border-[#d8d8df] px-4 py-3 text-sm text-[#2f2f3f] outline-none placeholder:text-[#b0b0bd]"
                            />

                            <p className="mt-4 text-sm italic text-[#4b4b62]">
                                Your feedback will be reviewed by our team. Refund eligibility will be based on the cancellation policy.
                            </p>
                        </div>

                        <div className="mt-6 flex flex-col items-center gap-3">
                            <button
                                type="button"
                                onClick={() => onConfirm?.(reason.trim() || "Change of plans")}
                                className="h-11 min-w-52 rounded-full bg-linear-to-r from-[#2f4cc3] to-[#6d5ef6] px-10 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(73,87,230,0.3)] cursor-pointer"
                            >
                                Submit
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowReasonForm(false)}
                                className="text-md font-medium text-[#b0b0bd] cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CancelBookingModal;