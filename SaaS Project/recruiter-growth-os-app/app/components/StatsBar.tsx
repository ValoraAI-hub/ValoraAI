import type { Candidate } from "../lib/types";

type Props = {
  candidates: Candidate[];
};

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function StatsBar({ candidates }: Props) {
  const todayStart = startOfToday();
  let sent = 0;
  let replied = 0;
  let actionsToday = 0;
  let positiveReplies = 0;

  for (const c of candidates) {
    const a = c.lastAction;
    if (!a) continue;

    if (a.status === "SENT" || a.status === "REPLIED") sent += 1;
    if (a.status === "REPLIED") replied += 1;
    if (a.replyType === "POSITIVE") positiveReplies += 1;

    const created = new Date(a.createdAt).getTime();
    if (!Number.isNaN(created) && created >= todayStart) actionsToday += 1;
  }

  const replyRate = sent === 0 ? 0 : Math.round((replied / sent) * 100);

  const cells: Array<{ label: string; value: string; sub?: string }> = [
    { label: "Total candidates", value: String(candidates.length), sub: "in pipeline" },
    { label: "Reply rate", value: `${replyRate}%`, sub: "of outreach" },
    { label: "Actions today", value: String(actionsToday), sub: "sent today" },
    { label: "Positive replies", value: String(positiveReplies), sub: "this week" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {cells.map((c, i) => (
        <div
          key={c.label}
          className="rounded-[10px] border border-border bg-surface px-4 py-3"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <div className="text-[10px] uppercase tracking-[.06em] font-medium text-text-muted">
            {c.label}
          </div>
          <div className={`mt-1.5 text-[22px] font-semibold tracking-tight leading-none ${i === 2 ? "text-accent" : "text-text-primary"}`}>
            {c.value}
          </div>
          <div className="mt-1 text-[10px] text-text-muted opacity-60">
            {c.sub ?? ""}
          </div>
        </div>
      ))}
    </div>
  );
}
