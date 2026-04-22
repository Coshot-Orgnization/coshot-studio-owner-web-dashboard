"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Footer from "./Footer";
import Navbar from './Navbar';
import { useCreateStudioMutation, useGetStudioDetailsQuery } from "@/redux/studios/studiosApi";
import { showErrorToast, showSuccessToast } from "@/helpers/toast";
import { TIME_OPTIONS } from "@/lists/timeOpts";

const START_TIME_OPTIONS = TIME_OPTIONS.slice(0, -1);

const ToggleSwitch = ({ checked, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`relative h-6 w-10 rounded-full border transition-all duration-200 ${checked
            ? "border-[#8a83ff] bg-[#a39eff]"
            : "border-[#d9d8df] bg-[#ececef]"
            }`}
    >
        <span
            className={`absolute top-0.5 h-4.5 w-4.5 border border-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-200 ${checked ? "left-5  customButtonSwitch" : "left-0.5 bg-white "
                }`}
        />
    </button>
);

const TimeDropdown = ({ value, options, onSelect }) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!dropdownRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    return (
        <div className={`relative w-full ${open ? "z-50" : "z-10"}`} ref={dropdownRef}>
            <button
                onClick={() => setOpen((prev) => !prev)}
                className={`h-11 w-full rounded-full border bg-white px-4 pr-10 text-left text-[14px] text-[#4f4a66] shadow-[0_7px_16px_rgba(46,35,85,0.08)] outline-hidden transition-all duration-200 ${open
                    ? "border-[#8f88ff] shadow-[0_10px_18px_rgba(109,94,246,0.2)]"
                    : "border-[#dfdde7] hover:border-[#cac7de]"
                    }`}
            >
                {value}
            </button>

            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#7c7891] transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
            >
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <div
                className={`absolute left-0 top-full z-50 mt-1.5 w-full overflow-visible rounded-2xl border border-[#e6e4f0] bg-white shadow-[0_14px_35px_rgba(40,33,73,0.16)] transition-all duration-200 ${open
                    ? "pointer-events-auto max-h-56 translate-y-0 opacity-100"
                    : "pointer-events-none max-h-0 -translate-y-1 opacity-0"
                    }`}
            >
                <div className="max-h-56 overflow-auto py-1">
                    {options.map((option) => (
                        <button
                            key={option}
                            style={{
                                color: option === value ? "#4f46e5" : "#4f4a66",
                                WebkitTextFillColor: option === value ? "#4f46e5" : "#4f4a66",
                            }}
                            onClick={() => {
                                onSelect(option);
                                setOpen(false);
                            }}
                            className={`block w-full px-4 py-2 text-left text-[14px] transition-colors duration-150 ${option === value
                                ? "bg-[#f2f0ff] text-[#4f46e5]"
                                : "text-[#4f4a66] hover:bg-[#f7f6fc]"
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ManageAvailability = () => {
    const router = useRouter();
    const [studioId, setStudioId] = useState("");

    useEffect(() => {
        setStudioId(localStorage.getItem("studioId") || "");
    }, []);

    const hasPrefilledRef = useRef(false);
    const [createStudio] = useCreateStudioMutation();
    const [sameHours, setSameHours] = useState(false);
    const { data: studioDetails } = useGetStudioDetailsQuery(studioId, {
        skip: !studioId,
        refetchOnMountOrArgChange: true,
    });

    const [days, setDays] = useState([
        { dayOfWeek: 0, key: "monday", label: "Monday", active: true, startTime: "9:00 AM", endTime: "6:00 PM" },
        { dayOfWeek: 1, key: "tuesday", label: "Tuesday", active: false, startTime: "", endTime: "" },
        { dayOfWeek: 2, key: "wednesday", label: "Wednesday", active: false, startTime: "", endTime: "" },
        { dayOfWeek: 3, key: "thursday", label: "Thursday", active: false, startTime: "", endTime: "" },
        { dayOfWeek: 4, key: "friday", label: "Friday", active: false, startTime: "", endTime: "" },
        { dayOfWeek: 5, key: "saturday", label: "Saturday", active: false, startTime: "", endTime: "" },
        { dayOfWeek: 6, key: "sunday", label: "Sunday", active: false, startTime: "", endTime: "" },
    ]);

    const convertMinutesToTime = (minutes) => {
        const value = Number(minutes);
        if (!Number.isFinite(value)) return "";

        const safeMinutes = ((value % 1440) + 1440) % 1440;
        const hour24 = Math.floor(safeMinutes / 60);
        const minute = safeMinutes % 60;
        const meridian = hour24 >= 12 ? "PM" : "AM";
        const hour12 = hour24 % 12 || 12;

        return `${hour12}:${String(minute).padStart(2, "0")} ${meridian}`;
    };

    useEffect(() => {
        if (hasPrefilledRef.current || !studioDetails?.data) return;
        hasPrefilledRef.current = true;

        const operatingHours = Array.isArray(studioDetails?.data?.operatingHours)
            ? studioDetails.data.operatingHours
            : [];

        if (operatingHours.length === 0) {
            return;
        }

        queueMicrotask(() => {
            setDays((prevDays) => {
                const nextDays = prevDays.map((defaultDay) => {
                    const matchedDay = operatingHours.find((item) => Number(item?.dayOfWeek) === defaultDay.dayOfWeek);

                    if (!matchedDay) return defaultDay;

                    const isClosed = Boolean(matchedDay?.isClosed);

                    return {
                        ...defaultDay,
                        active: !isClosed,
                        startTime: !isClosed ? convertMinutesToTime(matchedDay?.opensAt) || defaultDay.startTime : "",
                        endTime: !isClosed ? convertMinutesToTime(matchedDay?.closesAt) || defaultDay.endTime : "",
                    };
                });

                const activeDays = nextDays.filter((day) => day.active);
                const hasUniformHours =
                    activeDays.length > 1 &&
                    activeDays.every(
                        (day) =>
                            day.startTime === activeDays[0].startTime &&
                            day.endTime === activeDays[0].endTime
                    );
                setSameHours(hasUniformHours);

                return nextDays;
            });
        });
    }, [studioDetails]);

    const primaryTimes = useMemo(() => {
        const firstActive = days.find((day) => day.active);
        return {
            startTime: firstActive?.startTime || "9:00 AM",
            endTime: firstActive?.endTime || "6:00 PM",
        };
    }, [days]);

    const toggleDay = (key) => {
        setDays((prev) => {
            let manuallyClosedDay = false;

            const nextDays = prev.map((day) => {
                if (day.key !== key) return day;
                if (!day.active) {
                    return {
                        ...day,
                        active: true,
                        startTime: sameHours ? primaryTimes.startTime : day.startTime || "9:00 AM",
                        endTime: sameHours ? primaryTimes.endTime : day.endTime || "6:00 PM",
                    };
                }

                manuallyClosedDay = true;
                return {
                    ...day,
                    active: false,
                    startTime: "",
                    endTime: "",
                };
            });

            if (sameHours && manuallyClosedDay) {
                setSameHours(false);
            }

            return nextDays;
        });
    };

    const handleSameHours = () => {
        setSameHours((prev) => {
            const next = !prev;

            if (next) {
                // When enabling "Same Hours", activate all days with primary times
                setDays((current) =>
                    current.map((day) => ({
                        ...day,
                        active: true,
                        startTime: primaryTimes.startTime,
                        endTime: primaryTimes.endTime,
                    }))
                );
            } else {
                // When disabling "Same Hours", deactivate all days
                setDays((current) =>
                    current.map((day) => ({
                        ...day,
                        active: false,
                        startTime: "",
                        endTime: "",
                    }))
                );
            }

            return next;
        });
    };

    const handleTimeChange = (dayKey, field, value) => {
        const getNextValidEndTime = (startTime, currentEndTime) => {
            const startIndex = TIME_OPTIONS.indexOf(startTime);
            const availableEndTimes = TIME_OPTIONS.slice(startIndex + 1);

            if (availableEndTimes.includes(currentEndTime)) {
                return currentEndTime;
            }

            return availableEndTimes[0] || TIME_OPTIONS[TIME_OPTIONS.length - 1];
        };

        setDays((prev) => {
            if (sameHours) {
                return prev.map((day) =>
                    day.active
                        ? {
                            ...day,
                            [field]: value,
                            ...(field === "startTime"
                                ? { endTime: getNextValidEndTime(value, day.endTime) }
                                : {}),
                        }
                        : day
                );
            }

            return prev.map((day) =>
                day.key === dayKey
                    ? {
                        ...day,
                        [field]: value,
                        ...(field === "startTime"
                            ? { endTime: getNextValidEndTime(value, day.endTime) }
                            : {}),
                    }
                    : day
            );
        });
    };

    const clockIcon = (
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" stroke="#A1A1AA" strokeWidth="1.4" />
            <path d="M10 5.8V10L12.8 11.8" stroke="#A1A1AA" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const convertTimeToMinutes = (time) => {
        if (!time) return 0;

        const [clockTime, meridian] = time.split(" ");
        if (!clockTime || !meridian) return 0;

        let [hour, minute] = clockTime.split(":").map(Number);

        if (meridian === "PM" && hour !== 12) hour += 12;
        if (meridian === "AM" && hour === 12) hour = 0;

        return hour * 60 + minute;
    };

    const onClickHandler = async () => {
        if (!studioId) {
            showErrorToast("Studio ID not found. Please complete previous steps first.");
            return;
        }

        const availability = days.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            opensAt: day.active ? convertTimeToMinutes(day.startTime) : 0,
            closesAt: day.active ? convertTimeToMinutes(day.endTime) : 0,
            isClosed: !day.active,
        }));

        const res = await createStudio({
            studioId,
            step: 3,
            operatingHours: availability,
        });

        if (res?.data) {
            showSuccessToast(res?.data?.message || "Availability saved successfully.");
            router.push("/add-studio/amenities-and-inclusions");
        } else {
            showErrorToast(res?.error?.data?.message || "Something went wrong");
        }
    };

    return (
        <main className="min-h-screen pt-15">
            <div className="mx-auto flex w-full max-w-full flex-col gap-6 lg:flex-row lg:items-start">
                <aside className="hidden lg:block h-200 w-full rounded-tr-[300px] bg-[#F7F8FC] pr-4 lg:w-105 lg:pr-5">
                    <h2 className="mb-4 mt-4 ps-5 lg:mt-15 text-[28px] font-semibold text-[#2f2d3a]">Studio Setup Steps</h2>
                    <div className="space-y-1">
                        <Navbar />
                    </div>
                </aside>

                <section className="w-full rounded-[20px] border border-[#e5e4ee] bg-white shadow-[0_10px_24px_rgba(47,42,71,0.08)] lg:w-300">
                    <div className="px-6 py-5 md:grid-cols-[1fr_auto] md:items-center md:px-10 flex justify-between">
                        <div>
                            <h1 className="text-[20px] font-semibold text-[#6d5ef6]">Manage Availability</h1>
                            <p className="max-w-[320px] mt-2 text-[13px] leading-4 text-[#6f6b84]">
                                Set when your studio is available and review everything before submitting.
                            </p>
                        </div>
                        <div className="block lg:hidden">
                            <Navbar />
                        </div>
                    </div>

                    <div className="mt-1 sm:mt-4 border-t border-dashed border-[#e3e2ec]" />
                    <div className="px-6 py-6 md:px-10 md:py-8">
                        <div className="mb-6 grid gap-3 grid-cols-[1fr_auto] md:items-center">
                            <div>
                                <h3 className="text-[18px] font-semibold text-[#333040]">Same Hours Everyday</h3>
                                <p className="text-[13px] text-[#8b879e]">Applies the same opening and closing time to all active days.</p>
                            </div>
                            <div className="md:justify-self-end">
                                <ToggleSwitch checked={sameHours} onClick={handleSameHours} />
                            </div>
                        </div>

                        <div className="space-y-4 overflow-visible">
                            <div className="hidden md:grid md:grid-cols-[88px_140px_1fr_1fr] md:gap-6 text-[13px] font-medium text-[#67637b]">
                                <span />
                                <span />
                                <p>Start Time</p>
                                <p>End Time</p>
                            </div>

                            {days.map((day) => (
                                <div key={day.key} className="relative grid items-center gap-3 overflow-visible sm:grid-cols-[88px_140px_1fr_1fr] md:gap-6">
                                    <div className="justify-self-start md:justify-self-center hidden sm:block">
                                        <ToggleSwitch checked={day.active} onClick={() => toggleDay(day.key)} />
                                    </div>
                                    <p className="text-[14px] mb-2 font-medium text-[#4b475f] hidden sm:block">{day.label}</p>
                                    <div className="flex items-center justify-between sm:hidden">
                                        <p className="text-[14px] mb-2 font-medium text-[#4b475f]">{day.label}</p>
                                        <div className="justify-self-start md:justify-self-center block sm:hidden">
                                            <ToggleSwitch checked={day.active} onClick={() => toggleDay(day.key)} />
                                        </div>
                                    </div>

                                    {day.active ? (
                                        <>
                                            <TimeDropdown
                                                value={day.startTime}
                                                options={START_TIME_OPTIONS}
                                                onSelect={(selected) => handleTimeChange(day.key, "startTime", selected)}
                                            />

                                            <TimeDropdown
                                                value={day.endTime}
                                                options={TIME_OPTIONS.slice(TIME_OPTIONS.indexOf(day.startTime) + 1)}
                                                onSelect={(selected) => handleTimeChange(day.key, "endTime", selected)}
                                            />
                                        </>
                                    ) : (
                                        <div className="md:col-span-2 h-11 rounded-full border border-[#d8d8dd] bg-[#efeff2] px-4 text-[14px] text-[#8a8a94] flex items-center gap-2">
                                            {clockIcon}
                                            Closed
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-dashed border-[#ecebf3] px-6 py-5 md:px-10 md:py-6">
                        <div className="flex justify-center md:justify-end">
                            <button
                                type="button"
                                className="h-12 w-full max-w-53.5 rounded-full bg-linear-to-r from-[#1e3a8a] to-[#6d5ef6] text-[18px] font-medium text-white cursor-pointer bg-[linear-gradient(95.53deg,#1E3A8A_0%,#6D5EF6_40%,#1E3A8A_100%)] bg-size-[300%_100%] transition-all duration-500 ease-in-out hover:bg-position-[100%_0]"
                                onClick={() => onClickHandler()}
                            >
                                Save & Continue
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <div className="mx-auto max-w-full px-0 sm:px-0">
                <Footer />
            </div>
        </main>
    )
}

export default ManageAvailability