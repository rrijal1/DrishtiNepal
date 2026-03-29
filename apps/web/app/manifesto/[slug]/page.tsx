import { ProposeEditForm } from "@/components/ProposeEditForm";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: item } = await supabase
    .from("manifesto_items")
    .select("title_en, category")
    .eq("source_id", slug)
    .maybeSingle();
  if (!item) return { title: "Commitment Not Found — Drishti Nepal" };
  return {
    title: `${item.title_en ?? slug} | Vacha Patra — Drishti Nepal`,
    description: `Full text and tracking status for commitment ${slug} under ${item.category}.`,
  };
}

export default async function ManifestoItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch the manifesto item
  const { data: item } = await supabase
    .from("manifesto_items")
    .select(
      "*, minister_manifesto_assignments(minister_id, ministers(name_en, name_np, id))",
    )
    .eq("source_id", slug)
    .maybeSingle();

  if (!item) notFound();

  // Related actions (via action_manifesto_links)
  const { data: actionLinks } = await supabase
    .from("action_manifesto_links")
    .select(
      "link_type, actions(id, title_en, action_date, category, sentiment, description_en)",
    )
    .eq("manifesto_item_id", item.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Related cabinet decisions
  const { data: decisionLinks } = await supabase
    .from("cabinet_decision_manifesto_links")
    .select(
      "cabinet_decisions(id, title_en, decision_date, summary_en, significance)",
    )
    .eq("manifesto_item_id", item.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Recent approved edits
  const { data: approvedEdits } = await supabase
    .from("manifesto_edits")
    .select("field_name, proposed_text, reason, submitter_name, created_at")
    .eq("manifesto_item_id", item.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(5);

  const keyCommitments: string[] = Array.isArray(item.key_commitments)
    ? item.key_commitments
    : [];
  const targetMetrics = item.target_metrics ?? {};
  const metricEntries = Object.entries(targetMetrics);

  // Build editable fields list for the propose-edit form
  const editableFields = [
    {
      name: "item_text_en",
      label: "Full Text (English)",
      currentText: item.item_text_en ?? "",
    },
    {
      name: "item_text_np",
      label: "Full Text (Nepali)",
      currentText: item.item_text_np ?? "",
    },
    {
      name: "description_en",
      label: "Description (English)",
      currentText: item.description_en ?? "",
    },
  ];

  const statusMap: Record<string, { bg: string; text: string; label: string }> =
    {
      completed: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        label: "Completed",
      },
      in_progress: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        label: "In Progress",
      },
      partially_fulfilled: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        label: "Partially Fulfilled",
      },
      fulfilled: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        label: "Fulfilled",
      },
      broken: { bg: "bg-red-50", text: "text-red-700", label: "Broken" },
      not_started: {
        bg: "bg-neutral-50",
        text: "text-neutral-500",
        label: "Not Started",
      },
      contradicted: {
        bg: "bg-red-50",
        text: "text-red-700",
        label: "Contradicted",
      },
    };
  const s = statusMap[item.status] ?? statusMap.not_started;

  const sentimentColor: Record<string, string> = {
    positive: "text-emerald-600",
    negative: "text-red-600",
    neutral: "text-neutral-500",
    mixed: "text-amber-600",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back */}
      <a
        href="/manifesto"
        className="mb-6 inline-flex items-center gap-1 text-sm text-neutral-500 transition hover:text-neutral-800"
      >
        ← Back to Vacha Patra Tracker
      </a>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#1e3a5f]/8 px-2.5 py-0.5 text-xs font-medium text-[#1e3a5f]">
            {item.source_id}
          </span>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500 capitalize">
            {item.category?.replace(/_/g, " ")}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}
          >
            {s.label}
          </span>
          {item.priority && item.priority !== "medium" && (
            <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-600 capitalize">
              {item.priority} priority
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-neutral-800 sm:text-3xl">
          {item.title_en}
        </h1>
        {item.title_np && (
          <p className="mt-1 text-lg text-neutral-500 font-nepali">
            {item.title_np}
          </p>
        )}

        {/* Assigned ministers */}
        {(item.minister_manifesto_assignments?.length ?? 0) > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-sm text-neutral-400">Responsible:</span>
            {item.minister_manifesto_assignments!.map((a: any) => (
              <a
                key={a.minister_id}
                href={`/ministers/${a.minister_id}`}
                className="rounded-full bg-[#1e3a5f]/5 px-2.5 py-0.5 text-xs font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
              >
                {a.ministers?.name_en}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Full text */}
      <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Full Commitment Text
        </h2>
        <div className="mb-4 text-neutral-700 leading-relaxed">
          {item.item_text_en}
        </div>
        {item.item_text_np && (
          <div className="border-t border-neutral-100 pt-4 text-neutral-600 font-nepali leading-relaxed">
            {item.item_text_np}
          </div>
        )}
      </section>

      {/* Key commitments */}
      {keyCommitments.length > 0 && (
        <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Key Commitments
          </h2>
          <ul className="space-y-2.5">
            {keyCommitments.map((c, i) => (
              <li key={i} className="flex gap-3 text-sm text-neutral-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1e3a5f]/40" />
                {c}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Target metrics */}
      {metricEntries.length > 0 && (
        <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Target Metrics
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            {metricEntries.map(([k, v]) => (
              <div key={k} className="rounded-lg bg-neutral-50 p-3">
                <dt className="text-xs font-medium text-neutral-400 capitalize">
                  {k.replace(/_/g, " ")}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-neutral-700">
                  {String(v)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Related government actions */}
      {(actionLinks?.length ?? 0) > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-neutral-800">
            Related Government Actions
          </h2>
          <div className="space-y-3">
            {actionLinks!.map((link: any) => {
              const a = link.actions;
              const linkColor =
                link.link_type === "supports"
                  ? "border-l-emerald-400"
                  : link.link_type === "contradicts"
                    ? "border-l-red-400"
                    : "border-l-amber-400";
              return (
                <div
                  key={a.id}
                  className={`rounded-lg border border-neutral-200 bg-white p-4 border-l-4 ${linkColor}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-neutral-800">
                        {a.title_en}
                      </p>
                      {a.description_en && (
                        <p className="mt-1 text-sm text-neutral-500">
                          {a.description_en.slice(0, 200)}
                          {a.description_en.length > 200 ? "…" : ""}
                        </p>
                      )}
                      <p className="mt-1.5 text-xs text-neutral-400">
                        {new Date(a.action_date).toLocaleDateString("en-NP", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        · {a.category}
                        {a.sentiment && (
                          <span
                            className={` ml-2 ${sentimentColor[a.sentiment] ?? ""}`}
                          >
                            ● {a.sentiment}
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        link.link_type === "supports"
                          ? "bg-emerald-50 text-emerald-700"
                          : link.link_type === "contradicts"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {link.link_type.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Related cabinet decisions */}
      {(decisionLinks?.length ?? 0) > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-neutral-800">
            Related Cabinet Decisions
          </h2>
          <div className="space-y-3">
            {decisionLinks!.map((link: any) => {
              const d = link.cabinet_decisions;
              return (
                <div
                  key={d.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <p className="font-medium text-neutral-800">{d.title_en}</p>
                  {d.summary_en && (
                    <p className="mt-1 text-sm text-neutral-500">
                      {d.summary_en}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-neutral-400">
                    {new Date(d.decision_date).toLocaleDateString("en-NP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {d.significance && d.significance !== "medium" && (
                      <span className="ml-2 capitalize">
                        · {d.significance} significance
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Approved community edits history */}
      {(approvedEdits?.length ?? 0) > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-neutral-800">
            Edit History
          </h2>
          <div className="space-y-3">
            {approvedEdits!.map((edit: any, i: number) => (
              <div
                key={i}
                className="rounded-lg border border-neutral-200 bg-white p-4 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-neutral-700 capitalize">
                    {edit.field_name.replace(/_/g, " ")} updated
                  </span>
                  <span className="text-xs text-neutral-400">
                    {new Date(edit.created_at).toLocaleDateString()}
                    {edit.submitter_name ? ` by ${edit.submitter_name}` : ""}
                  </span>
                </div>
                {edit.reason && (
                  <p className="mt-1 text-neutral-500">Source: {edit.reason}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Propose Edit form */}
      <section
        id="propose-edit"
        className="rounded-xl border border-neutral-200 bg-white p-6"
      >
        <div className="mb-5">
          <h2 className="text-lg font-bold text-neutral-800">
            Propose a Correction
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            See something inaccurate? Suggest a correction — it will be reviewed
            by our moderators before going live. Think of it like a pull
            request.
          </p>
        </div>
        <ProposeEditForm itemId={item.id} slug={slug} fields={editableFields} />
      </section>
    </div>
  );
}
