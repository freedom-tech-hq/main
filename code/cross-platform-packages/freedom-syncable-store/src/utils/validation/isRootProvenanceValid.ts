import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { isSignedValueValid } from 'freedom-crypto';
import type { SyncableStore } from 'freedom-syncable-store-types';

/** For roots, only the signature on the metadata is verified against the expected creator's key */
export const isRootProvenanceValid = makeAsyncResultFunc([import.meta.filename], async (trace, store: SyncableStore): PR<boolean> => {
  if (store.localTrustMarks.isTrusted(store.path, 'provenance')) {
    return makeSuccess(true);
  }

  const metadata = await store.getMetadata(trace);
  if (!metadata.ok) {
    return metadata;
  }

  const isValid = await isSignedValueValid(
    trace,
    metadata.value.provenance.origin,
    { name: metadata.value.name, path: store.path, type: 'folder' },
    { verifyingKeys: store.creatorPublicKeys }
  );
  if (!isValid.ok) {
    return isValid;
  } else if (!isValid.value) {
    return makeSuccess(false);
  }

  store.localTrustMarks.markTrusted(store.path, 'provenance');
  return makeSuccess(true);
});
