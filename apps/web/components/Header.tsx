"use client";

import type { Locale } from "@/lib/i18n-client";
import { useState } from "react";
import { LanguageToggle } from "./LanguageToggle";

interface HeaderProps {
  locale: Locale;
  navLabels: {
    manifesto: string;
    ministers: string;
    research: string;
    search: string;
  };
}

export function Header({ locale, navLabels: t }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/manifesto", label: t.manifesto },
    { href: "/ministers", label: t.ministers },
    { href: "/articles", label: t.research },
  ];

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

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Language toggle + search + mobile menu button */}
        <div className="flex items-center gap-2">
          <a
            href="/search"
            aria-label="Search"
            className="rounded-md p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </a>
          <LanguageToggle currentLocale={locale} />
          <button
            className="rounded-md p-2 text-neutral-600 transition hover:bg-neutral-100 md:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h14M3 10h14M3 14h14" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="border-t border-neutral-100 bg-white px-4 pb-4 md:hidden">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="block rounded-md px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
          <a
            href="/search"
            className="mt-1 flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
            onClick={() => setMenuOpen(false)}
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            {t.search}
          </a>
        </nav>
      )}
    </header>
  );
}
