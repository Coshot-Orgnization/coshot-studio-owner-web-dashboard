import "./globals.css";
import Providers from "../redux/providers";
import GlobalClientLayout from "../components/GlobalClientLayout";
import { ToastContainer } from "react-toastify";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.coshot.in";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Coshot Studio Owner Dashboard | Manage Studio Bookings, Earnings & Availability",
    template: "%s | Coshot Studio Owner Dashboard",
  },
  description:
    "Coshot Studio Owner Dashboard helps studio owners manage bookings, studio availability, pricing, earnings, payouts, and profile settings in one place.",
  applicationName: "Coshot Studio Owner Dashboard",
  referrer: "origin-when-cross-origin",
  category: "Business",
  keywords: [
    "Coshot",
    "Co shot",
    "Coshot studio",
    "Co shot studio",
    "Coshot studio owner",
    "Co shot studio owner",
    "studio owner dashboard",
    "studio management software",
    "studio booking dashboard",
    "studio booking management",
    "photo studio management",
    "video studio management",
    "content creator studio",
    "rental studio dashboard",
    "studio scheduling software",
    "booking calendar for studio",
    "manage studio availability",
    "studio pricing management",
    "studio host dashboard",
    "studio owner portal",
    "studio partner login",
    "studio owner login",
    "host booking management",
    "studio earnings dashboard",
    "studio payout tracking",
    "settlement management",
    "studio wallet dashboard",
    "studio operations dashboard",
    "studio profile management",
    "add studio listing",
    "studio listing management",
    "production studio booking",
    "podcast studio booking",
    "shoot location management",
    "workspace booking management",
    "studio business tools",
    "studio reservation management",
    "India studio booking platform",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Coshot Studio Owner Dashboard",
    description:
      "Manage bookings, pricing, availability, earnings, and payouts with the Coshot Studio Owner Dashboard.",
    siteName: "Coshot",
    images: [
      {
        url: "/images/Logo.png",
        width: 1200,
        height: 630,
        alt: "Coshot Studio Owner Dashboard",
      },
    ],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coshot Studio Owner Dashboard",
    description:
      "Manage your studio bookings, availability, and earnings from one dashboard.",
    images: ["/images/Logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/images/favicon.png",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Coshot",
  url: siteUrl,
  logo: `${siteUrl}/images/Logo.png`,
  sameAs: [
    "https://www.instagram.com/coshot.in/?hl=en",
    "https://x.com/Coshot123",
    "https://www.youtube.com/@CoshotStudio",
    "https://www.linkedin.com/company/coshot-studio/",
    "https://www.facebook.com/profile.php?id=61576865589227#",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Coshot Studio Owner Dashboard",
  url: siteUrl,
  inLanguage: "en-IN",
};

export default function RootLayout({ children }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://maida-acheilary-luisa.ngrok-free.dev";
  const apiOrigin = new URL(apiUrl).origin;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href={apiOrigin} />
        <link rel="dns-prefetch" href={apiOrigin} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <ToastContainer />
          <GlobalClientLayout>
            {children}
          </GlobalClientLayout>
        </Providers>
      </body>
    </html >
  );
}
