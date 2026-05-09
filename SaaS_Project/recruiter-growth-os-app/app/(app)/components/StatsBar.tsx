"use client";

import { useEffect, useState } from "react";
import type { Candidate } from "../lib/types";

type Props = {
  candidates: Candidate[];
};

type Stats = {
  totalCandidates: number;
  replyRate: number;
  actionsToday: number;
  positiveReplies: number;
};

const DEFAULT_STATS: Stats = {
  totalCandidates: 0,
  replyRate: 0,
  actionsToday: 0,
  positiveReplies: 0,
};

export function StatsBar(_props: Props) {
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);

  useEffect(() => {
    fetch("/api/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: Stats) => setStats(data))
      .catch(() => {});
  }, []);

  const cells: Array<{ label: string; value: string; sub?: string }> = [
    { label: "Total candidates", value: String(stats.totalCandidates), sub: "in pipeline" },
    { label: "Reply rate", value: `${stats.replyRate}%`, sub: "of outreach" },
    { label: "Actions today", value: String(stats.actionsToday), sub: "sent today" },
    { label: "Positive replies", value: String(stats.positiveReplies), sub: "this week" },
  ];

  return (
    <div
      className="flex w-full min-w-0 overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {cells.map((c, i) => (
        <div
          key={c.label}
          className="min-w-0 flex-1"
          style={{
            padding: "16px 20px",
            borderRight:
              i < cells.length - 1 ? "1px solid var(--border)" : undefined,
          }}
        >
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              fontWeight: 500,
              marginBottom: "6px",
            }}
          >
            {c.label}
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: i === 2 ? "var(--accent)" : "var(--text-primary)",
              lineHeight: 1,
            }}
          >
            {c.value}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-tertiary)",
              marginTop: "4px",
            }}
          >
            {c.sub ?? ""}
          </div>
        </div>
      ))}
    </div>
  );
}
