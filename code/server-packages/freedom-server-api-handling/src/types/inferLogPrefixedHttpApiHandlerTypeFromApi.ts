import { Cast } from 'freedom-cast';
import type { AnyBody, AnyHeaders, AnyParams, AnyQuery, AnyStatus, HttpApi } from 'yaschema-api';

import type { LogPrefixedHttpApiHandler } from './LogPrefixedHttpApiHandler.ts';

/**
 * Returns an `undefined` value that is forcibly typed to the correctly inferred LogPrefixedHttpApiHandler type for the specified api
 *
 * Use like:
 * ```
 * const handlerType = inferLogPrefixedHttpApiHandlerTypeFromApi(POST, {});
 * const handler: typeof handlerType = async (trace, { express, input, output }) => { … }
 * ```
 */
export const inferLogPrefixedHttpApiHandlerTypeFromApi = <
  ReqHeadersT extends AnyHeaders,
  ReqParamsT extends AnyParams,
  ReqQueryT extends AnyQuery,
  ReqBodyT extends AnyBody,
  ResStatusT extends AnyStatus,
  ResHeadersT extends AnyHeaders,
  ResBodyT extends AnyBody,
  ErrResStatusT extends AnyStatus,
  ErrResHeadersT extends AnyHeaders,
  ErrResBodyT extends AnyBody,
  ExtrasT extends Record<string, any> = Record<string, never>
>(
  _api: HttpApi<
    ReqHeadersT,
    ReqParamsT,
    ReqQueryT,
    ReqBodyT,
    ResStatusT,
    ResHeadersT,
    ResBodyT,
    ErrResStatusT,
    ErrResHeadersT,
    ErrResBodyT
  >,
  _extras: ExtrasT
): LogPrefixedHttpApiHandler<
  ReqHeadersT,
  ReqParamsT,
  ReqQueryT,
  ReqBodyT,
  ResStatusT,
  ResHeadersT,
  ResBodyT,
  ErrResStatusT,
  ErrResHeadersT,
  ErrResBodyT,
  ExtrasT
> =>
  Cast<
    LogPrefixedHttpApiHandler<
      ReqHeadersT,
      ReqParamsT,
      ReqQueryT,
      ReqBodyT,
      ResStatusT,
      ResHeadersT,
      ResBodyT,
      ErrResStatusT,
      ErrResHeadersT,
      ErrResBodyT,
      ExtrasT
    >
  >();
