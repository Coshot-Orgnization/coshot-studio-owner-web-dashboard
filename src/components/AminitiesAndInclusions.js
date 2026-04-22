"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Footer from "./Footer";
import Navbar from "./Navbar";
import { useAmenitiesListQuery } from "@/redux/public/publicApi";
import { useCreateStudioMutation, useGetStudioDetailsQuery } from "@/redux/studios/studiosApi";
import { showErrorToast, showSuccessToast } from "@/helpers/toast";

const AminitiesAndInclusions = () => {
    const router = useRouter();
    const [studioId, setStudioId] = useState("");

    useEffect(() => {
        setStudioId(localStorage.getItem("studioId") || "");
    }, []);

    const hasPrefilledRef = useRef(false);
    const { data } = useAmenitiesListQuery();
    const [createStudio, { isLoading }] = useCreateStudioMutation();
    const [selectedAmenities, setSelectedAmenities] = useState([]);
    const [inclusionInput, setInclusionInput] = useState("");
    const [inclusions, setInclusions] = useState([]);
    const { data: studioDetails } = useGetStudioDetailsQuery(studioId, {
        skip: !studioId,
        refetchOnMountOrArgChange: true,
    });

    useEffect(() => {
        if (hasPrefilledRef.current || !studioDetails?.data) return;
        hasPrefilledRef.current = true;

        const details = studioDetails.data;

        queueMicrotask(() => {
            const prefilledAmenityIds = (details?.amenities || [])
                .map((amenity) => {
                    if (typeof amenity === "string") return amenity;

                    return (
                        amenity?.amenityId ||
                        amenity?._id ||
                        amenity?.id ||
                        amenity?.amenity?._id ||
                        amenity?.amenity?.id ||
                        amenity?.slug ||
                        amenity?.name ||
                        ""
                    );
                })
                .filter(Boolean)
                .map(String);

            if (prefilledAmenityIds.length > 0) {
                setSelectedAmenities(Array.from(new Set(prefilledAmenityIds)));
            }

            const prefilledInclusions = (details?.includedItems || [])
                .map((item) => (typeof item === "string" ? item : item?.name || item?.label || ""))
                .filter(Boolean);

            if (prefilledInclusions.length > 0) {
                setInclusions(prefilledInclusions);
            }
        });
    }, [studioDetails]);

    const normalizedAmenities = useMemo(
        () =>
            (data?.data || [])
                .map((amenity) => {
                    if (typeof amenity === "string") {
                        return { id: amenity, label: amenity };
                    }

                    const id = amenity?._id || amenity?.id || amenity?.name;
                    const label = amenity?.name || amenity?.label || "";

                    if (!id || !label) return null;
                    return { id: String(id), label };
                })
                .filter(Boolean),
        [data?.data]
    );

    const toggleAmenity = (amenityId) => {
        setSelectedAmenities((prev) =>
            prev.includes(amenityId)
                ? prev.filter((item) => item !== amenityId)
                : [...prev, amenityId]
        );
    };

    const addInclusion = () => {
        const value = inclusionInput.trim();
        if (!value) return;

        if (!inclusions.includes(value)) {
            setInclusions((prev) => [...prev, value]);
        }

        setInclusionInput("");
    };

    const removeInclusion = (item) => {
        setInclusions((prev) => prev.filter((inclusion) => inclusion !== item));
    };

    const onClickHandler = async () => {
        if (!studioId) {
            showErrorToast("Studio ID not found. Please complete previous steps first.");
            return;
        }

        const amenitiesPayload = selectedAmenities.map((amenityId) => (
            amenityId
        ));

        const includedItemsPayload = inclusions.map((item) => item.trim()).filter(Boolean);

        const res = await createStudio({
            studioId,
            step: 4,
            amenities: amenitiesPayload,
            includedItems: includedItemsPayload,
        });

        if (res?.data) {
            showSuccessToast(res?.data?.message || "Amenities and inclusions saved successfully.");
            router.push("/add-studio/rules");
        } else {
            showErrorToast(res?.error?.data?.message || "Something went wrong");
        }
    };

    return (
        <main className="min-h-screen pt-15">
            <div className="mx-auto flex w-full max-w-full flex-col gap-6 lg:flex-row lg:items-start">
                <aside className="hidden lg:block w-full rounded-tr-[300px] h-200 bg-[#F7F8FC] pr-4 lg:w-105 lg:pr-5">
                    <h2 className="mb-4 mt-4 ps-5 lg:mt-15 text-[28px] font-semibold text-[#2f2d3a]">Studio Setup Steps</h2>
                    <div className="space-y-1">
                        <Navbar />
                    </div>
                </aside>

                <section className="w-full rounded-[20px] border border-[#e5e4ee] bg-white shadow-[0_10px_24px_rgba(47,42,71,0.08)] lg:w-300">
                    <div className="flex justify-between px-6 py-5 md:grid-cols-[1fr_auto] md:items-center md:px-10">
                        <div>
                            <h1 className="text-[20px] font-semibold text-[#6d5ef6]">Amenities &amp; Inclusions</h1>
                            <p className="max-w-88.75 text-[13px] leading-4 text-[#6f6b84]">
                                Select the amenities and equipment included with your studio booking.
                            </p>
                        </div>
                        <div className="block lg:hidden">
                            <Navbar />
                        </div>
                    </div>

                    <div className="mt-1 sm:mt-4 border-t border-dashed border-[#e3e2ec]" />
                    <div className="space-y-8 px-6 py-7 md:px-10 md:py-8">
                        <div>
                            <h3 className="mb-4 text-[17px] font-semibold text-[#2f2d3a]">Amenities</h3>
                            <div className="flex flex-wrap gap-3">
                                {normalizedAmenities.map((amenity) => {
                                    const isActive = selectedAmenities.includes(amenity.id);

                                    return (
                                        <button
                                            key={amenity.id}
                                            type="button"
                                            onClick={() => toggleAmenity(amenity.id)}
                                            className={`rounded-full border px-4 py-2 text-[14px] transition-all cursor-pointer ${isActive
                                                ? "border-[#4f52d8] bg-linear-to-r from-[#2f48a6] to-[#6b5ef5] text-white shadow-[0_8px_18px_rgba(89,78,224,0.35)]"
                                                : "border-[#dddbe7] bg-white text-[#8f8a9f] shadow-[0_6px_14px_rgba(47,42,71,0.08)]"
                                                }`}
                                        >
                                            {amenity.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-4 text-[17px] font-semibold text-[#2f2d3a]">Included in Booking</h3>
                            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
                                <input
                                    type="text"
                                    value={inclusionInput}
                                    onChange={(e) => setInclusionInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addInclusion();
                                        }
                                    }}
                                    placeholder="Ex: Camera, Mic..."
                                    className="h-11 w-full flex rounded-full border border-[#dedde7] bg-white px-6 text-[14px] text-[#5e5b71] shadow-[0_8px_20px_rgba(46,35,85,0.06)] outline-hidden"
                                />

                                <button
                                    type="button"
                                    onClick={addInclusion}
                                    className="h-10 min-w-22 rounded-full bg-linear-to-r from-[#171717] to-[#494949] px-7 text-[16px] font-medium text-white cursor-pointer"
                                >
                                    Add
                                </button>
                            </div>

                            {inclusions.length > 0 && (
                                <div className="mt-10 flex flex-wrap gap-4">
                                    {inclusions.map((item) => (
                                        <span
                                            key={item}
                                            className="inline-flex items-center gap-2 rounded-full bg-[#c7c3ff] pl-5 pr-2 py-2 text-[14px] text-[#3a3651]"
                                        >
                                            {item}
                                            <button
                                                type="button"
                                                onClick={() => removeInclusion(item)}
                                                className="inline-flex h-5.5 w-5.5 items-center justify-center rounded-full bg-[#ff5964] text-[11px] text-white cursor-pointer"
                                                aria-label={`Remove ${item}`}
                                            >
                                                <img src="/images/navbar/delete.png" alt="Remove" className="w-5 h-5 font-semibold" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-dashed border-[#ecebf3] px-6 py-6 md:px-10 md:py-7">
                        <div className="flex justify-center md:justify-end">
                            <button
                                type="button"
                                onClick={onClickHandler}
                                disabled={isLoading}
                                className="h-12 w-full max-w-53.5 rounded-full bg-linear-to-r from-[#1e3a8a] to-[#6d5ef6] text-[18px] font-medium text-white cursor-pointer bg-[linear-gradient(95.53deg,#1E3A8A_0%,#6D5EF6_40%,#1E3A8A_100%)] bg-size-[300%_100%] transition-all duration-500 ease-in-out hover:bg-position-[100%_0]"
                            >
                                {isLoading ? "Saving..." : "Save & Continue"}
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

export default AminitiesAndInclusions