"use client";

import React, { useEffect, useMemo, useState } from "react";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";
import { useUploadImageUrlMutation } from "@/redux/studio-owner/studioOwnerApi";
import { showErrorToast } from "@/helpers/toast";

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/jpg,image/webp";

const ImageUploadModal = ({
    isOpen,
    onClose,
    onUpload,
    isUploading = false,
    currentImage = "",
    title = "Upload Profile Image",
    category = "profile_pic",
    allowMultiple = false,
    entityId = "",
}) => {
    useBodyScrollLock(isOpen);

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrl, setPreviewUrl] = useState("");
    const [uploadMeta, setUploadMeta] = useState([]);
    const [uploadImgUrl] = useUploadImageUrlMutation();

    useEffect(() => {
        if (!isOpen) {
            setSelectedFiles([]);
            setPreviewUrl("");
            setUploadMeta([]);
        }
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const effectivePreview = useMemo(() => previewUrl || currentImage || "", [previewUrl, currentImage]);

    const handleFileChange = async (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        const finalFiles = allowMultiple ? files : [files[0]];
        setSelectedFiles(finalFiles);

        const url = URL.createObjectURL(finalFiles[0]);
        setPreviewUrl(url);

        try {
            const resolvedEntityId = entityId || (category === "studio_gallery" ? localStorage.getItem("studioId") : "");

            const payload = finalFiles.length > 1
                ? {
                    files: finalFiles.map((file) => ({
                        fileName: file.name,
                        contentType: file.type,
                        category,
                        entityId: resolvedEntityId || undefined,
                    })),
                }
                : {
                    fileName: finalFiles[0].name,
                    contentType: finalFiles[0].type,
                    category,
                    entityId: resolvedEntityId || undefined,
                };

            const res = await uploadImgUrl(payload).unwrap();

            const data = res?.data?.results ?? res?.data ?? res ?? {};
            const metaList = Array.isArray(data)
                ? data
                : Array.isArray(data?.files)
                    ? data.files
                    : Array.isArray(data?.uploads)
                        ? data.uploads
                        : Array.isArray(data?.items)
                            ? data.items
                            : data?.presignedUrl
                                ? [data]
                                : [];

            setUploadMeta(metaList);
        } catch {
            setUploadMeta([]);
            showErrorToast("Failed to prepare image upload.");
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0 || isUploading) return;

        try {
            const metaList = Array.isArray(uploadMeta) ? uploadMeta : [];

            if (metaList.length === 0) {
                showErrorToast("Missing upload URL. Please reselect your image.");
                return;
            }

            const uploadedItems = [];

            for (let index = 0; index < selectedFiles.length; index += 1) {
                const file = selectedFiles[index];
                const matchedMeta =
                    metaList[index] ||
                    metaList.find((meta) => {

                        const metaFileName = meta?.fileName || meta?.name || meta?.originalFileName;
                        return metaFileName && metaFileName === file.name;
                    }) ||
                    null;

                const presignedUrl = matchedMeta?.presignedUrl;
                if (!presignedUrl) {
                    showErrorToast("Missing upload URL. Please reselect your image.");
                    return;
                }

                const uploadResponse = await fetch(presignedUrl, {
                    method: "PUT",
                    headers: {
                        "Content-Type": file.type,
                    },
                    body: file,
                });

                if (!uploadResponse.ok) {
                    throw new Error("Failed to upload image file");
                }

                const fallbackPublicUrl = presignedUrl?.split("?")?.[0] || "";

                uploadedItems.push({
                    file,
                    fileName: file?.name,
                    uploadMeta: matchedMeta,
                    uploadedPath:
                        matchedMeta?.filePath ||
                        matchedMeta?.path ||
                        matchedMeta?.key ||
                        matchedMeta?.fileKey ||
                        matchedMeta?.url ||
                        fallbackPublicUrl,
                });
            }

            await onUpload?.(allowMultiple || uploadedItems.length > 1 ? uploadedItems : uploadedItems[0]);
        } catch {
            showErrorToast("Failed to upload profile image.");
        }
    };

    const handleClose = () => {
        if (isUploading) return;
        onClose?.();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-[#242528b3] px-4">
            <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
                <button
                    type="button"
                    onClick={handleClose}
                    disabled={isUploading}
                    className="absolute right-4 top-3 text-3xl cursor-pointer text-[#8E8EAA] transition hover:text-[#69699A] disabled:cursor-not-allowed"
                    aria-label="Close image upload modal"
                >
                    ×
                </button>

                <h3 className="mb-1 text-xl font-semibold text-[#1B1B2F]">{title}</h3>

                <div className="my-5 flex justify-center">
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-[#ececf2] bg-[#f6f6fb]">
                        {effectivePreview ? (
                            <img src={effectivePreview} alt="Profile preview" className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-xs text-[#8E8EAA]">No image</span>
                        )}
                    </div>
                </div>

                <label className="mb-5 flex h-12 cursor-pointer items-center justify-center rounded-full border border-dashed border-[#b7b4dc] bg-[#f8f7ff] px-4 text-sm font-medium text-[#4f45d4] hover:bg-[#f1efff]">
                    <input
                        type="file"
                        accept={ACCEPTED_IMAGE_TYPES}
                        multiple={allowMultiple}
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="hidden"
                    />
                    {selectedFiles.length > 1
                        ? `${selectedFiles.length} images selected`
                        : selectedFiles[0]?.name || "Select Image"}
                </label>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isUploading}
                        className="h-11 flex-1 rounded-full border border-[#d8d8e8] text-sm font-medium text-[#4f4f68] disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0 || isUploading}
                        className="h-11 flex-1 rounded-full bg-linear-to-r from-[#2849b3] to-[#6558e8] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer hover:opacity-95"
                    >
                        {isUploading ? "Uploading..." : "Upload"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageUploadModal;