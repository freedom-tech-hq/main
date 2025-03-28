import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { base64String } from 'freedom-basic-data';
import { generateHashFromString, getCoordinatedHashSalt } from 'freedom-crypto';
import type { SyncablePath } from 'freedom-sync-types';

// TODO: this isn't very secure because if you can guess paths, you can spy that changes are being made -- though you wont know what those
// are.  There should be a real rotating secret involved that only people with token level read access can get
export const generateStreamIdForPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { path }: { path: SyncablePath }): PR<Base64String> => {
    const streamIdBuffer = await generateHashFromString(trace, {
      value: JSON.stringify({ salt: getCoordinatedHashSalt(), path: [path.storageRootId, ...path.ids] })
    });
    if (!streamIdBuffer.ok) {
      return streamIdBuffer;
    }

    return makeSuccess(base64String.makeWithBuffer(streamIdBuffer.value));
  }
);
