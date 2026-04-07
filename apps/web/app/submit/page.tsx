"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function SubmitPage() {
  const [form, setForm] = useState({
    type: "evidence",
    minister_name: "",
    title: "",
    description: "",
    source_url: "",
    submitter_name: "",
    submitter_email: "",
  });
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    const { error } = await supabase.from("public_submissions").insert({
      submission_type: form.type,
      title: form.title,
      content: JSON.stringify({
        minister_name: form.minister_name,
        description: form.description,
        source_url: form.source_url,
        submitter_name: form.submitter_name,
        submitter_email: form.submitter_email,
      }),
      status: "pending",
    });

    setStatus(error ? "error" : "success");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">Submit Evidence</h1>
        <p className="mt-2 text-neutral-500">
          Help hold Nepal&apos;s government accountable. Submit evidence of
          ministerial actions, corrections, or tips. All submissions are
          reviewed before publishing.
        </p>
      </div>

      {status === "success" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mb-3 text-4xl">✅</div>
          <h2 className="text-xl font-bold text-emerald-800">Thank You!</h2>
          <p className="mt-2 text-emerald-700">
            Your submission has been received and will be reviewed by our team.
            Approved submissions will be attributed to you.
          </p>
          <button
            onClick={() => {
              setForm({
                type: "evidence",
                minister_name: "",
                title: "",
                description: "",
                source_url: "",
                submitter_name: "",
                submitter_email: "",
              });
              setStatus("idle");
            }}
            className="mt-4 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Submit Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type */}
          <div>
            <label
              htmlFor="submit-type"
              className="mb-1.5 block text-sm font-medium text-neutral-700"
            >
              Submission Type
            </label>
            <select
              id="submit-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-blue-700 focus:ring-1 focus:ring-[#0EA5E9] focus:outline-none"
            >
              <option value="evidence">Evidence of Action</option>
              <option value="correction">Correction / Error Report</option>
              <option value="tip">Anonymous Tip</option>
              <option value="data">Data Contribution</option>
            </select>
          </div>

          {/* Minister */}
          <div>
            <label
              htmlFor="submit-minister"
              className="mb-1.5 block text-sm font-medium text-neutral-700"
            >
              Related Minister (optional)
            </label>
            <input
              id="submit-minister"
              type="text"
              value={form.minister_name}
              onChange={(e) =>
                setForm({ ...form, minister_name: e.target.value })
              }
              placeholder="e.g. Name of the minister"
              className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-blue-700 focus:ring-1 focus:ring-[#0EA5E9] focus:outline-none"
            />
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="submit-title"
              className="mb-1.5 block text-sm font-medium text-neutral-700"
            >
              Title *
            </label>
            <input
              id="submit-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Brief summary of the evidence or correction"
              className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-blue-700 focus:ring-1 focus:ring-[#0EA5E9] focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="submit-description"
              className="mb-1.5 block text-sm font-medium text-neutral-700"
            >
              Description *
            </label>
            <textarea
              id="submit-description"
              required
              rows={6}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Provide details about the evidence, including dates, context, and impact. The more specific, the better."
              className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-blue-700 focus:ring-1 focus:ring-[#0EA5E9] focus:outline-none"
            />
          </div>

          {/* Source URL */}
          <div>
            <label
              htmlFor="submit-source-url"
              className="mb-1.5 block text-sm font-medium text-neutral-700"
            >
              Source URL
            </label>
            <input
              id="submit-source-url"
              type="url"
              value={form.source_url}
              onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-blue-700 focus:ring-1 focus:ring-[#0EA5E9] focus:outline-none"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Link to a news article, government gazette, or other verifiable
              source.
            </p>
          </div>

          {/* Contact info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="submit-name"
                className="mb-1.5 block text-sm font-medium text-neutral-700"
              >
                Your Name (optional)
              </label>
              <input
                id="submit-name"
                type="text"
                value={form.submitter_name}
                onChange={(e) =>
                  setForm({ ...form, submitter_name: e.target.value })
                }
                placeholder="For attribution"
                className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-blue-700 focus:ring-1 focus:ring-[#0EA5E9] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="submit-email"
                className="mb-1.5 block text-sm font-medium text-neutral-700"
              >
                Email (optional)
              </label>
              <input
                id="submit-email"
                type="email"
                value={form.submitter_email}
                onChange={(e) =>
                  setForm({ ...form, submitter_email: e.target.value })
                }
                placeholder="For follow-up questions"
                className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-blue-700 focus:ring-1 focus:ring-[#0EA5E9] focus:outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-lg bg-blue-700 px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#2a4a73] disabled:opacity-50"
            >
              {status === "submitting" ? "Submitting…" : "Submit Evidence"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-600">
                Something went wrong. Please try again.
              </p>
            )}
          </div>

          <p className="text-xs text-neutral-400">
            By submitting, you confirm this information is accurate to your
            knowledge. All submissions are reviewed by our editorial team. You
            can also{" "}
            <a
              href="https://github.com/rrijal1/DrishtiNepal"
              className="text-blue-700 underline"
            >
              submit a Pull Request on GitHub
            </a>{" "}
            for data corrections.
          </p>
        </form>
      )}
    </div>
  );
}
