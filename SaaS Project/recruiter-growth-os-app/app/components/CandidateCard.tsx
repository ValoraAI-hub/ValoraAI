"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

function PipelineStatusBadge({ slug }: { slug: PipelineSlug }) {
  const spec = (() => {
    switch (slug) {
      case "new":
        return {
          label: "New",
          background: "#f1f5f9",
          color: "#475569",
          border: "1px solid #e2e8f0",
        };
      case "sent":
        return {
          label: "Sent",
          background: "#dbeafe",
          color: "#1d4ed8",
          border: "1px solid #bfdbfe",
        };
      case "replied":
        return {
          label: "Replied",
          background: "#ede9fe",
          color: "#5b21b6",
          border: "1px solid #ddd6fe",
        };
      case "no_response":
        return {
          label: "No response",
          background: "#f1f5f9",
          color: "#475569",
          border: "1px solid #e2e8f0",
        };
      case "not_interested":
        return {
          label: "Not interested",
          background: "#fee2e2",
          color: "#991b1b",
          border: "1px solid #fecaca",
        };
      case "booked":
        return {
          label: "Booked",
          background: "#d1fae5",
          color: "#065f46",
          border: "1px solid #a7f3d0",
        };
      default:
        return {
          label: "New",
          background: "#f1f5f9",
          color: "#475569",
          border: "1px solid #e2e8f0",
        };
    }
  })();

  return (
    <span
      className="inline-flex shrink-0 items-center font-medium"
      style={{
        fontSize: "10px",
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: "100px",
        background: spec.background,
        color: spec.color,
        border: spec.border,
      }}
    >
      {spec.label}
    </span>
  );
}

function statusToneClasses(slug: CommittablePipelineSlug, active: boolean): string {
  if (slug === "booked") {
    return active
      ? "rounded-[7px] border-transparent bg-[#1D9E75] text-white hover:brightness-95"
      : "rounded-[7px] border-[#1D9E7540] bg-[#1D9E751a] text-[#1D9E75] hover:border-[#1D9E75]";
  }

  switch (slug) {
    case "sent":
      return active
        ? "rounded-[7px] border-blue-700/55 bg-blue-600/22 text-blue-950 dark:border-blue-300/55 dark:bg-blue-400/18 dark:text-blue-50"
        : "rounded-[7px] border-border-strong bg-surface text-text-secondary hover:border-blue-500/40 hover:text-blue-900 dark:hover:text-blue-50";
    case "replied":
      return active
        ? "rounded-[7px] border-purple-700/55 bg-purple-600/22 text-purple-950 dark:border-purple-300/55 dark:bg-purple-400/18 dark:text-purple-50"
        : "rounded-[7px] border-border-strong bg-surface text-text-secondary hover:border-purple-500/40 hover:text-purple-900 dark:hover:text-purple-50";
    case "no_response":
      return active
        ? "rounded-[7px] border-border-strong bg-surface-2 text-text-primary"
        : "rounded-[7px] border-border-strong bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary";
    case "not_interested":
      return active
        ? "rounded-[7px] border-danger/45 bg-danger-bg text-danger"
        : "rounded-[7px] border-border-strong bg-surface text-text-secondary hover:border-danger/30 hover:text-danger";
    default:
      return "";
  }
}

