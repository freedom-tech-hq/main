import { schema } from 'yaschema';

export const messageFolders = [
  'inbox',
  // 'outbox' is a technical folder for agent in the current implementation.
  // If the agent does not rely on it, we should remove the constant.
  // The user should get either instant feedback from send API or a bounce email in case of delayed problems.
  'outbox',
  'sent',
  'drafts'
] as const;

export const messageFolderSchema = schema.string<MessageFolder>(...messageFolders);

export type MessageFolder = (typeof messageFolders)[number];
