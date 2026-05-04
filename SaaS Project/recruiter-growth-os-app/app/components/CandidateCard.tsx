"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { Candidate } from "../lib/types";
import { classNames, daysSince, getInitials } from "../lib/utils";
import {
  type CommittablePipelineSlug,
  derivePipelineSlug,
  pipelineSlugToApiStatus,
  type PipelineSlug,
} from "../lib/pipeline-status";
import { SparkleIcon } from "./icons";
import { MessageGenerator } from "./MessageGenerator";

type Props = {
  candidate: Candidate;
  onStatusChanged?: (candidateId: string, newStatus: PipelineSlug) => void;
};

function isProtectedInteractiveTarget(el: EventTarget | null): boolean {
  return (
    typeof window !== "undefined" &&
    el instanceof Element &&
    Boolean(el.closest("button, a, input, textarea, select, label"))
  );
}

const STATUS_BUTTON_SPECS: { slug: CommittablePipelineSlug; label: string }[] = [
  { slug: "sent", label: "Sent" },
  { slug: "replied", label: "Replied" },
  { slug: "no_response", label: "No response" },
  { slug: "not_interested", label: "Not interested" },
  { slug: "booked", label: "Booked" },
];

function PipelineStatusBadge({ slug }: { slug: Exclude<PipelineSlug, "new"> }) {
  if (slug === "booked") {
    return (
      <span
        className="inline-flex shrink-0 items-center rounded-pill border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
        style={{
          borderRadius: 20,
          backgroundColor: "#1D9E75",
          borderColor: "#1D9E75",
        }}
      >
        Booked
      </span>
    );
  }

  const classes =
    slug === "sent"
      ? "border-blue-600/35 bg-blue-600/15 text-blue-800 dark:border-blue-400/40 dark:bg-blue-400/15 dark:text-blue-200"
      : slug === "replied"
        ? "border-purple-600/35 bg-purple-600/15 text-purple-900 dark:border-purple-400/40 dark:bg-purple-400/15 dark:text-purple-100"
        : slug === "no_response"
          ? "border-border-strong bg-surface-2 text-text-muted"
          : "border-danger/35 bg-danger-bg text-danger";

  const label =
    slug === "sent"
      ? "Sent"
      : slug === "replied"
        ? "Replied"
        : slug === "no_response"
          ? "No response"
          : "Not interested";

  return (
    <span
      className={classNames(
        "inline-flex shrink-0 items-center rounded-pill border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        classes
      )}
      style={{ borderRadius: 20 }}
    >
      {label}
    </span>
  );
}

function statusToneClasses(slug: CommittablePipelineSlug, active: boolean): string {
  if (slug === "booked") {
    return active
      ? "border-transparent bg-[#1D9E75] text-white hover:brightness-95"
      : "border-[#1D9E7540] bg-[#1D9E751a] text-[#1D9E75] hover:border-[#1D9E75]";
  }

  switch (slug) {
    case "sent":
      return active
        ? "border-blue-700/55 bg-blue-600/22 text-blue-950 dark:border-blue-300/55 dark:bg-blue-400/18 dark:text-blue-50"
        : "border-border bg-surface text-text-secondary hover:border-blue-500/40 hover:text-blue-900 dark:hover:text-blue-50";
    case "replied":
      return active
        ? "border-purple-700/55 bg-purple-600/22 text-purple-950 dark:border-purple-300/55 dark:bg-purple-400/18 dark:text-purple-50"
        : "border-border bg-surface text-text-secondary hover:border-purple-500/40 hover:text-purple-900 dark:hover:text-purple-50";
    case "no_response":
      return active
        ? "border-border-strong bg-surface-2 text-text-primary"
        : "border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary";
    case "not_interested":
      return active
        ? "border-danger/45 bg-danger-bg text-danger"
        : "border-border bg-surface text-text-secondary hover:border-danger/30 hover:text-danger";
    default:
      return "";
  }
}

