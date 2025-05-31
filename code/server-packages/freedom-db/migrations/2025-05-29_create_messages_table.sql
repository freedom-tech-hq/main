-- Create messages table
CREATE TABLE "messages" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users" ("userId") ON DELETE CASCADE,
  "transferredAt" TIMESTAMPTZ NOT NULL,
  "folder" TEXT NOT NULL CHECK ("folder" IN ('inbox', 'outbox', 'sent', 'drafts')),
  "listMessage" BYTEA NOT NULL,
  "viewMessage" BYTEA NOT NULL,
  "rawMessage" BYTEA NOT NULL
);

-- Index for efficient querying and pagination
CREATE INDEX "idx_messages_user_folder_time_id" ON "messages" ("userId", "folder", "transferredAt" DESC, "id" DESC);
