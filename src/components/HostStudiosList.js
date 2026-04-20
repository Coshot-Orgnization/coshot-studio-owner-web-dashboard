"use client";
import { imageSrcHandler } from '@/helpers/imageSrcHandler'
import OfflineBookingModal from '@/modals/OfflineBookingModal';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'

const HostStudiosList = ({ studio, formatDate }) => {

    const isLive = (studio?.status || "").toLowerCase() === "verified" || (studio?.status || "").toLowerCase() === "published";
    const createdOn = typeof formatDate === "function" ? formatDate(studio?.createdAt) : "DD-MM-YYYY";
    const router = useRouter();
    const [openOfflineBookingModal, setOpenOfflineBookingModal] = useState(false);

    return (
        <>
            <article className='overflow-hidden rounded-xl border border-[#E8E8E8] bg-[#EFF2FF] cursor-pointer' onClick={() => router?.push(`/studio-details/${studio?.id}`)}>
                <div className='flex flex-col sm:flex-row gap-3 bg-white sm:max-h-42'>
                    <div className="relative">
                        <img
                            src={studio?.coverImage ? imageSrcHandler(studio?.coverImage) : "/images/booking/imagePlaceholder.jpg"}
                            alt={studio?.name}
                            className='h-42 w-full sm:w-41 object-cover'
                        />
                        <span className={`text-[14px] absolute bottom-0 left-0 p-2 px-5 font-medium bg-[#DBEAFE]/75 rounded-tr-[50px] ${isLive ? "text-[#4D79FF]" : "text-[#8B6CFF]"}`}>
                            {isLive ? "Live" : studio?.status === "pending_approval" ? "Pending Approval" : "Draft"}
                        </span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-3 justify-between p-3 sm:p-0 sm:mt-1">
                        <div>
                            <p className="truncate text-[14px] font-semibold text-[#1f1f2a] flex gap-2 items-center"><img src="/images/booking/studioName.png" className="h-4 w-4" /> {studio.name}</p>
                            <p className="leading-snug text-[14px] flex items-start gap-2 mt-2 text-[#505050]"><img src="/images/booking/location.png" className="h-4 w-3 mt-0.5 shrink-0" /> <span className="line-clamp-2">{studio?.location?.addressLine1}, {studio?.location?.addressLine2}, {studio?.location?.city}</span></p>
                        </div>
                        <span className='text-[12px] font-semibold text-[#6d6d6d] sm:mb-2'>Added on : {createdOn}</span>
                    </div>
                </div>


                <div className='flex flex-wrap items-center justify-between min-h-13 bg-[#D9E4FF] gap-2 px-3 py-2 text-[10px] text-[#505050]'>
                    {isLive && (
                        <>
                            <span className='text-[11px] sm:text-[12px] font-medium'>⭐ {Number(studio?.averageRating).toFixed(1)} ({studio?.reviewCount} reviews)</span>
                            <span className='text-[11px] sm:text-[12px] font-medium'>📅 {studio?.upcomingBookingsCount} upcoming</span>
                            <button
                                type='button'
                                className='rounded-full bg-linear-to-r from-[#1C1C1C] to-[#505050] px-3 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-normal text-white cursor-pointer'
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenOfflineBookingModal(true);
                                }}
                            >
                                Add Offline Booking
                            </button>
                        </>
                    )}
                </div>
            </article>

            <OfflineBookingModal
                isOpen={openOfflineBookingModal}
                onClose={() => setOpenOfflineBookingModal(false)}
                onConfirm={() => setOpenOfflineBookingModal(false)}
                studioDetails={studio}
            />
        </>
    )
}

export default HostStudiosList