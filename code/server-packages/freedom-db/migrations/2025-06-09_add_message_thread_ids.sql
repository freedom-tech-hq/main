-- Add messageId and threadId columns to messages table
ALTER TABLE "messages"
ADD COLUMN "messageId" VARCHAR NULL,
ADD COLUMN "threadId" VARCHAR NULL;

-- Index for efficient thread-based queries
CREATE INDEX "idx_messages_thread_id" ON "messages" ("threadId", "updatedAt" DESC);

-- Index for message lookup by messageId
CREATE INDEX "idx_messages_message_id" ON "messages" ("messageId");
