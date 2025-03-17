import { makeStringSubtypeArray } from 'yaschema';

export const mailCollectionTypes = makeStringSubtypeArray('archive', 'drafts', 'inbox', 'label', 'outbox', 'sent', 'spam', 'trash');
export type MailCollectionType = (typeof mailCollectionTypes)[0];
