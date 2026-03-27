import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drishti Nepal | दृष्टि नेपाल — Cabinet Accountability Portal",
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
  ],
  openGraph: {
    title: "Drishti Nepal | दृष्टि नेपाल",
    description:
      "Holding Nepal's government accountable through transparent tracking of every cabinet decision.",
    siteName: "Drishti Nepal",
    locale: "ne_NP",
    alternateLocale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@DrishtiNepalHQ",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
      </head>
      <body className="min-h-screen bg-neutral-50 text-neutral-800 antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

/* ─── Navbar ─── */
function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e3a5f] text-white font-bold text-lg">
            द
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold text-[#1e3a5f]">
              Drishti Nepal
            </span>
            <span className="text-[10px] font-medium text-neutral-400 font-nepali">
              दृष्टि नेपाल
            </span>
          </div>
        </a>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/ministers">Ministers</NavLink>
          <NavLink href="/decisions">Decisions</NavLink>
          <NavLink href="/manifesto">Manifesto Tracker</NavLink>
          <NavLink href="/scores">Scores</NavLink>
          <NavLink href="/articles">Articles</NavLink>
          <NavLink href="/submit">Submit Evidence</NavLink>
        </nav>

        {/* Language toggle + mobile menu */}
        <div className="flex items-center gap-3">
          <button className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100">
            नेपाली
          </button>
          {/* Mobile hamburger */}
          <button className="rounded-md p-2 text-neutral-600 md:hidden hover:bg-neutral-100">
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h14M3 10h14M3 14h14" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
    >
      {children}
    </a>
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f] text-white font-bold">
                द
              </div>
              <div>
                <p className="font-bold text-[#1e3a5f]">Drishti Nepal</p>
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
