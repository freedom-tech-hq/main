import { makeStringSubtypeArray } from 'yaschema';

export const referencedMailCompositionModes = makeStringSubtypeArray('reply', 'reply-all', 'forward');
export type ReferencedMailCompositionMode = (typeof referencedMailCompositionModes)[0];
