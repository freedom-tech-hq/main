import type { TypeOrPromisedType } from 'yaschema';

import type { FuncOptions } from './FuncOptions.ts';
import type { Result } from './Result.ts';
import type { TraceableError } from './TraceableError.ts';

export interface ResultFuncOptions<SuccessT, ErrorCodeT extends string, SpecialCallbackReturnT extends TypeOrPromisedType<void> | void>
  extends FuncOptions<Result<SuccessT, ErrorCodeT>, SpecialCallbackReturnT> {
  /** Called if the function results in failure or if an error is thrown, which is converted into a `GeneralError` */
  onFailure?: (result: TraceableError<ErrorCodeT>) => SpecialCallbackReturnT;
  /** Called if the function results in success */
  onSuccess?: (result: SuccessT) => SpecialCallbackReturnT;
}
