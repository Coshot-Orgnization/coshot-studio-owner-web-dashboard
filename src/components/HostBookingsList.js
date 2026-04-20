import { formatAmount } from '@/helpers/formatAmount';
import { imageSrcHandler } from '@/helpers/imageSrcHandler'
import CancellationReasonModal from '@/modals/CancellationReasonModal';
import ReviewModal from '@/modals/ReviewModal';
import { useRefundStatusQuery } from '@/redux/bookings/bookingsApi';
import Link from 'next/link';
import React, { useState } from 'react'

const HostBookingsList = ({ booking, showBookingActions = false, onCancelBooking }) => {
    const [isCancellationReasonModalOpen, setIsCancellationReasonModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const bookingStatus = booking?.status?.toLowerCase?.();
    const isCancelledBooking = bookingStatus === 'cancelled' || bookingStatus === 'canceled';
    const { data: refundStatusData } = useRefundStatusQuery(booking?.id, {
        skip: !isCancellationReasonModalOpen,
    });

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
    const bookedStudio = booking?.studio;
    const studioDetailsHref = bookedStudio?.slug
        ? `/studio-details/${bookedStudio.slug}`
        : `/studio-details/${bookedStudio?.id || bookedStudio?._id || ""}`;

    const cancelBookingHandler = () => {
        onCancelBooking?.(booking);
    }

    return (
        <article className='overflow-hidden rounded-xl border border-[#E8E8E8] bg-[#EFF2FF]'>
            <div className='flex flex-col sm:flex-row gap-4 bg-white sm:max-h-47.5'>
                <div>
                    <img
                        src={booking?.studio?.images && imageSrcHandler(booking?.studio?.images[0]?.imagePath)}
                        alt={booking?.studio?.name}
                        className='h-47.5 w-full sm:w-41 object-cover'
                    />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2 justify-evenly p-3 sm:p-0 sm:mt-1">
                    <p className="truncate text-base font-medium text-[#1f1f2a] flex gap-2 items-center"><img src="/images/booking/studioName.png" className="h-4 w-4" /> {bookedStudio.name}</p>
                    <p className="text-sm text-[#2f2f3f] flex gap-2 items-center"><img src="/images/booking/calender.png" className="h-4 w-4" /> {formatBookingDate(booking.bookingDate)}</p>
                    <p className="text-sm text-[#2f2f3f] flex gap-2 items-center"><img src="/images/booking/clock.png" className="h-4 w-4" /> {booking.startTimeFormatted} - {booking.endTimeFormatted}</p>
                    <p className="text-sm text-[#2f2f3f] flex gap-2 items-center"><img src="/images/booking/duration.png" className="h-4 w-4" /> {booking.durationHours} hours</p>
                    <p className="text-sm text-[#2f2f3f] flex gap-2 items-center">💰 Earnings: ₹{formatAmount(booking.finalAmount)}</p>
                    <p className="text-sm text-[#2f2f3f] flex gap-2 items-center"><img src="/images/booking/bookingId.png" className="h-4 w-4" /> {booking?.referenceCode}</p>
                </div>
            </div>

            <div className='bg-[#D9E4FF] px-3 py-2 text-[10px] text-[#505050]'>
                <div className='flex items-start justify-between gap-2'>
                    <div className='grid justify-between'>
                        <span className='text-[12px] font-medium text-[#6D5EF6]'>Booked By:</span>
                        <div className='flex items-center mt-1'>
                            {booking?.user?.profileImage ? <img src={booking?.user?.profileImage && imageSrcHandler(booking?.user?.profileImage)} className='h-9 w-9 rounded-full' /> : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#5B4FEB] bg-gray-200">{booking?.guestName?.[0]?.toUpperCase() ?? "H"}</div>}
                            <div className='grid'>
                                <span className='text-[14px] font-semibold ml-2 capitalize'>{booking?.user?.name ?? booking?.guestName ?? "User"}</span>
                                <span className='text-[11px] font-normal ml-2 flex items-center gap-1 mt-0.5'><img src='/images/booking/phone.png' className='h-3 w-3 ' />{booking?.user?.phone ?? booking?.guestPhone}</span>
                            </div>
                        </div>
                    </div>
                    {bookingStatus === "confirmed" && (
                        <img
                            src='/images/navbar/Call.png'
                            className='h-9 w-9 cursor-pointer mt-2'
                            role='button'
                            onClick={() => {
                                const phone = booking?.user?.phone ?? booking?.guestPhone;
                                if (phone) {
                                    window.location.href = `tel:${phone}`;
                                }
                            }}
                            alt='Call guest'
                        />
                    )}
                </div>

                {showBookingActions && (
                    <div className='mt-3 flex flex-wrap items-center justify-end gap-2 sm:gap-3 pr-1 text-[10px] leading-none'>
                        <Link
                            href={studioDetailsHref}
                            className='text-[11px] font-medium text-[#6D5EF6] underline-offset-2 hover:underline'
                        >
                            View Studio Details
                        </Link>
                        <span className='text-[#9b9bb0]'>|</span>
                        {bookingStatus === "confirmed" ?
                            <button
                                type='button'
                                className='cursor-pointer text-[11px] font-medium text-[#FD6161] underline-offset-2 hover:underline'
                                onClick={() => cancelBookingHandler()}
                            >
                                Cancel Reservation
                            </button>
                            : isCancelledBooking ?
                                <button
                                    type='button'
                                    className='cursor-pointer text-[11px] font-medium text-[#F6B11C] underline-offset-2 hover:underline'
                                    onClick={() => setIsCancellationReasonModalOpen(true)}
                                >
                                    Show Cancellation Reason
                                </button>
                                :
                                <button
                                    type='button'
                                    className='cursor-pointer text-[11px] font-medium text-[#F6B11C] underline-offset-2 hover:underline'
                                    onClick={() => setIsReviewModalOpen(true)}
                                >
                                    View Review
                                </button>}
                    </div>
                )}
            </div>

            {isCancellationReasonModalOpen && (
                <CancellationReasonModal
                    booking={booking}
                    data={refundStatusData?.data}
                    onClose={() => setIsCancellationReasonModalOpen(false)}
                />
            )}

            {isReviewModalOpen && (
                <ReviewModal
                    booking={booking}
                    onClose={() => setIsReviewModalOpen(false)}
                />
            )}
        </article>
    )
}

export default HostBookingsList