-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "messageContent" TEXT NOT NULL,
    "strategyType" TEXT NOT NULL,
    "messageVariant" TEXT NOT NULL,
    "signalsSnapshot" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "replyType" TEXT,
    "replyContent" TEXT,
    "sentAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
