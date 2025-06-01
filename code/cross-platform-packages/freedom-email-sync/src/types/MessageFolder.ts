import { schema } from 'yaschema';

export const messageFolders = ['inbox', 'outbox', 'sent', 'drafts'] as const;

export const messageFolderSchema = schema.string<MessageFolder>(...messageFolders);

export type MessageFolder = (typeof messageFolders)[number];
