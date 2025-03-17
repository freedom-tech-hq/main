import type { Trace } from 'freedom-contexts';

import type { PR } from './PR.ts';

export type PRFunc<SuccessT, ErrorCodeT extends string = never, ArgsT extends any[] = []> = (
  trace: Trace,
  ...args: ArgsT
) => PR<SuccessT, ErrorCodeT>;
