"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toIsoDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const parseIsoToDate = (iso = "") => {
    const [year, month, day] = String(iso).split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

const getMonthStartIso = (isoDate = "") => {
    const parsed = parseIsoToDate(isoDate);
    if (!parsed) return "";
    return toIsoDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
};

const defaultFormatDate = (value = "") => {
    if (!value) return "DD-MM-YYYY";
    const [year, month, day] = String(value).split("-");
    if (!year || !month || !day) return value;
    return `${day}-${month}-${year}`;
};

const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const ReusableCalendarInput = ({
    value,
    onChange,
    minDate,
    maxDate,
    placeholder = "DD-MM-YYYY",
    formatDisplayDate = defaultFormatDate,
    className = "",
    triggerClassName = "",
    textClassName = "",
    popoverClassName = "",
    iconSrc = "/images/navbar/bookings.png",
    iconClassName = "h-5 w-5 opacity-70",
    showIcon = true,
    allowClear = true,
    clearLabel = "Clear",
    onOpen,
}) => {
    const todayIso = useMemo(() => toIsoDate(new Date()), []);
    const effectiveMinDate = minDate || "2026-01-01";
    const anchorDate = value || effectiveMinDate || todayIso;

    const [isOpen, setIsOpen] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => getMonthStartIso(anchorDate));
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!isOpen || typeof document === "undefined") return;

        const handleOutsideClick = (event) => {
            if (!wrapperRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [isOpen]);

    useEffect(() => {
        const nextAnchor = value || effectiveMinDate || todayIso;
        if (nextAnchor) {
            setCalendarMonth(getMonthStartIso(nextAnchor));
        }
    }, [value, effectiveMinDate, todayIso]);

    const currentMonthDate = useMemo(
        () => parseIsoToDate(calendarMonth) || parseIsoToDate(anchorDate) || new Date(),
        [calendarMonth, anchorDate]
    );

    const monthLabel = useMemo(
        () => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(currentMonthDate),
        [currentMonthDate]
    );

    const minMonthIso = getMonthStartIso(effectiveMinDate || "");
    const maxMonthIso = getMonthStartIso(maxDate || "");
    const canGoToPreviousMonth = !minMonthIso || calendarMonth > minMonthIso;
    const canGoToNextMonth = !maxMonthIso || calendarMonth < maxMonthIso;

    const calendarDays = useMemo(() => {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();
        const firstWeekDay = new Date(year, month, 1).getDay();
        const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
        const daysInPreviousMonth = new Date(year, month, 0).getDate();
        const days = [];

        for (let i = firstWeekDay - 1; i >= 0; i -= 1) {
            const dayNumber = daysInPreviousMonth - i;
            const date = new Date(year, month - 1, dayNumber);
            days.push({ iso: toIsoDate(date), day: dayNumber, isCurrentMonth: false });
        }

        for (let day = 1; day <= daysInCurrentMonth; day += 1) {
            const date = new Date(year, month, day);
            days.push({ iso: toIsoDate(date), day, isCurrentMonth: true });
        }

        let nextMonthDay = 1;
        while (days.length < 42) {
            const date = new Date(year, month + 1, nextMonthDay);
            days.push({ iso: toIsoDate(date), day: nextMonthDay, isCurrentMonth: false });
            nextMonthDay += 1;
        }

        return days.map((item) => {
            const beforeMin = effectiveMinDate ? item.iso < effectiveMinDate : false;
            const afterMax = maxDate ? item.iso > maxDate : false;

            return {
                ...item,
                isSelected: item.iso === value,
                isDisabled: !item.isCurrentMonth || beforeMin || afterMax,
            };
        });
    }, [currentMonthDate, effectiveMinDate, maxDate, value]);

    const handlePreviousMonth = () => {
        if (!canGoToPreviousMonth) return;
        setCalendarMonth(toIsoDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1)));
    };

    const handleNextMonth = () => {
        if (!canGoToNextMonth) return;
        setCalendarMonth(toIsoDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1)));
    };

    const toggleCalendar = () => {
        onOpen?.();
        setIsOpen((prev) => !prev);
    };

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const startYear = minDate ? parseIsoToDate(minDate).getFullYear() : currentYear - 10;
        const endYear = maxDate ? parseIsoToDate(maxDate).getFullYear() : currentYear;
        const arr = [];
        for (let y = startYear; y <= endYear; y++) arr.push(y);
        return arr;
    }, [minDate, maxDate]);

    const months = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const selectedYear = currentMonthDate.getFullYear();

        return Array.from({ length: 12 }, (_, i) => ({
            index: i,
            name: new Date(2000, i, 1).toLocaleString("en-US", { month: "short" }),
            disabled: selectedYear >= currentYear && i > currentMonth
        }));
    }, [currentMonthDate]);

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={toggleCalendar}
                className={`flex h-12 w-full items-center rounded-full border border-[#D8DAE2] bg-[#F3F3F4] px-4 shadow-[0_4px_14px_rgba(37,40,61,0.12)] cursor-pointer ${triggerClassName}`}
            >
                {showIcon ? <img src={iconSrc} alt="calendar" className={iconClassName} /> : null}
                <span className={`ml-2 text-sm font-medium text-[#2E3147] ${textClassName}`}>
                    {value ? formatDisplayDate(value) : placeholder}
                </span>
            </button>

            {isOpen ? (
                <div className={`absolute left-15 -translate-x-1/2 md:left-0 md:translate-x-0 top-14 z-30 w-72.5 rounded-xl border border-[#3E4058] bg-[#252739] p-3 shadow-[0_14px_35px_rgba(15,16,28,0.45)] ${popoverClassName}`}>
                    <div className="mb-3 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handlePreviousMonth}
                            disabled={!canGoToPreviousMonth}
                            className="h-7 w-7 rounded-md text-[#A0A4BD] hover:bg-[#31344A] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Previous month"
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsPickerOpen(!isPickerOpen)}
                            className="rounded-md border border-[#686C83] px-3 py-1 text-sm font-medium text-[#ECEEFD] hover:bg-[#31344A]"
                        >
                            {monthLabel}
                        </button>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            disabled={!canGoToNextMonth}
                            className="h-7 w-7 rounded-md text-[#A0A4BD] hover:bg-[#31344A] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Next month"
                        >
                            ›
                        </button>
                    </div>

                    {isPickerOpen ? (
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] uppercase text-[#7F839C] font-bold mb-1">Month</p>
                                {months.map((m) => (
                                    <button
                                        key={m.index}
                                        type="button"
                                        disabled={m.disabled}
                                        onClick={() => {
                                            setCalendarMonth(toIsoDate(new Date(currentMonthDate.getFullYear(), m.index, 1)));
                                            setIsPickerOpen(false);
                                        }}
                                        className={`text-left px-2 py-1 rounded text-xs ${currentMonthDate.getMonth() === m.index ? "bg-[#10D8F9] text-[#0E2341]" : m.disabled ? "text-[#585C74] cursor-not-allowed" : "text-[#DCE0F6] hover:bg-[#34374D]"}`}
                                    >
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] uppercase text-[#7F839C] font-bold mb-1">Year</p>
                                {years.map((y) => (
                                    <button
                                        key={y}
                                        type="button"
                                        onClick={() => {
                                            setCalendarMonth(toIsoDate(new Date(y, currentMonthDate.getMonth(), 1)));
                                            setIsPickerOpen(false);
                                        }}
                                        className={`text-left px-2 py-1 rounded text-xs ${currentMonthDate.getFullYear() === y ? "bg-[#10D8F9] text-[#0E2341]" : "text-[#DCE0F6] hover:bg-[#34374D]"}`}
                                    >
                                        {y}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
                            {WEEK_DAYS.map((day) => (
                                <span key={day} className="text-[#7F839C]">
                                    {day}
                                </span>
                            ))}

                            {calendarDays.map((day) => (
                                <button
                                    key={day.iso}
                                    type="button"
                                    disabled={day.isDisabled}
                                    onClick={() => {
                                        onChange?.(day.iso);
                                        setIsOpen(false);
                                    }}
                                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-md text-base ${day.isSelected
                                        ? "bg-[#10D8F9] text-[#0E2341] shadow-[0_0_0_2px_#0AAFD1_inset]"
                                        : day.isDisabled
                                            ? "cursor-not-allowed text-[#585C74]"
                                            : "text-[#DCE0F6] hover:bg-[#34374D]"
                                        }`}
                                >
                                    {day.day}
                                </button>
                            ))}
                        </div>
                    )}

                    {allowClear && !isPickerOpen ? (
                        <button
                            type="button"
                            onClick={() => {
                                onChange?.("");
                                setIsOpen(false);
                            }}
                            className="mt-3 rounded-md border border-[#6F7287] px-3 py-1 text-sm font-semibold text-[#E7E9F9] hover:bg-[#34374D]"
                        >
                            {clearLabel}
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

export default ReusableCalendarInput;