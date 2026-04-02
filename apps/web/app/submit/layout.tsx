import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Evidence — Drishti Nepal",
  description:
    "Submit evidence of ministerial actions, corrections, or tips to help hold Nepal's government accountable.",
};

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
