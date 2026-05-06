# 🧠 RECRUITER GROWTH OS — MASTER BUILD DOC (ELITE HYBRID)

🔥 CORE TRUTH (NON-NEGOTIABLE)

This product wins or loses based on ONE thing:

→ Does the user take action faster and more consistently?

If not → the product fails.

---

## 1. 🎯 PRODUCT DEFINITION

Name: Recruiter Growth OS

Type: AI-powered decision and execution system for LinkedIn recruiters

---

### Core Goal

Increase recruiter performance by improving:

reply rate

number of candidates

number of placements

---

### Core Promise

The system tells the recruiter exactly:

who to contact

why now

what to say

Then improves over time based on results.

---

### What This Is NOT

Not a CRM

Not a LinkedIn automation tool

Not a generic AI message generator

Not an analytics dashboard

---

### What This IS

A daily execution system that removes guesswork and improves recruiter outcomes.

---

## 2. 🔥 CORE LOOP (MOST IMPORTANT PART)

Load candidate pool (manual or mock)

User selects candidates with no reply (follow-up only)

Generate follow-up message for each

User sends manually via LinkedIn

User logs outcome

System stores outcomes for future rule updates (manual tuning in MVP)

---

## 3. 🚀 MVP SCOPE (STRICT — NO EXCEPTIONS)

### Goal

Deliver clear value within 60 seconds

---

### ONLY BUILD THIS

---

### 0. Candidate Object Definition (CRITICAL)

Candidate Object (MVP):

id

name

role

company

last_contacted_at (optional)

interaction_type (follow_up only)

tags (optional)

---

### 0. Input Method (MVP)

Candidates must be loaded via:

simple manual input form

Optional (NOT required for MVP):

hardcoded mock list

---

### 1. Follow-up Execution System (CRITICAL)

Output:

follow-up actions for selected candidates

each action includes:

candidate

reason for selection

message

---

### ✅ Reason Format (STRICT — NO FREE TEXT)

Must be ONE of:

"Follow-up: No reply after X days"

Optional (only if data exists):

"Similar profiles replied before (manual tag)"

---

### Candidate Priority Logic (MVP)

User selects candidates with no reply

System optimizes follow-up only

Limit: max 10 per session

---

### 2. Message Support System

For each candidate generate:

follow-up 1

follow-up 2

Each message must be assigned a strategyType (e.g. soft_follow_up, direct_follow_up)

---

### Message Constraints (VERY IMPORTANT)

max 300 characters

must reference candidate role, experience, or company

no generic compliments

no “I came across your profile”

no corporate tone

must feel human and direct

---

### ✅ Message Structure (MANDATORY)

Personal hook (role / company / experience)

Direct relevance or value

Simple call-to-action

Max 3 sentences.

---

### ✅ Message Hard Constraints (CRITICAL QUALITY CONTROL)

Avoid low-performing generic phrasing such as:

“Would you be open to…”

“Exciting opportunity”

Must include at least ONE specific detail (company OR tech OR role)

(Subject to validation through real data)

---

### 3. Tracking System (CRITICAL)

User must log:

SENT

REPLIED

NO_RESPONSE

NOT_INTERESTED

---

### ✅ Tracking Requirements (CRITICAL)

When REPLIED:

User must classify reply:

positive

negative

neutral

---

### ✅ Tracking Impact (MVP)

REPLIED → positive / negative / neutral classification

NOT_INTERESTED → negative signal

SENT → baseline data

NO_RESPONSE → no engagement signal

NO automatic weighting in MVP.

Used only for:

manual review

future system design

---

### ✅ Logging UX Constraint (CRITICAL)

Logging must happen immediately after action

Max 1 click

No forms

No typing

---

## System Output (STRICT FORMAT)

Each action must display:

- Candidate name + role + company
- Strategy label
- Reason (predefined format)
- Message (copy-ready)

No extra text  
No explanations

---

## 4. ❌ STRICTLY EXCLUDED FROM MVP

DO NOT BUILD:

CRM functionality

LinkedIn automation

Chrome extension

AI agents

Revenue tracking

Team features

Content engine

Advanced scoring systems

Weekly insights / analytics dashboards

---

## 5. 🧠 DATA STRATEGY (FOUNDATION OF MOAT)

### Data Collected

messages (content, structure)

candidate profile data

timing of messages

replies / no replies

user activity

---

### Purpose

Build a personalized intelligence model per user

---

## 6. 🧠 EXECUTION PRINCIPLES (NON-NEGOTIABLE)

Execution > features

Simplicity > complexity

Speed > perfection

Outcome > activity

Learning > static

---

# 🔥 PRODUCT EXPERIENCE SYSTEM (CRITICAL)

The product is not just a tool.

It must create a daily execution habit.

---

## 🎯 CORE EXPERIENCE

When the user opens the app, it must feel like:

