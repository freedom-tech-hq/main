import type { FailureResult, SuccessResult } from 'freedom-async';
import type { AnyBody, AnyHeaders, AnyStatus, OptionalIfPossiblyUndefined } from 'yaschema-api';

import type { InferErrorCodeFromErrResBody } from './InferErrorCodeFromErrResBody.ts';

export type HttpApiHandlerResult<
  ResStatusT extends AnyStatus,
  ResHeadersT extends AnyHeaders,
  ResBodyT extends AnyBody,
  ErrResBodyT extends AnyBody
> =
  | void
  | SuccessResult<
      { status?: ResStatusT } & OptionalIfPossiblyUndefined<'headers', ResHeadersT> & OptionalIfPossiblyUndefined<'body', ResBodyT>
    >
  | FailureResult<InferErrorCodeFromErrResBody<ErrResBodyT>>;
