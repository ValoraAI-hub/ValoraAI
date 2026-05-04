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

  const cells: Array<{ label: string; value: string }> = [
    { label: "Total candidates", value: String(candidates.length) },
    { label: "Reply rate", value: `${replyRate}%` },
    { label: "Actions today", value: String(actionsToday) },
    { label: "Positive replies", value: String(positiveReplies) },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border md:grid-cols-4">
      {cells.map((c) => (
        <div key={c.label} className="bg-surface px-4 py-3">
          <div className="text-[11px] uppercase tracking-wide text-text-muted">
            {c.label}
          </div>
          <div className="mt-1 text-[20px] font-semibold tracking-tight text-text-primary">
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}