“I know exactly what to do now.”

NOT:

“I need to think”

---

## 🧠 USER PSYCHOLOGY

The system must trigger:

Clarity → clear next action, no decision fatigue

Momentum → fast progression between actions

Progress → visible completion

Control → structured, predictable system

---

## ⚡ SPEED REQUIREMENT

User must:

open app

understand instantly

send first message

→ within 30–60 seconds

---

## 🔁 DAILY LOOP EXPERIENCE

Open app → Select candidates → Execute follow-ups → Feel progress → Finish

---

## 🎯 EMOTIONAL OUTCOME

User feels:

productive

focused

ahead

in control

---

## ❗ CRITICAL RULE

If anything slows:

clarity

speed

execution

→ DO NOT BUILD IT

---

## 7. 🧠 UX PRINCIPLES

The product must:

be usable instantly

require zero training

have zero confusion

always show next action

---

### Required Flow

Open → Select → Click → Copy → Send → Log → Next

---

### UI Constraint (CRITICAL)

Entire daily flow must happen in ONE screen (or minimal transitions)

---

## 8. 🎯 DIFFERENTIATION

Competitors:

increase message volume

This product:

increases decision quality

increases reply rate

improves over time

---

### Core Advantage

Decision layer > generation layer

---

## 9. ⚠️ BUILD CONSTRAINTS (VERY IMPORTANT)

You are building an MVP.

Do NOT:

over-engineer intelligence

add extra features

expand scope

---

Focus ONLY on:

follow-up execution

message generation

structured tracking

---

## 10. ⚠️ MVP REALITY CONSTRAINTS

Candidates are manually input or mocked

No LinkedIn integration

No real signal engine

No machine learning

---

Goal:

→ usability

→ speed

→ real value

NOT:

→ perfect intelligence

---

## 11. 🧠 SIMPLICITY & LOGIC RULES

NO HIDDEN LOGIC

All behavior must be visible

No background AI decisions

No black-box scoring

---

### LOGIC REQUIREMENTS

All logic must be:

rule-based

deterministic

transparent

easy to debug

---

### SCORING SIMPLIFICATION

follow_up → high priority

---

NO complex scoring systems

---

## 12. 🧠 UI DATA BINDING RULE

Everything shown in UI must map directly to data:

candidate name

role + company

reason

message

action buttons

---

No abstraction

No hidden layers

---

## 13. 🧠 DATA BINDING (CRITICAL)

Every action MUST include:

strategyType (required)

messageVariant (required)

signalsSnapshot (required)

replyType (when reply occurs)

If this is not captured → action is invalid

---

### Signals (MVP)

- User manually selects simple context signals (optional)
- If not provided → default empty snapshot

---

## 14. 🧠 LEARNING SYSTEM (MVP LIMITATION)

There is NO real learning system in MVP

Only:

messages sent

replies

not interested

---

Future learning comes later

---

## 15. 🎯 SUCCESS CRITERIA (MVP)

MVP succeeds if:

user understands product in < 60 sec

user takes action immediately

user returns daily

reply rate improves

---

## 16. 🚀 FINAL BUILD RULE

If a feature does NOT directly help the user:

→ see what to do

→ take action

→ send message

---

It MUST NOT be built

No exceptions

---

## 17. 🧠 FUTURE SYSTEM (LOCKED — DO NOT BUILD)

### 🎯 PURPOSE

Move from:

→ execution system

To:

→ intelligent decision system

---

### 🧠 INTELLIGENCE LAYERS

Message Intelligence → identify high-performing patterns

Candidate Intelligence → identify high-converting profiles

Timing Intelligence → identify optimal send times

---

### Coach System

feedback

insights

improvement suggestions

---

### Progression System

recruiter score

milestones

personal playbook

---

### Revenue Layer

activity → placements → revenue

---

### Agent Layer

outreach

follow-ups

strategy

---

### Candidate Likelihood Engine (FUTURE)

Estimates:

reply likelihood

engagement likelihood

progression likelihood

---

### Output

low / medium / high

reason-based explanation

---

### Constraints

NO fake precision

NO early % predictions

MUST use real data

---

## 🚀 LONG-TERM VISION

Each user gets:

their own strategy

their own playbook

continuously improving results

---

## ❌ DO NOT BUILD IN MVP

Focus ONLY on:

execution

simplicity

data collection

---

# 🔥 PRIORITY ORDER (ABSOLUTE)

UX clarity

Speed

Execution

Data collection

Future intelligence

---

# 🚀 BUILD INSTRUCTION

Build the MVP exactly as described

Do not expand scope

Do not add features

Do not “improve” the system

Focus only on execution

---

# 💣 FINAL REALITY CHECK

If the user is not:

taking action immediately

completing actions daily

improving reply rate

→ the product is failing

No matter how “smart” it looks