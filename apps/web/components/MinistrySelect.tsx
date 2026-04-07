"use client";

import { useRouter } from "next/navigation";

export function MinistrySelect({
  ministries,
  selected,
}: {
  ministries: string[];
  selected: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selected}
      onChange={(e) => {
        const val = e.target.value;
        router.push(
          val
            ? `/ministers?filter=ministry&ministry=${encodeURIComponent(val)}`
            : "/ministers?filter=ministry",
        );
      }}
      className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]"
    >
      <option value="">Select Ministry</option>
      {ministries.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
}
