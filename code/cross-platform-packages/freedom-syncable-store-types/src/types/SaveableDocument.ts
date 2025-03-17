import type { PRFunc } from 'freedom-async';

export type SaveableDocument<DocumentT> = { document: DocumentT; save: PRFunc<undefined, 'conflict'> };
