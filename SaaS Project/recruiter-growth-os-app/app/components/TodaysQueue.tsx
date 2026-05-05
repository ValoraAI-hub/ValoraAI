"use client";

import { useCallback, useEffect, useState } from "react";
import type { Candidate } from "../lib/types";
import {
  derivePipelineSlug,
  mergeCandidateAfterStatusCommit,
  type PipelineSlug,
} from "../lib/pipeline-status";
import { formatLongDate } from "../lib/utils";
import { AddCandidateForm } from "./AddCandidateForm";
import { CandidateCard } from "./CandidateCard";
import { PlusIcon } from "./icons";
import { StatsBar } from "./StatsBar";

type PipelineTab =
  | "all"
  | "new"
  | "sent"
  | "replied"
  | "no_response"
  | "not_interested"
  | "booked";

const PIPELINE_TAB_SPECS: { id: PipelineTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "sent", label: "Sent" },
  { id: "replied", label: "Replied" },
  { id: "no_response", label: "No response" },
  { id: "not_interested", label: "Not interested" },
  { id: "booked", label: "Booked" },
];

function matchesPipelineTab(
  candidate: Candidate & { status?: string | null },
  tab: PipelineTab
): boolean {
  const s = derivePipelineSlug(candidate);
  if (tab === "all") return true;
  if (tab === "new") return s === "new";
  return s === tab;
}

function countForPipelineTab(candidatesList: Candidate[], tab: PipelineTab): number {
  if (tab === "all") return candidatesList.length;
  return candidatesList.filter((c) =>
    matchesPipelineTab(c as Candidate & { status?: string | null }, tab)
  ).length;
}

export function TodaysQueue() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<PipelineTab>("all");

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/candidates", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load candidates");
      setCandidates(data as Candidate[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreated = (created: Candidate) => {
    setCandidates((cs) => [created, ...cs]);
    setShowForm(false);
    load();
  };

  const handleStatusChanged = (candidateId: string, newStatus: PipelineSlug) => {
    setCandidates((cs) =>
      cs.map((c) =>
        c.id !== candidateId ? c : mergeCandidateAfterStatusCommit(c, newStatus)
      )
    );
  };

  const filteredCandidates =
    activeTab === "all"
      ? candidates
      : candidates.filter((c) => matchesPipelineTab(c, activeTab));

  return (
    <div className="mx-auto w-full max-w-5xl px-8 py-8">
      <div className="flex items-end justify-between gap-4 pb-6">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-text-primary">
            Today&apos;s queue
          </h1>
          <p className="mt-0.5 text-[12px] text-text-muted">
            Candidates ready for outreach today.
          </p>
        </div>
        <span className="text-[12px] text-text-muted">{formatLongDate()}</span>
      </div>

      <div className="pb-6">
        <StatsBar candidates={candidates} />
      </div>

      <div className="flex items-center justify-between pb-3">
        <h2 className="text-[13px] font-medium text-text-secondary">
          Candidates{" "}
          <span className="text-text-muted">({candidates.length})</span>
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="
            inline-flex items-center gap-1.5 rounded-btn border border-border
            bg-surface px-2.5 py-1 text-[12px] text-text-primary
            hover:border-border-strong
          "
        >
          <PlusIcon size={12} />
          Add candidate
        </button>
      </div>

      {showForm && (
        <div className="pb-4">
          <AddCandidateForm
            onCreated={handleCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {error && (
        <div
          className="
            mb-3 rounded-md border border-danger/30 bg-danger-bg
            px-3 py-2 text-[12px] text-danger
          "
        >
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pb-4 p-1 bg-surface-2 rounded-lg w-fit">
        {PIPELINE_TAB_SPECS.map(({ id, label }) => {
          const count = countForPipelineTab(candidates, id);
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={
                isActive
                  ? "whitespace-nowrap rounded-md px-3 py-1.5 text-[12px] font-medium text-white bg-accent"
                  : "whitespace-nowrap rounded-md px-3 py-1.5 text-[12px] text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }
            >
              {label}{" "}
              <span>({count})</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[64px] rounded-card border border-border bg-surface"
              style={{ animation: "pulse 1.5s ease-in-out infinite" }}
            />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div
          className="
            rounded-card border border-dashed border-border bg-surface px-4 py-10
            text-center
          "
        >
          <p className="text-[13px] font-medium text-text-primary">
            Your queue is empty
          </p>
          <p className="mt-1 text-[12px] text-text-muted">
            Add a candidate to start sending follow-ups.
          </p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div
          className="
            rounded-card border border-dashed border-border bg-surface px-4 py-10
            text-center
          "
        >
          <p className="text-[13px] text-text-muted">
            No candidates in this stage.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCandidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              onStatusChanged={handleStatusChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}
