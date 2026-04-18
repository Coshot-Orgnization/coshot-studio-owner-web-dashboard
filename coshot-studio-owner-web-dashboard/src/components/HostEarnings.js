"use client";

import React, { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Navbar from './Navbar';
import Footer from './Footer';
import { useBookingsRevenueQuery } from '@/redux/studio-owner/studioOwnerApi';
import { useRouter } from 'next/navigation';
import ReusableCalendarInput from './ReusableCalendarInput';
import { getTodayIsoLocal } from '@/helpers/formatDate';
import NoData from './NoData';

const toNumber = (value) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
};

const formatChartDay = (value) => {
    if (!value) return '-';

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;

    const day = parsedDate.getDate();
    return `${day}${getOrdinalSuffix(day)}`;
};

const MONTH_SHORT_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseDateParts = (value) => {
    if (!value || typeof value !== 'string') return null;

    if (/^\d{4}$/.test(value)) {
        return { year: Number(value), month: null, day: null };
    }

    if (/^\d{4}-\d{2}$/.test(value)) {
        const [year, month] = value.split('-').map(Number);
        return { year, month, day: null };
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        return { year, month, day };
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return null;

    return {
        year: parsedDate.getFullYear(),
        month: parsedDate.getMonth() + 1,
        day: parsedDate.getDate(),
    };
};

const formatGraphXAxisLabel = (value, groupBy) => {
    const parts = parseDateParts(value);
    if (!parts) return value || '-';

    if (groupBy === 'year') {
        return String(parts.year);
    }

    if (groupBy === 'month') {
        if (!parts.month) return value;
        return MONTH_SHORT_NAMES[parts.month - 1] || value;
    }

    if (parts.day && parts.month) {
        if (groupBy === 'day') {
            return formatChartDay(`${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`);
        }

        return `${parts.day} ${MONTH_SHORT_NAMES[parts.month - 1] || ''}`.trim();
    }

    return value;
};

const formatGraphDateLabel = (value, groupBy) => {
    const parts = parseDateParts(value);
    if (!parts) return value || '-';

    if (groupBy === 'year') {
        return String(parts.year);
    }

    if (groupBy === 'month') {
        if (!parts.month) return value;
        return `${MONTH_SHORT_NAMES[parts.month - 1]} ${parts.year}`;
    }

    if (parts.day && parts.month) {
        return `${parts.day} ${MONTH_SHORT_NAMES[parts.month - 1]} ${parts.year}`;
    }

    return value;
};

const getSortedDateRange = (firstDate, secondDate) => {
    if (!firstDate || !secondDate) {
        return { from: firstDate || '', to: secondDate || '' };
    }

    if (new Date(firstDate).getTime() <= new Date(secondDate).getTime()) {
        return { from: firstDate, to: secondDate };
    }

    return { from: secondDate, to: firstDate };
};

const formatDateDisplay = (value) => {
    if (!value) return 'DD / MM / YYYY';

    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return 'DD / MM / YYYY';

    return `${day} / ${month} / ${year}`;
};

const formatINR = (value) => `₹${Number(value || 0)}`;

const DatePill = ({ label, value, onChange, minDate, maxDate }) => (
    <div className="min-w-33">
        <p className="mb-1 text-[14px] font-medium text-[#5e5b6f]">{label}</p>

        <ReusableCalendarInput
            value={value}
            onChange={onChange}
            minDate={minDate}
            maxDate={maxDate}
            allowClear={false}
            triggerClassName="flex h-9 w-full cursor-pointer items-center gap-2 rounded-full border border-[#dbd9e8] bg-white px-3 text-[12px] font-medium text-[#66637a] shadow-none"
            textClassName="text-[12px] font-medium text-[#66637a]"
            formatDisplayDate={formatDateDisplay}
        />
    </div>
);

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;

    const chartEntry = payload?.[0]?.payload;

    return (
        <div className="rounded-xl bg-[#0f172a] px-3 py-2 text-[10px] text-white shadow-[0_8px_24px_rgba(15,23,42,0.34)]">
            <p className="font-semibold text-[10px]">{chartEntry?.dateLabel}</p>
            <p className="mt-1 text-[#cbd5e1]">{chartEntry?.bookings} Bookings, {chartEntry?.cancelledBookings} Cancellation</p>
            <p className="mt-1 font-semibold">Total: {formatINR(chartEntry?.total)}</p>
        </div>
    );
};

