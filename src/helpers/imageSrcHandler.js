export const imageSrcHandler = (imagePath = "") => {
    if (!imagePath) return "";

    if (/^(https?:\/\/|data:|blob:)/i.test(imagePath)) {
        return imagePath;
    }

    const bucketBaseUrl = (process.env.NEXT_PUBLIC_S3_BUCKET_URL || "").replace(/\/api\/v1\/?$/, "");
    const normalizedPath = imagePath.replace(/^\/+/, "");

    return bucketBaseUrl ? `${bucketBaseUrl}/${normalizedPath}` : `/${normalizedPath}`;
};