import type { PR } from './PR.ts';

export type ChainableResult<SuccessT, ErrorCodeT extends string = never> = SuccessT | PR<SuccessT, ErrorCodeT>;
