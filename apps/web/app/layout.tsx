import { Header } from "@/components/Header";
import { getLocale, translations } from "@/lib/i18n";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Drishti Nepal | दृष्टि नेपाल — Cabinet Accountability Portal",
    template: "%s | Drishti Nepal",
  },
  description:
    "Tracking Nepal's cabinet ministers against their election manifesto commitments. AI-powered, transparent, unbiased political accountability.",
  keywords: [
    "Nepal",
    "politics",
    "cabinet",
    "accountability",
    "manifesto",
    "दृष्टि नेपाल",
    "मन्त्रिपरिषद्",
    "Nepal government tracker",
    "RSP manifesto",
    "Balendra Shah",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://drishtinepal.com",
  ),
  openGraph: {
    title: "Drishti Nepal | दृष्टि नेपाल",
    description:
      "Holding Nepal's government accountable through transparent tracking of every cabinet decision.",
    siteName: "Drishti Nepal",
    locale: "ne_NP",
    alternateLocale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Drishti Nepal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@DrishtiNepalHQ",
    images: ["/og-default.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const t = translations[locale].nav;

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Umami analytics — privacy-friendly, GDPR compliant, no cookies */}
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <script
            defer
            src={
              process.env.NEXT_PUBLIC_UMAMI_SRC ??
              "https://cloud.umami.is/script.js"
            }
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        )}
      </head>
      <body className="min-h-screen overflow-x-hidden bg-neutral-50 text-neutral-800 antialiased">
        <Header locale={locale} navLabels={t} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="mt-20 border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-800 text-white font-bold">
                द
              </div>
              <div>
                <p className="font-bold text-blue-800">Drishti Nepal</p>
                <p className="text-xs text-neutral-400 font-nepali">
                  दृष्टि नेपाल
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-neutral-500">
              Holding Nepal&apos;s government accountable through transparent,
              AI-powered tracking.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-neutral-800">
              Portal
            </h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li>
                <a href="/ministers" className="hover:text-neutral-800">
                  Ministers
                </a>
              </li>
              <li>
                <a href="/decisions" className="hover:text-neutral-800">
                  Cabinet Decisions
                </a>
              </li>
              <li>
                <a href="/manifesto" className="hover:text-neutral-800">
                  Manifesto Tracker
                </a>
              </li>
              <li>
                <a href="/scores" className="hover:text-neutral-800">
                  Score Dashboard
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-neutral-800">
              Participate
            </h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li>
                <a href="/submit" className="hover:text-neutral-800">
                  Submit Evidence
                </a>
              </li>
              <li>
                <a href="/articles" className="hover:text-neutral-800">
                  Read Analysis
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/rrijal1/DrishtiNepal"
                  className="hover:text-neutral-800"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a href="/about" className="hover:text-neutral-800">
                  About Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-neutral-800">
              Follow Us
            </h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li>
                <a
                  href="https://facebook.com/DrishtiNepalHQ"
                  className="hover:text-neutral-800"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/DrishtiNepalHQ"
                  className="hover:text-neutral-800"
                >
                  X (Twitter)
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/drishtinepal_hq/"
                  className="hover:text-neutral-800"
                >
                  Instagram
                </a>
              </li>
            </ul>
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-semibold text-neutral-800">
                Methodology
              </h4>
              <p className="text-xs text-neutral-400">
                All scoring is{" "}
                <a href="/methodology" className="underline">
                  publicly documented
                </a>
                . AI-generated content is clearly labeled.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-100 pt-6 text-center text-xs text-neutral-400">
          <p>
            &copy; {new Date().getFullYear()} Drishti Nepal. Open source under
            MIT License. Non-partisan civic technology.
          </p>
        </div>
      </div>
    </footer>
  );
}
