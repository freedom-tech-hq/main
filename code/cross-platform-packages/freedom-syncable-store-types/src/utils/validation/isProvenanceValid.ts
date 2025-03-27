import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';

import type { SyncableItemAccessor } from '../../types/SyncableItemAccessor.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { isAcceptanceValid } from './internal/isAcceptanceValid.ts';
import { isOriginValid } from './internal/isOriginValid.ts';

export const isProvenanceValid = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, item: SyncableItemAccessor): PR<boolean> => {
    if (store.localTrustMarks.isTrusted(item.path, 'provenance')) {
      return makeSuccess(true);
    }

    const metadata = await item.getMetadata(trace);
    if (!metadata.ok) {
      return metadata;
    }

    const provenance = metadata.value.provenance;

    // If the acceptance is set, that's all we'll consider
    if (provenance.acceptance !== undefined) {
      const acceptanceValid = await isAcceptanceValid(trace, store, item, { acceptance: provenance.acceptance });
      if (!acceptanceValid.ok) {
        return acceptanceValid;
      } else if (!acceptanceValid.value) {
        return makeSuccess(false);
      }

      store.localTrustMarks.markTrusted(item.path, 'provenance');
      return makeSuccess(true);
    }

    const originValid = await isOriginValid(trace, store, item, { origin: provenance.origin });
    if (!originValid.ok) {
      return originValid;
    } else if (!originValid.value) {
      return makeSuccess(false);
    }

    store.localTrustMarks.markTrusted(item.path, 'provenance');
    return makeSuccess(true);
  }
);
