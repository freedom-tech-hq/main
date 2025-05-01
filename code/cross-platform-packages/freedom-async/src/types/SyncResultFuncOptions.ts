import type { ResultFuncOptions } from './ResultFuncOptions.ts';

export type SyncResultFuncOptions<SuccessT, ErrorCodeT extends string = never> = ResultFuncOptions<SuccessT, ErrorCodeT, void>;
