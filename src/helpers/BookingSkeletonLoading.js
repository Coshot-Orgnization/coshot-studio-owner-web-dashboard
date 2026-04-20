import React from 'react'

const BookingSkeletonLoading = ({ isPastBooking }) => (
    <div
        className={`animate-pulse rounded-2xl border border-[#ececf4] bg-[#fafafe] p-5 ${isPastBooking ? "w-full" : "w-full"}`}
    >
        <div className="h-4 w-1/3 rounded bg-[#e5e7f5]" />
        <div className="mt-4 h-3 w-2/3 rounded bg-[#eceefd]" />
        <div className="mt-3 h-3 w-1/2 rounded bg-[#eceefd]" />
        <div className="mt-6 h-9 w-28 rounded-full bg-[#e1e4fb]" />
    </div>
);

export default BookingSkeletonLoading