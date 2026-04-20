"use client";

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import CommonPagination from './CommonPagination';
import NoData from './NoData';
import CommonPageLoader from './CommonPageLoader';
import { getPaginationFromResponse } from '@/helpers/pagination';
import { useGetSettlementsHistoryQuery, useGetSettlementsSummaryQuery } from '@/redux/settlements/settlementsApi';
import { formatAmount } from '@/helpers/formatAmount';

const DEFAULT_LIMIT = 8;

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatINR = (value) => `₹${formatAmount(toNumber(value), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const capitalize = (value) => {
    if (!value || typeof value !== 'string') return 'Completed';
    return value.charAt(0).toUpperCase() + value.slice(1);
};

const pluralize = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;

const HostWallet = () => {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);

    const {
        data: summaryResponse,
        isLoading: isSummaryLoading,
    } = useGetSettlementsSummaryQuery();

    const {
        data: settlementsHistoryData,
        isLoading: isHistoryLoading,
    } = useGetSettlementsHistoryQuery({
        page: currentPage,
        limit: DEFAULT_LIMIT,
    });

    const pagination = getPaginationFromResponse(settlementsHistoryData?.data, DEFAULT_LIMIT);

    const summary = summaryResponse?.data ?? {};
    const readyForPayout = summary?.readyForPayout ?? {};
    const cooling = summary?.cooling ?? {};
    const commissionPercent = summary?.commissionPercent ?? '0.00';

    const payoutOperational = readyForPayout?.operational ?? {};
    const payoutCancellation = readyForPayout?.cancellation ?? {};

    const coolingOperational = cooling?.operational ?? {};
    const coolingCancellation = cooling?.cancellation ?? {};

    const totalLifetimeSettled = toNumber(summary?.lifetimeSettled?.total ?? summary?.totalLifetimeSettled);

    const transferDate = formatDate(cooling?.nextReadyAt);
    const includeText = `${pluralize(toNumber(readyForPayout?.totalCount), 'item', 'items')} (${pluralize(toNumber(payoutOperational?.count), 'booking', 'bookings')}, ${pluralize(toNumber(payoutCancellation?.count), 'cancellation', 'cancellations')})`;

    if (isSummaryLoading && !summaryResponse) {
        return <CommonPageLoader />;
    }

    return (
        <section className="w-full pt-15">
            <div className="relative mx-auto mt-8 flex w-full max-w-330 flex-col gap-6 px-4 lg:flex-row lg:items-start lg:gap-8 lg:px-6">
                <Navbar />

                <section className="w-full overflow-hidden rounded-3xl border border-[#e8e8ef] bg-white shadow-[0_10px_36px_rgba(42,48,82,0.08)] lg:max-w-232.5">
                    <div className="border-b border-dashed border-[#e3e2ec] px-5 py-4 sm:px-7 sm:py-4">
                        <div className="grid gap-2 md:grid-cols-[1fr_1fr] md:items-start">
                            <h2 className="text-[16px] font-semibold text-[#6257eb]">Studio Wallet</h2>
                            <p className="max-w-87 text-[12px] leading-4 text-[#5f5d6f] md:justify-self-end">
                                Track payments received from CoShot and upcoming transfers.
                            </p>
                        </div>
                    </div>


                    <div className="space-y-7 px-6 pb-6 pt-5">
                        <div className="relative h-30 w-full max-w-96 overflow-hidden rounded-2xl bg-linear-to-r from-[#4e59df] to-[#6560f6] px-5 py-4 text-white shadow-[0_12px_28px_rgba(93,95,245,0.28)]">
                            <p className="text-[16px] font-medium text-[#dce2ff]">Total Lifetime Settled</p>
                            <p className="mt-1 text-[42px] leading-none font-semibold">{formatINR(totalLifetimeSettled)}</p>
                            <span className="pointer-events-none absolute -bottom-4 -right-3.5 h-28 w-28 rounded-full bg-white/12" />
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <div>
                                <div className="group relative mb-3 flex items-center justify-between">
                                    <p className="text-[14px] font-semibold tracking-[0.08em] text-[#6e7893] uppercase">Payout Pipeline</p>
                                    <div className="absolute top-full right-0 mb-2 hidden w-48 rounded-lg bg-[#1e293b] p-2 text-[11px] text-white shadow-lg group-hover:block z-1">
                                        Earnings that have cleared the cooling period and are ready for the next scheduled transfer.
                                    </div>
                                    <svg className="cursor-help" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6.75 3.72656H8.22656V5.23828H6.75V3.72656ZM6.75 6.75H8.22656V11.25H6.75V6.75ZM7.48828 0C3.33984 0 0 3.33984 0 7.48828C0 11.6367 3.33984 14.9766 7.48828 14.9766C11.6367 14.9766 14.9766 11.6367 14.9766 7.48828C14.9766 3.33984 11.6367 0 7.48828 0ZM7.48828 13.5C4.18359 13.5 1.47656 10.793 1.47656 7.48828C1.47656 4.18359 4.18359 1.47656 7.48828 1.47656C10.793 1.47656 13.5 4.18359 13.5 7.48828C13.5 10.793 10.793 13.5 7.48828 13.5Z" fill="#94A3B8" />
                                    </svg>
                                </div>

                                <article className="rounded-[14px] border border-[#dbe0ee] bg-white px-4 py-4 shadow-[inset_4px_0_0_#6b5ff5]">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[15px] font-medium text-[#73809a]">Ready for Payout</p>
                                            <p className="mt-0.5 text-[43px] leading-none font-semibold text-[#20202b]">{formatINR(readyForPayout?.totalAmount)}</p>
                                        </div>
                                        <span className="mt-0.5 rounded-md bg-[#EEF2FF] p-1.5">
                                            <img src='/images/navbar/payout.png' alt='Payout' className='h-5 w-5 opacity-70' />
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-2 border-b border-dashed border-[#e0e4f1] pb-3 text-[15px]">
                                        <div className="flex items-center justify-between text-[#657189]">
                                            <p>Bookings ({toNumber(payoutOperational?.count)})</p>
                                            <p className="font-semibold text-[#20202b]">{formatINR(payoutOperational?.netAmount)}</p>
                                        </div>
                                        <div className="flex items-center justify-between text-[#657189]">
                                            <p>Gross</p>
                                            <p className="font-semibold text-[#20202b]">{formatINR(payoutOperational?.grossAmount)}</p>
                                        </div>
                                        <div className="flex items-center justify-between text-[#657189]">
                                            <p>Commission ({toNumber(commissionPercent)}%)</p>
                                            <p className="font-semibold text-[#20202b]">{formatINR(payoutOperational?.commission)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 space-y-2 text-[13px] text-[#66748f]">
                                        <p className="flex items-center gap-2">
                                            <span className="text-[#6d5ef6]">◻</span>
                                            Transfer scheduled after {transferDate}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <span className="text-[#6d5ef6]">⊞</span>
                                            Includes {includeText}
                                        </p>
                                    </div>
                                </article>
                            </div>

                            <div>
                                <div className="group relative mb-3 flex items-center justify-between">
                                    <p className="text-[14px] font-semibold tracking-[0.08em] text-[#6e7893] uppercase">Cooling</p>
                                    <div className="absolute top-full right-0 mb-2 hidden w-48 rounded-lg bg-[#1e293b] p-2 text-[11px] text-white shadow-lg group-hover:block z-1">
                                        Recent earnings currently in the mandatory verification period before becoming eligible for payout.
                                    </div>
                                    <svg className="cursor-help" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6.75 3.72656H8.22656V5.23828H6.75V3.72656ZM6.75 6.75H8.22656V11.25H6.75V6.75ZM7.48828 0C3.33984 0 0 3.33984 0 7.48828C0 11.6367 3.33984 14.9766 7.48828 14.9766C11.6367 14.9766 14.9766 11.6367 14.9766 7.48828C14.9766 3.33984 11.6367 0 7.48828 0ZM7.48828 13.5C4.18359 13.5 1.47656 10.793 1.47656 7.48828C1.47656 4.18359 4.18359 1.47656 7.48828 1.47656C10.793 1.47656 13.5 4.18359 13.5 7.48828C13.5 10.793 10.793 13.5 7.48828 13.5Z" fill="#94A3B8" />
                                    </svg>
                                </div>

                                <article className="rounded-[14px] border border-[#dbe0ee] bg-white px-4 py-4">
                                    <div className="space-y-2 border-b border-dashed border-[#e0e4f1] pb-3 text-[15px]">
                                        <div className="flex items-center justify-between text-[#657189]">
                                            <p>Bookings ({toNumber(coolingOperational?.count)})</p>
                                            <p className="font-semibold text-[#20202b]">{formatINR(coolingOperational?.netAmount)}</p>
                                        </div>
                                        <div className="flex items-center justify-between text-[#657189]">
                                            <p>Cancellations ({toNumber(coolingCancellation?.count)})</p>
                                            <p className="font-semibold text-[#20202b]">{formatINR(coolingCancellation?.amount)}</p>
                                        </div>
                                    </div>

                                    <p className="mt-3 flex items-center gap-2 text-[13px] text-[#66748f]">
                                        <span className="text-[#8792ab]">◉</span>
                                        Next payout ready: {transferDate}
                                    </p>
                                </article>
                            </div>
                        </div>

                        <div>
                            <p className="mb-3 text-[16px] font-semibold tracking-[0.08em] text-[#6e7893] uppercase">Settlement History</p>

                            {isHistoryLoading ? (
                                <div className="rounded-xl border border-[#e5e7f2] bg-white px-4 py-5 text-[14px] text-[#7c85a1]">
                                    Loading settlement history...
                                </div>
                            ) : settlementsHistoryData?.data?.data?.length > 0 ? (
                                <div className="grid gap-4 lg:grid-cols-2 place-self-center sm:place-self-auto">
                                    {settlementsHistoryData?.data?.data?.map((settlement) => (
                                        <article key={settlement.id} className="rounded-[14px] border border-[#e3e7f3] bg-white px-4 py-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <span className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${settlement.status !== "completed" ? 'bg-[#e8fff2] text-[#23b273]' : 'bg-[#e8fff2] text-[#23b273]'}`}>
                                                        <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M15 3.55469V1.67969C15 0.742188 14.2578 0 13.3203 0H1.67969C0.742188 0 0 0.742188 0 1.67969V13.3203C0 14.2578 0.742188 15 1.67969 15H13.3203C14.2578 15 15 14.2578 15 13.3203V11.4453C15.5078 11.1328 15.8203 10.625 15.8203 10V5C15.8203 4.375 15.5078 3.86719 15 3.55469ZM14.1797 5V10H8.32031V5H14.1797ZM1.67969 13.3203V1.67969H13.3203V3.32031H8.32031C7.42188 3.32031 6.67969 4.10156 6.67969 5V10C6.67969 10.8984 7.42188 11.6797 8.32031 11.6797H13.3203V13.3203H1.67969ZM9.57031 7.5C9.57031 6.79688 10.1562 6.25 10.8203 6.25C11.5234 6.25 12.0703 6.79688 12.0703 7.5C12.0703 8.20312 11.5234 8.75 10.8203 8.75C10.1562 8.75 9.57031 8.20312 9.57031 7.5Z" fill="#10B981" />
                                                        </svg>

                                                    </span>

                                                    <div>
                                                        <p className="text-[13px] font-semibold leading-7 text-[#20202b]"> From:{formatDate(settlement.settledFrom)} - To: {formatDate(settlement.settledTo)}</p>
                                                        <div className='flex gap-2'>
                                                            <p className="text-[10px] font-medium text-[#9ca4bb]">Bookings: {settlement.operationalCount}</p>
                                                            <p className="text-[10px] font-medium text-[#9ca4bb]">Cancelled: {settlement.cancellationCount}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-[16px] font-semibold leading-none text-[#20202b]">{formatINR(settlement.grossAmount)}</p>
                                                    <p className="mt-1 text-[12px] font-medium text-[#98a1b8]">{formatDate(settlement.processedAt)}</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between border-t border-dashed border-[#e4e7f2] pt-2.5">
                                                <span className="rounded-full bg-[#dcf8e9] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0fa760]">
                                                    {settlement.status}
                                                </span>

                                                <button
                                                    type="button"
                                                    className="text-[14px] font-semibold text-[#6d5ef6] transition hover:opacity-80 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                    disabled={!settlement?.id}
                                                    onClick={() => router.push(`/earnings/wallet/${settlement.id}`)}
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <NoData
                                    page="default"
                                    className="mt-0 min-h-[16vh]"
                                    title="No settlements available"
                                    description="Your processed payouts will appear here once settlements are generated."
                                />
                            )}

                            <CommonPagination
                                currentPage={currentPage}
                                totalPages={pagination.totalPages}
                                hasNext={pagination.hasNext}
                                hasPrevious={pagination.hasPrevious}
                                onPageChange={setCurrentPage}
                            />
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

export default HostWallet;