export function CandidateCard({ candidate, onStatusChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [trackingTooltipVisible, setTrackingTooltipVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const finalizeFromBackdropRef = useRef<() => Promise<void>>(async () => {});

  const committedSlug = useMemo(() => derivePipelineSlug(candidate), [candidate]);

  const days = daysSince(candidate.lastContactedAt);
  const initials = getInitials(candidate.name);
  const canTrackActions = Boolean(candidate.lastAction?.id);
  const hasStoredMessage = Boolean(candidate.lastAction?.messageContent?.trim?.());

  const effectiveButtonSlug: CommittablePipelineSlug | null =
    committedSlug === "new" ? null : committedSlug;

  const closePanelFully = () => {
    setOpen(false);
    setShowGenerator(false);
  };

  const persistStatusForSlug = async (slug: CommittablePipelineSlug): Promise<boolean> => {
    const actionId = candidate.lastAction?.id;
    if (!actionId) {
      console.warn("Cannot save outreach tracking without an action draft.");
      return false;
    }

    const currentSlug = derivePipelineSlug(candidate);
    const clearToNew = currentSlug !== "new" && slug === currentSlug;

    const nextSlug: PipelineSlug = clearToNew ? "new" : slug;
    const apiStat = clearToNew ? "DRAFT" : pipelineSlugToApiStatus(slug);

    onStatusChanged?.(candidate.id, nextSlug);

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
      onStatusChanged?.(candidate.id, currentSlug);
      return false;
    }

    return true;
  };

  const handleStatusButtonClick = (slug: CommittablePipelineSlug) => {
    void persistStatusForSlug(slug);
  };

  const finalizeFromBackdrop = async () => {
    closePanelFully();
  };

  finalizeFromBackdropRef.current = finalizeFromBackdrop;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = cardRef.current;
      if (!root || root.contains(e.target as Node)) return;
      void finalizeFromBackdropRef.current();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  const handleRowClick = (e: React.MouseEvent) => {
    if (isProtectedInteractiveTarget(e.target)) return;
    setOpen(true);
    setShowGenerator(false);
  };

  return (
    <div
      ref={cardRef}
      className={classNames(
        "rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-xs)] transition-[box-shadow,border-color] duration-150 ease-out",
        open
          ? "overflow-visible hover:border-border"
          : "overflow-hidden hover:border-border-strong hover:shadow-[var(--shadow-md)]"
      )}
    >
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3"
        role="presentation"
        onClick={handleRowClick}
      >
        <span
          aria-hidden
          className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
          style={{
            background: "var(--accent-surface)",
            color: "var(--accent-text)",
            border: "0.75px solid var(--border-strong)",
          }}
        >
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="truncate font-medium text-[13px] text-text-primary"
              style={{ letterSpacing: "-0.01em" }}
            >
              {candidate.name}
            </div>
            <PipelineStatusBadge slug={committedSlug} />
          </div>
          <div
            className="truncate text-[11px]"
            style={{ color: "var(--text-tertiary)", marginTop: "2px" }}
          >
            {candidate.role} <span className="opacity-50">·</span>{" "}
            {candidate.company}
          </div>
        </div>

        {days !== null && (
          <span
            className="inline-flex items-center font-medium"
            style={{
              fontSize: "10px",
              padding: "2px 7px",
              borderRadius: "100px",
              background: "var(--surface-2)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            {days} {days === 1 ? "day" : "days"}
          </span>
        )}

        <Link
          href={`/candidates/${candidate.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex shrink-0 items-center justify-center font-medium leading-none text-[11px] transition-colors hover:bg-surface-2"
          style={{
            background: "transparent",
            color: "var(--text-secondary)",
            padding: "5px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-strong)",
            fontWeight: 500,
          }}
        >
          Conversation
        </Link>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
            setShowGenerator(true);
          }}
          className="inline-flex shrink-0 items-center gap-1 font-medium leading-none text-[11px] text-white transition-colors hover:bg-accent-hover"
          style={{
            background: "var(--accent)",
            padding: "5px 12px",
            borderRadius: "var(--radius-md)",
            border: "none",
            fontWeight: 500,
          }}
        >
          <span className="inline-flex" style={{ color: "inherit" }}>
            <SparkleIcon size={12} />
          </span>
          {hasStoredMessage ? "Regenerate" : "Generate"}
        </button>
      </div>

      {open ? (
        <div
          className="flex flex-col overflow-visible px-4 py-3.5"
          style={{ background: "var(--surface)", padding: "14px" }}
        >
            {showGenerator ? (
              <MessageGenerator
                candidate={candidate}
                suppressTrackingControls
                onClose={closePanelFully}
              />
            ) : (
              <>
                <div className="min-h-0 flex-1 space-y-4">
                <div>
                  {hasStoredMessage ? (
                    <div
                      className="rounded-[10px] border border-border bg-surface px-4 py-3 mb-4"
                    >
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-text-primary">
                        {candidate.lastAction?.messageContent}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-[10px] border border-dashed border-border bg-surface px-4 py-3 mb-4">
                      <p className="text-[13px] text-text-muted">
                        No draft message saved yet — generate one to get started.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGenerator(true)}
                    className="inline-flex shrink-0 items-center gap-1 font-medium leading-none text-[11px] text-white transition-colors hover:bg-accent-hover"
                    style={{
                      background: "var(--accent)",
                      padding: "5px 12px",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      fontWeight: 500,
                    }}
                  >
                    <span className="inline-flex" style={{ color: "inherit" }}>
                      <SparkleIcon size={12} />
                    </span>
                    {hasStoredMessage ? "Regenerate" : "Generate your first message"}
                  </button>
                </div>

                <div className="space-y-2">
                  {!canTrackActions ? (
                    <p className="text-[11px] text-text-muted">
                      Track outreach status once a message draft exists on this candidate.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_BUTTON_SPECS.map(({ slug, label }) => {
                        const active = effectiveButtonSlug === slug;
                        return (
                          <button
                            key={slug}
                            type="button"
                            disabled={!canTrackActions}
                            aria-pressed={active}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusButtonClick(slug);
                            }}
                            className={classNames(
                              "inline-flex items-center border px-2.5 py-1 text-[12px] font-medium transition",
                              statusToneClasses(slug, active)
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
                {canTrackActions ? (
                  <div className="mt-auto flex w-full shrink-0 justify-end overflow-visible pt-2">
                    <div className="relative inline-flex items-center overflow-visible">
                      <button
                        type="button"
                        aria-label="Tracking help"
                        onMouseEnter={() => setTrackingTooltipVisible(true)}
                        onMouseLeave={() => setTrackingTooltipVisible(false)}
                        className="inline-flex cursor-pointer items-center justify-center font-normal leading-none"
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          border: "1px solid var(--border-strong)",
                          background: "transparent",
                          color: "var(--text-muted)",
                          fontSize: "10px",
                        }}
                      >
                        ?
                      </button>
                      {trackingTooltipVisible ? (
                        <div
                          role="tooltip"
                          style={{
                            position: "absolute",
                            right: "24px",
                            bottom: "0",
                            minWidth: "280px",
                            maxWidth: "min(360px, calc(100vw - 32px))",
                            whiteSpace: "normal",
                            lineHeight: 1.5,
                            background: "var(--text-primary)",
                            color: "var(--surface)",
                            fontSize: "11px",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            zIndex: 50,
                          }}
                        >
                          Status saves as you click. Choosing the same status
                          clears it back to new. Click outside to close.
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
      ) : null}
    </div>
  );
}
