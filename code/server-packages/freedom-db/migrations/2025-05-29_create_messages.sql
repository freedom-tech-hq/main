-- Create messages table
CREATE TABLE "messages" (
  "id" VARCHAR PRIMARY KEY,
  "userId" VARCHAR NOT NULL REFERENCES "users" ("userId") ON DELETE CASCADE,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  "folder" VARCHAR NOT NULL CHECK ("folder" IN ('inbox', 'outbox', 'sent', 'drafts')),
  "listFields" VARCHAR NOT NULL,
  "viewFields" VARCHAR NOT NULL,
  "raw" VARCHAR NULL
);

-- Index for efficient querying and pagination
CREATE INDEX "idx_messages_user_folder_time_id" ON "messages" ("userId", "folder", "updatedAt" DESC, "id" DESC);
