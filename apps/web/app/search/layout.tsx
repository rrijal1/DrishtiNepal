import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search — Drishti Nepal",
  description:
    "Search ministers, manifesto commitments, and analysis articles.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