const CustomDayTick = ({ x, y, payload }) => {
    return (
        <text
            x={x}
            y={y + 14}
            textAnchor="middle"
            fill="#9594a8"
            fontSize="10"
            fontWeight={600}
        >
            {payload?.value}
        </text>
    );
};

const StudioCard = ({ item }) => (
    <div className="flex items-center justify-between rounded-xl border border-[#ececf3] bg-white px-4 py-3.5">
        <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ebe9ff]">
                <img src='/images/navbar/studio.png' alt='Studio icon' className='h-4 w-4' />
            </span>

            <div>
                <p className="text-[15px] font-semibold text-[#20202b]">{item.studio}</p>
                <p className="text-[11px] font-medium text-[#8c8a9d]">{item.bookings} Bookings</p>
            </div>
        </div>

        <div className="text-right">
            <p className="text-[20px] font-semibold leading-none text-[#6d5ef6]">{formatINR(item.amount)}</p>
            <p className="mt-1 text-[11px] font-medium text-[#8c8a9d]">{item.share}</p>
        </div>
    </div>
);

const HostEarnings = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const router = useRouter();

    const revenueQueryParams = useMemo(() => {
        if (startDate && endDate) {
            const { from, to } = getSortedDateRange(startDate, endDate);
            return { from, to };
        }

        if (startDate) return { from: startDate };
        if (endDate) return { to: endDate };

        return {};
    }, [startDate, endDate]);

    const { data } = useBookingsRevenueQuery(revenueQueryParams);

    const summary = data?.data?.summary ?? {};
    const operationalRevenue = summary?.operationalRevenue ?? {};
    const cancellationRevenue = summary?.cancellationRevenue ?? {};
    const groupBy = data?.data?.groupBy || 'day';
    const graph = data?.data?.graph ?? [];
    const studios = data?.data?.studios ?? [];

    const totalEarnings = toNumber(summary?.totalRevenue ?? operationalRevenue?.totalRevenue ?? operationalRevenue?.totalEarnings);
    const completedBookings = toNumber(operationalRevenue?.totalBookings);
    const averageBookingValue = toNumber(operationalRevenue?.averageBookingValue);
    const netEarnings = toNumber(operationalRevenue?.netEarnings);

    const operationalAmount = toNumber(operationalRevenue?.totalEarnings);
    const cancellationAmount = toNumber(cancellationRevenue?.totalAmount);
    const refundsAmount = Math.abs(toNumber(operationalRevenue?.totalRefunds));
    const totalBreakdownAmount = operationalAmount + cancellationAmount + refundsAmount;

    const getBreakdownWidth = (amount) => {
        if (!totalBreakdownAmount) return 0;
        return (amount / totalBreakdownAmount) * 100;
    };

    const dailyEarningsData = graph.map((item) => ({
        label: formatGraphXAxisLabel(item?.date, groupBy),
        ops: toNumber(item?.operationalEarnings),
        cancellation: toNumber(item?.cancellationEarnings),
        dateLabel: formatGraphDateLabel(item?.date, groupBy),
        bookings: toNumber(item?.completedBookings),
        cancelledBookings: toNumber(item?.cancellations),
        total: toNumber(item?.totalEarnings),
    }));

    const graphHeadingByGroup = {
        day: 'Daily Earnings',
        week: 'Weekly Earnings',
        month: 'Monthly Earnings',
        year: 'Yearly Earnings',
    };

    const totalStudioEarnings = studios.reduce(
        (sum, studio) => sum + toNumber(studio?.totalEarnings),
        0
    );

    const studioBreakdown = studios.map((studio) => {
        const studioAmount = toNumber(studio?.totalEarnings);
        const sharePercentage = totalStudioEarnings
            ? Math.round((studioAmount / totalStudioEarnings) * 100)
            : 0;

        return {
            id: studio?.studioId || studio?.studioName,
            studio: studio?.studioName || 'Studio',
            bookings: toNumber(studio?.completedBookings),
            share: `${sharePercentage}% Share`,
            amount: studioAmount,
        };
    });

    return (
        <section className="w-full pt-15">
            <div className="relative mx-auto flex w-full max-w-330 flex-col gap-6 px-4 lg:flex-row lg:items-start lg:gap-8 lg:px-6 mt-5">
                <div className="hidden lg:block">
                    <Navbar />
                </div>

                <section className="w-full overflow-hidden rounded-3xl border border-[#e8e8ef] bg-white shadow-[0_10px_36px_rgba(42,48,82,0.08)] lg:max-w-232.5">
                    <div className="px-5 pt-3 sm:px-8 sm:pt-6 flex justify-between items-center">
                        <h2 className="text-[24px] font-semibold text-[#6257eb]">Earnings</h2>
                        <div className="block lg:hidden">
                            <Navbar />
                        </div>
                        <p className="max-w-[320px] text-[14px] leading-5 text-[#5f5d6f] md:justify-self-end hidden lg:block">
                            Track your studio earnings, completed bookings, and payouts over time.
                        </p>
                    </div>

                    <div className="px-5 pb-8 pt-5 sm:px-7">
                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#4b55dd] to-[#655ef6] px-4 py-4 text-white shadow-[0_10px_30px_rgba(97,92,240,0.28)]">
                                <p className="text-[15px] font-medium text-[#e4e7ff]">Total Earnings</p>
                                <p className="mt-1 text-[44px] leading-none font-semibold">{formatINR(totalEarnings)}</p>

                                <span className="pointer-events-none absolute -bottom-5 right-2 h-28 w-28 rounded-full bg-white/10" />
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-[#ececf2] bg-[#f6f6f9] px-3 py-3.5">
                                    <p className="text-[13px] font-medium text-[#5e5c6d]">Completed Bookings</p>
                                    <p className="mt-1 text-[32px] leading-none font-semibold text-[#6d5ef6]">{completedBookings}</p>
                                    <p className="mt-1 text-[10px] font-medium text-[#9a98a9]">AVG. VALUE {formatINR(averageBookingValue)}</p>
                                </div>

                                <div className="rounded-xl border border-[#ececf2] bg-[#f6f6f9] px-3 py-3.5">
                                    <p className="text-[13px] font-medium text-[#5e5c6d]">Net Earnings</p>
                                    <p className="mt-1 text-[32px] leading-none font-semibold text-[#20202b]">{formatINR(netEarnings)}</p>
                                    <p className="mt-1 text-[10px] font-medium text-[#9a98a9]">After refunds & cancellations</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div>
                                <div className="flex flex-wrap items-end gap-2">
                                    <DatePill
                                        label="Start Date"
                                        value={startDate}
                                        onChange={setStartDate}
                                        minDate={"2022-01-01"}
                                        maxDate={getTodayIsoLocal()}
                                    />

                                    <DatePill
                                        label="End Date"
                                        value={endDate}
                                        onChange={setEndDate}
                                        minDate={startDate || ''}
                                        maxDate={getTodayIsoLocal()}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStartDate('');
                                            setEndDate('');
                                        }}
                                        className="mb-1 flex h-8.5 w-8.5 items-center justify-center rounded-full text-[#7a7692]"
                                        aria-label="Reset date filters"
                                    >
                                        <img src='/images/navbar/reset.png' alt='Reset' className='h-5 w-5 mt-0' />
                                    </button>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="mt-auto flex h-12 w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#2943a1] to-[#655ef6] text-[16px] font-semibold text-white shadow-[0_10px_24px_rgba(76,89,216,0.32)] cursor-pointer animate-pulse hover:animate-none hover:scale-[1.02] ring-2 ring-white/20 bg-[linear-gradient(95.53deg,#1E3A8A_0%,#6D5EF6_40%,#1E3A8A_100%)] bg-size-[300%_100%] transition-all duration-500 ease-in-out hover:bg-position-[100%_0]"
                                onClick={() => router.push('/earnings/wallet')}
                            >
                                <img src='/images/navbar/wallet.png' alt='Wallet' className='w-4 h-4' />
                                See Your Wallet
                            </button>
                        </div>

                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                            <div>
                                <p className="mb-2 text-[16px] font-semibold tracking-[1.6px] text-[#8590a8] uppercase">Revenue Breakdown</p>
                                <div className="rounded-2xl border border-[#ececf3] bg-[#f7f7fb] px-4 py-4">
                                    <div className="h-3.5 w-full overflow-hidden rounded-full bg-white">
                                        <div className="flex h-full w-full">
                                            <div className="h-full bg-[#595fe5]" style={{ width: `${getBreakdownWidth(operationalAmount)}%` }} />
                                            <div className="h-full bg-[#f97316]" style={{ width: `${getBreakdownWidth(cancellationAmount)}%` }} />
                                            <div className="h-full bg-[#ef4444]" style={{ width: `${getBreakdownWidth(refundsAmount)}%` }} />
                                        </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                        <div>
                                            <p className="text-[10px] font-medium text-[#85839a]"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#595fe5]" />Operational</p>
                                            <p className="mt-1 text-[18px] font-semibold text-[#20202b]">{formatINR(operationalAmount)}</p>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-medium text-[#85839a]"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#f97316]" />Cancellations</p>
                                            <p className="mt-1 text-[18px] font-semibold text-[#f97316]">{formatINR(cancellationAmount)}</p>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-medium text-[#85839a]"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#ef4444]" />Refunds</p>
                                            <p className="mt-1 text-[18px] font-semibold text-[#ef4444]">-{formatINR(refundsAmount)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-[16px] font-semibold tracking-[1.6px] text-[#8590a8] uppercase">{graphHeadingByGroup[groupBy] || 'Earnings Graph'}</p>

                                    <div className="flex items-center gap-4 text-[10px] font-medium text-[#85839a]">
                                        <span><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#595fe5]" />Ops</span>
                                        <span><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#f97316]" />Canc.</span>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-[#ececf3] bg-[#f7f7fb] px-3 py-3">
                                    <div className="h-40 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={dailyEarningsData} margin={{ top: 8, right: 0, left: 0, bottom: 4 }}>
                                                <XAxis
                                                    dataKey="label"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={<CustomDayTick />}
                                                />
                                                <YAxis hide />
                                                <Tooltip cursor={false} content={<CustomTooltip />} />
                                                <Bar
                                                    dataKey="ops"
                                                    stackId="daily"
                                                    fill="#595fe5"
                                                    radius={[2, 2, 0, 0]}
                                                    barSize={40}
                                                    isAnimationActive={false}
                                                />
                                                <Bar
                                                    dataKey="cancellation"
                                                    stackId="daily"
                                                    fill="#f97316"
                                                    radius={[2, 2, 0, 0]}
                                                    barSize={22}
                                                    isAnimationActive={false}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5">
                            <p className="mb-2 text-[16px] font-semibold tracking-[1.6px] text-[#8590a8] uppercase">Earnings by Studio</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {studioBreakdown.length > 0 ? (
                                    studioBreakdown.map((item) => (
                                        <StudioCard key={item.id} item={item} />
                                    ))
                                ) : (
                                    <NoData
                                        page="default"
                                        className="sm:col-span-2 mt-0 min-h-[14vh]"
                                        title="No earnings data found"
                                        description="No studio earnings data is available for the selected date range. Try changing the dates."
                                    />
                                )}
                            </div>
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

export default HostEarnings;