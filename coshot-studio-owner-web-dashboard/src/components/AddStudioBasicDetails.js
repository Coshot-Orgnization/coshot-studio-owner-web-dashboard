"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Footer from "./Footer";
import Navbar from "./Navbar";
import { useCategoriesListQuery } from "@/redux/public/publicApi";
import { useCreateStudiDraftMutation, useCreateStudioMutation, useGetCurrentStudioDraftQuery, useGetStudioDetailsQuery } from "@/redux/studios/studiosApi";
import { showErrorToast, showSuccessToast } from "@/helpers/toast";
import { useRouter } from "next/navigation";

const AddStudioBasicDetails = () => {
    const { data } = useCategoriesListQuery();
    const [studioName, setStudioName] = useState("");
    const [sizeSqft, setSizeSqft] = useState("");
    const [description, setDescription] = useState("");
    const [capacity, setCapacity] = useState(1);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [totalCategories, setTotalCategories] = useState([]);
    const [createDraft] = useCreateStudiDraftMutation();
    const [draftStudioId, setDraftStudioId] = useState("");
    const hasPrefilledBaseRef = useRef(false);
    const hasPrefilledCategoriesRef = useRef(false);
    const { data: currentStudioId } = useGetCurrentStudioDraftQuery();
    const [createStudio] = useCreateStudioMutation();
    const categories = useMemo(() => data?.data || [], [data?.data]);
    const visibleCategories = showAllCategories ? categories : categories.slice(0, 16);
    const router = useRouter();
    const studioId = typeof window !== "undefined" ? localStorage.getItem("studioId") || "" : "";
    const { data: studioDetails } = useGetStudioDetailsQuery(studioId, {
        skip: !studioId,
        refetchOnMountOrArgChange: true,
    });

    useEffect(() => {
        if (hasPrefilledBaseRef.current || !studioDetails?.data) return;
        hasPrefilledBaseRef.current = true;

        const details = studioDetails.data;

        queueMicrotask(() => {
            setStudioName(details?.name || "");
            setDescription(details?.description || "");
            setSizeSqft(details?.sizeSqft ? String(details.sizeSqft) : "");

            const parsedCapacity = Number(details?.capacity);
            setCapacity(Number.isFinite(parsedCapacity) && parsedCapacity > 0 ? parsedCapacity : 1);
        });
    }, [studioDetails]);

    useEffect(() => {
        if (hasPrefilledCategoriesRef.current || !studioDetails?.data || categories.length === 0) return;
        hasPrefilledCategoriesRef.current = true;

        const categoryIdByName = new Map(
            categories
                .map((category) => {
                    const id = String(category?._id || category?.id || "");
                    const name = String(category?.name || "").trim().toLowerCase();
                    return [name, id];
                })
                .filter(([name, id]) => Boolean(name && id))
        );

        const validIds = new Set(
            categories
                .map((category) => String(category?._id || category?.id || ""))
                .filter(Boolean)
        );

        const prefilledCategoryIds = (studioDetails?.data?.categories || studioDetails?.data?.categoryIds || [])
            .map((category) => {
                if (typeof category === "string") {
                    const value = category.trim();
                    return validIds.has(value) ? value : categoryIdByName.get(value.toLowerCase()) || "";
                }

                const directId = String(category?._id || category?.id || category?.categoryId || "").trim();
                if (directId && validIds.has(directId)) return directId;

                const byName = String(category?.name || category?.title || "").trim().toLowerCase();
                return categoryIdByName.get(byName) || "";
            })
            .filter(Boolean);

        if (prefilledCategoryIds.length > 0) {
            queueMicrotask(() => {
                setTotalCategories(Array.from(new Set(prefilledCategoryIds)).slice(0, 5));
            });
        }
    }, [categories, studioDetails]);

    const handleCategorySelect = (category) => {
        const categoryId = String(category?._id || category?.id || "");
        if (!categoryId) return;

        setTotalCategories((prev) => {
            if (prev.includes(categoryId)) {
                return prev.filter((id) => id !== categoryId);
            }

            if (prev.length >= 10) {
                return prev;
            }

            return [...prev, categoryId];
        });
    };

    const onClickHandler = async () => {
        const parsedSizeSqft = Number(sizeSqft);

        if (
            !studioName.trim() ||
            !description.trim() ||
            !String(sizeSqft).trim() ||
            Number.isNaN(parsedSizeSqft) ||
            parsedSizeSqft <= 0 ||
            totalCategories.length === 0
        ) {
            showErrorToast("Please fill all required information before continuing.");
            return;
        }

        let studioId = localStorage.getItem("studioId") || currentStudioId?.data?.studioId || "";

        if (currentStudioId?.data?.studioId) {
            setDraftStudioId(currentStudioId?.data?.studioId);
        } else {
            const res = await createDraft();
            if (res?.data) {
                studioId = res?.data?.data?.studioId || "";
                setDraftStudioId(studioId);
            } else {
                showErrorToast(res?.error?.data?.message || "Something went wrong")
                return;
            }
        }

        if (!studioId) {
            studioId = draftStudioId;
        }

        const res = await createStudio({
            studioId,
            step: 1,
            name: studioName,
            description,
            sizeSqft: parsedSizeSqft,
            capacity: capacity,
            categoryIds: totalCategories
        })

        if (res?.data) {
            router.push("/add-studio/pricing-booking")
            showSuccessToast(res?.data?.message || "Studio step saved successfully.")
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

                <section className="w-full lg:w-300 rounded-[20px] border border-[#e5e4ee] bg-white shadow-[0_10px_24px_rgba(47,42,71,0.08)]">
                    <div className="px-6 py-2 md:py-5 md:px-10 flex justify-between items-center">
                        <h1 className="text-[20px] font-semibold text-[#6d5ef6]">Studio Basic Information</h1>
                        <div className="block lg:hidden">
                            <Navbar />
                        </div>
                    </div>

                    <div className="mt-1 sm:mt-4 border-t border-dashed border-[#e3e2ec]" />
                    <div className="space-y-7 px-6 py-6 md:px-10 md:py-8">
                        <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-10">
                            <div className="w-full lg:w-md">
                                <div>
                                    <label className="mb-2 text-[14px] font-medium text-[#4f4b63]">Studio Name</label>
                                    <input
                                        type="text"
                                        placeholder="Studio Name"
                                        value={studioName}
                                        onChange={(e) => setStudioName(e.target.value)}
                                        className="h-11.5 mt-2 w-full rounded-full border border-[#dfdde8] shadow-lg px-5 text-[14px] text-[#5e5b71] outline-hidden"
                                    />
                                </div>

                                <div className="mt-5">
                                    <label className="mb-2 text-[14px] font-medium text-[#4f4b63]">
                                        Studio Size (Sq. Ft.) <span className="text-[#9c98ab] italic">e.g. 850</span>
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Studio Size (Sq. Ft.)"
                                        value={sizeSqft}
                                        onChange={(e) => setSizeSqft(e.target.value)}
                                        className="h-11.5 mt-2 w-full rounded-full border border-[#dfdde8] shadow-lg px-5 text-[14px] text-[#5e5b71] outline-hidden [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                        onWheel={(e) => e.target.blur()}
                                    />
                                </div>
                            </div>

                            <div className="w-full lg:flex-1">
                                <div>
                                    <label className="mb-2 block text-[14px] font-medium text-[#4f4b63]">Description</label>
                                    <textarea
                                        rows={4}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe your studio, setup, lighting, and ideal use cases."
                                        className="w-full rounded-xl border border-[#dfdde8] px-4 py-3 shadow-lg text-[14px] text-[#5e5b71] outline-hidden"
                                    />
                                </div>

                            </div>
                        </div>

                        <div className="w-full lg:w-md px-0 lg:px-4 py-3">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-7">
                                <div>
                                    <p className="text-[16px] font-semibold text-[#444059]">Capacity</p>
                                    <p className="text-[13px] italic leading-4 text-[#8c88a1]">
                                        Maximum number of people can be present at a time.
                                    </p>
                                </div>
                                <div className="flex items-center gap-5 rounded-full shadow-2xl border border-[#d8d6e6] p-2">
                                    <button
                                        type="button"
                                        onClick={() => setCapacity((prev) => Math.max(1, prev - 1))}
                                        className="grid h-8 w-8 place-items-center rounded-full bg-linear-to-r from-[#1e3a8a] to-[#6d5ef6] text-white"
                                    >
                                        −
                                    </button>
                                    <span className="min-w-4 text-center text-[14px] font-medium text-[#393651]">{capacity}</span>
                                    <button
                                        type="button"
                                        onClick={() => setCapacity((prev) => prev + 1)}
                                        className="grid h-8 w-8 text-xl place-items-center pt-1 rounded-full bg-linear-to-r from-[#1e3a8a] to-[#6d5ef6] text-white"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                            <h3 className="text-[15px] font-semibold text-[#444059]">Studio Categories</h3>
                            <p className="text-[12px] italic text-[#8b879f]">Select up to 10 categories that best describe your studio.</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {visibleCategories.map((category) => {
                                const categoryId = String(category?._id || category?.id || "");
                                const active = totalCategories.includes(categoryId);
                                return (
                                    <button
                                        key={categoryId}
                                        type="button"
                                        onClick={() => handleCategorySelect(category)}
                                        className={`rounded-full border px-4 py-2 text-[14px] cursor-pointer ${active
                                            ? "bg-linear-to-r from-[#1e3a8a] to-[#6d5ef6] text-white"
                                            : "border-[#e3e1eb] bg-white text-[#7e7a92]"
                                            }`}
                                    >
                                        {category?.name}
                                    </button>
                                );
                            })}
                        </div>

                        {!showAllCategories && categories.length > 16 && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => setShowAllCategories(true)}
                                    className="text-[12px] font-medium text-[#6d5ef6] underline underline-offset-2 cursor-pointer"
                                >
                                    View All Categories +
                                </button>
                            </div>
                        )}
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

            <div className="px-0 sm:px-0 max-w-full mx-auto mt-7">
                <Footer />
            </div>
        </main>
    );
};

export default AddStudioBasicDetails;