"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type SearchSummary = {
  id: string;
  title: string;
  company: string;
};

export default function NewCandidatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchId = searchParams.get("searchId") ?? "";

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [searchSummary, setSearchSummary] = useState<SearchSummary | null>(
    null
  );
  const [searchSummaryError, setSearchSummaryError] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!searchId) {
      setSearchSummary(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/searches/${searchId}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            (data as { error?: string })?.error ?? "Failed to load search"
          );
        }
        if (!cancelled) {
          setSearchSummary({
            id: data.id,
            title: data.title,
            company: data.company,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setSearchSummaryError(
            e instanceof Error ? e.message : "Failed to load search"
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchId]);

  const navigateBack = () => {
    if (searchId) {
      router.push(`/searches/${searchId}`);
    } else {
      router.push("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const n = name.trim();
    const r = role.trim();
    const c = company.trim();

    if (!n || !r || !c) {
      setFormError("Name, role and company are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: n,
          role: r,
          company: c,
          linkedinUrl: linkedinUrl.trim() || undefined,
          interactionType: "FOLLOW_UP",
          searchId: searchId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          (data as { error?: string })?.error ?? "Failed to create candidate"
        );
      }
      navigateBack();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create candidate"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-6">
      <header className="mb-4 border-b border-border pb-4">
        <Link
          href={searchId ? `/searches/${searchId}` : "/"}
          className="inline-block text-[12px] text-text-muted hover:text-text-primary"
        >
          ← Back
        </Link>
        <h1
          className="mt-1 text-[18px] font-semibold tracking-tight text-text-primary"
          style={{ letterSpacing: "-0.01em" }}
        >
          Add candidate
        </h1>
        {searchId && (
          <p className="text-[13px] text-text-muted">
            {searchSummary
              ? (
                  <>
                    Adding to: {searchSummary.title}{" "}
                    <span className="opacity-50">·</span>{" "}
                    {searchSummary.company}
                  </>
                )
              : searchSummaryError
                ? "Could not load search context"
                : "Loading search context…"}
          </p>
        )}
      </header>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="rounded-card border border-border bg-surface p-4"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-text-secondary">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-text-secondary">
              Role / Title
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Senior backend engineer"
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
              autoComplete="off"
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
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-text-secondary">
              LinkedIn URL{" "}
              <span className="font-normal text-text-muted">(optional)</span>
            </label>
            <input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/…"
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
              autoComplete="off"
            />
          </div>

          <input type="hidden" name="searchId" value={searchId} />

          {formError && (
            <div className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-[12px] text-danger">
              {formError}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
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
              {submitting ? "Saving…" : "Add candidate"}
            </button>
            <button
              type="button"
              onClick={navigateBack}
              disabled={submitting}
              className="inline-flex items-center rounded-btn border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-text-primary hover:border-border-strong disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
