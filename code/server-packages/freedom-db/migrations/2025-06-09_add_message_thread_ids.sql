-- Add messageId and threadId columns to messages table
ALTER TABLE "messages"
ADD COLUMN "messageId" VARCHAR NULL,
ADD COLUMN "threadId" VARCHAR NULL;

-- Make threadId non-nullable
UPDATE "messages"
SET "threadId" = 'MAILTHREAD_' || gen_random_uuid()
WHERE "threadId" IS NULL;

ALTER TABLE "messages"
ALTER COLUMN "threadId" SET NOT NULL;

-- Index for efficient thread-based queries
CREATE INDEX "idx_messages_thread_id" ON "messages" ("threadId", "updatedAt" DESC);

-- Index for message lookup by messageId
CREATE INDEX "idx_messages_message_id" ON "messages" ("messageId");
