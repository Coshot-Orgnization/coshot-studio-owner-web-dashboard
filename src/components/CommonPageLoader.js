import React from "react";

const CommonPageLoader = () => {
    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                {/* Lightweight CSS Spinner */}
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6d5ef6] border-t-transparent"></div>
                <p className="text-sm font-medium text-[#6d5ef6] animate-pulse">Loading Coshot...</p>
            </div>
        </div>
    );
};

export default CommonPageLoader;
