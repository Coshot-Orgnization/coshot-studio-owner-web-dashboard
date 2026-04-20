import React from "react";

const RejectedModal = ({ studio, setShowRejectionModal }) => {

    return (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-[#242528b3] px-4">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full relative">
                <button
                    onClick={() => setShowRejectionModal(false)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
                >
                    &times;
                </button>
                <h2 className="text-xl font-semibold mb-4">Studio Verification Not Approved</h2>
                <p className="text-gray-700 mb-4">
                    Your studio profile needs a few corrections before approval. Please review
                    the feedback below and resubmit your information.
                </p>
                <h3 className="text-lg font-semibold mb-2">Reason for Rejection:</h3>
                <p className="text-gray-700 mb-6">
                    {studio?.rejectionReason}
                </p>
                <div className="flex flex-col items-center space-y-3">
                    <button onClick={() => setShowRejectionModal(false)} className="h-12 w-sm rounded-full bg-linear-to-r from-[#2849b3] to-[#6558e8] text-md font-semibold text-white shadow-lg transition hover:opacity-95 cursor-pointer">
                        Edit & Resubmit
                    </button>
                    <button
                        onClick={() => setShowRejectionModal(false)}
                        className="text-gray-600 py-2 px-4 rounded-md hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectedModal;