export function CandidateCard({ candidate, onStatusChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<CommittablePipelineSlug | null>(
    null
  );
  const finalizeLock = useRef(false);

  const committedSlug = useMemo(() => derivePipelineSlug(candidate), [candidate]);

  const days = daysSince(candidate.lastContactedAt);
  const stale = days !== null && days > 5;
  const initials = getInitials(candidate.name);
  const canTrackActions = Boolean(candidate.lastAction?.id);
  const hasStoredMessage = Boolean(candidate.lastAction?.messageContent?.trim?.());

  const effectiveButtonSlug: CommittablePipelineSlug | null =
    pendingStatus ?? (committedSlug === "new" ? null : committedSlug);

  const closePanelFully = () => {
    setOpen(false);
    setShowGenerator(false);
    setPendingStatus(null);
  };

  const commitPendingPatch = async (): Promise<boolean> => {
    const actionId = candidate.lastAction?.id;
    if (!pendingStatus) return true;

    if (!actionId) {
      console.warn("Cannot save outreach tracking without an action draft.");
      return false;
    }

    let nextSlug: PipelineSlug;
    let apiStat: string;

    if (pendingStatus === committedSlug) {
      nextSlug = "new";
      apiStat = "DRAFT";
    } else {
      nextSlug = pendingStatus;
      apiStat = pipelineSlugToApiStatus(pendingStatus);
    }

    const res = await fetch(`/api/actions/${actionId}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: apiStat }),
    });
    let data: { error?: string } = {};
    try {
      data = (await res.json()) as typeof data;
    } catch {
      // ignore malformed JSON
    }

    if (!res.ok) {
      console.error("Status commit failed", data?.error ?? res.statusText);
      return false;
    }

    onStatusChanged?.(candidate.id, nextSlug);
    return true;
  };

  const finalizeFromBackdrop = async () => {
    if (finalizeLock.current) return;
    finalizeLock.current = true;
    try {
      if (pendingStatus === null) {
        closePanelFully();
        return;
      }
      const ok = await commitPendingPatch();
      if (ok) closePanelFully();
    } finally {
      finalizeLock.current = false;
    }
  };

  const handleRowClick = (e: React.MouseEvent) => {
    if (isProtectedInteractiveTarget(e.target)) return;
    setOpen(true);
    setShowGenerator(false);
    setPendingStatus(null);
  };

  const toggleStatusSelection = (slug: CommittablePipelineSlug) => {
    setPendingStatus((prev) => (prev === slug ? null : slug));
  };

  const badgeSlug = committedSlug === "new" ? null : committedSlug;

  return (
    <div className={classNames("rounded-card border border-border bg-surface", open && "relative z-[200]")}>
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3"
        role="presentation"
        onClick={handleRowClick}
      >
        <span
          aria-hidden
          className="
            inline-flex h-9 w-9 shrink-0 items-center justify-center
            rounded-full border border-border bg-surface-2
            text-[12px] font-semibold text-text-primary
          "
        >
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <div className="truncate text-[13px] font-medium text-text-primary">
              {candidate.name}
            </div>
            {badgeSlug !== null && <PipelineStatusBadge slug={badgeSlug} />}
          </div>
          <div className="truncate text-[12px] text-text-muted">
            {candidate.role} <span className="opacity-50">·</span>{" "}
            {candidate.company}
          </div>
        </div>

        {days !== null && (
          <span
            className={classNames(
              "inline-flex items-center rounded-pill border px-2 py-0.5 text-[11px] font-medium",
              stale
                ? "border-warning/30 bg-warning-bg text-warning"
                : "border-border bg-surface-2 text-text-muted"
            )}
            style={{ borderRadius: 20 }}
          >
            {days} {days === 1 ? "day" : "days"}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
            setShowGenerator(true);
            setPendingStatus(null);
          }}
          className="
            inline-flex items-center gap-1.5 rounded-btn border px-2.5 py-1 text-[12px] font-medium
            border-accent-border bg-accent-bg text-accent hover:brightness-[0.97]
          "
        >
          <SparkleIcon size={12} />
          {hasStoredMessage ? "Regenerate" : "Generate"}
        </button>

        <Link
          href={`/candidates/${candidate.id}`}
          onClick={(e) => e.stopPropagation()}
          className="
            inline-flex shrink-0 items-center gap-1.5 rounded-btn border border-border
            bg-surface px-2.5 py-1 text-[12px] font-medium text-text-primary
            hover:border-border-strong
          "
        >
          Conversation
        </Link>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close message panel"
            className="fixed inset-0 z-[1000] bg-black/35 backdrop-blur-[1px]"
            tabIndex={-1}
            onClick={() => void finalizeFromBackdrop()}
          />

          <div className="relative z-[1001] border-t border-border bg-bg/40 px-4 py-4">
            {showGenerator ? (
              <MessageGenerator
                candidate={candidate}
                suppressTrackingControls
                onClose={closePanelFully}
              />
            ) : (
              <div className="space-y-4">
                <div>
                  {hasStoredMessage ? (
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-text-primary">
                      {candidate.lastAction?.messageContent}
                    </p>
                  ) : (
                    <p className="text-[13px] text-text-muted">
                      No draft message saved yet — generate one to get started.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGenerator(true)}
                    className="
                      inline-flex items-center gap-1.5 rounded-btn border border-accent-border bg-accent-bg
                      px-3 py-1.5 text-[12px] font-medium text-accent hover:brightness-[0.97]
                    "
                  >
                    <SparkleIcon size={14} />
                    {hasStoredMessage ? "Regenerate" : "Generate your first message"}
                  </button>
                </div>

                <div className="space-y-2">
                  {!canTrackActions ? (
                    <p className="text-[11px] text-text-muted">
                      Track outreach status once a message draft exists on this candidate.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {STATUS_BUTTON_SPECS.map(({ slug, label }) => {
                        const active = effectiveButtonSlug === slug;
                        return (
                          <button
                            key={slug}
                            type="button"
                            disabled={!canTrackActions}
                            aria-pressed={active}
                            onClick={() => toggleStatusSelection(slug)}
                            className={classNames(
                              "inline-flex items-center rounded-btn border px-2.5 py-1 text-[12px] font-medium transition",
                              statusToneClasses(slug, active)
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-[11px] leading-relaxed text-text-muted">
                    Click outside this panel to save tracking. Choosing the same status as now clears it back to new.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
