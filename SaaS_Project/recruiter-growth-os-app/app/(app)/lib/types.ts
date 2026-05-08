export type ActionStatus =
  | "DRAFT"
  | "SENT"
  | "REPLIED"
  | "NO_RESPONSE"
  | "NOT_INTERESTED"
  | "BOOKED"
  | "FAILED";

export type ReplyType = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

export type Action = {
  id: string;
  candidateId: string;
  messageContent: string;
  strategyType: string;
  messageVariant: string;
  signalsSnapshot: Record<string, unknown>;
  status: ActionStatus | string;
  replyType: string | null;
  replyContent: string | null;
  sentAt: string | null;
  repliedAt: string | null;
  createdAt: string;
};

export type Candidate = {
  id: string;
  userId: string;
  name: string;
  role: string;
  company: string;
  linkedinUrl: string | null;
  interactionType: string;
  tags: string[];
  signals: Record<string, unknown>;
  lastContactedAt: string | null;
  createdAt: string;
  lastAction: Action | null;
};

export type GeneratedMessage = {
  message: string;
  strategyType: string;
  messageVariant: string;
};
