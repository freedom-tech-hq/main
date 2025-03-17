import type { FailureResult, Result, SuccessResult } from 'freedom-async';
import { makeFailure } from 'freedom-async';
import type { Trace } from 'freedom-contexts';

import { InternalStateError } from '../types/InternalStateError.ts';

export function generalizeFailureResult<_SuccessT, ErrorCodeT extends string, ExcludeErrorCodeT extends ErrorCodeT>(
  trace: Trace,
  result: FailureResult<ErrorCodeT>,
  types: ExcludeErrorCodeT | ExcludeErrorCodeT[],
  message?: string
): FailureResult<Exclude<ErrorCodeT, ExcludeErrorCodeT>>;
export function generalizeFailureResult<SuccessT, ErrorCodeT extends string, ExcludeErrorCodeT extends ErrorCodeT>(
  trace: Trace,
  result: SuccessResult<SuccessT>,
  types: ExcludeErrorCodeT | ExcludeErrorCodeT[],
  message?: string
): SuccessResult<SuccessT>;
export function generalizeFailureResult<SuccessT, ErrorCodeT extends string, ExcludeErrorCodeT extends ErrorCodeT>(
  trace: Trace,
  result: Result<SuccessT, ErrorCodeT>,
  types: ExcludeErrorCodeT | ExcludeErrorCodeT[],
  message?: string
): Result<SuccessT, Exclude<ErrorCodeT, ExcludeErrorCodeT>>;
export function generalizeFailureResult<SuccessT, ErrorCodeT extends string, ExcludeErrorCodeT extends ErrorCodeT>(
  trace: Trace,
  result: Result<SuccessT, ErrorCodeT>,
  types: ExcludeErrorCodeT | ExcludeErrorCodeT[],
  message?: string
): Result<SuccessT, Exclude<ErrorCodeT, ExcludeErrorCodeT>> {
  if (result.ok) {
    return result;
  }

  if (
    Array.isArray(types)
      ? (types as string[]).includes(result.value.errorCode ?? 'generic')
      : (types as string) === (result.value.errorCode ?? 'generic')
  ) {
    return makeFailure(new InternalStateError(trace, { message, cause: result.value }));
  } else {
    return result as FailureResult<Exclude<ErrorCodeT, ExcludeErrorCodeT>>;
  }
}
