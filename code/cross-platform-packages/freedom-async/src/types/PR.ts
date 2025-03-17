import type { Result } from './Result.ts';

export type PR<SuccessT, ErrorCodeT extends string = never> = Promise<Result<SuccessT, ErrorCodeT>>;
