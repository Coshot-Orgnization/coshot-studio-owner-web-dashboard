import React from 'react';
import useBodyScrollLock from "@/hooks/useBodyScrollLock";

const ReviewModal = ({ booking, onClose }) => {
    useBodyScrollLock(Boolean(booking));

    if (!booking) return null;

    const rating = booking?.review?.rating ?? 0;
    const reviewText = booking?.review?.comment ?? "No written feedback provided.";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#262424a6] px-4 py-8">
            <div className="relative w-full max-w-110 rounded-[20px] bg-white p-5 shadow-[0_20px_40px_rgba(16,27,84,0.35)] sm:p-6">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-3 text-2xl leading-none text-[#6f64ef] hover:opacity-80 cursor-pointer"
                    aria-label="Close review modal"
                >
                    ×
                </button>

                <h3 className="text-xl font-semibold text-[#2b2b3f]">Guest Experience</h3>
                <p className="mt-1 text-sm font-semibold text-[#5d52e7]">Review shared by {booking?.user?.name || booking?.guestName || "User"}</p>

                <p className="mt-4 text-sm font-semibold text-[#242438]">Ratings</p>
                <div className="mt-2 flex items-center justify-center gap-1 text-3xl leading-none">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <span key={index} className={index < rating ? "text-[#f4b25a]" : "text-[#cfd1dc]"}>
                            ★
                        </span>
                    ))}
                </div>

                <p className="mt-7 text-sm font-semibold text-[#242438]">Comment</p>
                <p className="mt-1 text-sm leading-5 text-[#3f3f52] italic wrap-break-word">"{reviewText}"</p>

                <div className="mt-6 flex flex-col items-center gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 min-w-40 rounded-full bg-linear-to-r from-[#2f4cc3] to-[#6d5ef6] px-6 text-base font-semibold text-white shadow-[0_10px_22px_rgba(73,87,230,0.3)] cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
