import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';

import type { SyncableStoreAccessControlDocument } from '../../types/SyncableStoreAccessControlDocument.ts';

const AccessControlDocumentContext = createTraceContext<{ accessControlDoc?: SyncableStoreAccessControlDocument }>(() => ({}));

export const useAccessControlDocument = (trace: Trace) => useTraceContext(trace, AccessControlDocumentContext);

export const accessControlDocumentProvider = <ReturnT>(
  trace: Trace,
  accessControlDoc: SyncableStoreAccessControlDocument | undefined,
  callback: (trace: Trace) => ReturnT
) => AccessControlDocumentContext.provider(trace, { accessControlDoc }, callback);
