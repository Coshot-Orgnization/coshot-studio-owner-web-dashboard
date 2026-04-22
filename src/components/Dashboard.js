"use client";
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useStudioOwnerDashboardStatsQuery } from '@/redux/studio-owner/studioOwnerApi'
import { useSelector } from 'react-redux';
import React, { useEffect, useState } from 'react'
import Navbar from './Navbar';
import HostStudiosList from './HostStudiosList';
import BookingSkeletonLoading from '@/helpers/BookingSkeletonLoading';
import { useRouter } from 'next/navigation';
import CommonPagination from './CommonPagination';
import { getPaginationFromResponse } from '@/helpers/pagination';
import NoData from './NoData';
import { useStudioOwnerStudioListQuery } from '@/redux/studios/studiosApi';
import { useCheckProfileMutation } from '@/redux/auth/authApi';
import { formatAmount } from '@/helpers/formatAmount';

const HostBookings = dynamic(() => import('./HostBookings'), {
    loading: () => <BookingSkeletonLoading />
});
const Footer = dynamic(() => import('./Footer'));

const Dashboard = () => {
    const { data } = useStudioOwnerDashboardStatsQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    const { user } = useSelector((state) => state.auth);
    const DEFAULT_PAGE = 1;
    const DEFAULT_LIMIT = 20;
    const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
    const { data: studiList, isLoading } = useStudioOwnerStudioListQuery({
        page: currentPage,
        limit: DEFAULT_LIMIT,
    });
    const [checkProfile] = useCheckProfileMutation();
    const studiosPagination = getPaginationFromResponse(studiList, DEFAULT_LIMIT);
    const router = useRouter();

    const stats = data?.data ?? {};
    const hostName = user?.profile?.firstName || "Host";
    const totalStudios = stats?.totalStudios ?? 0;
    const nextBookings = stats?.upcomingBookingsCount ?? 0;
    const totalEarnings = stats?.earningsLastMonth ?? 0;
    const [isProfileCompleted, setIsProfileCompleted] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const statCards = [
        { label: "Total Studios", value: totalStudios, prefix: "" },
        { label: "Next Bookings", value: nextBookings, prefix: "" },
        { label: "Total Earnings", value: formatAmount(totalEarnings), prefix: "₹" },
    ];

    const BOOKING_TABS = [
        { label: "Studios", value: "Studios" },
        { label: "Today's Bookings", value: "Booking" },
    ];
    const [activeTab, setActiveTab] = useState("Booking");
    const studios = studiList?.data?.data ?? [];

    const formatDate = (dateValue) => {
        if (!dateValue) return "DD-MM-YYYY";

        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return "DD-MM-YYYY";

        return date.toLocaleDateString("en-GB").replace(/\//g, "-");
    };

    useEffect(() => {
        checkProfile({ role: "studio_owner" }).unwrap().then((res) => {
            if (res?.data?.user?.profile?.isProfileCompleted) {
                setIsProfileCompleted(true);
            }
        }).catch((err) => {
            console.error("Error checking profile completion:", err);
        });
    }, [checkProfile])

    return (
        <section className="w-full pt-15 ">
            <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-6 px-4 lg:flex-row lg:items-start lg:px-6">
                <div className="w-full lg:max-w-xl">
                    <div className='flex justify-between items-center'>
                        <h1 className="text-2xl font-semibold text-[#272727]">
                            Hello, {hostName} <span aria-hidden="true">👋</span>
                        </h1>
                        <div className="block lg:hidden">
                            <Navbar />
                        </div>
                    </div>

                    <p className="mt-1 text-lg sm:text-[20px] text-[#4b4b4b]">Manage your studios, bookings, and profile from here.</p>

                    <div className="mt-5">
                        {isProfileCompleted === false && (
                            <div className="flex items-center justify-left gap-1 sm:gap-3 text-[14px] sm:text-[16px] font-medium text-[#3f3f3f]">
                                <span>Profile Completion:</span>
                                <button type="button" className="cursor-pointer font-medium text-[#6d5ef6] underline underline-offset-2" onClick={() => router.push("/profile")}>
                                    Complete Your Profile →
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-4 lg:justify-end">
                    {statCards.map((card) => (
                        <div
                            key={card.label}
                            className="flex h-19 flex-col items-center justify-center rounded-xl border border-[#DBDBDB] bg-linear-to-b from-[#EBEBEB] to-white px-2 sm:max-w-32 sm:px-4"
                        >
                            <p className="text-base sm:text-[20px] font-semibold leading-none text-[#6d5ef6]">
                                {card.prefix}
                                {card.value}
                            </p>
                            <p className="mt-2 text-[10px] sm:text-sm font-medium text-[#313131] text-center">{card.label}</p>
                        </div>
                    ))}
                </div>
            </div>
            {totalStudios === 0 ?
                <div className='grid justify-items-center text-center md:flex md:text-start justify-center mt-10'>
                    <Image
                        src='/images/navbar/stuioClip.png'
                        alt="No studios"
                        width={480}
                        height={360}
                        className='h-90 w-120 object-contain'
                    />
                    <div className='flex flex-col justify-center gap-1'>
                        <span className="text-2xl font-semibold text-[#272727]">
                            You haven’t added any studios yet.
                        </span>
                        <p className='max-w-90 font-medium text-[#5D5D5D] mt-1 text-[16px]'>
                            Add your studio details and showcase your space to creators and brands. CoShot helps you manage bookings and grow your business effortlessly.
                        </p>
                        <button
                            type='button'
                            className='mt-5 h-12 w-full max-w-72 ml-3 rounded-full bg-linear-to-r from-[#1E3A8A] to-[#6D5EF6] text-[16px] leading-none font-medium text-white cursor-pointer bg-[linear-gradient(95.53deg,#1E3A8A_0%,#6D5EF6_40%,#1E3A8A_100%)] bg-size-[300%_100%] transition-all duration-500 ease-in-out hover:bg-position-[100%_0]'
                            onClick={() => router.push("/add-studio")}
                        >
                            Continue
                        </button>
                        <p className='italic text-[#5D5D5D] text-[13px] mt-2 ml-5'>
                            You can add your studio details in the next step.
                        </p>
                    </div>
                </div>
                :
                <div className="relative mx-auto flex w-full max-w-330 flex-col gap-6 px-4 lg:flex-row lg:items-start lg:gap-8 lg:px-6 mt-10">
                    <div className="hidden lg:block">
                        <Navbar />
                    </div>
                    <section className="w-full overflow-hidden rounded-3xl border border-[#e8e8ef] bg-white shadow-[0_10px_36px_rgba(42,48,82,0.08)] lg:max-w-220">
                        <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-xl font-semibold text-[#6257eb]">Dashboard</h2>

                                <div className="flex w-full lg:w-lg rounded-full bg-[#f0f0f6] p-1">
                                    {BOOKING_TABS.map((tab) => {
                                        const isActive = tab.value === activeTab;
                                        return (
                                            <button
                                                key={tab.value}
                                                type="button"
                                                onClick={() => {
                                                    setActiveTab(tab.value);
                                                    if (tab.value === "Studios") {
                                                        setCurrentPage(DEFAULT_PAGE);
                                                    }
                                                }}
                                                className={`h-10 flex-1 sm:min-w-36 rounded-full px-3 sm:px-5 text-xs sm:text-sm font-semibold transition cursor-pointer ${isActive
                                                    ? "bg-linear-to-r from-[#2f4cc3] to-[#6d5ef6] text-white shadow-[0_8px_20px_rgba(102,93,245,0.35)] bg-[linear-gradient(95.53deg,#1E3A8A_0%,#6D5EF6_40%,#1E3A8A_100%)] bg-size-[300%_100%] transition-all duration-500 ease-in-out hover:bg-position-[100%_0]"
                                                    : "text-[#69677f]"
                                                    }`}
                                            >
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-5 border-t border-dashed border-[#e3e2ec]" />

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
                            ) : activeTab === "Studios" ? (
                                studios.length === 0 ? (
                                    <NoData
                                        page="hostDashboard"
                                        title="No studios found"
                                        description="You don’t have any studio listings yet. Add a studio to start receiving bookings."
                                        actionLabel="Add Studio"
                                        onAction={() => router.push('/add-studio')}
                                    />
                                ) : (
                                    <>
                                        <div className='mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2'>
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
                                            totalPages={studiosPagination.totalPages}
                                            hasNext={studiosPagination.hasNext}
                                            hasPrevious={studiosPagination.hasPrevious}
                                            onPageChange={setCurrentPage}
                                        />
                                    </>
                                )
                            ) : (
                                <HostBookings
                                    embedded
                                    withTabs={false}
                                    status="confirmed"
                                    date={isMounted ? new Date().toISOString().split("T")[0] : ""}
                                />
                            )}
                        </div>
                    </section>
                </div>
            }
            <div className="px-0 sm:px-0 max-w-full mx-auto mt-7">
                <Footer />
            </div>
        </section>
    )
}

export default Dashboard