"use client";

import React, { useEffect } from "react";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";
import { useOfflineBookingMutation } from "@/redux/studio-owner/studioOwnerApi";
import { showErrorToast, showSuccessToast } from "@/helpers/toast";
import ReusableCalendarInput from "@/components/ReusableCalendarInput";
import { useSlotListQuery } from "@/redux/bookings/bookingsApi";

const FieldInput = ({ placeholder, className = "", icon, value, onChange, type = "text", ...inputProps }) => (
    <div
        className={`flex h-10 items-center gap-2 rounded-full border border-[#d3d3dc] bg-[#f6f6f8] px-5 text-[22px] text-[#8f8fa0] shadow-[0_2px_8px_rgba(45,45,75,0.08)] ${className}`}
    >
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-transparent text-[14px] leading-none text-[#3f3f4e] outline-none placeholder:text-[#8f8fa0]"
            {...inputProps}
        />
    </div>
);

const PriceIcon = ({ children }) => (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-[#7f75ff] text-[#7f75ff]">
        {children}
    </span>
);

const timeToMinutes = (value) => {
    if (!value || typeof value !== "string") return null;

    const trimmed = value.trim().toUpperCase();
    if (!trimmed) return null;

    // Supports minute payloads like "540"
    if (/^\d+$/.test(trimmed)) {
        const totalMinutes = Number(trimmed);
        return Number.isNaN(totalMinutes) ? null : totalMinutes;
    }

    // Supports: "02:00 PM", "2:00PM", "14:00", "14:00:00"
    const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/);
    if (!match) return null;

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const meridiem = match[3];

    if (Number.isNaN(hour) || Number.isNaN(minute) || minute < 0 || minute > 59) return null;

    if (meridiem) {
        if (hour < 1 || hour > 12) return null;
        hour = hour % 12;
        if (meridiem === "PM") hour += 12;
    } else {
        if (hour < 0 || hour > 23) return null;
    }

    return hour * 60 + minute;
};

const minutesToTimeInputValue = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "";
    const totalMinutes = Number(value);
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    const hours = String(Math.floor(normalized / 60)).padStart(2, "0");
    const minutes = String(normalized % 60).padStart(2, "0");
    return `${hours}:${minutes}`;
};

const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return amount.toLocaleString("en-IN", {
        minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
        maximumFractionDigits: 2,
    });
};

const formatDateForDisplay = (value) => {
    if (!value) return "DD-MM-YYYY";
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return "DD-MM-YYYY";
    return `${day}-${month}-${year}`;
};

const isSlotAvailable = (slot) => slot?.status === "available";

