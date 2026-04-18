import React from "react";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";
import { useRouter } from "next/navigation";

const StudioSubmitModal = ({ onShow, onClose }) => {
    useBodyScrollLock(Boolean(onShow));
    const router = useRouter();

    const onCloseHandler = () => {
        router.push('/add-studio')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#262424a6] px-4 py-8">
            <div className="relative w-full max-w-125 h-105 text-center flex flex-col justify-center rounded-[20px] bg-white p-5 shadow-[0_20px_40px_rgba(16,27,84,0.35)] sm:p-6">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-3 text-3xl leading-none text-[#6f64ef] hover:opacity-80 cursor-pointer"
                    aria-label="Close your review modal"
                >
                    ×
                </button>

                <div className="mx-auto flex h-20 w-20 items-center justify-center">
                    <img src="/images/navbar/paymentSuccuss.png" />
                </div>

                <h3 className="text-[22px] sm:text-[24px] font-bold text-[#313131] mt-5">Studio Submitted for Review</h3>
                <p className="text-[14px] sm:text-[16px] font-medium text-[#313131]">Thank you for sharing your studio details. The CoShot team will review your information and notify you via email and WhatsApp once your studio is approved.</p>

                <div className="mt-6 flex flex-col items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onCloseHandler()}
                        className="h-11 min-w-60 rounded-full bg-linear-to-r from-[#1E3A8A] to-[#6D5EF6]  px-6 text-base font-semibold text-white shadow-[0_10px_22px_rgba(73,87,230,0.3)] cursor-pointer"
                    >
                        Add More Studio
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudioSubmitModal;
