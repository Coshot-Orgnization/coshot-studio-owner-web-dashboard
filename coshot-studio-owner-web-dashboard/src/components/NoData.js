import React from "react";

const PAGE_MESSAGES = {
    studioList: {
        title: "No studios found",
        description: "We couldn’t find studios for your selected filters. Try changing location, category, or price.",
    },
    hostDashboard: {
        title: "No studios yet",
        description: "You haven’t added any studios yet. Add your first studio to start receiving bookings.",
    },
    hostStudios: {
        title: "No studios found",
        description: "Your added studios will appear here once they are created.",
    },
    wishlist: {
        title: "Your wishlist is empty",
        description: "Save your favorite studios to quickly find and book them later.",
    },
    default: {
        title: "No data available",
        description: "There is nothing to show right now.",
    },
};

const NoData = ({
    page = "default",
    title,
    description,
    actionLabel,
    onAction,
    className = "",
}) => {
    const pageMessage = PAGE_MESSAGES[page] || PAGE_MESSAGES.default;
    const resolvedTitle = title || pageMessage.title;
    const resolvedDescription = description || pageMessage.description;

    return (
        <div className={`mt-8 rounded-2xl min-h-[20vh] border border-dashed border-[#d8d8e5] bg-[#fafafe] px-6 py-10 text-center ${className}`}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eceafd] text-xl">
                📭
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-[#4f4b6b]">{resolvedTitle}</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[#6d6a83]">{resolvedDescription}</p>

            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-5 h-10 rounded-full bg-linear-to-r from-[#2f4cc3] to-[#6d5ef6] px-6 text-sm font-medium text-white cursor-pointer"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default NoData;