const OfflineBookingModal = ({ isOpen, onClose, onConfirm, studioDetails }) => {
    const [startTime, setStartTime] = React.useState("");
    const [endTime, setEndTime] = React.useState("");
    const [bookingDate, setBookingDate] = React.useState("");
    const [customAmount, setCustomAmount] = React.useState("");
    const [paymentMethod, setPaymentMethod] = React.useState("cash");
    const [notes, setNotes] = React.useState("");
    const [guestName, setGuestName] = React.useState("");
    const [guestPhone, setGuestPhone] = React.useState("");
    const [guestEmail, setGuestEmail] = React.useState("");
    const [showConfirmModal, setShowConfirmModal] = React.useState(false);
    const [selectedSlots, setSelectedSlots] = React.useState([]);
    const slotParams = React.useMemo(() => ({ id: studioDetails?.id, date: bookingDate }), [studioDetails?.id, bookingDate]);
    const { data: slotsData, refetch } = useSlotListQuery(slotParams, {
        skip: !slotParams?.id || !slotParams?.date,
    });
    const [addOfflineBooking] = useOfflineBookingMutation()
    useBodyScrollLock(isOpen);

    const allSlots = React.useMemo(
        () => (bookingDate ? slotsData?.data?.slots || [] : []),
        [bookingDate, slotsData?.data?.slots]
    );
    const availableSlots = React.useMemo(
        () => allSlots.filter((slot) => isSlotAvailable(slot)),
        [allSlots]
    );
    const unavailableSlots = React.useMemo(
        () => allSlots.filter((slot) => !isSlotAvailable(slot)),
        [allSlots]
    );

    const minStartTime = React.useMemo(() => {
        if (!availableSlots.length) return "";
        const firstAvailableStart = Math.min(
            ...availableSlots
                .map((slot) => timeToMinutes(slot?.startTimeFormatted || slot?.startTime))
                .filter((minutes) => minutes !== null)
        );

        return Number.isFinite(firstAvailableStart) ? minutesToTimeInputValue(firstAvailableStart) : "";
    }, [availableSlots]);

    const maxEndTime = React.useMemo(() => {
        if (!allSlots.length) return "";
        const lastSlotEnd = Math.max(
            ...allSlots
                .map((slot) => timeToMinutes(slot?.endTimeFormatted || slot?.endTime))
                .filter((minutes) => minutes !== null)
        );

        return Number.isFinite(lastSlotEnd) ? minutesToTimeInputValue(lastSlotEnd) : "";
    }, [allSlots]);

    const startTimeOptions = React.useMemo(() => {
        const unique = new Map();

        availableSlots.forEach((slot) => {
            const normalizedValue = minutesToTimeInputValue(
                timeToMinutes(slot?.startTimeFormatted || slot?.startTime)
            );
            if (!normalizedValue) return;

            if (!unique.has(normalizedValue)) {
                unique.set(normalizedValue, slot?.startTimeFormatted || normalizedValue);
            }
        });

        return Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
    }, [availableSlots]);

    const endTimeOptions = React.useMemo(() => {
        const unique = new Map();

        availableSlots.forEach((slot) => {
            const normalizedValue = minutesToTimeInputValue(
                timeToMinutes(slot?.endTimeFormatted || slot?.endTime)
            );
            if (!normalizedValue) return;

            if (!unique.has(normalizedValue)) {
                unique.set(normalizedValue, slot?.endTimeFormatted || normalizedValue);
            }
        });

        return Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
    }, [availableSlots]);

    const filteredEndTimeOptions = React.useMemo(() => {
        const startMinutes = timeToMinutes(startTime);
        if (startMinutes === null) return endTimeOptions;

        const startIndex = allSlots.findIndex((slot) => {
            if (!isSlotAvailable(slot)) return false;
            const slotStartMinutes = timeToMinutes(slot?.startTimeFormatted || slot?.startTime);
            return slotStartMinutes === startMinutes;
        });

        if (startIndex === -1) return [];

        const contiguousEndOptions = [];
        for (let index = startIndex; index < allSlots.length; index += 1) {
            const slot = allSlots[index];
            if (!isSlotAvailable(slot)) break;

            const value = minutesToTimeInputValue(timeToMinutes(slot?.endTimeFormatted || slot?.endTime));
            if (!value) continue;

            contiguousEndOptions.push({
                value,
                label: slot?.endTimeFormatted || value,
            });
        }

        return contiguousEndOptions;
    }, [allSlots, endTimeOptions, startTime]);

    const getSlotsInSelectedRange = React.useCallback((rangeStartTime, rangeEndTime) => {
        const startMinutes = timeToMinutes(rangeStartTime);
        const endMinutes = timeToMinutes(rangeEndTime);

        if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
            return [];
        }

        return allSlots
            .filter((slot) => {
                const slotStart = timeToMinutes(slot?.startTimeFormatted || slot?.startTime);
                const slotEnd = timeToMinutes(slot?.endTimeFormatted || slot?.endTime);

                if (slotStart === null || slotEnd === null) return false;
                return isSlotAvailable(slot) && slotStart >= startMinutes && slotEnd <= endMinutes;
            })
            .sort(
                (a, b) =>
                    timeToMinutes(a?.startTimeFormatted || a?.startTime) -
                    timeToMinutes(b?.startTimeFormatted || b?.startTime)
            );
    }, [allSlots]);

    const { durationHours, basePrice, gstAmount, totalAmount } = React.useMemo(() => {
        const pricePerHour = Number(studioDetails?.basePricePerHour || 0);

        let hours = 0;
        if (selectedSlots.length > 0) {
            hours = selectedSlots.length;
        } else {
            const startInMinutes = timeToMinutes(startTime);
            const endInMinutes = timeToMinutes(endTime);
            if (startInMinutes !== null && endInMinutes !== null && endInMinutes > startInMinutes) {
                hours = (endInMinutes - startInMinutes) / 60;
            }
        }

        if (hours <= 0) {
            return {
                durationHours: 0,
                basePrice: 0,
                gstAmount: 0,
                totalAmount: 0,
            };
        }

        const bookingBasePrice = pricePerHour * hours;
        const gst = bookingBasePrice * 0.18;

        return {
            durationHours: hours,
            basePrice: bookingBasePrice,
            gstAmount: gst,
            totalAmount: bookingBasePrice + gst,
        };
    }, [selectedSlots, endTime, startTime, studioDetails?.basePricePerHour]);

    const customAmountValue = React.useMemo(() => {
        const parsedValue = Number(customAmount);
        if (!Number.isFinite(parsedValue) || parsedValue <= 0) return 0;
        return parsedValue;
    }, [customAmount]);

    const payableAmount = customAmountValue > 0 ? customAmountValue : totalAmount;

    const resetBookingForm = () => {
        setStartTime("");
        setEndTime("");
        setBookingDate("");
        setSelectedSlots([]);
        setGuestName("");
        setGuestPhone("");
        setCustomAmount("");
        setPaymentMethod("cash");
        setNotes("");
        setGuestEmail("");
        setShowConfirmModal(false);
    };

    const handleDateChange = (selectedDate) => {
        setBookingDate(selectedDate);
        setSelectedSlots([]);
        setStartTime("");
        setEndTime("");
    };

    const handleSlotSelection = (slot, index) => {
        if (!isSlotAvailable(slot)) return;

        setSelectedSlots((prevSelected) => {
            const slots = slotsData?.data?.slots || [];
            if (!prevSelected.length) {
                setStartTime(minutesToTimeInputValue(timeToMinutes(slot?.startTimeFormatted || slot?.startTime)));
                setEndTime(minutesToTimeInputValue(timeToMinutes(slot?.endTimeFormatted || slot?.endTime)));
                return [slot];
            }

            const firstSelectedIndex = slots.findIndex((s) => s?.startTime === prevSelected[0]?.startTime);
            const lastSelectedIndex = slots.findIndex((s) => s?.startTime === prevSelected[prevSelected.length - 1]?.startTime);

            if (firstSelectedIndex === -1 || lastSelectedIndex === -1) {
                setStartTime(minutesToTimeInputValue(timeToMinutes(slot?.startTimeFormatted || slot?.startTime)));
                setEndTime(minutesToTimeInputValue(timeToMinutes(slot?.endTimeFormatted || slot?.endTime)));
                return [slot];
            }

            if (index >= firstSelectedIndex && index <= lastSelectedIndex) {
                if (prevSelected.length === 1) {
                    setStartTime("");
                    setEndTime("");
                    return [];
                }

                if (index === firstSelectedIndex) {
                    const nextSelection = slots.slice(firstSelectedIndex + 1, lastSelectedIndex + 1);
                    setStartTime(minutesToTimeInputValue(timeToMinutes(nextSelection[0]?.startTimeFormatted || nextSelection[0]?.startTime)));
                    setEndTime(minutesToTimeInputValue(timeToMinutes(nextSelection[nextSelection.length - 1]?.endTimeFormatted || nextSelection[nextSelection.length - 1]?.endTime)));
                    return nextSelection;
                }

                if (index === lastSelectedIndex) {
                    const nextSelection = slots.slice(firstSelectedIndex, lastSelectedIndex);
                    setStartTime(minutesToTimeInputValue(timeToMinutes(nextSelection[0]?.startTimeFormatted || nextSelection[0]?.startTime)));
                    setEndTime(minutesToTimeInputValue(timeToMinutes(nextSelection[nextSelection.length - 1]?.endTimeFormatted || nextSelection[nextSelection.length - 1]?.endTime)));
                    return nextSelection;
                }

                const nextSelection = slots.slice(firstSelectedIndex, index);
                setStartTime(minutesToTimeInputValue(timeToMinutes(nextSelection[0]?.startTimeFormatted || nextSelection[0]?.startTime)));
                setEndTime(minutesToTimeInputValue(timeToMinutes(nextSelection[nextSelection.length - 1]?.endTimeFormatted || nextSelection[nextSelection.length - 1]?.endTime)));
                return nextSelection;
            }

            const rangeStart = Math.min(index, firstSelectedIndex);
            const rangeEnd = Math.max(index, lastSelectedIndex);
            const candidateRange = slots.slice(rangeStart, rangeEnd + 1);
            const isContinuousAvailableRange = candidateRange.every(isSlotAvailable);

            if (!isContinuousAvailableRange) {
                setStartTime(minutesToTimeInputValue(timeToMinutes(slot?.startTimeFormatted || slot?.startTime)));
                setEndTime(minutesToTimeInputValue(timeToMinutes(slot?.endTimeFormatted || slot?.endTime)));
                return [slot];
            }

            setStartTime(minutesToTimeInputValue(timeToMinutes(candidateRange[0]?.startTimeFormatted || candidateRange[0]?.startTime)));
            setEndTime(minutesToTimeInputValue(timeToMinutes(candidateRange[candidateRange.length - 1]?.endTimeFormatted || candidateRange[candidateRange.length - 1]?.endTime)));
            return candidateRange;
        });
    };

    const getTodayDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleOfflineBookingAdded = async () => {

        const selectedStartMinutes = timeToMinutes(startTime);
        const selectedEndMinutes = timeToMinutes(endTime);
        const minStartMinutes = timeToMinutes(minStartTime);
        const maxEndMinutes = timeToMinutes(maxEndTime);

        if (
            selectedStartMinutes === null ||
            selectedEndMinutes === null ||
            selectedEndMinutes <= selectedStartMinutes
        ) {
            showErrorToast("End time must be greater than start time.");
            return;
        }

        if (minStartMinutes !== null && selectedStartMinutes < minStartMinutes) {
            showErrorToast("Start time cannot be before the first available slot.");
            return;
        }

        if (maxEndMinutes !== null && selectedEndMinutes > maxEndMinutes) {
            showErrorToast("End time cannot be after the last slot.");
            return;
        }

        try {
            await addOfflineBooking({
                studioId: studioDetails?.id,
                bookingDate: bookingDate,
                startTime: selectedStartMinutes,
                endTime: selectedEndMinutes,
                guestName,
                guestPhone,
                ownerNotes: notes?.trim() || "Walk-in, negotiated special rate",
                guestEmail: guestEmail || undefined,
                customAmount: payableAmount > 0 ? payableAmount : 0,
                paymentMethod,
                reference: "Cash collected at front desk"
            }).unwrap();

            setStartTime("");
            setEndTime("");
            setBookingDate("");
            setSelectedSlots([]);
            setGuestName("");
            setGuestPhone("");
            setGuestEmail("");
            setCustomAmount("");
            setPaymentMethod("cash");
            setNotes("");
            refetch();

            showSuccessToast("Offline booking added successfully.");
            setShowConfirmModal(false);
            onConfirm();
        } catch (error) {
            showErrorToast(error?.data?.message || "Failed to add offline booking.");
        }
    }

    const handleOfflineButton = () => {
        if (!guestName || !guestPhone || !bookingDate || !startTime || !endTime) {
            showErrorToast("Please fill in all required fields.");
            return;
        }

        if (selectedSlots.length === 0) {
            showErrorToast("Please select at least one slot.");
            return;
        }

        setShowConfirmModal(true)
    }


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-99 flex items-center justify-center bg-[#20223380] px-3 py-4" onClick={() => {
            resetBookingForm();
            onClose();
        }}>
            <div
                className="relative h-190 w-194 max-h-[calc(100vh-32px)] max-w-[calc(100vw-24px)] overflow-y-auto rounded-2xl bg-white px-7 pb-5 pt-4 shadow-[0_26px_55px_rgba(23,31,75,0.32)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="sticky -top-4 z-10 -mx-7 bg-white px-7 pb-2 pt-4">
                    <button
                        type="button"
                        onClick={() => {
                            resetBookingForm();
                            onClose();
                        }}
                        className="absolute right-4 top-2 text-[27px] leading-none text-[#6e63f5] cursor-pointer"
                        aria-label="Close offline booking modal"
                    >
                        ×
                    </button>

                    <h2 className="text-[18px] font-semibold leading-none text-[#2e2e3f]">Add Offline Booking</h2>
                    <p className="mt-2 text-[14px] text-[#5d5d69]">Record a manual booking made outside CoShot.</p>
                </div>

                <div className="mt-2 text-[16px] font-medium text-[#6257eb]">Client Details</div>
                <div className="mt-1 grid grid-cols-1 gap-x-7 gap-y-3 sm:grid-cols-2">
                    <div>
                        <p className="mb-1 text-[16px] text-[#3f3f4e]">Client Name</p>
                        <FieldInput placeholder="Client Name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                    </div>
                    <div>
                        <p className="mb-1 text-[16px] text-[#3f3f4e]">Phone Number</p>
                        <FieldInput
                            placeholder="Phone Number"
                            value={guestPhone}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setGuestPhone(val);
                            }}
                        />
                    </div>
                    <div className="sm:col-span-1">
                        <p className="mb-1 text-[16px] text-[#3f3f4e]">Email <span className="italic">(Optional)</span></p>
                        <FieldInput placeholder="Email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
                    </div>
                </div>

                <div className="mt-2 text-[16px] font-medium text-[#6257eb]">Booking Date</div>
                <div className="mt-0 grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-start">
                    <div className="sm:col-span-6">
                        <p className="mb-1 text-[16px] text-[#3f3f4e]">Select Date</p>
                        <ReusableCalendarInput
                            value={bookingDate}
                            onChange={handleDateChange}
                            triggerClassName="flex h-10 w-full items-center gap-2 rounded-full border border-[#d3d3dc] bg-[#f6f6f8] px-5 text-[14px] text-[#8f8fa0] shadow-[0_2px_8px_rgba(45,45,75,0.08)]"
                            textClassName="text-[14px] text-[#8f8fa0]"
                            formatDisplayDate={formatDateForDisplay}
                            allowClear={false}
                            minDate={getTodayDate()}
                        />
                        {!bookingDate ? (
                            <div className="text-center mt-4 font-semibold">
                                Please select a date to view available slots.
                            </div>
                        ) : null}
                    </div>
                    <div className="sm:col-span-6">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <p className="mb-1 text-[16px] text-[#3f3f4e]">Start Time</p>
                                <div className="flex h-10 w-full items-center rounded-full border border-[#d3d3dc] bg-[#f6f6f8] px-5 text-[14px] text-[#3f3f4e] shadow-[0_2px_8px_rgba(45,45,75,0.08)]">
                                    <select
                                        value={startTime}
                                        onChange={(e) => {
                                            const nextStartTime = e.target.value;
                                            setStartTime(nextStartTime);

                                            const nextStartMinutes = timeToMinutes(nextStartTime);
                                            const currentEndMinutes = timeToMinutes(endTime);
                                            if (
                                                nextStartMinutes !== null &&
                                                currentEndMinutes !== null &&
                                                currentEndMinutes <= nextStartMinutes
                                            ) {
                                                setEndTime("");
                                                setSelectedSlots([]);
                                                return;
                                            }

                                            if (!nextStartTime || !endTime) {
                                                setSelectedSlots([]);
                                                return;
                                            }

                                            setSelectedSlots(getSlotsInSelectedRange(nextStartTime, endTime));
                                        }}
                                        className="w-full bg-transparent outline-none"
                                    >
                                        <option value="">HH:MM</option>
                                        {startTimeOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <p className="mb-1 text-[16px] text-[#3f3f4e]">End Time</p>
                                <div className="flex h-10 w-full items-center rounded-full border border-[#d3d3dc] bg-[#f6f6f8] px-5 text-[14px] text-[#3f3f4e] shadow-[0_2px_8px_rgba(45,45,75,0.08)]">
                                    <select
                                        value={endTime}
                                        onChange={(e) => {
                                            const nextEndTime = e.target.value;
                                            setEndTime(nextEndTime);

                                            if (!startTime || !nextEndTime) {
                                                setSelectedSlots([]);
                                                return;
                                            }

                                            setSelectedSlots(getSlotsInSelectedRange(startTime, nextEndTime));
                                        }}
                                        className="w-full bg-transparent outline-none"
                                    >
                                        <option value="">HH:MM</option>
                                        {filteredEndTimeOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <p className="mt-3 text-[16px] text-[#3f3f4e]">Duration : {startTime || "HH:MM"} to {endTime || "HH:MM"}</p>
                    </div>
                </div>
                {bookingDate ? (slotsData ? <>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <h4 className="mb-2 text-[16px] font-medium text-[#6257eb]">Available Slots</h4>
                            {availableSlots.length ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {availableSlots.map((slot) => {
                                        const slotIndex = allSlots.findIndex((s) => s?.startTime === slot?.startTime);
                                        const isSelected = selectedSlots.some((selected) => selected?.startTime === slot?.startTime);

                                        return (
                                            <button
                                                key={slot.startTimeFormatted}
                                                type="button"
                                                className={`flex h-10 w-full items-center justify-center gap-2 rounded-full border text-base font-medium shadow-[0_6px_14px_rgba(56,59,94,0.12)] ${isSelected
                                                    ? "border-[#74D34A] bg-[#74D34A] text-white"
                                                    : "border-[#74D34A] bg-white text-[#2D314D]"
                                                    }`}
                                                onClick={() => handleSlotSelection(slot, slotIndex)}
                                            >
                                                <span className="w-4 h-4"><img src={`/images/booking/${isSelected ? "success" : "clockT"}.png`} alt="" /></span>
                                                {slot.startTimeFormatted}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-[14px] text-[#7a7a8d]">No available slots.</p>
                            )}
                        </div>

                        <div>
                            <h4 className="mb-2 text-[16px] font-medium text-[#6257eb]">Not Available Slots</h4>
                            {unavailableSlots.length ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {unavailableSlots.map((slot) => (
                                        <div
                                            key={slot.startTimeFormatted}
                                            className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#FF6666] bg-white text-base font-medium text-[#2D314D] shadow-[0_6px_14px_rgba(56,59,94,0.12)]"
                                        >
                                            <span className="w-4 h-4"><img src="/images/booking/clockRed.png" alt="booked" /></span>
                                            {slot.startTimeFormatted}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[14px] text-[#7a7a8d]">All slots are available.</p>
                            )}
                        </div>
                    </div>
                </> :
                    <div className="text-center mt-4 font-semibold">
                        No slots available for the selected date.
                    </div>
                ) : null}

                {bookingDate ? <div className="mt-4">
                    <div className="text-[16px] font-medium text-[#6257eb]">Custom Amount</div>
                    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <p className="mb-1 text-[16px] text-[#3f3f4e]">Custom Amount</p>
                            <div className="flex h-10 w-full items-center rounded-full border border-[#d3d3dc] bg-[#f6f6f8] px-5 text-[14px] text-[#3f3f4e] shadow-[0_2px_8px_rgba(45,45,75,0.08)]">
                                <span className="mr-2 text-[#8f8fa0]">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={customAmount}
                                    onChange={(event) => setCustomAmount(event.target.value)}
                                    placeholder="Custom Amount"
                                    onWheel={(e) => e.target.blur()}
                                    className="w-full bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                            </div>
                            <p className="mt-2 text-[14px] italic text-[#4f4f5f]">
                                If you choose the same price as the studio, the studio&apos;s listed price will be applied. If a custom amount is set,
                                the studio price will be overridden.
                            </p>
                        </div>

                        <div>
                            <p className="mb-1 text-[16px] text-[#3f3f4e]">Payment Method</p>
                            <div className="flex h-10 w-full items-center rounded-full border border-[#d3d3dc] bg-[#f6f6f8] px-5 text-[14px] text-[#3f3f4e] shadow-[0_2px_8px_rgba(45,45,75,0.08)]">
                                <select
                                    value={paymentMethod}
                                    onChange={(event) => setPaymentMethod(event.target.value)}
                                    className="w-full cursor-pointer bg-transparent outline-none"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="card">Card</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div> : null}

                {bookingDate ? <div className="mt-4">
                    <p className="mb-2 text-[16px] text-[#3f3f4e]">Notes</p>
                    <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Write notes here..."
                        rows={4}
                        className="w-full rounded-[14px] border border-[#d3d3dc] bg-[#f6f6f8] px-4 py-3 text-[15px] text-[#3f3f4e] shadow-[0_2px_8px_rgba(45,45,75,0.08)] outline-none placeholder:text-[#8f8fa0]"
                    />
                </div> : null}

                <div className="mt-4 text-[16px] font-medium text-[#6257eb]">Pricing</div>
                <div className="mt-1 grid grid-cols-1 gap-y-1 text-[16px] text-[#3f3f4e] sm:grid-cols-3">
                    <p>Price Per Hour: ₹{formatCurrency(studioDetails?.basePricePerHour || 0)}</p>
                    <p className="sm:text-center">Duration: {durationHours > 0 ? `${durationHours} hours` : "0 hours"}</p>
                    <p className="sm:text-right">Base Price: ₹{formatCurrency(basePrice)}</p>
                </div>

                <div className="mt-3 rounded-[10px] bg-[#f1efff] px-4 py-3">
                    <h3 className="text-[18px] font-semibold text-[#323245]">Price Details</h3>
                    <div className="mt-2 space-y-2 text-[16px] text-[#37374a]">
                        <div className="flex items-center justify-between">
                            <p className="flex items-center gap-2 text-[14px]">
                                <PriceIcon>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 8H19M5 12H19M5 16H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                    </svg>
                                </PriceIcon>
                                Base Price
                            </p>
                            <p className="font-semibold">₹{formatCurrency(basePrice)}</p>
                        </div>
                        <div className="flex items-center justify-between font-semibold text-[14px]">
                            <p className="flex items-center gap-2">
                                <PriceIcon>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4 9H20V20H4V9Z" stroke="currentColor" strokeWidth="1.6" />
                                        <path d="M8 9V7.5C8 5.567 9.567 4 11.5 4H12.5C14.433 4 16 5.567 16 7.5V9" stroke="currentColor" strokeWidth="1.6" />
                                    </svg>
                                </PriceIcon>
                                Total Amount
                            </p>
                            <p className="text-[#6157ee]">₹{formatCurrency(payableAmount)}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col items-center">
                    <button
                        type="button"
                        onClick={() => handleOfflineButton()}
                        className="h-12 min-w-63 rounded-full bg-linear-to-r from-[#28439f] to-[#685bf4] px-8 text-[16px] font-medium text-white shadow-[0_14px_26px_rgba(62,77,201,0.32)] cursor-pointer"
                    >
                        Confirm Offline Booking
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            resetBookingForm();
                            onClose();
                        }}
                        className="mt-3 text-[14px] text-[#b8b8c2] cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>

                {showConfirmModal ? (
                    <div
                        className="fixed inset-0 z-120 flex items-center justify-center bg-[#20223380] px-4"
                        onClick={() => setShowConfirmModal(false)}
                    >
                        <div
                            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_22px_48px_rgba(12,18,54,0.35)]"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <h3 className="text-[22px] font-semibold leading-7 text-[#2b2b3f]">Confirm Offline Booking</h3>
                            <p className="mt-2 text-sm font-semibold text-[#5d52e7]">
                                Are you sure you want to confirm this offline booking?
                            </p>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                                <button
                                    type="button"
                                    onClick={handleOfflineBookingAdded}
                                    className="h-11 min-w-52 rounded-full bg-linear-to-r from-[#2f4cc3] to-[#6d5ef6] px-6 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(73,87,230,0.3)] cursor-pointer"
                                >
                                    Yes, Confirm
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmModal(false)}
                                    className="h-11 min-w-44 rounded-full bg-linear-to-r from-[#f65b5a] to-[#e92c5a] px-6 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(235,61,71,0.3)] cursor-pointer"
                                >
                                    No, Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default OfflineBookingModal;
