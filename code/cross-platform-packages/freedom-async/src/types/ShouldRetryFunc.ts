import type { FailureResult } from './Result.ts';
import type { ShouldRetryArgs } from './ShouldRetryArgs.ts';

export type ShouldRetryFunc<ErrorCodeT extends string = never> = (
  failure: FailureResult<ErrorCodeT>,
  args: ShouldRetryArgs
) => { retry: boolean; delayMSec?: number };
