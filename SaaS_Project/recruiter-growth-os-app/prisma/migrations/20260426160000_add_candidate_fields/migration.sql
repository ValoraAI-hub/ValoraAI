-- AlterTable
ALTER TABLE "Candidate"
  ADD COLUMN "linkedinUrl"     TEXT,
  ADD COLUMN "interactionType" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "tags"            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "signals"         JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Drop the temporary default on interactionType so future inserts must provide it
ALTER TABLE "Candidate" ALTER COLUMN "interactionType" DROP DEFAULT;
