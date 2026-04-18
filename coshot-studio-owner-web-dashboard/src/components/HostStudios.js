"use client";
import React, { useEffect, useState } from 'react'
import Navbar from './Navbar'
import { useStudioOwnerStudioListQuery } from '@/redux/studios/studiosApi';
import HostStudiosList from './HostStudiosList';
import BookingSkeletonLoading from '@/helpers/BookingSkeletonLoading';
import CommonPagination from './CommonPagination';
import { getPaginationFromResponse } from '@/helpers/pagination';
import NoData from './NoData';

const HostStudios = () => {
    const DEFAULT_PAGE = 1;
    const DEFAULT_LIMIT = 20;
    const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);

    const { data: studiList, isLoading } = useStudioOwnerStudioListQuery({
        page: currentPage,
        limit: DEFAULT_LIMIT,
    });
    const pagination = getPaginationFromResponse(studiList, DEFAULT_LIMIT);

    useEffect(() => {
        if (currentPage > pagination.totalPages) {
            setCurrentPage(pagination.totalPages);
        }
    }, [currentPage, pagination.totalPages]);

    const activeTab = "Studios";

    const formatDate = (dateValue) => {
        if (!dateValue) return "DD-MM-YYYY";

        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return "DD-MM-YYYY";

        return date.toLocaleDateString("en-GB").replace(/\//g, "-");
    };

    const studios = studiList?.data?.data ?? [];
    return (
        <div className="relative mx-auto flex w-full max-w-330 flex-col gap-6 px-4 lg:flex-row lg:items-start lg:gap-8 lg:px-6 pt-15">
            <div className="hidden lg:block">
                <Navbar />
            </div>
            <section className="w-full overflow-hidden rounded-3xl border border-[#e8e8ef] bg-white shadow-[0_10px_36px_rgba(42,48,82,0.08)] lg:max-w-232.5">
                <div className="px-5 pt-3 sm:px-8 sm:pt-6 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-[#6257eb]">My Studios</h2>
                    <div className="block lg:hidden">
                        <Navbar />
                    </div>
                </div>

                <div className="mt-1 sm:mt-4 border-t border-dashed border-[#e3e2ec]" />
                <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
                    {isLoading ? (
                        <div
                            className={`mt-6 ${(activeTab === "Studios" || activeTab === "Cancelled Booking")
                                ? "flex flex-col gap-4"
                                : "grid grid-cols-1 gap-5 lg:grid-cols-2"
                                }`}
                        >
                            {Array.from({ length: (activeTab === "Studios" || activeTab === "Cancelled Booking") ? 3 : 4 }).map((_, index) => (
                                <BookingSkeletonLoading key={index} isPastBooking={activeTab === "Studios" || activeTab === "Cancelled Booking"} />
                            ))}
                        </div>
                    ) : studios.length === 0 ? (
                        <NoData
                            page="hostStudios"
                            description="No studios found on this page. Try switching pages or add a new studio."
                        />
                    ) : (
                        <>
                            <div className='mt-5 grid grid-cols-1 gap-4 md:grid-cols-2'>
                                {studios.map((studio, index) => (
                                    <HostStudiosList
                                        key={studio?.id || `${studio?.name || studio?.studioName || "studio"}-${index}`}
                                        studio={studio}
                                        formatDate={formatDate}
                                    />
                                ))}
                            </div>

                            <CommonPagination
                                currentPage={currentPage}
                                totalPages={pagination.totalPages}
                                hasNext={pagination.hasNext}
                                hasPrevious={pagination.hasPrevious}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </section >
        </div >
    )
}

export default HostStudios