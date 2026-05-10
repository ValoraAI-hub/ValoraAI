"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ConversationTurn = {
  id: string;
  candidateId: string;
  turn: number;
  direction: string;
  content: string;
  strategyType?: string | null;
  replyType?: string | null;
  createdAt: string;
};

type LastAction = {
  id: string;
  status: string;
  outcome: string | null;
};

type CandidateSummary = {
  id: string;
  name: string;
  role: string;
  company: string;
  status: string;
  lastAction?: LastAction | null;
};

const OUTCOME_VALUES = ["replied", "ghosted", "booked", "rejected"] as const;
type Outcome = (typeof OUTCOME_VALUES)[number];

const OUTCOME_LABELS: Record<Outcome, string> = {
  replied: "Replied",
  ghosted: "Ghosted",
  booked: "Booked",
  rejected: "Rejected",
};

type NextAction = "continue" | "clarify" | "soft_push" | "book" | "close";

function normalizeConversationResponse(data: unknown): ConversationTurn[] {
  if (Array.isArray(data)) return data as ConversationTurn[];
  if (data && typeof data === "object" && "turns" in data && Array.isArray((data as { turns: unknown }).turns)) {
    return (data as { turns: ConversationTurn[] }).turns;
  }
  return [];
}

function isOutbound(dir: string): boolean {
  return dir.toLowerCase() === "outbound";
}

function nextActionBadgeClasses(action: NextAction): string {
  switch (action) {
    case "continue":
      return "text-text-muted";
    case "clarify":
      return "text-text-secondary";
    case "soft_push":
      return "text-warning";
    case "book":
      return "font-medium text-[#1D9E75]";
    case "close":
      return "text-danger";
    default:
      return "text-text-muted";
  }
}

function nextActionLabel(action: NextAction): string {
  switch (action) {
    case "continue":
      return "continue";
    case "clarify":
      return "clarify";
    case "soft_push":
      return "build interest";
    case "book":
      return "suggest meeting";
    case "close":
      return "close conversation";
    default:
      return String(action);
  }
}

function parseNextAction(raw: unknown): NextAction | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase().replace(/-/g, "_");
  const map: Record<string, NextAction> = {
    continue: "continue",
    clarify: "clarify",
    soft_push: "soft_push",
    book: "book",
    close: "close",
  };
  return map[s] ?? null;
}

function confidenceTier(confidence: number): "HIGH" | "MEDIUM" | "LOW" {
  if (confidence >= 0.8) return "HIGH";
  if (confidence >= 0.5) return "MEDIUM";
  return "LOW";
}

function confidenceBadgeClass(tier: "HIGH" | "MEDIUM" | "LOW"): string {
  switch (tier) {
    case "HIGH":
      return "border-accent-border bg-accent-bg text-accent";
    case "MEDIUM":
      return "border-border-strong bg-surface-2 text-text-secondary";
    case "LOW":
      return "border-border bg-surface text-text-muted";
    default:
      return "border-border bg-surface text-text-muted";
  }
}

