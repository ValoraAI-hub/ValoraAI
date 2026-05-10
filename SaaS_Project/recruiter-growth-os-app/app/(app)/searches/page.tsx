"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SearchListItem = {
  id: string;
  title: string;
  company: string;
  rawContext: string | null;
  extractionStatus: string;
  createdAt: string;
  _count: { candidates: number };
};

function ExtractionBadge({ status }: { status: string }) {
  if (status === "extracting") {
    return (
      <span className="text-[11px] text-text-muted">Analyzing…</span>
    );
  }
  if (status === "ready") {
    return (
      <span className="text-[11px] font-medium text-accent">
        Intelligence ready
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="text-[11px] font-medium text-danger">
        Extraction failed
      </span>
    );
  }
  return null;
}

export default function SearchesPage() {
  const router = useRouter();
  const [searches, setSearches] = useState<SearchListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [rawContext, setRawContext] = useState("");

  const loadSearches = async () => {
    setError(null);
    try {
      const res = await fetch("/api/searches", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          (data as { error?: string })?.error ?? "Failed to load searches"
        );
      }
      setSearches(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load searches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSearches();
  }, []);

  const resetForm = () => {
    setTitle("");
    setCompany("");
    setRawContext("");
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const t = title.trim();
    const c = company.trim();
    if (!t || !c) {
      setFormError("Title and company are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/searches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: t,
          company: c,
          rawContext: rawContext.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          (data as { error?: string })?.error ?? "Failed to create search"
        );
      }
      const created = data as { id: string };
      router.push(`/searches/${created.id}`);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create search");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-6">
      <header className="mb-4 flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1
            className="text-[18px] font-semibold tracking-tight text-text-primary"
            style={{ letterSpacing: "-0.01em" }}
          >
            Searches
          </h1>
          <p className="text-[12px] text-text-muted">
            One workspace per role. Brief the AI once and reuse the
            intelligence across every candidate.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            if (showForm) resetForm();
          }}
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-white hover:bg-accent-hover"
          style={{
            background: "var(--accent)",
            padding: "6px 12px",
            borderRadius: "var(--radius-md)",
            border: "none",
          }}
        >
          {showForm ? "Cancel" : "+ New Search"}
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={(e) => void handleCreate(e)}
          className="mb-4 rounded-card border border-border bg-surface p-4"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-text-secondary">
                Role title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Senior backend engineer"
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-secondary">
                Company
              </label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-text-secondary">
                Brief the AI about this role{" "}
                <span className="font-normal text-text-muted">(optional)</span>
              </label>
              <textarea
                value={rawContext}
                onChange={(e) => setRawContext(e.target.value)}
                rows={6}
                placeholder="Paste job description, salary range, team info, recruiter notes, hiring manager comments — anything relevant."
                className="mt-1 w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
              />
            </div>
            {formError && (
              <div className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-[12px] text-danger">
                {formError}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center text-[12px] font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                style={{
                  background: "var(--accent)",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                }}
              >
                {submitting ? "Creating…" : "Create Search"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="inline-flex items-center rounded-btn border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-text-primary hover:border-border-strong"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {error && (
        <div className="mb-3 rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-[12px] text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-card bg-surface-2"
              style={{ animation: "pulse 1.5s ease-in-out infinite" }}
            />
          ))}
        </div>
      ) : !searches || searches.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-surface px-4 py-8 text-center">
          <p className="text-[13px] text-text-muted">
            No searches yet. Create your first search to start building a role
            pipeline.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {searches.map((s) => (
            <li key={s.id}>
              <Link
                href={`/searches/${s.id}`}
                className="block rounded-card border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div
                      className="truncate text-[14px] font-semibold text-text-primary"
                      style={{ letterSpacing: "-0.01em" }}
                    >
                      {s.title}
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-text-muted">
                      {s.company}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[11px] text-text-muted">
                      {s._count.candidates}{" "}
                      {s._count.candidates === 1 ? "candidate" : "candidates"}
                    </span>
                    <ExtractionBadge status={s.extractionStatus} />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
