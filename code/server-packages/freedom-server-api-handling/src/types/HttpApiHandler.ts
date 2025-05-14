import type { HttpApiHandlerArgs } from 'express-yaschema-api-handler';
import type { Trace } from 'freedom-contexts';
import type { AnyBody, AnyHeaders, AnyParams, AnyQuery, AnyStatus } from 'yaschema-api';

import type { HttpApiHandlerResult } from './HttpApiHandlerResult.ts';

export type HttpApiHandler<
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
) => Promise<HttpApiHandlerResult<ResStatusT, ResHeadersT, ResBodyT, ErrResBodyT>>;
