import type { Trace } from 'freedom-contexts';

import type { Result } from './Result.ts';

export type RFunc<SuccessT, ErrorCodeT extends string = never, ArgsT extends any[] = []> = (
  trace: Trace,
  ...args: ArgsT
) => Result<SuccessT, ErrorCodeT>;
