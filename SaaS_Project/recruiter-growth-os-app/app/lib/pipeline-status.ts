import type { Action, Candidate } from "./types";

/** Lowercase pipeline slug used by UI filters and candidate.status override. */
export type PipelineSlug =
  | "new"
  | "sent"
  | "replied"
  | "no_response"
  | "not_interested"
  | "booked";

export type CommittablePipelineSlug = Exclude<PipelineSlug, "new">;

const ACTION_TO_SLUG: Record<string, CommittablePipelineSlug> = {
  SENT: "sent",
  REPLIED: "replied",
  NO_RESPONSE: "no_response",
  NOT_INTERESTED: "not_interested",
  BOOKED: "booked",
};

const SLUG_TO_ACTION: Record<CommittablePipelineSlug, string> = {
  sent: "SENT",
  replied: "REPLIED",
  no_response: "NO_RESPONSE",
  not_interested: "NOT_INTERESTED",
  booked: "BOOKED",
};

function isCommittableSlug(s: string): s is CommittablePipelineSlug {
  return s in SLUG_TO_ACTION;
}

export function derivePipelineSlug(
  candidate: Candidate & { status?: string | null }
): PipelineSlug {
  const override = candidate.status;
  if (
    override !== undefined &&
    override !== null &&
    override !== "" &&
    (override === "new" || isCommittableSlug(override))
  ) {
    return override === "new" ? "new" : override;
  }

  const raw = candidate.lastAction?.status?.toUpperCase?.() ?? "";
  if (raw === "" || raw === "DRAFT" || raw === "FAILED") return "new";
  if (ACTION_TO_SLUG[raw]) return ACTION_TO_SLUG[raw];
  return "new";
}

export function pipelineSlugToApiStatus(
  slug: CommittablePipelineSlug
): string {
  return SLUG_TO_ACTION[slug];
}

export function mergeCandidateAfterStatusCommit(
  candidate: Candidate,
  nextSlug: PipelineSlug
): Candidate & { status?: string | null } {
  const la = candidate.lastAction;
  if (nextSlug === "new") {
    return {
      ...candidate,
      status: "new",
      lastAction: la
        ? ({
            ...la,
            status: "DRAFT",
            sentAt: null,
            repliedAt: null,
            replyType: null,
            replyContent: null,
          } as Action)
        : null,
    };
  }
  const upper = pipelineSlugToApiStatus(nextSlug) as Action["status"];
  return {
    ...candidate,
    status: nextSlug,
    lastAction: la ? ({ ...la, status: upper } as Action) : null,
  };
}
