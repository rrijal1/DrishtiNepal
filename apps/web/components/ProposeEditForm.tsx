"use client";

import { useState } from "react";

interface ProposeEditFormProps {
  itemId: string;
  slug: string;
  fields: { name: string; label: string; currentText: string }[];
}

export function ProposeEditForm({
  itemId,
  slug,
  fields,
}: ProposeEditFormProps) {
  const [selectedField, setSelectedField] = useState(fields[0]?.name ?? "");
  const [proposedText, setProposedText] = useState("");
  const [reason, setReason] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [state, setState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const currentField = fields.find((f) => f.name === selectedField);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!proposedText.trim()) return;
    setState("submitting");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/manifesto/${slug}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manifesto_item_id: itemId,
          field_name: selectedField,
          original_text: currentField?.currentText ?? "",
          proposed_text: proposedText.trim(),
          reason: reason.trim() || null,
          submitter_name: submitterName.trim() || null,
          submitter_email: submitterEmail.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Submission failed");
      }
      setState("success");
      setProposedText("");
      setReason("");
    } catch (err: any) {
      setState("error");
      setErrorMsg(err.message ?? "Unknown error");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mb-2 text-2xl">✅</div>
        <h3 className="font-semibold text-emerald-800">
          Edit Proposal Submitted
        </h3>
        <p className="mt-1 text-sm text-emerald-700">
          Your proposed correction has been queued for moderator review. Thank
          you for helping improve the accuracy of this tracker.
        </p>
        <button
          onClick={() => setState("idle")}
          className="mt-4 rounded-lg border border-emerald-300 bg-white px-4 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Field selector */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Which field needs correction?
        </label>
        <select
          value={selectedField}
          onChange={(e) => {
            setSelectedField(e.target.value);
            setProposedText("");
          }}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
        >
          {fields.map((f) => (
            <option key={f.name} value={f.name}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Current value (read-only preview) */}
      {currentField?.currentText && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-500">
            Current text
          </label>
          <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-500 ring-1 ring-neutral-200">
            {currentField.currentText.slice(0, 400)}
            {currentField.currentText.length > 400 ? "…" : ""}
          </div>
        </div>
      )}

      {/* Proposed correction */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Your proposed correction <span className="text-red-500">*</span>
        </label>
        <textarea
          value={proposedText}
          onChange={(e) => setProposedText(e.target.value)}
          required
          rows={4}
          placeholder="Enter the corrected text…"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
        />
      </div>

      {/* Reason */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Reason / source (optional but recommended)
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Official gazette no. 1234, Gorkhapatra 2082-04-15"
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
        />
      </div>

      {/* Submitter info */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Your name (optional)
          </label>
          <input
            type="text"
            value={submitterName}
            onChange={(e) => setSubmitterName(e.target.value)}
            placeholder="Anonymous"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Email (optional, for updates)
          </label>
          <input
            type="email"
            value={submitterEmail}
            onChange={(e) => setSubmitterEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
          />
        </div>
      </div>

      {state === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "submitting" || !proposedText.trim()}
        className="rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#1e3a5f]/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state === "submitting" ? "Submitting…" : "Submit Edit Proposal"}
      </button>
    </form>
  );
}
