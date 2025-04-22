import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';
import type { ISyncableStoreAccessControlDocument } from 'freedom-syncable-store-types/lib/types/ISyncableStoreAccessControlDocument';

const AccessControlDocumentContext = createTraceContext<{ accessControlDoc?: ISyncableStoreAccessControlDocument }>(() => ({}));

export const useAccessControlDocument = (trace: Trace) => useTraceContext(trace, AccessControlDocumentContext);

export const accessControlDocumentProvider = <ReturnT>(
  trace: Trace,
  accessControlDoc: ISyncableStoreAccessControlDocument | undefined,
  callback: (trace: Trace) => ReturnT
) => AccessControlDocumentContext.provider(trace, { accessControlDoc }, callback);
