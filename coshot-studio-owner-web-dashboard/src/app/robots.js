const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.coshot.in";

export default function robots() {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
            },
            {
                userAgent: "*",
                disallow: ["/login"],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    };
}
