import type { AccessChange, TimedAccessChange } from 'freedom-access-control-types';
import { makeTimedAccessChangeSchema } from 'freedom-access-control-types';
import type { ModifyAccessChange, ModifyAccessChangeParams } from 'freedom-access-control-types/lib/types/ModifyAccessChange.ts';
import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SignedValue, TrustedTimeId } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import type { Schema } from 'yaschema';

export const generateSignedModifyAccessChange = makeAsyncResultFunc(
  [import.meta.filename],
  async <RoleT extends string>(
    trace: Trace,
    {
      generateTrustedTimeIdForAccessChange,
      cryptoService,
      params,
      roleSchema
    }: {
      generateTrustedTimeIdForAccessChange: PRFunc<TrustedTimeId, never, [AccessChange<RoleT>]>;
      cryptoService: CryptoService;
      params: Omit<ModifyAccessChangeParams<RoleT>, 'type'>;
      roleSchema: Schema<RoleT>;
    }
  ): PR<SignedValue<TimedAccessChange<RoleT>>> => {
    const modifyAccessChange: ModifyAccessChange<RoleT> = { ...params, type: 'modify-access' };

    const trustedTimeId = await generateTrustedTimeIdForAccessChange(trace, modifyAccessChange);
    /* node:coverage disable */
    if (!trustedTimeId.ok) {
      return trustedTimeId;
    }
    /* node:coverage enable */

    return cryptoService.generateSignedValue<TimedAccessChange<RoleT>>(trace, {
      value: { ...modifyAccessChange, trustedTimeId: trustedTimeId.value },
      valueSchema: makeTimedAccessChangeSchema({ roleSchema }),
      signatureExtras: undefined,
      signatureExtrasSchema: undefined
    });
  }
);