export default function CandidateConversationPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [candidate, setCandidate] = useState<CandidateSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [outboundDraft, setOutboundDraft] = useState("");
  const [inboundDraft, setInboundDraft] = useState("");
  const [panelError, setPanelError] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [editedReply, setEditedReply] = useState("");
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [replyOverride, setReplyOverride] = useState<
    "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null
  >(null);
  const [savingOutbound, setSavingOutbound] = useState(false);
  const [savingOutbound2, setSavingOutbound2] = useState(false);
  const [savingInbound, setSavingInbound] = useState(false);
  const [replyCopied, setReplyCopied] = useState(false);
  const [showOutcomeReminder, setShowOutcomeReminder] = useState(false);

  const [candidateStatus, setCandidateStatus] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [actionOutcome, setActionOutcome] = useState<string | null>(null);
  const [outcomeSaving, setOutcomeSaving] = useState<Outcome | null>(null);
  const [outcomeError, setOutcomeError] = useState<string | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);

  const sortedTurns = useMemo(
    () => [...turns].sort((a, b) => a.turn - b.turn),
    [turns]
  );

  const lastTurn = sortedTurns.length > 0 ? sortedTurns[sortedTurns.length - 1] : null;

  const hasGenerateDraft = nextAction !== null && confidence !== null;

  const loadConversation = useCallback(async () => {
    setLoadError(null);
    const res = await fetch(`/api/candidates/${id}/conversation`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error((data as { error?: string })?.error ?? "Failed to load conversation");
    setTurns(normalizeConversationResponse(data));
  }, [id]);

  const loadCandidate = useCallback(async () => {
    const res = await fetch("/api/candidates", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error((data as { error?: string })?.error ?? "Failed to load candidates");
    const rows = Array.isArray(data) ? data : [];
    const found = rows.find((c: CandidateSummary) => c.id === id) ?? null;
    setCandidate(found);
    setCandidateStatus(found?.status ?? null);
    const last = found?.lastAction ?? null;
    setActionId(last?.id ?? null);
    setActionStatus(last?.status ?? null);
    setActionOutcome(last?.outcome ?? null);
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setLoadError("Missing candidate id");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadConversation(), loadCandidate()]);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Could not load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, loadConversation, loadCandidate]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [sortedTurns, generating]);

  const resetReplyDraftOnly = useCallback(() => {
    setEditedReply("");
    setNextAction(null);
    setConfidence(null);
    setReplyOverride(null);
  }, []);

  const handleSetOutcome = async (outcome: Outcome) => {
    if (!actionId) return;
    const previous = actionOutcome;
    setOutcomeError(null);
    setOutcomeSaving(outcome);
    setActionOutcome(outcome);
    try {
      const res = await fetch("/api/actions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actionId, outcome }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string })?.error ?? "Could not save outcome");
      }
    } catch (e) {
      setActionOutcome(previous);
      setOutcomeError(e instanceof Error ? e.message : "Could not save outcome");
    } finally {
      setOutcomeSaving(null);
    }
  };

  const handleClearConversation = async () => {
    setPanelError(null);
    try {
      const res = await fetch(`/api/candidates/${id}/conversation`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string })?.error ?? "Could not clear");
      setTurns([]);
      setOutboundDraft("");
      setInboundDraft("");
      resetReplyDraftOnly();
      setGenerating(false);
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Could not clear");
    }
  };

  const postTurn = async (body: {
    direction: "outbound" | "inbound";
    content: string;
    strategyType?: string;
    replyType?: string;
  }) => {
    const res = await fetch(`/api/candidates/${id}/conversation`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string })?.error ?? "Could not save turn");
    await loadConversation();
  };

  const handleLogOutbound = async () => {
    setPanelError(null);
    const text = outboundDraft.trim();
    if (!text) return;
    setSavingOutbound2(true);
    try {
      await postTurn({ direction: "outbound", content: text });
      setOutboundDraft("");
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Could not log message");
    } finally {
      setSavingOutbound2(false);
    }
  };

  const handleLogInbound = async () => {
    setPanelError(null);
    const text = inboundDraft.trim();
    if (!text) return;
    setSavingInbound(true);
    try {
      await postTurn({ direction: "inbound", content: text });
      setInboundDraft("");
      resetReplyDraftOnly();
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Could not log reply");
    } finally {
      setSavingInbound(false);
    }
  };

  const buildHistory = () =>
    sortedTurns.map((t) => ({
      direction: isOutbound(t.direction) ? ("outbound" as const) : ("inbound" as const),
      content: t.content,
    }));

  const handleGenerateNext = async () => {
    if (!lastTurn || isOutbound(lastTurn.direction)) return;
    setPanelError(null);
    resetReplyDraftOnly();
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          candidateId: id,
          candidateMessage: lastTurn.content,
          history: buildHistory(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string })?.error ?? "Generate failed");

      const message = typeof data.message === "string" ? data.message : "";
      const na = parseNextAction(data.nextAction);
      const conf = typeof data.confidence === "number" ? data.confidence : Number(data.confidence);

      setEditedReply(message);
      setNextAction(na ?? "continue");
      setConfidence(Number.isFinite(conf) ? Math.min(1, Math.max(0, conf)) : 0.5);
      await loadCandidate();
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleLagreSomSendt = async () => {
    setPanelError(null);
    if (!lastTurn || isOutbound(lastTurn.direction)) return;
    const text = editedReply.trim();
    if (!text) return;
    setSavingOutbound(true);
    try {
      const outboundBody: Parameters<typeof postTurn>[0] = {
        direction: "outbound",
        content: text,
      };
      if (replyOverride) outboundBody.replyType = replyOverride;

      await postTurn(outboundBody);

      if (nextAction === "book") {
        const patch = await fetch(`/api/candidates/${id}/status`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status: "booked" }),
        });
        const patchBody = await patch.json().catch(() => ({}));
        if (!patch.ok) throw new Error((patchBody as { error?: string })?.error ?? "Status update failed");
        setCandidateStatus("booked");
      }

      resetReplyDraftOnly();
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSavingOutbound(false);
    }
  };

  if (!id) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <p className="text-[13px] text-text-muted">Invalid candidate route.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-2xl flex-col px-6 py-6">
      <header className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <Link
            href="/"
            className="inline-block text-[12px] text-text-muted hover:text-text-primary"
          >
            ← Back
          </Link>
          <h1 className="mt-1 text-[18px] font-semibold tracking-tight text-text-primary">
            {candidate?.name ?? "Kandidat"}
          </h1>
          <p className="text-[13px] text-text-muted">
            {candidate ? (
              <>
                {candidate.role} <span className="opacity-50">·</span> {candidate.company}
              </>
            ) : loading ? (
              "…"
            ) : (
              "Ukjent kandidat"
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleClearConversation()}
          disabled={sortedTurns.length === 0}
          className="
            inline-flex shrink-0 items-center rounded-btn border border-border bg-surface px-2.5 py-1 text-[12px] font-medium
            text-text-primary hover:border-border-strong disabled:pointer-events-none disabled:opacity-40
          "
        >
          Clear conversation
        </button>
      </header>

      {loadError && (
        <div className="mb-3 rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-[12px] text-danger">
          {loadError}
        </div>
      )}

      {panelError && (
        <div className="mb-3 rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-[12px] text-danger">
          {panelError}
        </div>
      )}

      {actionId && actionStatus === "SENT" && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-text-muted">Outcome:</span>
          {actionOutcome ? (
            <span className="inline-flex rounded-btn border border-border-strong bg-surface-2 px-2.5 py-1 text-[12px] font-medium text-text-primary">
              {OUTCOME_LABELS[actionOutcome as Outcome] ?? actionOutcome}
            </span>
          ) : (
            <>
              {OUTCOME_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => void handleSetOutcome(value)}
                  disabled={outcomeSaving !== null}
                  className="inline-flex rounded-btn border border-border bg-bg px-2.5 py-1 text-[12px] font-medium text-text-secondary hover:border-border-strong disabled:opacity-50"
                >
                  {OUTCOME_LABELS[value]}
                </button>
              ))}
              {showOutcomeReminder && !actionOutcome && (
                <p className="text-[11px] text-text-muted mt-1">
                  Husk å velge utfall når kandidaten svarer.
                </p>
              )}
            </>
          )}
          {outcomeError && (
            <span className="text-[12px] text-danger">{outcomeError}</span>
          )}
        </div>
      )}

      <div
        ref={threadRef}
        className="mb-4 min-h-0 flex-1 overflow-y-auto rounded-card border border-border bg-surface-2 px-4 py-4"
      >
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-surface"
                style={{ animation: "pulse 1.5s ease-in-out infinite" }}
              />
            ))}
          </div>
        ) : sortedTurns.length === 0 ? (
          <p className="text-center text-[12px] text-text-muted">Ingen meldinger ennå.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedTurns.map((t) => {
              const out = isOutbound(t.direction);
              return (
                <div
                  key={t.id}
                  className={`flex ${out ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={[
                      "max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
                      out
                        ? "rounded-br-md text-white"
                        : "rounded-bl-md bg-surface text-text-primary ring-1 ring-border",
                    ].join(" ")}
                    style={out ? { backgroundColor: "#1D9E75" } : undefined}
                  >
                    <p className="whitespace-pre-wrap">{t.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 space-y-4 border-t border-border pt-4">
        {sortedTurns.length === 0 && (
          <div className="rounded-card border border-border bg-surface p-4">
            <label className="block text-[12px] font-medium text-text-secondary">
              Din første melding (utkast til sendt)
            </label>
            <textarea
              value={outboundDraft}
              onChange={(e) => setOutboundDraft(e.target.value)}
              rows={4}
              className="
                mt-2 w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text-primary
                placeholder:text-text-muted focus:border-border-strong focus:outline-none
              "
              placeholder="Lim inn eller skriv meldingen du sendte..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => void handleLogOutbound()}
              disabled={savingOutbound2}
              className="
                mt-3 inline-flex items-center rounded-btn border border-accent-border bg-accent-bg px-3 py-1.5
                text-[12px] font-medium text-accent hover:brightness-[0.97] disabled:opacity-45
              "
            >
              {savingOutbound2 ? "Sender…" : "Logg sendt melding"}
            </button>
          </div>
        )}

        {sortedTurns.length > 0 && lastTurn && isOutbound(lastTurn.direction) && (
          <div className="rounded-card border border-border bg-surface p-4">
            <label className="block text-[12px] font-medium text-text-secondary">
              Kandidaten svarte:
            </label>
            <textarea
              value={inboundDraft}
              onChange={(e) => setInboundDraft(e.target.value)}
              rows={4}
              className="
                mt-2 w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text-primary
                placeholder:text-text-muted focus:border-border-strong focus:outline-none
              "
              placeholder="Lim inn eller skriv svaret..."
            />
            <button
              type="button"
              onClick={() => void handleLogInbound()}
              disabled={savingInbound}
              className="
                mt-3 inline-flex items-center rounded-btn border border-border bg-surface px-3 py-1.5 text-[12px]
                font-medium text-text-primary hover:border-border-strong disabled:opacity-45
              "
            >
              {savingInbound ? "Sender…" : "Logg svar"}
            </button>
          </div>
        )}

        {sortedTurns.length > 0 && lastTurn && !isOutbound(lastTurn.direction) && (
          <div className="space-y-3 rounded-card border border-border bg-surface p-4">
            {!hasGenerateDraft && !generating ? (
              <button
                type="button"
                onClick={() => void handleGenerateNext()}
                disabled={generating}
                className="
                  inline-flex items-center rounded-btn border border-accent-border bg-accent-bg px-3 py-1.5
                  text-[12px] font-medium text-accent hover:brightness-[0.97] disabled:opacity-50
                "
              >
                Generer neste melding
              </button>
            ) : null}

            {generating && (
              <p className="text-[12px] text-text-muted">Generer forslag…</p>
            )}

            {hasGenerateDraft ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[12px] font-medium text-text-secondary">
                    Forslag til svar (rediger før du sender)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        await navigator.clipboard.writeText(editedReply);
                        setReplyCopied(true);
                        setTimeout(() => setReplyCopied(false), 1500);
                        if (actionId) {
                          await Promise.all([
                            fetch(`/api/actions/${actionId}/status`, {
                              method: "PATCH",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({ status: "SENT" }),
                            }),
                            fetch(`/api/candidates/${id}/status`, {
                              method: "PATCH",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({ status: "contacted" }),
                            }),
                          ]);
                          setActionStatus("SENT");
                          setShowOutcomeReminder(true);
                        }
                      })();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 border border-border rounded-md bg-surface-2 text-text-muted hover:text-text-primary hover:border-border-strong"
                  >
                    {replyCopied ? "Copied" : "Copy"}
                  </button>
                </div>
                <textarea
                  value={editedReply}
                  onChange={(e) => setEditedReply(e.target.value)}
                  rows={6}
                  className="
                    w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text-primary
                    focus:border-border-strong focus:outline-none
                  "
                />

                {nextAction !== null && confidence !== null && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[12px] ${nextActionBadgeClasses(nextAction)}`}>
                      {nextActionLabel(nextAction)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-pill border px-2 py-0.5 text-[11px] font-semibold uppercase ${confidenceBadgeClass(
                        confidenceTier(confidence)
                      )}`}
                      style={{ borderRadius: 20 }}
                    >
                      {confidenceTier(confidence)}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {(["POSITIVE", "NEUTRAL", "NEGATIVE"] as const).map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setReplyOverride(tone)}
                      className={[
                        "inline-flex rounded-btn border px-2.5 py-1 text-[12px] font-medium",
                        replyOverride === tone
                          ? "border-border-strong bg-surface-2 text-text-primary"
                          : "border-border bg-bg text-text-secondary hover:border-border-strong",
                      ].join(" ")}
                    >
                      {tone === "POSITIVE"
                        ? "Positive"
                        : tone === "NEUTRAL"
                          ? "Neutral"
                          : "Negative"}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => void handleLagreSomSendt()}
                  disabled={savingOutbound || editedReply.trim() === ""}
                  className="
                    inline-flex items-center rounded-btn border border-border bg-surface px-3 py-1.5 text-[12px]
                    font-medium text-text-primary hover:border-border-strong disabled:opacity-45
                  "
                >
                  {savingOutbound ? "Sender…" : "Lagre som sendt"}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
