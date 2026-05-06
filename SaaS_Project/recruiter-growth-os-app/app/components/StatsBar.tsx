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
