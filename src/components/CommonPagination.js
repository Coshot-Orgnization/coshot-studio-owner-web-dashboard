"use client";

import React from "react";

const CommonPagination = ({
    currentPage = 1,
    totalPages = 1,
    hasNext,
    hasPrevious,
    onPageChange,
    className = "",
}) => {
    const safeCurrentPage = Math.max(1, Number(currentPage) || 1);
    const safeTotalPages = Math.max(1, Number(totalPages) || 1);
    const canGoPrevious = typeof hasPrevious === "boolean" ? hasPrevious : safeCurrentPage > 1;
    const canGoNext = typeof hasNext === "boolean" ? hasNext : safeCurrentPage < safeTotalPages;

    if (hasNext !== true) {
        return null;
    }

    const handlePageChange = (page) => {
        if (!onPageChange) return;
        if (page < 1 || page > safeTotalPages || page === safeCurrentPage) return;
        onPageChange(page);
    };

    const getVisiblePages = () => {
        const pages = [];

        if (safeTotalPages <= 7) {
            for (let page = 1; page <= safeTotalPages; page += 1) {
                pages.push(page);
            }
            return pages;
        }

        pages.push(1);

        if (safeCurrentPage > 3) {
            pages.push("start-ellipsis");
        }

        const middleStart = Math.max(2, safeCurrentPage - 1);
        const middleEnd = Math.min(safeTotalPages - 1, safeCurrentPage + 1);

        for (let page = middleStart; page <= middleEnd; page += 1) {
            pages.push(page);
        }

        if (safeCurrentPage < safeTotalPages - 2) {
            pages.push("end-ellipsis");
        }

        pages.push(safeTotalPages);

        return pages;
    };

    const visiblePages = getVisiblePages();

    return (
        <div className={`mt-7 flex flex-wrap items-center justify-center gap-2 ${className}`}>
            <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                disabled={!canGoPrevious}
                className="h-9 rounded-full border border-[#dcdcf0] bg-white px-4 text-xs sm:text-sm font-semibold text-[#585572] transition enabled:cursor-pointer enabled:hover:border-[#6257eb] enabled:hover:text-[#6257eb] disabled:cursor-not-allowed disabled:opacity-45"
            >
                Prev
            </button>

            {visiblePages.map((page, index) => {
                if (typeof page !== "number") {
                    return (
                        <span
                            key={`${page}-${index}`}
                            className="px-2 text-sm font-semibold text-[#9a98ad]"
                        >
                            ...
                        </span>
                    );
                }

                const isActive = page === safeCurrentPage;

                return (
                    <button
                        key={page}
                        type="button"
                        onClick={() => handlePageChange(page)}
                        className={`h-9 min-w-9 rounded-full px-3 text-xs sm:text-sm font-semibold transition cursor-pointer ${isActive
                            ? "bg-linear-to-r from-[#2f4cc3] to-[#6d5ef6] text-white shadow-[0_8px_20px_rgba(102,93,245,0.35)]"
                            : "border border-[#dcdcf0] bg-white text-[#585572] hover:border-[#6257eb] hover:text-[#6257eb]"
                            }`}
                    >
                        {page}
                    </button>
                );
            })}

            <button
                type="button"
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                disabled={!canGoNext}
                className="h-9 rounded-full border border-[#dcdcf0] bg-white px-4 text-xs sm:text-sm font-semibold text-[#585572] transition enabled:cursor-pointer enabled:hover:border-[#6257eb] enabled:hover:text-[#6257eb] disabled:cursor-not-allowed disabled:opacity-45"
            >
                Next
            </button>
        </div>
    );
};

export default CommonPagination;
