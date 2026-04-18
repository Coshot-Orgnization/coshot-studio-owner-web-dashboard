"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from './Navbar'
import Footer from './Footer'
import { useDiscountRulesToggleMutation, useGetStudioDetailsQuery, useSubmitStudioForApprovalMutation } from '@/redux/studios/studiosApi'
import { imageSrcHandler } from '@/helpers/imageSrcHandler'
import { showErrorToast, showSuccessToast } from '@/helpers/toast'
import StudioSubmitModal from '@/modals/StudioSubmitModal'
import { useRefundPoliciesListQuery } from '@/redux/public/publicApi'
import { useGetStudioOwnerProfileQuery } from '@/redux/studio-owner/studioOwnerApi'

const PLACEHOLDER_IMAGE = '/images/landingPage/imagePlaceholder.jpg'
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const inr = (value) => `₹${Number(value || 0)}`
const minsToTime = (m) => {
    const n = Number(m);
    if (!Number.isFinite(n)) return m || "";
    const h = Math.floor(n / 60) % 24;
    const min = n % 60;
    return `${h % 12 || 12}:${String(min).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
const toTime12 = (t = '') => {
    if (typeof t === "number" || /^\d+$/.test(String(t))) return minsToTime(t);
    const [h, m] = String(t).split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return t || "";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const getImageUrl = (image) => {
    const path = typeof image === 'string' ? image : image?.imagePath || image?.url || image?.path
    if (!path) return PLACEHOLDER_IMAGE
    return imageSrcHandler(path)
}

const normalizeOperatingHours = (hours = []) => {
    const normalized = (hours || [])
        .filter(Boolean)
        .map((item) => ({
            dayIndex: Number(item?.dayOfWeek),
            isClosed: Boolean(item?.isClosed),
            open: item?.opensAt ? toTime12(item.opensAt) : '',
            close: item?.closesAt ? toTime12(item.closesAt) : '',
        }))
        .filter((item) => Number.isFinite(item.dayIndex))
        .sort((a, b) => a.dayIndex - b.dayIndex)

    const groups = []

    normalized.forEach((item) => {
        const key = item.isClosed ? 'closed' : `${item.open}-${item.close}`
        const prev = groups[groups.length - 1]

        if (prev && prev.key === key && item.dayIndex === prev.end + 1) {
            prev.end = item.dayIndex
            return
        }

        groups.push({
            key,
            isClosed: item.isClosed,
            open: item.open,
            close: item.close,
            start: item.dayIndex,
            end: item.dayIndex,
        })
    })

    return groups.map((group) => {
        const dayLabel = group.start === group.end
            ? DAY_SHORT[group.start]
            : `${DAY_SHORT[group.start]}-${DAY_SHORT[group.end]}: `

        const timeLabel = group.isClosed ? 'Closed' : `${group.open} - ${group.close}`
        return `${dayLabel} ${timeLabel}`
    })
}

const StudioPreview = () => {
    const router = useRouter()
    const [studioId, setStudioId] = useState('')
    const [showSubmitModal, setShowSubmitModal] = useState(false)
    const [submit] = useSubmitStudioForApprovalMutation();
    const [showFullGallery, setShowFullGallery] = useState(false);
    const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
    const { data: cancellationPolicies } = useRefundPoliciesListQuery()
    const [toggleDiscountRules] = useDiscountRulesToggleMutation();
    const { data: ownerData } = useGetStudioOwnerProfileQuery();

    useEffect(() => {
        setStudioId(localStorage.getItem('studioId') || '')
    }, [])

    const { data, refetch } = useGetStudioDetailsQuery(studioId, {
        skip: !studioId,
        refetchOnMountOrArgChange: true,
    })

    const studioDetails = data?.data
    const studioImages = Array.isArray(studioDetails?.images) ? studioDetails.images : []

    const primaryImage = studioImages.find(img => img?.isPrimary === true)
    const previewImage = primaryImage ? getImageUrl(primaryImage) : (studioImages.length ? getImageUrl(studioImages[0]) : PLACEHOLDER_IMAGE)

    const studioName = studioDetails?.name || 'Studio Name'
    const ownerName = ownerData?.data?.profile?.firstName ? `${ownerData.data.profile.firstName} ${ownerData.data.profile.lastName || ''}`.trim() : 'Host'
    const ownerImage = ownerData?.data?.profile?.profileImagePath ? imageSrcHandler(ownerData.data.profile?.profileImagePath) : ''
    const rating = Number(studioDetails?.averageRating || 0)
    const reviewCount = Number(studioDetails?.reviewCount || 0)
    const locationText = [
        studioDetails?.location?.addressLine1 || studioDetails?.location?.displayAddress,
        studioDetails?.location?.addressLine2,
        studioDetails?.location?.city,
        studioDetails?.location?.state,
        studioDetails?.location?.country + (studioDetails?.location?.postalCode ? ` - ${studioDetails.location.postalCode}` : '')
    ].filter(Boolean).join(', ') || 'Location not added'

    const pricingChips = [
        { label: 'Price :', value: inr(studioDetails?.basePricePerHour), icon: '/images/navbar/gst.png' },
        { label: 'Minimum Booking :', value: `${studioDetails?.minBookingHours || 1} hrs`, icon: '/images/navbar/dateTime.png' },
        { label: 'Overtime :', value: `${inr(studioDetails?.overtimePricePerHour)} / hour`, icon: '/images/navbar/overtime.png' },
        { label: 'Security Deposit :', value: inr(studioDetails?.securityDeposit), icon: '/images/navbar/subtotal.png' },
        { label: 'Capacity :', value: `${studioDetails?.capacity || '-'}`, icon: '/images/navbar/people.png' },
        { label: 'Size :', value: `${studioDetails?.sizeSqft || '-'} sq.ft.`, icon: '/images/navbar/area.png' },
    ]

    const availabilityRows = normalizeOperatingHours(studioDetails?.operatingHours || [])
    const rules = Array.isArray(studioDetails?.hostRules) ? studioDetails.hostRules : []
    const inclusions = Array.isArray(studioDetails?.includedItems) ? studioDetails.includedItems : []

    const goToSection = (path) => router.push(path)

    const onClickDiscountHandler = async (id, isActive) => {
        try {
            await toggleDiscountRules({ studioId, ruleId: id, isActive: isActive === true ? false : true }).unwrap();
            refetch();
            showSuccessToast("Discount rule toggled successfully")
        } catch (error) {
            showErrorToast(error?.data?.message || "Failed to toggle discount rule")
        }
    }

    const onClickHandler = async () => {
        if (!studioId) {
            showErrorToast('Studio not found');
            return;
        }

        const res = await submit({ id: studioId })

        if (res?.data?.success) {
            setShowSubmitModal(true)
            showSuccessToast(res?.data?.message || 'Studio submitted for review')
        } else {
            showErrorToast(res?.data?.message || "Something went wrong")
        }
    }

    return (
        <main className="min-h-screen pt-15">
            <div className="mx-auto flex w-full max-w-full flex-col gap-6 lg:flex-row lg:items-start">
                <aside className="hidden lg:block w-full rounded-tr-[300px] h-200 bg-[#F7F8FC] pr-4 lg:w-105 lg:pr-5">
                    <h2 className="mb-4 mt-4 ps-5 lg:mt-15 text-[28px] font-semibold text-[#2f2d3a]">Studio Setup Steps</h2>
                    <div className="space-y-1">
                        <Navbar />
                    </div>
                </aside>

                <section className="w-full mb-4 rounded-[18px] border border-[#e3e2ea] bg-white p-4 shadow-[0_10px_24px_rgba(47,42,71,0.08)] lg:w-250 lg:p-5">
                    <div className="mb-4 flex items-center justify-between pb-3">
                        <div className="flex items-center justify-between w-full gap-4">
                            <div>
                                <h1 className="text-[16px] md:text-[19px] font-semibold text-[#6d5ef6]">Studio Preview</h1>
                                <p className="max-w-90 text-left text-[10px] md:text-[14px] leading-4 text-[#313131]">Review your studio details and appear to users. You can edit each section before submitting.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => goToSection('/add-studio/studio-basic-information')}
                                className="rounded-lg border border-[#d9d7e8] p-3 text-[12px] font-medium text-[#6d5ef6] cursor-pointer"
                            >
                                <img src='/images/navbar/pencil.png' className='w-5 h-4' />
                            </button>

                        </div>
                        <div className="block lg:hidden">
                            <Navbar />
                        </div>
                    </div>

                    <div className="mt-1 sm:mt-4 border-t border-dashed border-[#e3e2ec]" />
                    <div className="relative overflow-hidden rounded-[10px] border border-[#ecebf3] mx-3">
                        <img src={previewImage} alt={studioName} className="h-68 w-full object-cover" />
                        <button
                            type="button"
                            onClick={() => setShowFullGallery(true)}
                            className="absolute bottom-2 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#313131] shadow-sm cursor-pointer hover:bg-white transition-colors"
                        >
                            See all images
                        </button>
                        <span className="absolute bottom-2 right-3 rounded-full bg-black/65 px-2 py-0.5 text-[10px] text-white">
                            1/{studioImages.length || 1}</span>
                    </div>

                    <div className="mt-4 border-b border-dashed border-[#DEDEDE] pb-1 mx-3">
                        <div className="items-start ">
                            <h2 className="text-[20px] font-semibold text-[#2f2d3a]">{studioName}</h2>
                            <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center text-[14px] text-[#767289] mt-3 gap-4">
                                <div className='lg:w-40'>
                                    <span className='flex gap-2 font-semibold'><img src='/images/navbar/star.png' className='w-4 h-4' /> <span className='text-black'>{rating.toFixed(1)} </span> ({reviewCount} reviews)</span>
                                </div>
                                <div className="flex-1">
                                    <span className='flex gap-2 text-black text-[14px] items-start'><svg width="16" height="19" viewBox="0 0 16 19" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-0.5">
                                        <path d="M13.6562 2.30475C10.5322 -0.76825 5.46716 -0.76825 2.34316 2.30475C1.60145 3.02938 1.01207 3.89498 0.60968 4.85066C0.207288 5.80634 0 6.83281 0 7.86975C0 8.90669 0.207288 9.93316 0.60968 10.8888C1.01207 11.8445 1.60145 12.7101 2.34316 13.4347L7.99917 18.9998L13.6562 13.4347C14.3979 12.7101 14.9873 11.8445 15.3897 10.8888C15.792 9.93316 15.9993 8.90669 15.9993 7.86975C15.9993 6.83281 15.792 5.80634 15.3897 4.85066C14.9873 3.89498 14.3979 3.02938 13.6562 2.30475ZM7.99917 10.4998C7.33117 10.4998 6.70417 10.2397 6.23117 9.76775C5.76292 9.2985 5.49994 8.66266 5.49994 7.99975C5.49994 7.33684 5.76292 6.701 6.23117 6.23175C6.70317 5.75975 7.33117 5.49975 7.99917 5.49975C8.66716 5.49975 9.29516 5.75975 9.76716 6.23175C10.2354 6.701 10.4984 7.33684 10.4984 7.99975C10.4984 8.66266 10.2354 9.2985 9.76716 9.76775C9.29516 10.2397 8.66716 10.4998 7.99917 10.4998Z" fill="#7D7F88" />
                                    </svg>
                                        {locationText}</span>
                                </div>
                                <div className="flex items-center justify-end w-full lg:w-85 gap-2 rounded-full px-2.5 py-1.5 bg-[#F9F9FB] lg:bg-transparent">
                                    <div className='flex gap-2'>
                                        {ownerImage ? (
                                            <img src={ownerImage} alt={ownerName} className="h-8 w-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7e5ff] text-[12px] font-semibold text-[#5b4feb]">{ownerName?.charAt(0)?.toUpperCase() || 'H'}</div>
                                        )}
                                        <div className='grid'>
                                            <span className="text-[14px] font-semibold text-[#3d3a4f]">{ownerName}</span>
                                            <span className="text-[10px] font-medium text-[#73727a]">Studio owner</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1 py-1">
                        <div className="border-b border-dashed border-[#DEDEDE] py-3 mx-3">
                            <p className="mb-2 text-[14px] font-semibold text-[#313131]">Pricing &amp; Booking Info</p>
                            <div className="grid gap-2 md:grid-cols-3">
                                {pricingChips.map((item) => (
                                    <div key={item.label} className="flex items-start gap-2 rounded-full px-3 py-2 text-[11px] text-[#5f5b74]">
                                        <img src={item.icon} alt={item.label} className="h-6 w-6 object-contain" />
                                        <div>
                                            <p className="text-[#7D7F88] font-medium text-[12px] leading-3">{item.label}</p>
                                            <p className="font-medium text-[12px] text-[#313131] mt-1">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-b border-dashed border-[#DEDEDE] py-3 mx-3">
                            <p className="mb-2 text-[15px] font-semibold text-[#313131]">Availability</p>
                            <div className="space-y-1 text-[12px] text-[#5f5b74]">

                                {availabilityRows.length > 0 ? availabilityRows.map((row) => <div key={row} className="flex items-center gap-2 text-black"><img src='/images/navbar/weekdays.png' className='w-7 h-7' /><p key={row}>{row}</p></div>) : <p>Availability not added yet</p>}
                            </div>
                        </div>

                        <div className="border-b border-dashed border-[#DEDEDE] py-3 mx-3">
                            <p className="mb-2 text-[15px] font-semibold text-[#313131]">Rules &amp; Policies</p>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                    <p className="mb-1 text-[13px] font-semibold text-[#6d5ef6]">Host Rules</p>
                                    <ul className="space-y-1 text-[12px] text-[#313131]">
                                        {rules.length > 0 ? rules.map((rule, index) =>
                                            <li key={`${rule}-${index}`} className='flex items-center gap-1 font-medium'>
                                                <img src='/images/navbar/hostRules.png' className='w-6 h-6' /> {rule}
                                            </li>
                                        )
                                            : <li>• No rules added</li>}
                                    </ul>
                                </div>
                                <div>
                                    <p className="mb-1 text-[13px] font-semibold text-[#6d5ef6]">Cancellation Policy</p>
                                    <ul className="space-y-1 text-[12px] text-[#313131]">
                                        {cancellationPolicies?.data?.length > 1 ? cancellationPolicies?.data.map((rule, index) => <li key={`${rule}-${index}`} className='flex items-center gap-1 font-medium'>  <img src='/images/navbar/hostRules.png' className='w-6 h-6' /> {rule?.description}</li>) : <li>• Follow booking policies.</li>}
                                    </ul>
                                </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                    <p className="mb-1 text-[13px] font-semibold text-[#6d5ef6]">Discount Rules</p>
                                    <ul className="space-y-1 text-[12px] text-[#313131]">
                                        {studioDetails?.discountRules?.length > 0 ? studioDetails?.discountRules?.map((rule, index) =>
                                            <li key={rule?.id} className='flex items-center gap-1 font-medium justify-between'>
                                                <div className="flex items-center gap-2">
                                                    <img src='/images/navbar/hostRules.png' className='w-6 h-6 ' /> {rule?.hours}hrs and {rule?.discountPercentage}% discount
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => onClickDiscountHandler(rule?.id, rule?.isActive)}
                                                    className={`relative h-6 w-10 rounded-full border transition-all duration-200 ${rule?.isActive
                                                        ? "border-[#8a83ff] bg-[#a39eff]"
                                                        : "border-[#d9d8df] bg-[#ececef]"
                                                        }`}
                                                >
                                                    <span
                                                        className={`absolute top-0.5 h-4.5 w-4.5 border border-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-200 ${rule?.isActive ? "left-5  customButtonSwitch" : "left-0.5 bg-white "
                                                            }`}
                                                    />
                                                </button>
                                            </li>
                                        )
                                            : <li>• No rules added</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="border-b border-dashed border-[#DEDEDE] py-3 mx-3">
                            <p className=" text-[15px] font-semibold text-[#313131]">Inclusions</p>
                            <div className="space-y-1 text-[14px] font-medium">
                                <span className="text-[#6d5ef6]">Included in Booking</span>
                                {inclusions.length > 0 ? inclusions.slice(0, 4).map((item, index) => (
                                    <p key={`${item}-${index}`} className="text-[#313131] capitalize mt-1">{item}</p>
                                )) : <p className="text-[#313131]">No inclusions added</p>}
                            </div>
                        </div>

                        <div className="border-b border-dashed border-[#DEDEDE] py-3 mx-3">
                            <p className="mb-2 text-[15px] font-semibold text-[#313131]">Amenities</p>
                            <div className="flex flex-wrap gap-2 text-[14px] text-[#313131]">
                                {studioDetails?.amenities.length > 0 ? studioDetails?.amenities.map((amenity) => (
                                    <span key={amenity.name} className="flex items-center gap-2 px-3 py-1">
                                        {amenity.iconPath && <img src={imageSrcHandler(amenity.iconPath)} className="w-5 h-5 object-contain" alt="" />}
                                        {amenity.name}
                                    </span>
                                )) : <p>No amenities selected</p>}
                            </div>
                        </div>

                        <div className="border-b border-dashed border-[#DEDEDE] py-3 mx-3">
                            <p className="mb-2 text-[15px] font-semibold text-[#313131]">Address</p>
                            <p className="text-[12px] font-medium text-[#313131]">{locationText}</p>
                            <p className="mt-1 text-[12px] italic text-[#89869d]">Full address/phone shown after booking.</p>
                        </div>

                        <div className="py-3 mx-3">
                            <p className="mb-2 text-[15px] font-semibold text-[#313131]">About Studio</p>
                            <p className="text-[12px] leading-4 text-[#7D7F88]">{studioDetails?.description || 'No description added yet.'}</p>
                        </div>
                    </div>

                    <div className="mt-1 flex flex-col items-center justify-between gap-3 border-t border-dashed border-[#DEDEDE] pt-4 text-center md:flex-row md:text-left mx-3">
                        <p className="text-[12px] text-[#313131]">Our team will review your studio and notify you once it is live on CoShot.</p>
                        <button type="button" className="h-12 rounded-full bg-linear-to-r from-[#1e3a8a] to-[#6d5ef6] px-8 text-[16px] font-medium text-white cursor-pointer bg-[linear-gradient(95.53deg,#1E3A8A_0%,#6D5EF6_40%,#1E3A8A_100%)] bg-size-[300%_100%] transition-all duration-500 ease-in-out hover:bg-position-[100%_0]" onClick={() => onClickHandler()}>Submit for Approval</button>
                    </div>
                </section>

                {showSubmitModal &&
                    <StudioSubmitModal
                        onShow={showSubmitModal}
                        onClose={() => router.push('/')}
                    />}
            </div>

            {showFullGallery && (
                <div className="fixed inset-0 z-50 bg-black/90 p-4 flex items-center justify-center">
                    <div className="relative h-full w-full rounded-2xl bg-[#111111] p-2">
                        <button
                            type="button"
                            onClick={() => setShowFullGallery(false)}
                            className="absolute right-5 top-5 z-10 h-10 w-10 rounded-full bg-white/20 text-2xl leading-none text-white hover:bg-white/30 transition-colors cursor-pointer"
                            aria-label="Close gallery"
                        >
                            ×
                        </button>

                        <div className="absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white">
                            {activeGalleryIndex + 1} / {studioImages.length}
                        </div>

                        {studioImages.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setActiveGalleryIndex(prev => Math.max(0, prev - 1))}
                                    className="absolute left-4 top-1/2 z-10 -translate-y-1/2 h-10.5 w-10 text-3xl rounded-full bg-white/20 text-white flex justify-center hover:bg-white/30 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                    disabled={activeGalleryIndex === 0}
                                >
                                    ‹
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveGalleryIndex(prev => Math.min(studioImages.length - 1, prev + 1))}
                                    className="absolute right-4 top-1/2 z-10 -translate-y-1/2 h-10.5 w-10 text-3xl rounded-full bg-white/20 text-white flex justify-center hover:bg-white/30 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                                    disabled={activeGalleryIndex === studioImages.length - 1}
                                >
                                    ›
                                </button>
                            </>
                        )}

                        <div
                            className="flex h-full items-center justify-center overflow-hidden"
                        >
                            {studioImages.length > 0 ? (
                                <img
                                    src={getImageUrl(studioImages[activeGalleryIndex])}
                                    alt={`Studio image ${activeGalleryIndex + 1}`}
                                    className="max-h-full max-w-full rounded-xl object-contain"
                                />
                            ) : (
                                <img
                                    src={PLACEHOLDER_IMAGE}
                                    alt="Placeholder"
                                    className="max-h-full max-w-full rounded-xl object-contain"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-full px-0 sm:px-0">
                <Footer />
            </div>
        </main>
    )
}

export default StudioPreview