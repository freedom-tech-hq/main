import type { AnyBody } from 'yaschema-api';

export type InferErrorCodeFromErrResBody<ErrResBodyT extends AnyBody> = ErrResBodyT extends { errorCode?: infer ErrorCodeT }
  ? ErrorCodeT extends string
    ? ErrorCodeT
    : never
  : never;
