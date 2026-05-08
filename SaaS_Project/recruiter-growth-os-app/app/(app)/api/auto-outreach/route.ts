import { prisma } from "@/lib/prisma";

// 🔹 Velg variant basert på performance
function chooseVariant(stats: any) {
  const variants = ["A", "B", "C"];

  if (!stats || Object.keys(stats).length === 0) {
    return variants[Math.floor(Math.random() * variants.length)];
  }

  const weights = variants.map((v) => {
    const data = stats[v];
    if (!data) return 1;

    const replyRate = data.replies / data.total || 0;
    return 1 + replyRate * 5;
  });

  const total = weights.reduce((a, b) => a + b, 0);
  const rand = Math.random() * total;

  let sum = 0;
  for (let i = 0; i < variants.length; i++) {
    sum += weights[i];
    if (rand < sum) return variants[i];
  }

  return "A";
}

// 🔹 Generer melding
function generateMessage(candidate: any, variant: string) {
  if (variant === "A") {
    return `Hei ${candidate.name}, jeg ser dere jobber med ${candidate.role}. Har en idé som kan øke pipeline hos ${candidate.company}.`;
  }

  if (variant === "B") {
    return `Hei ${candidate.name}, rask spørsmål – hvordan jobber dere med ${candidate.role}-rekruttering i ${candidate.company}?`;
  }

  if (variant === "C") {
    return `Hei ${candidate.name}, har sett flere ${candidate.role}-team slite med pipeline. Kan vise deg noe som funker.`;
  }

  return `Hei ${candidate.name}`;
}

export async function POST() {

  const ONE_DAY = 10 * 1000; // test

  // 🔴 FOLLOW-UP FIRST
  const pendingAction = await prisma.action.findFirst({
    where: {
      strategyType: "auto",
      status: "sent",
      replyType: null,
      createdAt: {
        lt: new Date(Date.now() - ONE_DAY),
      },
    },
    include: {
      candidate: {
        include: {
          actions: true,
        },
      },
    },
  });

  if (pendingAction) {
    const actionCount = pendingAction.candidate.actions.length;

if (actionCount >= 2) {
  return Response.json({ error: "Follow-up limit reached" });
}
    const followUpMessage = `Hei igjen ${pendingAction.candidate.name}, ville bare følge opp her 😊`;

    const action = await prisma.action.create({
      data: {
        candidateId: pendingAction.candidate.id,
        messageContent: followUpMessage,
        strategyType: "follow_up",
        messageVariant: "F1",
        signalsSnapshot: {},
        status: "sent",
      },
    });

    return Response.json({
      type: "follow-up",
      action,
    });
  }

  // 🟢 NORMAL FLOW

  const candidate = await prisma.candidate.findFirst({
    where: {
      actions: {
        none: {
          status: "sent",
        },
      },
    },
  });

  if (!candidate) {
    return Response.json({ error: "No candidate found" });
  }

  const actions = await prisma.action.findMany();

  const stats = actions.reduce((acc, a) => {
    const key = a.messageVariant || "A";

    if (!acc[key]) {
      acc[key] = { total: 0, replies: 0 };
    }

    acc[key].total += 1;

    if (a.status === "replied") {
      acc[key].replies += 1;
    }

    return acc;
  }, {} as Record<string, { total: number; replies: number }>);

  const chosenVariant = chooseVariant(stats);
  const message = generateMessage(candidate, chosenVariant);

  const action = await prisma.action.create({
    data: {
      candidateId: candidate.id,
      messageContent: message,
      strategyType: "auto",
      messageVariant: chosenVariant,
      signalsSnapshot: {},
      status: "sent",
      sentAt: new Date(),
    },
  });

  return Response.json({
    candidate,
    action,
    chosenVariant,
  });
}