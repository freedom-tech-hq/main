/* node:coverage disable */

import type { TraceableError } from './TraceableError.ts';

export interface SuccessResult<SuccessT> {
  ok: true;
  value: SuccessT;
}

export interface FailureResult<ErrorCodeT extends string = never> {
  ok: false;
  value: TraceableError<ErrorCodeT>;
}

export const excludeFailureResult = <ErrorCodeT extends string, ExcludeErrorCodeT extends ErrorCodeT>(
  result: FailureResult<ErrorCodeT>,
  ..._types: ExcludeErrorCodeT[]
): FailureResult<Exclude<ErrorCodeT, ExcludeErrorCodeT>> => result as FailureResult<Exclude<ErrorCodeT, ExcludeErrorCodeT>>;

export type InferResultSuccessT<R> = R extends SuccessResult<infer SuccessT> ? SuccessT : never;
export type InferResultErrorCodeT<R> = R extends FailureResult<infer ErrorCodeT extends string> ? ErrorCodeT : never;

export type Result<SuccessT, ErrorCodeT extends string = never> = SuccessResult<SuccessT> | FailureResult<ErrorCodeT>;

export const makeSuccess = <SuccessT>(value: SuccessT): { ok: true; value: SuccessT } => ({ ok: true, value });
export const makeSuccessIfDefined = <SuccessT>(value: SuccessT | undefined) => (value !== undefined ? makeSuccess(value) : undefined);

export const makeFailure = <ErrorCodeT extends string = never>(
  value: TraceableError<ErrorCodeT>
): { ok: false; value: TraceableError<ErrorCodeT> } => ({ ok: false, value });

export const castSuccess = <SuccessT>(result: Result<SuccessT, any>): SuccessResult<SuccessT> => result as SuccessResult<SuccessT>;
export const castFailure = <ErrorCodeT extends string = never>(result: Result<any, ErrorCodeT>): FailureResult<ErrorCodeT> =>
  result as FailureResult<ErrorCodeT>;
