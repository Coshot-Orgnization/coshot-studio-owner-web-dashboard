const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.coshot.in";

export default function sitemap() {
    const now = new Date();

    const routes = [
        "/",
        "/add-studio",
        "/bookings",
        "/earnings",
        "/my-studios",
        "/profile",
        "/support",
        "/view-blocked-dates",
    ];

    return routes.map((route) => ({
        url: `${siteUrl}${route}`,
        lastModified: now,
        changeFrequency: route === "/" ? "daily" : "weekly",
        priority: route === "/" ? 1 : 0.7,
    }));
}
