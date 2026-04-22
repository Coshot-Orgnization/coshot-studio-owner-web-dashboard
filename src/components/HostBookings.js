"use client";
import React, { useState, useEffect } from 'react'
import { useCancelBookingByOwnerMutation, useStudioOwnerBookingListQuery } from '@/redux/studio-owner/studioOwnerApi'
import Navbar from './Navbar';
import BookingSkeletonLoading from '@/helpers/BookingSkeletonLoading';
import Footer from './Footer';
import HostBookingsList from './HostBookingsList';
import CancelBookingModal from '@/modals/CancelBookingModal';
import { showErrorToast, showSuccessToast } from '@/helpers/toast';
import ReusableCalendarInput from './ReusableCalendarInput';
import CommonPagination from './CommonPagination';
import { getPaginationFromResponse } from '@/helpers/pagination';
import { getTodayIsoLocal } from '@/helpers/formatDate';
import NoData from './NoData';

const BOOKING_TABS = [
    { label: "Future Bookings", value: "future", status: "confirmed" },
    { label: "Past Bookings", value: "past", status: "completed" },
    { label: "Cancelled Bookings", value: "cancelled", status: "cancelled" },
];

const HostBookings = ({ withTabs = true, status, date, embedded = false, title = "Manage Bookings", showBookingActions = false }) => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const DEFAULT_PAGE = 1;
    const DEFAULT_LIMIT = 10;
    const [activeTab, setActiveTab] = useState(BOOKING_TABS[0].value);
    const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
    const [selectedDates, setSelectedDates] = useState([]);
    const [dateInputValue, setDateInputValue] = useState("");
    const [showDateControls, setShowDateControls] = useState(false);
    const [cancelBookingByOwner] = useCancelBookingByOwnerMutation();

    const selectedStatus = withTabs
        ? BOOKING_TABS.find((tab) => tab.value === activeTab)?.status
        : status;

    const firstSelectedDate = selectedDates[0] || "";
    const secondSelectedDate = selectedDates[1] || "";
    const hasDateRange = Boolean(firstSelectedDate && secondSelectedDate && firstSelectedDate !== secondSelectedDate);

    const getSortedDateRange = (firstDate, secondDate) => {
        if (!firstDate || !secondDate) return { from: "", to: "" };
        if (new Date(firstDate).getTime() <= new Date(secondDate).getTime()) {
            return { from: firstDate, to: secondDate };
        }
        return { from: secondDate, to: firstDate };
    };

    const bookingListParams = {
        page: currentPage,
        limit: DEFAULT_LIMIT,
        status: selectedStatus,
    };

    if (hasDateRange) {
        const { from, to } = getSortedDateRange(firstSelectedDate, secondSelectedDate);
        bookingListParams.from = from;
        bookingListParams.to = to;
    } else if (firstSelectedDate || secondSelectedDate) {
        bookingListParams.date = firstSelectedDate || secondSelectedDate;
    } else if (date) {
        bookingListParams.date = date;
    }

    const { data: bookingList, isLoading, refetch } = useStudioOwnerBookingListQuery(bookingListParams);
    const pagination = getPaginationFromResponse(bookingList, DEFAULT_LIMIT);

    const [selectedBooking, setSelectedBooking] = useState(null);

    const bookings = bookingList?.data?.data ?? [];
    const formatFilterDate = (value) => {
        if (!value) return "";
        const parsedDate = new Date(value);
        if (Number.isNaN(parsedDate.getTime())) return "";

        return parsedDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
        });
    };

    const dateFilterLabel = (() => {
        const startLabel = formatFilterDate(firstSelectedDate);
        const endLabel = formatFilterDate(secondSelectedDate);

        if (startLabel && endLabel && firstSelectedDate !== secondSelectedDate) {
            const { from, to } = getSortedDateRange(firstSelectedDate, secondSelectedDate);
            return `${formatFilterDate(from)} - ${formatFilterDate(to)}`;
        }

        if (startLabel) return startLabel;
        if (endLabel) return endLabel;
        return "1 Jan - 20 Feb";
    })();

    const handleDateSelection = (value) => {
        if (!value) return;

        setSelectedDates((prev) => {
            if (prev.length === 0) return [value];
            if (prev.length === 1) return [prev[0], value];
            return [value];
        });

        setDateInputValue("");
    };

    const renderBookingsContent = () => {
        if (isLoading) {
            return (
                <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <BookingSkeletonLoading key={index} />
                    ))}
                </div>
            );
        }

        if (bookings.length === 0) {
            return (
                <NoData
                    page="default"
                    title="No bookings found"
                    description="There are no bookings for the selected filters. Try changing date range."
                />
            );
        }

        return (
            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {bookings.map((booking, index) => (
                    <HostBookingsList
                        key={booking?.id || `${booking?.name || booking?.studioName || "booking"}-${index}`}
                        booking={booking}
                        showBookingActions={showBookingActions}
                        onCancelBooking={() => setSelectedBooking(booking)}
                    />
                ))}
            </div>
        );
    };

    const cancelBookingHandler = async (booking, cancellationReason) => {
        const res = await cancelBookingByOwner({
            id: booking.id,
            cancellationReason
        })

        if (res?.data) {
            refetch();
            showSuccessToast(res?.data?.message || "Booking Cancelled")
            setSelectedBooking(null);
        } else {
            showErrorToast(res?.error?.data?.message || "Something went wrong")
        }
    };

    if (embedded) {
        return (
            <>
                {renderBookingsContent()}
                {!isLoading && bookings.length > 0 && (
                    <CommonPagination
                        currentPage={currentPage}
                        totalPages={pagination.totalPages}
                        hasNext={pagination.hasNext}
                        hasPrevious={pagination.hasPrevious}
                        onPageChange={setCurrentPage}
                    />
                )}
                {selectedBooking && (
                    <CancelBookingModal
                        booking={selectedBooking}
                        onClose={() => setSelectedBooking(null)}
                        onConfirm={(reason) => cancelBookingHandler(selectedBooking, reason)}
                    />
                )}
            </>
        );
    }

    return (
        <section className="w-full pt-15 ">
            <div className="relative mx-auto flex w-full max-w-330 flex-col gap-2 px-4 lg:flex-row lg:items-start lg:gap-8 lg:px-6">
                <div className="hidden lg:block">
                    <Navbar />
                </div>
                <section className="w-full overflow-hidden rounded-3xl border border-[#e8e8ef] bg-white shadow-[0_10px_36px_rgba(42,48,82,0.08)] lg:w-221">
                    <div className="px-4 pb-7 pt-5 sm:px-6 sm:pb-8 sm:pt-6 md:px-10 md:pb-10 md:pt-7">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-xl font-semibold text-[#6257eb]">{title}</h2>
                            <div className="block lg:hidden">
                                <Navbar />
                            </div>
                            {withTabs && (
                                <div className="flex w-full lg:w-xl rounded-full bg-[#f0f0f6] p-1">
                                    {BOOKING_TABS.map((tab) => {
                                        const isActive = tab.value === activeTab;
                                        return (
                                            <button
                                                key={tab.value}
                                                type="button"
                                                onClick={() => {
                                                    setActiveTab(tab.value);
                                                    setCurrentPage(DEFAULT_PAGE);
                                                }}
                                                className={`h-10 flex-1 sm:min-w-36 rounded-full px-3 sm:px-5 text-xs sm:text-sm font-semibold transition cursor-pointer ${isActive
                                                    ? "bg-linear-to-r from-[#2f4cc3] to-[#6d5ef6] text-white shadow-[0_8px_20px_rgba(102,93,245,0.35)] bg-[linear-gradient(95.53deg,#1E3A8A_0%,#6D5EF6_40%,#1E3A8A_100%)] bg-size-[300%_100%] transition-all duration-500 ease-in-out hover:bg-position-[100%_0]"
                                                    : "text-[#69677f]"
                                                    }`}
                                            >
                                                <span className="hidden sm:inline">{tab.label}</span>
                                                <span className="inline sm:hidden">
                                                    {tab.label.replace(/Bookings/gi, "").trim()}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="mt-5 border-t border-dashed border-[#e3e2ec]" />

                        <div className="mt-5 flex flex-col items-center gap-3">
                            <div className="flex items-center gap-4 text-[13px]">
                                <span className="font-semibold text-[#4f4d67]">Filter by date</span>
                                <button
                                    type="button"
                                    onClick={() => setShowDateControls((prev) => !prev)}
                                    className="flex h-10 items-center gap-2 rounded-full border border-[#e2e2eb] bg-[#fcfcff] px-4 text-[13px] font-medium text-[#66637c] cursor-pointer"
                                >
                                    <img src="/images/navbar/bookings.png" alt="Calendar" className="h-4 w-4" />
                                    <span>{dateFilterLabel}</span>
                                </button>
                            </div>

                            {showDateControls && (
                                <div className="flex flex-wrap flex-col items-center justify-center gap-2 text-xs sm:text-sm">
                                    <div className='flex gap-3'>
                                        <ReusableCalendarInput
                                            value={dateInputValue}
                                            onChange={(value) => {
                                                setDateInputValue(value);
                                                handleDateSelection(value);
                                                setCurrentPage(DEFAULT_PAGE);
                                            }}
                                            allowClear={false}
                                            triggerClassName="h-9 rounded-full border border-[#dddceb] px-3 text-[#4f4d67] outline-none bg-white shadow-none"
                                            textClassName="text-[#4f4d67]"
                                            minDate={bookings?.status === "confirmed" ? (isMounted ? getTodayIsoLocal() : "") : undefined}
                                            maxDate={bookings?.status === "confirmed" ? undefined : (isMounted ? getTodayIsoLocal() : "")}
                                        />
                                        <ReusableCalendarInput
                                            value={dateInputValue}
                                            onChange={(value) => {
                                                setDateInputValue(value);
                                                handleDateSelection(value);
                                                setCurrentPage(DEFAULT_PAGE);
                                            }}
                                            allowClear={false}
                                            triggerClassName="h-9 rounded-full border border-[#dddceb] px-3 text-[#4f4d67] outline-none bg-white shadow-none"
                                            textClassName="text-[#4f4d67]"
                                            maxDate={isMounted ? getTodayIsoLocal() : ""}
                                        />
                                    </div>
                                    {!!selectedDates.length && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedDates([]);
                                                setDateInputValue("");
                                                setCurrentPage(DEFAULT_PAGE);
                                            }}
                                            className="h-9 rounded-full border border-[#e3e2ec] px-3 text-[#6d5ef6] cursor-pointer"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {renderBookingsContent()}
                        {!isLoading && bookings.length > 0 && (
                            <CommonPagination
                                currentPage={currentPage}
                                totalPages={pagination.totalPages}
                                hasNext={pagination.hasNext}
                                hasPrevious={pagination.hasPrevious}
                                onPageChange={setCurrentPage}
                            />
                        )}
                    </div>
                </section>
            </div>
            <div className="px-0 sm:px-0 max-w-full mx-auto mt-7">
                <Footer />
            </div>

            {selectedBooking && (
                <CancelBookingModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    onConfirm={(reason) => cancelBookingHandler(selectedBooking, reason)}
                />
            )}
        </section>
    )
}

export default HostBookings