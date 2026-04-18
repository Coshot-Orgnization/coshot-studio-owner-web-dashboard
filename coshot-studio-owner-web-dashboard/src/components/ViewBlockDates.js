"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { showErrorToast, showSuccessToast } from '@/helpers/toast';
import {
    useDeleteStudioBlockedDatesMutation,
    useGetStudioBlockedDatesQuery,
    useSaveStudioBlockedDatesMutation, useStudioOwnerStudioListQuery
} from '@/redux/studios/studiosApi';
import ReusableCalendarInput from './ReusableCalendarInput';
import { getTodayIsoLocal } from '@/helpers/formatDate';

const formatDisplayDate = (value) => {
    if (!value) return 'DD-MM-YYYY';

    const [year, month, dayPart] = value.split('-');

    if (!year || !month || !dayPart) return 'DD-MM-YYYY';
    return `${dayPart.substring(0, 2)}-${month}-${year}`;
};

const normalizeDateString = (value) => {
    if (!value) return '';
    const normalized = String(value).match(/^\d{4}-\d{2}-\d{2}/);
    return normalized?.[0] || '';
};

const ViewBlockDates = () => {
    const [selectedStudio, setSelectedStudio] = useState('');
    const [isBlockStudioAvailabilityOpen, setIsBlockStudioAvailabilityOpen] = useState(false);
    const [isStudioDropdownOpen, setIsStudioDropdownOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState('');
    const [selectedBlockDates, setSelectedBlockDates] = useState([]);
    const [removeBlockedDate] = useDeleteStudioBlockedDatesMutation();

    const studioDropdownRef = useRef(null);

    const { data } = useStudioOwnerStudioListQuery();
    const studioList = data?.data?.data;
    const {
        data: studioDates,
        refetch: refetchStudioDates,
    } = useGetStudioBlockedDatesQuery(selectedStudio, { skip: !selectedStudio });
    const [saveStudioBlockedDates, { isLoading: isSavingBlockedDates }] = useSaveStudioBlockedDatesMutation();

    const selectedStudioName = useMemo(() => {
        if (!selectedStudio) return 'Studio Name';

        const matchedStudio = studioList?.find(
            (studio) => String(studio?.id) === String(selectedStudio)
        );

        return matchedStudio?.name || 'Studio Name';
    }, [selectedStudio, studioList]);

    const existingBlockedDates = useMemo(() => {
        if (!Array.isArray(studioDates?.data)) return [];

        return studioDates.data
            .map((item) => normalizeDateString(item?.blockedDate ?? item))
            .filter(Boolean);
    }, [studioDates]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (studioDropdownRef.current && !studioDropdownRef.current.contains(event.target)) {
                setIsStudioDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddMoreDate = () => {
        const normalizedDate = normalizeDateString(currentDate);

        if (!normalizedDate) {
            showErrorToast('Please select a date first.');
            return;
        }

        if (selectedBlockDates.includes(normalizedDate)) {
            showErrorToast('This date is already added.');
            return;
        }

        setSelectedBlockDates((prev) => [...prev, normalizedDate]);
        setCurrentDate('');
    };

    const handleRemoveDate = (dateToRemove) => {
        setSelectedBlockDates((prev) => prev.filter((date) => date !== dateToRemove));
    };

    const deleteBlockedDate = (date) => {
        removeBlockedDate({
            studioId: selectedStudio,
            blockedDates: [date],
        });
        refetchStudioDates();
    }

    const handleSaveBlockedDates = async () => {
        if (!selectedStudio) {
            showErrorToast('Please select a studio first.');
            return;
        }

        if (selectedBlockDates.length === 0) {
            showErrorToast('Please add at least one date.');
            return;
        }

        try {
            const response = await saveStudioBlockedDates({
                studioId: selectedStudio,
                blockedDates: selectedBlockDates,
            }).unwrap();

            showSuccessToast(response?.message || 'Blocked dates saved successfully.');
            setSelectedBlockDates([]);
            setCurrentDate('');
            refetchStudioDates();
        } catch (error) {
            showErrorToast(error?.data?.message || 'Failed to save blocked dates.');
        }
    };


    return (
        <section className="w-full pt-15">
            <div className="relative mx-auto flex w-full max-w-330 flex-col gap-6 px-4 lg:flex-row lg:items-start lg:gap-8 lg:px-6 mt-5">
                <div className="hidden lg:block">
                    <Navbar />
                </div>

                <section className="w-full overflow-hidden rounded-3xl border border-[#e8e8ef] bg-white shadow-[0_10px_36px_rgba(42,48,82,0.08)] lg:max-w-232.5">
                    <div className="px-5 pt-3 sm:px-8 sm:pt-6 flex justify-between items-center">
                        <h2 className="text-[20px] font-semibold text-[#6257eb]">View Blocked Dates</h2>
                        <div className="block lg:hidden">
                            <Navbar />
                        </div>
                        <p className="max-w-[320px] text-[14px] leading-5 text-[#5f5d6f] md:justify-self-end hidden lg:block">
                            Review the dates when your studio is unavailable for bookings.
                        </p>
                    </div>

                    <div className="mt-1 sm:mt-4 border-t border-dashed border-[#e3e2ec]" />
                    <div className="px-5 pb-8 pt-6 sm:px-8 sm:pb-10 w-full">
                        <div className="mx-auto w-full max-w-90">
                            <label className="mb-2 block text-[15px] font-medium text-[#56536a]">
                                Select your Studio
                            </label>

                            <div className="relative" ref={studioDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsStudioDropdownOpen((prev) => !prev)}
                                    className="flex h-12 w-full items-center justify-between rounded-full border border-[#dbd9e7] bg-[#f6f6f8] px-5 pr-4 text-left text-[14px] font-medium text-[#454353] shadow-[0_7px_16px_rgba(46,35,85,0.08)] outline-none cursor-pointer"
                                    aria-haspopup="listbox"
                                    aria-expanded={isStudioDropdownOpen}
                                >
                                    <span>{selectedStudioName}</span>

                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`text-[#7c7891] transition-transform duration-200 ease-out ${isStudioDropdownOpen ? 'rotate-180' : ''}`}
                                    >
                                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>

                                <div
                                    className={`absolute left-0 right-0 z-40 mt-2 origin-top overflow-hidden rounded-2xl border border-[#dbd9e7] bg-white shadow-[0_10px_24px_rgba(46,35,85,0.16)] transition-all duration-200 ease-out ${isStudioDropdownOpen
                                        ? 'pointer-events-auto max-h-64 translate-y-0 opacity-100'
                                        : 'pointer-events-none max-h-0 -translate-y-1 opacity-0'
                                        }`}
                                >
                                    <div className="max-h-35 overflow-y-auto py-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedStudio('');
                                                setCurrentDate('');
                                                setSelectedBlockDates([]);
                                                setIsStudioDropdownOpen(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-[14px] text-[#454353] transition-colors hover:bg-[#f3f2ff] cursor-pointer"
                                        >
                                            Studio Name
                                        </button>

                                        {studioList && studioList.map((studio) => (
                                            <button
                                                key={studio.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedStudio(String(studio.id));
                                                    setCurrentDate('');
                                                    setSelectedBlockDates([]);
                                                    setIsStudioDropdownOpen(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-[14px] text-[#454353] transition-colors hover:bg-[#f3f2ff] cursor-pointer"
                                            >
                                                {studio.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mx-auto mt-10 max-w-full">
                            <div className="grid grid-cols-2 items-center justify-center gap-3 sm:flex sm:flex-wrap">
                                {existingBlockedDates.length > 0 ? (
                                    existingBlockedDates.map((date) => (
                                        <div
                                            key={date}
                                            className="flex h-11 min-w-0 sm:min-w-32 items-center justify-between rounded-full bg-[#BCB8FF] px-3 text-[11px] sm:text-[13px] font-medium text-[#262338] shadow-[0_8px_18px_rgba(109,94,246,0.22)]"
                                        >
                                            {formatDisplayDate(date)}
                                            <div
                                                onClick={() => deleteBlockedDate(date)}
                                                className='bg-[#F65E61] rounded-full w-6 h-6 flex items-center justify-center cursor-pointer'
                                            >
                                                <img src='/images/navbar/delete.png' className='w-5 h-5' />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[14px] text-[#6d6a7f]">No blocked dates available for this studio.</p>
                                )}
                            </div>

                            <div className="mt-4 flex justify-center md:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsBlockStudioAvailabilityOpen(true)}
                                    disabled={isBlockStudioAvailabilityOpen || !selectedStudio}
                                    className={`h-10 rounded-full px-6 text-[15px] font-medium text-white shadow-[0_14px_26px_rgba(42,42,42,0.26)] ${isBlockStudioAvailabilityOpen || !selectedStudio
                                        ? 'cursor-not-allowed opacity-50 bg-linear-to-r from-[#222222] to-[#4f4f4f]'
                                        : 'cursor-pointer bg-linear-to-r from-[#222222] to-[#4f4f4f]'
                                        }`}
                                >
                                    + Add Block Date
                                </button>
                            </div>

                            {isBlockStudioAvailabilityOpen && (
                                <section className="mt-7 border-t border-dashed border-[#e3e2ec] pt-5 h-110">
                                    <div className="grid gap-2 md:grid-cols-[1fr_1fr] md:items-center">
                                        <h3 className="text-[18px] leading-9 font-semibold text-[#313131]">Block Studio Availability</h3>
                                        <p className="max-w-105 text-[15px] leading-5 text-[#3f3d4d] md:justify-self-end">
                                            Temporarily make your studio unavailable for specific dates.
                                        </p>
                                    </div>

                                    <div className="flex gap-5 justify-center md:items-center mt-4">
                                        <span className='text-[15px] leading-5 text-[#3f3d4d]'>Select Date</span>

                                        <div className="relative w-full max-w-37">
                                            <ReusableCalendarInput
                                                value={currentDate}
                                                onChange={(value) => setCurrentDate(normalizeDateString(value))}
                                                triggerClassName="flex h-10 w-full cursor-pointer items-center justify-between rounded-full border border-[#d9d9df] bg-[#f6f6f7] px-5 text-left text-[12px] font-medium text-[#4a4759] shadow-[0_8px_18px_rgba(109,94,246,0.12)]"
                                                textClassName="text-[12px] font-medium text-[#4a4759]"
                                                formatDisplayDate={formatDisplayDate}
                                                allowClear={false}
                                                minDate={getTodayIsoLocal()}
                                            />
                                        </div>

                                    </div>
                                    <div className="flex flex-wrap items-start justify-center gap-2 mt-5">
                                        <div className='grid grid-cols-2 w-65 gap-2 max-h-40 overflow-y-auto overflow-x-hidden'>
                                            {selectedBlockDates.map((date) => (
                                                <div
                                                    key={date}
                                                    className="flex h-10 items-center justify-between rounded-full bg-[#eeecff] px-3 text-[13px] font-medium text-[#3f3b55]"
                                                >
                                                    {formatDisplayDate(date)}
                                                    <div
                                                        onClick={() => handleRemoveDate(date)}
                                                        className='bg-[#F65E61] rounded-full w-6 h-6 flex items-center justify-center cursor-pointer'
                                                    >
                                                        <img src='/images/navbar/delete.png' className='w-5 h-5' />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleAddMoreDate}
                                            disabled={!currentDate}
                                            className={`h-10 rounded-full px-3 text-[14px] font-medium text-white shadow-[0_14px_26px_rgba(42,42,42,0.26)] ${currentDate
                                                ? 'cursor-pointer bg-linear-to-r from-[#222222] to-[#4f4f4f]'
                                                : 'cursor-not-allowed bg-linear-to-r from-[#5f5f5f] to-[#7a7a7a]'
                                                }`}
                                        >
                                            + Add
                                        </button>

                                    </div>

                                    <div className="mt-8 border-t border-dashed border-[#e3e2ec] pt-6">
                                        <div className="flex justify-center md:justify-end">
                                            <button
                                                type="button"
                                                onClick={handleSaveBlockedDates}
                                                disabled={isSavingBlockedDates || selectedBlockDates.length === 0 || !selectedStudio}
                                                className={`h-12 w-full max-w-65 rounded-full text-[16px] font-medium text-white ${isSavingBlockedDates || selectedBlockDates.length === 0 || !selectedStudio
                                                    ? 'cursor-not-allowed bg-linear-to-r from-[#4e60b9] to-[#7f72f4] opacity-60'
                                                    : 'cursor-pointer bg-linear-to-r from-[#24449d] to-[#6a5cf4]'
                                                    }`}
                                            >
                                                {isSavingBlockedDates ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            <div className="mx-auto mt-7 max-w-full px-0 sm:px-0">
                <Footer />
            </div>
        </section>
    );
};

export default ViewBlockDates;