import type { PR } from 'freedom-async';
import { makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';

import { generalizeFailureResult } from './generalizeFailureResult.ts';

export const autoGeneralizeFailureResults = async <SuccessT, ErrorCodeT extends string, ExcludeErrorCodeT extends ErrorCodeT>(
  trace: Trace,
  ignoreErrorCodes: ExcludeErrorCodeT | ExcludeErrorCodeT[],
  result: PR<SuccessT, ErrorCodeT>
): PR<SuccessT, Exclude<ErrorCodeT, ExcludeErrorCodeT>> => {
  const awaited = await result;
  if (!awaited.ok) {
    return generalizeFailureResult(trace, awaited, ignoreErrorCodes);
  }

  return makeSuccess(awaited.value);
};
