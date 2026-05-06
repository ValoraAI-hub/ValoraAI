# VISION: Recruiter Growth OS

## Core Use Case (V1 Focus)

Primary Focus: **Intelligent Follow-ups**

The system identifies candidates who have not replied and guides the user to send a high-probability follow-up message.

---

## What "Intelligent" Means (V1)

The system must:

- Select a clear strategy (e.g. soft nudge, curiosity hook, direct ask)
- Use structured signals (e.g. viewed profile, prior message context)
- Generate a short, high-conversion follow-up message
- Recommend the next best action (what to send and when)

---

## Core User Flow (V1)

1. User inputs candidate + previous message
2. User selects or confirms signals (context)
3. System suggests strategy
4. System generates follow-up message
5. User copies and sends manually via LinkedIn
6. User logs outcome (reply / no reply / type of reply)

---

## Performance Definition

Primary KPI:
- Reply Rate %

Secondary KPIs:
- Positive Reply Rate
- Time to Reply

Success Criteria (V1):
- Minimum 2x increase in reply rate compared to user baseline

---

## Strategic Phases (The Evolution)

### Phase 1 — Foundation
Manual execution system.

- Input: candidate + context
- Output: strategy + message
- Full logging of every action and outcome

Goal:
Create a clean data loop.

---

### Phase 2 — Insight Engine
Pattern detection based on real usage data.

- Identify which strategies perform best
- Detect patterns across signals, roles, and message styles
- Surface simple, actionable rules

Goal:
Remove guesswork.

---

### Phase 3 — Intelligence Engine
Prediction and optimization.

- Predict likelihood of reply before sending
- Recommend best strategy per candidate
- Personalize messaging based on historical success

Goal:
Maximize performance per action.

---

## Data & Feedback Loop (CRITICAL)

Every action must be logged:

- message content
- strategy used
- signals at time of sending
- outcome (reply / no reply / type)

Rule:
If it is not logged, it does not exist.

This data powers Phase 2 and Phase 3.

---

## Non-Negotiables

- SAFE BY DESIGN: 100% manual sending on LinkedIn (copy-paste only)
- NO FLUFF: Messages must be short (<300 characters) and direct
- SPEED: User must go from "open app" to "send message" in < 60 seconds
- DATA FIRST: Every action must be tracked

---

## Hard Constraints (Must NEVER be violated)

- No feature outside follow-up messaging
- No LinkedIn automation under any circumstance
- No feature that does not directly improve reply rate
- No unnecessary UI, dashboards, or complexity in V1

---

## What This Product Is NOT

- Not a generic AI writing tool
- Not a LinkedIn automation tool
- Not a CRM

This is a performance system focused on improving reply rates.

---

## Product Philosophy

- Every message is an experiment
- Every action must produce data
- Every feature must improve measurable outcomes

If it does not improve reply rate → it should not be built.