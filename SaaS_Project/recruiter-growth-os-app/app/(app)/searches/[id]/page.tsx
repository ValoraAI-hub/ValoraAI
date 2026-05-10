"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type SearchCandidate = {
  id: string;
  name: string;
  role: string;
  company: string;
  status: string;
  createdAt: string;
};

type StructuredContext = {
  salary_range?: string | null;
  team_size?: string | null;
  stack?: string[] | null;
  ownership?: string | null;
  culture?: string | null;
  mission?: string | null;
  selling_points?: string[] | null;
  objections?: string[] | null;
  seniority?: string | null;
  candidate_fit?: string | null;
  urgency?: string | null;
  [key: string]: unknown;
};

type SearchDetail = {
  id: string;
  title: string;
  company: string;
  rawContext: string | null;
  structuredContext: StructuredContext | null;
  extractionStatus: string;
  createdAt: string;
  updatedAt: string;
  candidates: SearchCandidate[];
};

const STATUS_TONE: Record<string, string> = {
  new: "bg-surface-2 text-text-secondary border-border",
  contacted: "bg-surface-2 text-text-secondary border-border",
  replied: "bg-surface-2 text-text-secondary border-border",
  booked: "bg-accent-bg text-accent border-accent-border",
  rejected: "bg-danger-bg text-danger border-danger/30",
};

function StatusPill({ status }: { status: string }) {
  const tone =
    STATUS_TONE[status] ?? "bg-surface-2 text-text-secondary border-border";
  return (
    <span
      className={`inline-flex items-center rounded-pill border px-2 py-0.5 text-[10px] font-medium ${tone}`}
      style={{ borderRadius: 20 }}
    >
      {status}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-pill border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-secondary"
      style={{ borderRadius: 20 }}
    >
      {children}
    </span>
  );
}

function StructuredField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-text-muted">
        {label}
      </div>
      <div className="mt-0.5 text-[13px] text-text-primary">{value}</div>
    </div>
  );
}

