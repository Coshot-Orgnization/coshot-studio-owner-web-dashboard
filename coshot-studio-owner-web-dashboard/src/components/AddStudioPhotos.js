"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ImageUploadModal from "@/modals/ImageUploadModal";
import { useCreateStudioMutation, useGetStudioDetailsQuery } from "@/redux/studios/studiosApi";
import { imageSrcHandler } from "@/helpers/imageSrcHandler";
import { showErrorToast, showSuccessToast } from "@/helpers/toast";

const TOTAL_SLOTS = 12;

const PlaceholderImageIcon = ({ className = "" }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="3.5" y="4.5" width="17" height="15" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8.5" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.5 16L10 11.5L13 14.5L15.5 12L18.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const UploadCloudIcon = () => (
    <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#9b99a9]">
        <path
            d="M31.7 20.9C31.4 16.1 27.4 12.4 22.6 12.4C18.4 12.4 14.9 15.2 13.7 19.1C9.9 19.7 7 23 7 26.9C7 31.2 10.5 34.8 14.9 34.8H20.3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M24 35.6V23.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M19.8 27.6L24 23.4L28.2 27.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const AddStudioPhotos = () => {
    const router = useRouter();
    const [createStudio, { isLoading: isSaving }] = useCreateStudioMutation();
    const [studioId, setStudioId] = useState("");
    const { data: studioDetails } = useGetStudioDetailsQuery(studioId, {
        skip: !studioId,
        refetchOnMountOrArgChange: true,
    });

    const [photos, setPhotos] = useState([]);
    const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const slots = useMemo(
        () =>
            Array.from({ length: TOTAL_SLOTS }).map((_, index) => ({
                id: `slot-${index + 1}`,
                preview: photos[index] || null,
            })),
        [photos]
    );

    const openUploadModal = () => {
        if (photos.length >= TOTAL_SLOTS) {
            showErrorToast(`You can upload up to ${TOTAL_SLOTS} photos.`);
            return;
        }
        setIsUploadModalOpen(true);
    };

    const removePhoto = (index) => {
        setPhotos((prev) => prev.filter((_, photoIndex) => photoIndex !== index));
        setMainPhotoIndex((prev) => {
            if (index === prev) return 0;
            if (index < prev) return Math.max(prev - 1, 0);
            return prev;
        });
    };

    const handlePhotoUpload = async (uploadPayload) => {
        const uploads = Array.isArray(uploadPayload) ? uploadPayload : [uploadPayload];
        const validUploads = uploads
            .map((item) => item?.uploadedPath)
            .filter(Boolean)
            .map((uploadedPath) => ({
                id: `${uploadedPath}-${Date.now()}-${Math.random()}`,
                path: uploadedPath,
                url: imageSrcHandler(uploadedPath),
            }));

        if (validUploads.length === 0) {
            showErrorToast("Missing uploaded image path.");
            return;
        }

        setIsUploadingImage(true);

        try {
            setPhotos((prev) => {
                const available = Math.max(TOTAL_SLOTS - prev.length, 0);
                if (available <= 0) return prev;
                return [...prev, ...validUploads.slice(0, available)];
            });
            setIsUploadModalOpen(false);
            showSuccessToast(validUploads.length > 1 ? "Photos uploaded successfully." : "Photo uploaded successfully.");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const onContinue = async () => {
        if (!studioId) {
            showErrorToast("Studio ID not found. Please complete previous steps first.");
            return;
        }

        if (photos.length < 3) {
            showErrorToast("Please upload at least 3 photos before continuing.");
            return;
        }

        const imagePayload = photos
            .map((photo, index) => {
                const key = String(photo?.path || "").replace(/^\/+/, "");
                if (!key) return null;

                const isPrimary = index === mainPhotoIndex;

                return {
                    key,
                    displayOrder: index,
                    isPrimary,
                    imageType: "gallery",
                    ...(isPrimary ? { altText: "Main studio shot" } : {}),
                };
            })
            .filter(Boolean);



        const res = await createStudio({
            studioId,
            step: 7,
            images: imagePayload,
        });

        if (res?.data) {
            showSuccessToast(res?.data?.message || "Studio photos saved successfully.");
            router.push("/add-studio/studio-preview");
        } else {
            showErrorToast(res?.error?.data?.message || "Something went wrong");
        }
    };

    useEffect(() => {
        setStudioId(localStorage.getItem("studioId") || "");
    }, []);

    useEffect(() => {
        const images = studioDetails?.data?.images || [];
        if (!Array.isArray(images) || images.length === 0) return;

        const normalized = images
            .map((item, index) => {
                const path = typeof item === "string" ? item : item?.imagePath || item?.url || item?.path || "";
                if (!path) return null;

                return {
                    id: `${path}-${index}`,
                    path,
                    url: imageSrcHandler(path),
                };
            })
            .filter(Boolean)
            .slice(0, TOTAL_SLOTS);

        if (normalized.length > 0) {
            setPhotos(normalized);

            const bannerImage =
                studioDetails?.data?.bannerImagePath ||
                studioDetails?.data?.bannerImage ||
                "";

            const bannerIndex = normalized.findIndex((image) => image.path === bannerImage || image.url === bannerImage);
            setMainPhotoIndex(bannerIndex >= 0 ? bannerIndex : 0);
        }
    }, [studioDetails]);

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
                            <h1 className="text-[20px] font-semibold text-[#6d5ef6]">Studio Photos</h1>
                            <p className="max-w-90 text-[13px] leading-4 text-[#444356]">
                                Upload clear photos of your studio to help guests understand the space and increase bookings.
                            </p>
                        </div>
                        <div className="block lg:hidden">
                            <Navbar />
                        </div>
                    </div>

                    <div className="mt-1 sm:mt-4 border-t border-dashed border-[#e3e2ec]" />
                    <div className="space-y-6 px-6 py-7 md:px-10 md:py-8">
                        <div>
                            <label className="mb-2 block text-[14px] font-semibold text-[#555268]">Upload Photos</label>

                            <button
                                type="button"
                                onClick={openUploadModal}
                                className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-[14px] border border-dashed border-[#e2e1eb] bg-white text-[#8a8798] shadow-[0_10px_20px_rgba(47,42,71,0.06)]"
                            >
                                <UploadCloudIcon />
                                <span className="mt-2 text-[16px] text-[#6b687c]">Tap to upload studio photos</span>
                            </button>

                            <p className="mt-2 text-[14px] italic text-[#8e8aa1]">Upload at least 3 well-lit photos. Avoid posters or watermarked images.</p>
                        </div>

                        <div>
                            <p className="text-[17px] font-semibold italic text-[#6f6b84]">👉 Mark as Main Image</p>
                            <p className="mb-5 text-[14px] italic text-[#8e8aa1]">This image will appear first in your studio listing.</p>

                            <div className="flex flex-wrap gap-4">
                                {slots.map((slot, index) => {
                                    const isMain = index === mainPhotoIndex && Boolean(slot.preview);

                                    return (
                                        <div
                                            key={slot.id}
                                            className="relative h-14 w-14 cursor-pointer overflow-visible rounded-xl border border-[#e2e1eb] bg-white shadow-[0_6px_14px_rgba(47,42,71,0.06)]"
                                        >
                                            {slot.preview ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setMainPhotoIndex(index)}
                                                    className="h-full w-full"
                                                    aria-label={`Set image ${index + 1} as main image`}
                                                >
                                                    <img src={slot.preview.url} alt={`Studio ${index + 1}`} className="h-full w-full rounded-[11px] object-cover" />
                                                </button>
                                            ) : (
                                                <span className="flex h-full w-full items-center justify-center text-[#c3c1ce]">
                                                    <PlaceholderImageIcon />
                                                </span>
                                            )}

                                            {slot.preview ? (
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        removePhoto(index);
                                                    }}
                                                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6b6b] text-[12px] leading-none text-white cursor-pointer"
                                                    aria-label="Remove photo"
                                                >
                                                    <img src="/images/navbar/delete.png" className="w-4 h-4" />
                                                </button>
                                            ) : null}

                                            {isMain && (
                                                <span className="absolute -bottom-2 right-5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-linear-to-r from-[#1e3a8a] to-[#6d5ef6] text-[10px] text-white cursor-pointer">
                                                    <img src="/images/navbar/tick.png" className="w-3 h-3" />
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-[#ecebf3] px-6 py-6 md:px-10 md:py-7">
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onContinue}
                                disabled={isSaving}
                                className="h-12 w-full max-w-53.5 rounded-full bg-linear-to-r from-[#1e3a8a] to-[#6d5ef6] text-[18px] font-medium text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 bg-[linear-gradient(95.53deg,#1E3A8A_0%,#6D5EF6_40%,#1E3A8A_100%)] bg-size-[300%_100%] transition-all duration-500 ease-in-out hover:bg-position-[100%_0]"
                            >
                                {isSaving ? "Saving..." : "Save & Continue"}
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <div className="mx-auto max-w-full px-0 sm:px-0">
                <Footer />
            </div>

            <ImageUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handlePhotoUpload}
                isUploading={isUploadingImage}
                title="Upload Studio Photo"
                category="studio_gallery"
                allowMultiple
                entityId={studioId}
            />
        </main>
    );
};

export default AddStudioPhotos;