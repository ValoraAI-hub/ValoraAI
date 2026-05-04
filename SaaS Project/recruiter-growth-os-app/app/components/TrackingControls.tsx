"use client";

import { useState } from "react";
import type { Action, ReplyType } from "../lib/types";
import { classNames } from "../lib/utils";

type Props = {
  action: Action;
  onUpdated?: (action: Action) => void;
};

const REPLY_OPTIONS: { value: ReplyType; label: string; tone: "good" | "neutral" | "bad" }[] = [
  { value: "POSITIVE", label: "Positive", tone: "good" },
  { value: "NEUTRAL", label: "Neutral", tone: "neutral" },
  { value: "NEGATIVE", label: "Negative", tone: "bad" },
];

export function TrackingControls({ action, onUpdated }: Props) {
  const [current, setCurrent] = useState<Action>(action);
  const [pending, setPending] = useState<string | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = current.status;
  const replyType = current.replyType ?? null;

  const patch = async (
    body: { status: string; replyType?: ReplyType; replyContent?: string },
    optimistic: Partial<Action>
  ) => {
    const prev = current;
    setError(null);
    setPending(body.status + (body.replyType ?? ""));
    setCurrent({ ...prev, ...optimistic });

    try {
      const res = await fetch(`/api/actions/${current.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to update");
      const next = data as Action;
      setCurrent(next);
      onUpdated?.(next);
    } catch (e) {
      setCurrent(prev);
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setPending(null);
    }
  };

  const buttonClass = (active: boolean, tone: "good" | "neutral" | "bad" = "neutral") => {
    const toneClasses =
      tone === "good"
        ? "border-accent-border bg-accent-bg text-accent"
        : tone === "bad"
        ? "border-danger/30 bg-danger-bg text-danger"
        : "border-border-strong bg-surface-2 text-text-primary";
    return classNames(
      "inline-flex items-center gap-1.5 rounded-btn border px-2.5 py-1 text-[12px]",
      "disabled:opacity-50",
      active
        ? toneClasses
        : "border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary"
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={!!pending}
          onClick={() => {
            setShowReply(false);
            patch({ status: "SENT" }, { status: "SENT", sentAt: new Date().toISOString() });
          }}
          className={buttonClass(status === "SENT", "good")}
        >
          {pending === "SENT" && <span className="spinner" />}Sent
        </button>

        <button
          type="button"
          disabled={!!pending}
          onClick={() => setShowReply((s) => !s)}
          className={buttonClass(status === "REPLIED", "good")}
        >
          Replied{replyType ? ` · ${replyType.toLowerCase()}` : ""}
        </button>

        <button
          type="button"
          disabled={!!pending}
          onClick={() => {
            setShowReply(false);
            patch({ status: "NO_RESPONSE" }, { status: "NO_RESPONSE" });
          }}
          className={buttonClass(status === "NO_RESPONSE")}
        >
          {pending === "NO_RESPONSE" && <span className="spinner" />}No response
        </button>

        <button
          type="button"
          disabled={!!pending}
          onClick={() => {
            setShowReply(false);
            patch({ status: "NOT_INTERESTED" }, { status: "NOT_INTERESTED" });
          }}
          className={buttonClass(status === "NOT_INTERESTED", "bad")}
        >
          {pending === "NOT_INTERESTED" && <span className="spinner" />}Not interested
        </button>
      </div>

      {showReply && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2 py-2">
          <span className="pr-1 text-[11px] text-text-muted">Reply tone</span>
          {REPLY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={!!pending}
              onClick={() =>
                patch(
                  { status: "REPLIED", replyType: opt.value },
                  {
                    status: "REPLIED",
                    replyType: opt.value,
                    repliedAt: new Date().toISOString(),
                  }
                )
              }
              className={buttonClass(replyType === opt.value, opt.tone)}
            >
              {pending === "REPLIED" + opt.value && <span className="spinner" />}
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div
          className="
            rounded-md border border-danger/30 bg-danger-bg px-2.5 py-1.5
            text-[11px] text-danger
          "
        >
          {error}
        </div>
      )}
    </div>
  );
}