export default function SearchDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [search, setSearch] = useState<SearchDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [rawDraft, setRawDraft] = useState("");
  const [savingBrief, setSavingBrief] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);

  const [editingStructured, setEditingStructured] = useState(false);
  const [structuredDraft, setStructuredDraft] = useState("");
  const [savingStructured, setSavingStructured] = useState(false);
  const [structuredError, setStructuredError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const loadSearch = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!opts.silent) setLoadError(null);
      try {
        const res = await fetch(`/api/searches/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            (data as { error?: string })?.error ?? "Failed to load search"
          );
        }
        const detail = data as SearchDetail;
        setSearch(detail);
        if (!opts.silent) {
          setRawDraft(detail.rawContext ?? "");
        }
        return detail;
      } catch (e) {
        if (!opts.silent) {
          setLoadError(e instanceof Error ? e.message : "Failed to load search");
        }
        return null;
      } finally {
        if (!opts.silent) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setLoadError("Missing search id");
      return;
    }
    void loadSearch();
    return () => stopPolling();
  }, [id, loadSearch, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const fresh = await loadSearch({ silent: true });
      if (
        fresh &&
        (fresh.extractionStatus === "ready" ||
          fresh.extractionStatus === "error")
      ) {
        stopPolling();
      }
    }, 3000);
  }, [loadSearch, stopPolling]);

  const handleSaveBrief = async () => {
    if (!search) return;
    setBriefError(null);
    setSavingBrief(true);
    try {
      const res = await fetch(`/api/searches/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rawContext: rawDraft }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          (data as { error?: string })?.error ?? "Failed to save brief"
        );
      }

      void fetch(`/api/searches/${id}/extract`, { method: "POST" });

      setSearch((prev) =>
        prev
          ? { ...prev, rawContext: rawDraft, extractionStatus: "extracting" }
          : prev
      );
      startPolling();
    } catch (e) {
      setBriefError(e instanceof Error ? e.message : "Failed to save brief");
    } finally {
      setSavingBrief(false);
    }
  };

  const startEditStructured = () => {
    setStructuredError(null);
    setStructuredDraft(
      JSON.stringify(search?.structuredContext ?? {}, null, 2)
    );
    setEditingStructured(true);
  };

  const handleSaveStructured = async () => {
    setStructuredError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(structuredDraft);
    } catch {
      setStructuredError("Invalid JSON.");
      return;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      setStructuredError("structuredContext must be a JSON object.");
      return;
    }

    setSavingStructured(true);
    try {
      const res = await fetch(`/api/searches/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ structuredContext: parsed }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          (data as { error?: string })?.error ?? "Failed to save"
        );
      }
      setSearch((prev) =>
        prev
          ? { ...prev, structuredContext: parsed as StructuredContext }
          : prev
      );
      setEditingStructured(false);
    } catch (e) {
      setStructuredError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingStructured(false);
    }
  };

  if (!id) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <p className="text-[13px] text-text-muted">Invalid search route.</p>
      </div>
    );
  }

  const sc = search?.structuredContext ?? null;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-6">
      <header className="mb-4 border-b border-border pb-4">
        <Link
          href="/searches"
          className="inline-block text-[12px] text-text-muted hover:text-text-primary"
        >
          ← Searches
        </Link>
        <h1
          className="mt-1 text-[18px] font-semibold tracking-tight text-text-primary"
          style={{ letterSpacing: "-0.01em" }}
        >
          {search?.title ?? (loading ? "…" : "Search")}
        </h1>
        <p className="text-[13px] text-text-muted">
          {search?.company ?? (loading ? "…" : "")}
        </p>
      </header>

      {loadError && (
        <div className="mb-3 rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-[12px] text-danger">
          {loadError}
        </div>
      )}

      <section className="mb-4 rounded-card border border-border bg-surface">
        <button
          type="button"
          onClick={() => setBriefOpen((v) => !v)}
          aria-expanded={briefOpen}
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-2"
        >
          <span className="text-[12px] font-medium text-text-secondary">
            Role brief
          </span>
          <span className="text-[11px] text-text-muted">
            {briefOpen ? "▼" : "▶"}
          </span>
        </button>
        {briefOpen && (
          <div className="border-t border-border px-4 py-3">
            <textarea
              value={rawDraft}
              onChange={(e) => setRawDraft(e.target.value)}
              rows={8}
              placeholder="Paste job description, salary range, team info, recruiter notes, hiring manager comments — anything relevant."
              className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
            />
            {briefError && (
              <div className="mt-2 text-[12px] text-danger">{briefError}</div>
            )}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => void handleSaveBrief()}
                disabled={savingBrief || rawDraft.trim() === ""}
                className="inline-flex items-center text-[12px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                style={{
                  background: "var(--accent)",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                }}
              >
                {savingBrief ? "Saving…" : "Save brief"}
              </button>
            </div>
          </div>
        )}
      </section>

      {search?.extractionStatus === "extracting" && (
        <div className="mb-4 rounded-card border border-border bg-surface-2 px-3 py-2 text-[12px] text-text-muted">
          Analyzing role context…
        </div>
      )}

      {search?.extractionStatus === "ready" && sc && (
        <section className="mb-4 rounded-card border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-text-primary">
              Role intelligence
            </h2>
            {!editingStructured ? (
              <button
                type="button"
                onClick={startEditStructured}
                className="inline-flex items-center rounded-btn border border-border bg-surface px-2.5 py-1 text-[12px] font-medium text-text-primary hover:border-border-strong"
              >
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveStructured()}
                  disabled={savingStructured}
                  className="inline-flex items-center text-[12px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                  style={{
                    background: "var(--accent)",
                    padding: "6px 10px",
                    borderRadius: "var(--radius-md)",
                    border: "none",
                  }}
                >
                  {savingStructured ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStructured(false)}
                  className="inline-flex items-center rounded-btn border border-border bg-surface px-2.5 py-1 text-[12px] font-medium text-text-primary hover:border-border-strong"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {editingStructured ? (
            <>
              <textarea
                value={structuredDraft}
                onChange={(e) => setStructuredDraft(e.target.value)}
                rows={16}
                className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 font-mono text-[12px] text-text-primary focus:border-border-strong focus:outline-none"
                spellCheck={false}
              />
              {structuredError && (
                <div className="mt-2 text-[12px] text-danger">
                  {structuredError}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <StructuredField
                  label="Salary range"
                  value={sc.salary_range ?? null}
                />
                <StructuredField
                  label="Team size"
                  value={sc.team_size ?? null}
                />
                <StructuredField
                  label="Seniority"
                  value={sc.seniority ?? null}
                />
                <StructuredField label="Urgency" value={sc.urgency ?? null} />
              </div>

              {Array.isArray(sc.stack) && sc.stack.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-text-muted">
                    Stack
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {sc.stack.map((s) => (
                      <Tag key={s}>{s}</Tag>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(sc.selling_points) &&
                sc.selling_points.length > 0 && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-text-muted">
                      Selling points
                    </div>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-[13px] text-text-primary">
                      {sc.selling_points.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {Array.isArray(sc.objections) && sc.objections.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-text-muted">
                    Objections
                  </div>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-[13px] text-text-primary">
                    {sc.objections.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}

              <StructuredField label="Culture" value={sc.culture ?? null} />
              <StructuredField label="Mission" value={sc.mission ?? null} />
              <StructuredField
                label="Ownership"
                value={sc.ownership ?? null}
              />
              <StructuredField
                label="Candidate fit"
                value={sc.candidate_fit ?? null}
              />
            </div>
          )}
        </section>
      )}

      {search?.extractionStatus === "error" && (
        <div className="mb-4 rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-[12px] text-danger">
          Extraction failed. Try saving the brief again to retry.
        </div>
      )}

      <section className="rounded-card border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-text-primary">
            Candidates ({search?.candidates.length ?? 0})
          </h2>
          <Link
            href={`/candidates/new?searchId=${id}`}
            className="inline-flex items-center text-[12px] font-medium text-white hover:bg-accent-hover"
            style={{
              background: "var(--accent)",
              padding: "6px 12px",
              borderRadius: "var(--radius-md)",
              border: "none",
            }}
          >
            + Add candidate
          </Link>
        </div>

        {loading ? (
          <p className="text-[12px] text-text-muted">Loading…</p>
        ) : !search || search.candidates.length === 0 ? (
          <p className="text-[12px] text-text-muted">
            No candidates linked to this search yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {search.candidates.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2"
              >
                <div className="min-w-0">
                  <Link
                    href={`/candidates/${c.id}`}
                    className="block truncate text-[13px] font-medium text-text-primary hover:text-accent"
                  >
                    {c.name}
                  </Link>
                  <div className="truncate text-[11px] text-text-muted">
                    {c.role} <span className="opacity-50">·</span> {c.company}
                  </div>
                </div>
                <StatusPill status={c.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
