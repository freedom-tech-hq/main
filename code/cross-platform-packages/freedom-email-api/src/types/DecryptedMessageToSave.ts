import type { DecryptedMessage } from './DecryptedMessage.ts';

export type DecryptedMessageToSave = Omit<
  DecryptedMessage,
  // Exclude controlled fields
  // | 'id' - frontend can control its ids as we are going to local-first, no?
  | 'userId' // validated
  | 'transferredAt' // auto
  | 'folder' // always 'drafts' for user and 'inbox' for MailAgent
  // Exclude all dynamic fields
  | 'hasAttachments'
  // TODO: 'attachments'
>;
