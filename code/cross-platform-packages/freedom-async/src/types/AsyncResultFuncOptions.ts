import type { TypeOrPromisedType } from 'yaschema';

import type { ResultFuncOptions } from './ResultFuncOptions.ts';
import type { ShouldRetryFunc } from './ShouldRetryFunc.ts';

export interface AsyncResultFuncOptions<SuccessT, ErrorCodeT extends string = never>
  extends ResultFuncOptions<SuccessT, ErrorCodeT, TypeOrPromisedType<void>> {
  shouldRetry?: ShouldRetryFunc<ErrorCodeT>;
}
