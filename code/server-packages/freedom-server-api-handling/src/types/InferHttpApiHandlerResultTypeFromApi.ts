import type { HttpApi } from 'yaschema-api';

import type { HttpApiHandlerResult } from './HttpApiHandlerResult.ts';

export type InferHttpApiHandlerResultTypeFromApi<T> =
  T extends HttpApi<
    infer _ReqHeadersT,
    infer _ReqParamsT,
    infer _ReqQueryT,
    infer _ReqBodyT,
    infer ResStatusT,
    infer ResHeadersT,
    infer ResBodyT,
    infer _ErrResStatusT,
    infer _ErrResHeadersT,
    infer ErrResBodyT
  >
    ? HttpApiHandlerResult<ResStatusT, ResHeadersT, ResBodyT, ErrResBodyT>
    : never;
