import { makeStringSubtypeArray } from 'yaschema';

export const mailCollectionTypes = makeStringSubtypeArray('archive', 'drafts', 'inbox', 'sent', 'spam', 'trash', 'custom');
export type MailCollectionType = (typeof mailCollectionTypes)[0];
