import type { AccessControlState, InitialAccess } from 'freedom-access-control-types';
import { makeAccessControlStateSchema } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { objectKeys } from 'freedom-cast';
import type { Trace } from 'freedom-contexts';
import type { CryptoService } from 'freedom-crypto-service';
import type { Schema } from 'yaschema';

import { generateSharedSecret } from './generateSharedSecret.ts';

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
    const signedState = await cryptoService.generateSignedValue<AccessControlState<RoleT>>(trace, {
      value: initialState,
      valueSchema: makeAccessControlStateSchema({ roleSchema }),
      signatureExtras: undefined,
      signatureExtrasSchema: undefined
    });
    /* node:coverage disable */
    if (!signedState.ok) {
      return signedState;
    }
    /* node:coverage enable */

    const initialSharedSecret = await generateSharedSecret(trace, { cryptoService, cryptoKeySetIds: objectKeys(initialState) });
    /* node:coverage disable */
    if (!initialSharedSecret.ok) {
      return initialSharedSecret;
    }
    /* node:coverage enable */

    return makeSuccess({ state: signedState.value, sharedSecrets: [initialSharedSecret.value] });
  }
);
