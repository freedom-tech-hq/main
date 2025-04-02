import type { AccessControlState, InitialAccess } from 'freedom-access-control-types';
import { makeAccessControlStateSchema } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { objectKeys } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { generateSignedValue } from 'freedom-crypto';
import type { CryptoService } from 'freedom-crypto-service';
import type { Schema } from 'yaschema';

import { generateSharedKeys } from './generateSharedKeys.ts';

export const generateInitialAccess = makeAsyncResultFunc(
  [import.meta.filename],
  async <RoleT extends string>(
    trace: Trace,
    {
      cryptoService,
      initialState,
      roleSchema
    }: {
      cryptoService: CryptoService;
      initialState: AccessControlState<RoleT>;
      roleSchema: Schema<RoleT>;
    }
  ): PR<InitialAccess<RoleT>> => {
    const signingKeys = await cryptoService.getSigningKeySet(trace);
    /* node:coverage disable */
    if (!signingKeys.ok) {
      return generalizeFailureResult(trace, signingKeys, 'not-found');
    }
    /* node:coverage enable */

    const signedState = await generateSignedValue(trace, {
      value: initialState,
      valueSchema: makeAccessControlStateSchema({ roleSchema }),
      signatureExtras: undefined,
      signatureExtrasSchema: undefined,
      signingKeys: signingKeys.value
    });
    /* node:coverage disable */
    if (!signedState.ok) {
      return signedState;
    }
    /* node:coverage enable */

    const initialSharedKeys = await generateSharedKeys(trace, { cryptoService, cryptoKeySetIds: objectKeys(initialState) });
    /* node:coverage disable */
    if (!initialSharedKeys.ok) {
      return initialSharedKeys;
    }
    /* node:coverage enable */

    return makeSuccess({ state: signedState.value, sharedKeys: [initialSharedKeys.value] });
  }
);
