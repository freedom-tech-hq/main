import type { PRFunc } from 'freedom-async';
import type { TrustedTime } from 'freedom-trusted-time-source';

export type SaveableDocument<DocumentT> = { document: DocumentT; save: PRFunc<undefined, 'conflict', [{ trustedTime?: TrustedTime }?]> };
