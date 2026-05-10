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
import { SparkleIcon, TrashIcon } from "./icons";
import { MessageGenerator } from "./MessageGenerator";

type Props = {
  candidate: Candidate;
  onStatusChanged?: (candidateId: string, newStatus: PipelineSlug) => void;
  onDeleted?: (candidateId: string) => void;
  selectedCandidateId?: string | null;
  onGenerated?: () => void;
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
  const { label, toneClass } = (() => {
    switch (slug) {
      case "new":
        return {
          label: "New",
          toneClass:
            "bg-[#F1F5F9] text-[#475569] dark:bg-[#1C2235] dark:text-[#94A3B8]",
        };
      case "sent":
        return {
          label: "Sent",
          toneClass:
            "bg-[#DBEAFE] text-[#1D4ED8] dark:bg-[#1E3A5F] dark:text-[#93C5FD]",
        };
      case "replied":
        return {
          label: "Replied",
          toneClass:
            "bg-[#EDE9FE] text-[#5B21B6] dark:bg-[#4C1D95] dark:text-[#DDD6FE]",
        };
      case "no_response":
        return {
          label: "No response",
          toneClass:
            "bg-[#F1F5F9] text-[#475569] dark:bg-[#1C2235] dark:text-[#94A3B8]",
        };
      case "not_interested":
        return {
          label: "Not interested",
          toneClass:
            "bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D] dark:text-[#FCA5A5]",
        };
      case "booked":
        return {
          label: "Booked",
          toneClass:
            "bg-[#D1FAE5] text-[#065F46] dark:bg-[#14532D] dark:text-[#86EFAC]",
        };
      default:
        return {
          label: "New",
          toneClass:
            "bg-[#F1F5F9] text-[#475569] dark:bg-[#1C2235] dark:text-[#94A3B8]",
        };
    }
  })();

  return (
    <span
      className={classNames(
        "inline-flex shrink-0 items-center font-medium border-0",
        toneClass
      )}
      style={{
        fontSize: "8px",
        fontWeight: 500,
        padding: "0px 4px",
        lineHeight: 1.2,
        borderRadius: "3px",
      }}
    >
      {label}
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

export function CandidateCard({
  candidate,
  onStatusChanged,
  onDeleted,
  selectedCandidateId,
  onGenerated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [copied, setCopied] = useState(false);
  const [trackingTooltipVisible, setTrackingTooltipVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const finalizeFromBackdropRef = useRef<() => Promise<void>>(async () => {});

  const showDeleteBox =
    isHovered &&
    !open &&
    (!selectedCandidateId || selectedCandidateId === candidate.id);

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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this candidate?")) return;
    const res = await fetch(`/api/candidates/${candidate.id}`, { method: "DELETE" });
    if (res.ok) onDeleted?.(candidate.id);
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

    const candidateStatusMap: Record<PipelineSlug, string> = {
      new: "new",
      sent: "contacted",
      replied: "replied",
      no_response: "contacted",
      not_interested: "rejected",
      booked: "booked",
    };
    await fetch(`/api/candidates/${candidate.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: candidateStatusMap[nextSlug] }),
    });

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

  const easing = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

  return (
    <div
      ref={cardRef}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
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
          Generate
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
                onGenerated={onGenerated}
              />
            ) : (
              <>
                <div className="min-h-0 flex-1 space-y-4">
                <div>
                  {hasStoredMessage ? (
                    <div className="relative mb-4">
                      <div
                        className="rounded-[10px] border border-border bg-surface px-4 py-3"
                      >
                        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-text-primary">
                          {candidate.lastAction?.messageContent}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void (async () => {
                            await navigator.clipboard.writeText(candidate.lastAction?.messageContent ?? "");
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                            if (candidate.lastAction?.id) {
                              await Promise.all([
                                fetch(`/api/actions/${candidate.lastAction.id}/status`, {
                                  method: "PATCH",
                                  headers: { "content-type": "application/json" },
                                  body: JSON.stringify({ status: "SENT" }),
                                }),
                                fetch(`/api/candidates/${candidate.id}/status`, {
                                  method: "PATCH",
                                  headers: { "content-type": "application/json" },
                                  body: JSON.stringify({ status: "contacted" }),
                                }),
                              ]);
                              onStatusChanged?.(candidate.id, "sent");
                            }
                          })();
                        }}
                        className="absolute top-2 right-2 inline-flex items-center gap-1 font-medium text-[11px] text-text-muted hover:text-text-primary hover:border-border-strong"
                        style={{
                          padding: "3px 8px",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          background: "var(--surface-2)",
                        }}
                      >
                        {copied ? "Copied" : "Copy"}
                      </button>
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

      <button
        type="button"
        aria-label="Delete candidate"
        aria-hidden={!showDeleteBox}
        tabIndex={showDeleteBox ? 0 : -1}
        onClick={(e) => void handleDelete(e)}
        className="flex items-center justify-center transition-all hover:brightness-75"
        style={{
          position: "absolute",
          top: showDeleteBox ? "-12px" : "-4px",
          right: "-12px",
          width: "24px",
          height: "24px",
          background: "var(--surface)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "none",
          padding: 0,
          borderRadius: "50%",
          color: "var(--danger)",
          cursor: "pointer",
          lineHeight: 0,
          opacity: showDeleteBox ? 1 : 0,
          pointerEvents: showDeleteBox ? "auto" : "none",
          transition: `all 200ms ${easing}`,
          zIndex: 10,
        }}
      >
        <TrashIcon size={12} />
      </button>
    </div>
  );
}
