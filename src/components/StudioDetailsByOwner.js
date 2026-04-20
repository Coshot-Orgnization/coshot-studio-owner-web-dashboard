"use client";
import { imageSrcHandler } from '@/helpers/imageSrcHandler';
import { useGetStudioDetailsOwnerViewQuery } from '@/redux/studios/studiosApi';
import { useGetStudioOwnerProfileQuery } from '@/redux/studio-owner/studioOwnerApi';
import { useRefundPoliciesListQuery } from '@/redux/public/publicApi';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react'

const minsToTime = (m) => {
    const n = Number(m);
    if (!Number.isFinite(n)) return m || "";
    const h = Math.floor(n / 60) % 24;
    const min = n % 60;
    return `${h % 12 || 12}:${String(min).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
const time12 = (t = "") => {
    if (typeof t === "number" || /^\d+$/.test(String(t))) return minsToTime(t);
    const [h, m] = String(t).split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return t || "";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const getDayName = (n) => {
    return DAY_NAMES[n] || "";
};
const dayIndexFromName = (name = "") => DAY_NAMES.findIndex((d) => d.toLowerCase() === String(name).toLowerCase());

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const StudioDetailsByOwner = ({ id }) => {
    const { data } = useGetStudioDetailsOwnerViewQuery(id)
    const { data: refundPoliciesData } = useRefundPoliciesListQuery()
    const { data: ownerProfile } = useGetStudioOwnerProfileQuery();
    const studioDetails = data?.data || {}
    const studioOwnerProfile = ownerProfile?.data || {}
    const PLACEHOLDER = "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80&auto=format&fit=crop";
    const [showMobileGallery, setShowMobileGallery] = useState(false);
    const [showAllHostRules, setShowAllHostRules] = useState(false);
    const [showAllCancellationPolicies, setShowAllCancellationPolicies] = useState(false);
    const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
    const [showRejectionReasonModal, setShowRejectionReasonModal] = useState(false);
    const images = (studioDetails?.images || []).map((img) => imageSrcHandler(typeof img === "string" ? img : img?.imagePath || img?.url || img?.path)).filter(Boolean);
    const schedule = (studioDetails.operatingHours || [])
        .map((x) => {
            const day = typeof x?.dayOfWeek === "number" ? getDayName(x.dayOfWeek) : x?.dayOfWeek;
            const start = x?.opensAt ? time12(x.opensAt) : "";
            const end = x?.closesAt ? time12(x?.closesAt) : "";
            return {
                day,
                dayIndex: typeof x?.dayOfWeek === "number" ? x.dayOfWeek : dayIndexFromName(day),
                start,
                end,
                isClosed: !!x?.isClosed,
            };
        })
        .filter((slot) => slot.day && (slot.isClosed || (slot?.start && slot?.end)));
    const mergeScheduleByTiming = (schedule = []) => {
        const sorted = [...schedule]
            .filter((x) => x?.day && Number.isFinite(x?.dayIndex))
            .sort((a, b) => a.dayIndex - b.dayIndex);

        const groups = [];

        for (const slot of sorted) {
            const prev = groups[groups?.length - 1];
            const key = slot.isClosed ? "closed" : `${slot.start}-${slot.end}`;

            if (
                prev &&
                prev.key === key &&
                slot.dayIndex === prev.endIndex + 1
            ) {
                prev.endIndex = slot.dayIndex;
                continue;
            }

            groups.push({
                key,
                isClosed: !!slot.isClosed,
                start: slot.start,
                end: slot.end,
                startIndex: slot.dayIndex,
                endIndex: slot.dayIndex,
            });
        }

        return groups.map((g) => {
            const dayLabel = g.startIndex === g.endIndex
                ? DAY_SHORT[g.startIndex]
                : `${DAY_SHORT[g.startIndex]}-${DAY_SHORT[g.endIndex]}`;

            return {
                ...g,
                dayLabel,
                timeLabel: g.isClosed ? "Closed" : `${time12(g.start)} - ${time12(g.end)}`,
            };
        });
    };
    const availabilityGroups = useMemo(() => mergeScheduleByTiming(schedule), [schedule]);
    const router = useRouter();
    const handleEditStudio = () => {
        const studioIdToEdit = studioDetails?._id || id;
        if (studioIdToEdit) {
            localStorage.setItem('studioId', String(studioIdToEdit));
        }
        setShowEditConfirmModal(false);
        router.push('/add-studio/studio-basic-information');
    };
    const [main, ...rest] = images;
    const locationText = [
        studioDetails?.location?.addressLine1 || studioDetails?.location?.displayAddress,
        studioDetails?.location?.addressLine2,
        studioDetails?.location?.city,
        studioDetails?.location?.state,
        studioDetails?.location?.country + (studioDetails?.location?.postalCode ? ` - ${studioDetails.location.postalCode}` : '')
    ].filter(Boolean).join(', ') || 'Location not added'
    return (
        <main className="min-h-screen bg-[#F5F6FB]">
            {studioDetails?.status !== "draft" && <div className={`${studioDetails?.status === "rejected" ? "bg-[#FF7272]" : studioDetails?.status === "verified" ? "bg-[#2cd163]" : "bg-[#dddd28]"} flex justify-center items-center gap-2 text-white text[12px] font-semibold py-1 uppercase`}>
                <img src='/images/navbar/verifiedTick.png' className='w-4.5 h-4.5' />
                {studioDetails?.status === "rejected" ? <span>
                    Studio Verification Not Approved. <span className='underline cursor-pointer' onClick={() => setShowRejectionReasonModal(true)}>See Reason</span> →
                </span> : studioDetails?.status === "verified" ? <span>
                    Studio Verification Approved.
                </span> : "Pending verification"}
            </div>}
            <section className="mx-auto w-full max-w-7xl px-3 pb-8 pt-4 md:px-5">
                <div className="mb-4 flex flex-col gap-3 md:flex-row items-center md:justify-between">
                    <div>
                        <a href="/host/studios" className='text-[14px] text-[#313131]' >← Back</a>
                        <h1 className="text-xl font-bold text-[#20202A] md:text-2xl text-center md:text-left mt-2">{studioDetails?.name}</h1>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center justify-items-center md:justify-items-start w-full mt-4">
                            <div className="flex items-center gap-1">
                                <img src="/images/navbar/location.png" className="h-4.5 w-4.5" alt="location" /> <span className="text-[#313131] text-[14px]">{studioDetails?.location?.city}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <img src="/images/navbar/area.png" className="h-4.5 w-4.5" alt="area" /> <span className="text-[#313131] text-[14px]">{studioDetails?.sizeSqft} sq.ft.<span style={{ fontSize: "14px", fontWeight: "400", color: "#7D7F88" }}>(Space Area)</span></span>
                            </div>
                            <div className="flex items-center gap-1 md:ms-20">
                                <img src="/images/navbar/people.png" className="h-4.5 w-4.5" alt="area" /> <span className="text-[#313131] text-[14px]">{studioDetails?.capacity}<span style={{ fontSize: "14px", fontWeight: "400", color: "#7D7F88" }}>(Capacity)</span></span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 w-full md:w-auto">
                        {(studioDetails?.status === "verified" || studioDetails?.status === "rejected") && <button
                            type="button"
                            onClick={() => setShowEditConfirmModal(true)}
                            className="h-10 flex-1 md:flex-none rounded-full px-4 md:px-6 text-[13px] md:text-[15px] font-medium text-white shadow-[0_14px_26px_rgba(42,42,42,0.26)] cursor-pointer bg-linear-to-r from-[#1E3A8A] to-[#6D5EF6] whitespace-nowrap"
                        >
                            + Edit Information
                        </button>}

                        <button
                            type="button"
                            onClick={() => router.push('/view-block-dates')}
                            className={`h-10 flex-1 md:flex-none rounded-full px-4 md:px-6 text-[13px] md:text-[15px] font-medium text-white shadow-[0_14px_26px_rgba(42,42,42,0.26)] cursor-pointer bg-linear-to-r from-[#222222] to-[#4f4f4f] whitespace-nowrap`
                            }
                        >
                            + Block Date
                        </button>
                    </div>

                </div>

                <div className="md:hidden relative">
                    <img src={main || PLACEHOLDER} alt={studioDetails?.name} className="h-85 w-full rounded-2xl object-cover" />
                    <button
                        type="button"
                        onClick={() => setShowMobileGallery(true)}
                        className="absolute bottom-3 right-3 rounded-full bg-black/70 px-4 py-2 text-xs font-semibold text-white"
                    >
                        See all images
                    </button>
                </div>

                <div className="hidden gap-3 md:grid md:grid-cols-[2fr_1fr]">
                    <img src={main || PLACEHOLDER} alt={studioDetails.name} className="h-85 w-full rounded-2xl object-cover md:h-105" />
                    <div className="grid grid-cols-2 gap-3">
                        {rest.slice(0, 4).map((img, i) => <img key={i} src={img} alt={`${studioDetails.name} ${i + 2}`} className="h-41.25 w-full rounded-2xl object-cover md:h-51" />)}
                    </div>
                </div>

                {showMobileGallery ? (
                    <div className="fixed inset-0 z-50 bg-black/80 p-3 md:hidden">
                        <div className="relative h-full w-full rounded-2xl bg-[#111111] p-2">
                            <button
                                type="button"
                                onClick={() => setShowMobileGallery(false)}
                                className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full bg-white/20 text-lg leading-none text-white"
                                aria-label="Close gallery"
                            >
                                ×
                            </button>

                            <div className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth">
                                {allImages.map((img, idx) => (
                                    <div key={`${img}-${idx}`} className="flex h-full w-full shrink-0 snap-center items-center justify-center px-1">
                                        <img
                                            src={img}
                                            alt={`${studioDetails?.name} image ${idx + 1}`}
                                            className="max-h-full w-full rounded-xl object-contain"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                ) : null}

                {showEditConfirmModal ? (
                    <div className="fixed inset-0 z-999 flex items-center justify-center bg-[#242528b3] px-4">
                        <div className="relative w-full max-w-lg rounded-3xl bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                            <h3 className="mb-3 text-xl font-bold text-[#1B1B2F]">Are you sure you want to edit the studio details?</h3>
                            <p className="mb-8 text-md leading-relaxed text-[#55556C]">
                                If you proceed with updating the information, your studio will be temporarily removed from the public listing. Once the changes are reviewed and verified by the CoShot team, your studio will be published and made live again.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={handleEditStudio}
                                    className="h-12 w-full rounded-full bg-linear-to-r from-[#2849b3] to-[#6558e8] text-sm font-semibold text-white shadow-lg transition hover:opacity-95 cursor-pointer"
                                >
                                    Update
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowEditConfirmModal(false)}
                                    className="h-12 w-full rounded-full text-sm font-medium text-[#4f4f68]  cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
                    <div className="space-y-5">
                        <section className="p-3">
                            <h2 className="text-lg font-semibold text-black">About Studio</h2>
                            <p className="mt-3 text-sm text-[#636579]">{studioDetails.description || "N/A"}</p>
                        </section>

                        <div className="text-[#CECECE] border border-dashed w-full customBorderWidth" />
                        <section className="p-3">
                            <h2 className="text-lg font-semibold text-[#1F2030]">Availability</h2>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {availabilityGroups?.length
                                    ? availabilityGroups.map((slot) => (
                                        <div key={`${slot.startIndex}-${slot.endIndex}-${slot.key}`} className="flex items-center gap-2">
                                            <img src="/images/navbar/weekdays.png" alt="schedule" className="h-5 w-5 opacity-60" />
                                            <p className="text-sm text-[#30313D]">
                                                <span className="font-medium">{slot.dayLabel}:</span> {slot.timeLabel}
                                            </p>
                                        </div>
                                    ))
                                    : <p className="text-sm text-[#636579]">Not available</p>}
                            </div>
                        </section>
                        <div className="text-[#CECECE] border border-dashed w-full customBorderWidth" />

                        <section className="p-3 w-full">
                            <h2 className="text-lg font-semibold text-[#1F2030]">Rules & Policies</h2>
                            <div className="flex flex-col md:flex-row gap-10 items-left justify-between w-full">
                                <div >
                                    <p className="text-[#6D5EF6] mt-2 font-semibold">Host Rules</p>
                                    {(showAllHostRules ? (studioDetails?.hostRules || []) : (studioDetails?.hostRules || []).slice(0, 3))?.map((r, i) =>
                                        <div className="flex gap-2 items-center mt-1" key={i}>
                                            <img src="/images/navbar/hostRules.png" className="h-5 w-5 mt-1" />
                                            <p key={i} className="mt-1 text-sm text-black">{r}</p>
                                        </div>
                                    )}
                                    {(studioDetails?.hostRules || [])?.length > 3 && (
                                        <button
                                            type="button"
                                            className="mt-2 text-sm font-semibold text-[#42398e] cursor-pointer"
                                            onClick={() => setShowAllHostRules((prev) => !prev)}
                                        >
                                            {showAllHostRules ? "Show less" : "Show more"}
                                        </button>
                                    )}
                                </div>
                                <div>

                                    <p className="text-[#6D5EF6] mt-2 font-semibold">Cancellation Policy</p>
                                    {(showAllCancellationPolicies ? (refundPoliciesData?.data || []) : (refundPoliciesData?.data || []).slice(0, 3))?.map((r, i) =>
                                        <div className="flex gap-2 items-center mt-1" key={i}>
                                            <img src="/images/navbar/hostRules.png" className="h-5 w-5 mt-1" />
                                            <p key={i} className="mt-1 text-sm text-black">{r?.description}</p>
                                        </div>
                                    )}
                                    {(refundPoliciesData?.data || [])?.length > 3 && (
                                        <button
                                            type="button"
                                            className="mt-2 text-sm font-semibold text-[#42398e] cursor-pointer"
                                            onClick={() => setShowAllCancellationPolicies((prev) => !prev)}
                                        >
                                            {showAllCancellationPolicies ? "Show less" : "Show more"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </section>
                        <div className="text-[#CECECE] border border-dashed w-full customBorderWidth" />
                        <section className="p-3">
                            <h2 className="text-lg font-semibold text-[#1F2030]">Inclusions</h2>
                            <p className="text-[#6D5EF6] mt-2 font-semibold">Included in Booking</p>
                            <div className="mt-1 space-y-1">
                                {studioDetails?.includedItems?.length > 0 ? (
                                    studioDetails?.includedItems.map((item, idx) => (
                                        <p key={idx} className="text-md text-[#313131] capitalize">{item}</p>
                                    ))
                                ) : <p className="text-sm text-[#636579]">N/A</p>}
                            </div>
                        </section>
                        <div className="text-[#CECECE] border border-dashed w-full customBorderWidth" />

                        <section className="p-3">
                            <h2 className="text-lg font-semibold text-[#1F2030]">Amenities</h2>
                            <div className="mt-3 grid gap-2 sm:grid-cols-4">
                                {studioDetails?.amenities?.length > 0 ? studioDetails?.amenities?.map((a) => {
                                    const amenityIcon = process.env.NEXT_PUBLIC_S3_BUCKET_URL + "/" + a?.iconPath;
                                    return (
                                        <div key={a?.slug || a?.name} className="text-sm flex gap-2 items-center">
                                            <Image
                                                src={amenityIcon}
                                                alt={a?.name || "amenity icon"}
                                                height={20}
                                                width={20}
                                                className="h-5 w-5"
                                                unoptimized={typeof amenityIcon === "string"}
                                            />
                                            <span>{a?.name}</span>
                                        </div>
                                    );
                                }) : <p className="text-sm text-[#636579]">N/A</p>}
                            </div>
                        </section>
                    </div>
                    <aside className="xl:sticky xl:top-24 xl:h-fit rounded-2xl p-5 w-full xl:w-100 customBorderWidth place-self-center xl:place-self-auto">
                        <div className="mb-4 rounded-xl border border-[#E5E5E5] border-dashed p-3 shadow-lg grid justify-between items-start">
                            <div className='flex justify-between items-start'>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                        {studioOwnerProfile?.profile?.profileImagePath ? <img src={imageSrcHandler(studioOwnerProfile?.profile?.profileImagePath)} alt={studioOwnerProfile?.profile?.firstName} className="h-10 w-10 shrink-0 rounded-full" /> : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#5B4FEB] bg-gray-200">{studioOwnerProfile?.profile?.firstName?.[0]?.toUpperCase() ?? "H"}</div>}
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold capitalize">{studioOwnerProfile?.profile?.firstName ? studioOwnerProfile?.profile?.firstName + " " + studioOwnerProfile?.profile?.lastName : "Host"}</p>
                                            <p className="text-xs text-[#7A7C93]">Owner</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pl-12">
                                    <a href={`tel:${studioOwnerProfile?.profile?.phone}`}>
                                        <img src="/images/navbar/call.png" className="h-7.5 w-7.5 shrink-0 cursor-pointer" alt="Call Host" />
                                    </a>
                                </div>
                            </div>
                            <p className="text-[12px] mt-3 leading-4 flex gap-2 items-center">
                                <img src='/images/bookings/location.png' className='w-4 h-5' /> {locationText}
                            </p>
                            <p className="text-[12px] mt-3 leading-4 flex gap-2 items-center">
                                <img src='/images/bookings/phone.png' className='w-4 h-4' /> {studioOwnerProfile?.profile?.phone} {" "}
                                (Host contact number)
                            </p>
                        </div>
                    </aside>
                </div>
            </section>
            {
                showRejectionReasonModal ? (
                    <div className="fixed inset-0 z-999 flex items-center justify-center bg-[#242528b3] px-4">
                        <div className="relative w-full max-w-lg rounded-3xl bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                            <span className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full bg-white/20 text-lg leading-none text-black cursor-pointer" onClick={() => setShowRejectionReasonModal(false)} aria-label="Close modal">×</span>
                            <h3 className="mb-3 text-xl font-bold text-[#1B1B2F]">Reason for Studio Verification Rejection</h3>
                            <p className="mb-8 text-md leading-relaxed text-[#55556C]">
                                {studioDetails?.rejectionReason || "No specific reason provided."}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRejectionReasonModal(false)}
                                    className="h-12 w-full rounded-full text-sm font-medium text-[#4f4f68]  cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null
            }
        </main >
    )
}

export default StudioDetailsByOwner