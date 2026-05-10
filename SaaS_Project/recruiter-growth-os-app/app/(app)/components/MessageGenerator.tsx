"use client";

import { useEffect, useMemo, useState } from "react";
import type { Action, Candidate, GeneratedMessage } from "../lib/types";
import { classNames, daysSince } from "../lib/utils";
import { CheckIcon, CloseIcon, CopyIcon, SparkleIcon } from "./icons";
import { TrackingControls } from "./TrackingControls";

const MAX_CHARS = 300;

type VariantState = {
  loading: boolean;
  error: string | null;
  message: GeneratedMessage | null;
  action: Action | null;
};

const initialVariant = (): VariantState => ({
  loading: true,
  error: null,
  message: null,
  action: null,
});

type Props = {
  candidate: Candidate;
  onClose: () => void;
  /** Hides outbound tracking buttons so host can defer status commits (e.g. CandidateCard). */
  suppressTrackingControls?: boolean;
  onGenerated?: () => void;
  onStatusChanged?: (candidateId: string, newStatus: string) => void;
};

export function MessageGenerator({
  candidate,
  onClose,
  suppressTrackingControls = false,
  onGenerated,
  onStatusChanged,
}: Props) {
  const [active, setActive] = useState<1 | 2>(1);
  const [variants, setVariants] = useState<Record<1 | 2, VariantState>>({
    1: initialVariant(),
    2: initialVariant(),
  });
  const [copiedVariant, setCopiedVariant] = useState<1 | 2 | null>(null);

  const days = useMemo(
    () => daysSince(candidate.lastContactedAt) ?? 0,
    [candidate.lastContactedAt]
  );

  useEffect(() => {
    let cancelled = false;

    const generate = async (variant: 1 | 2) => {
      try {
        const res = await fetch("/api/generate-message", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: candidate.name,
            role: candidate.role,
            company: candidate.company,
            daysSinceContact: days,
            variant,
          }),
        });

        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setVariants((v) => ({
            ...v,
            [variant]: {
              ...v[variant],
              loading: false,
              error: data?.error ?? "Failed to generate",
            },
          }));
          return;
        }

        const generated = data as GeneratedMessage;

        const actionRes = await fetch("/api/actions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            candidateId: candidate.id,
            messageContent: generated.message,
            strategyType: generated.strategyType,
            messageVariant: generated.messageVariant,
            signalsSnapshot: { daysSinceContact: days, variant },
          }),
        });

        const action = (await actionRes.json()) as Action;

        if (cancelled) return;

        if (!actionRes.ok) {
          setVariants((v) => ({
            ...v,
            [variant]: {
              loading: false,
              error: "Could not save draft",
              message: generated,
              action: null,
            },
          }));
          return;
        }

        setVariants((v) => ({
          ...v,
          [variant]: {
            loading: false,
            error: null,
            message: generated,
            action,
          },
        }));
        onGenerated?.();
      } catch (err) {
        if (cancelled) return;
        setVariants((v) => ({
          ...v,
          [variant]: {
            ...v[variant],
            loading: false,
            error: err instanceof Error ? err.message : "Unknown error",
          },
        }));
      }
    };

    generate(1);
    generate(2);

    return () => {
      cancelled = true;
    };
  }, [candidate.id, candidate.name, candidate.role, candidate.company, days]);

  const handleCopy = async (variant: 1 | 2, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedVariant(variant);
      setTimeout(() => setCopiedVariant(null), 1500);
      const action = variants[variant].action;
      if (action?.id) {
        await Promise.all([
          fetch(`/api/actions/${action.id}/status`, {
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
        onGenerated?.();
      }
    } catch {
      // ignore
    }
  };

  const handleStatusChange = (variant: 1 | 2, action: Action) => {
    setVariants((v) => ({
      ...v,
      [variant]: { ...v[variant], action },
    }));
  };

  const current = variants[active];
  const charCount = current.message?.message.length ?? 0;
  const overLimit = charCount > MAX_CHARS;

  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <SparkleIcon size={14} className="text-accent" />
          <span className="text-[13px] font-medium text-text-primary">
            Generated messages
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="
            inline-flex h-6 w-6 items-center justify-center rounded-md
            text-text-muted hover:bg-surface-2 hover:text-text-primary
          "
        >
          <CloseIcon size={14} />
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        {[1, 2].map((n) => {
          const v = n as 1 | 2;
          const isActive = active === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setActive(v)}
              className={classNames(
                "px-2.5 py-1 rounded-md text-[12px]",
                isActive
                  ? "bg-surface-2 text-text-primary font-medium"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              )}
            >
              Variant {v}
            </button>
          );
        })}

        {current.message?.strategyType && (
          <span
            className="
              ml-1 inline-flex items-center rounded-pill border border-accent-border
              bg-accent-bg px-2 py-0.5 text-[10px] font-medium text-accent
            "
            style={{ borderRadius: 20 }}
          >
            {current.message.strategyType}
          </span>
        )}
      </div>

      <div className="px-4 py-4">
        {current.loading && (
          <div className="space-y-2">
            <div
              className="h-3 w-full rounded bg-surface-2"
              style={{ animation: "pulse 1.5s ease-in-out infinite" }}
            />
            <div
              className="h-3 w-5/6 rounded bg-surface-2"
              style={{ animation: "pulse 1.5s ease-in-out infinite" }}
            />
            <div
              className="h-3 w-2/3 rounded bg-surface-2"
              style={{ animation: "pulse 1.5s ease-in-out infinite" }}
            />
          </div>
        )}

        {!current.loading && current.error && (
          <div
            className="
              rounded-md border border-danger/30
              bg-danger-bg px-3 py-2 text-[12px] text-danger
            "
          >
            {current.error}
          </div>
        )}

        {!current.loading && !current.error && current.message && (
          <>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-text-primary">
              {current.message.message}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span
                className={classNames(
                  "text-[11px]",
                  overLimit ? "text-danger" : "text-text-muted"
                )}
              >
                {charCount} / {MAX_CHARS}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(active, current.message!.message)}
                className="
                  inline-flex items-center gap-1.5 rounded-btn border border-border
                  bg-surface px-2.5 py-1 text-[12px] text-text-secondary
                  hover:border-border-strong hover:text-text-primary
                "
              >
                {copiedVariant === active ? (
                  <>
                    <CheckIcon size={12} />
                    Copied
                  </>
                ) : (
                  <>
                    <CopyIcon size={12} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {!suppressTrackingControls &&
        !current.loading &&
        !current.error &&
        current.action && (
        <div className="border-t border-border px-4 py-3">
          <TrackingControls
            action={current.action}
            onUpdated={(a) => handleStatusChange(active, a)}
          />
        </div>
      )}
    </div>
  );
}
