import type { ApiMessage } from './ApiMessage.ts';

export type ExcludedFromInputMessage =
  // Exclude server-controlled fields
  // | 'id' - frontend can control its ids as we are going to local-first, no?
  | 'userId'
  | 'transferredAt'
  | 'folder' // always 'drafts' for user and 'inbox' for MailAgent
  // Exclude all dynamic fields
  | 'hasAttachments';
// TODO: 'attachments'

export type ApiInputMessage = Omit<ApiMessage, ExcludedFromInputMessage>;
