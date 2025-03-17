import type { HttpApiHandlerArgs } from 'express-yaschema-api-handler';
import type { FailureResult, SuccessResult } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { AnyBody, AnyHeaders, AnyParams, AnyQuery, AnyStatus, OptionalIfPossiblyUndefined } from 'yaschema-api';

import type { InferErrorCodeFromErrResBody } from './InferErrorCodeFromErrResBody.ts';

export type LogPrefixedHttpApiHandler<
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
  ExtraArgsT extends Record<string, any> = Record<string, never>
> = (
  trace: Trace,
  args: HttpApiHandlerArgs<
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
    ExtraArgsT
  >
) => Promise<
  | void
  | SuccessResult<
      { status?: ResStatusT } & OptionalIfPossiblyUndefined<'headers', ResHeadersT> & OptionalIfPossiblyUndefined<'body', ResBodyT>
    >
  | FailureResult<InferErrorCodeFromErrResBody<ErrResBodyT>>
>;
