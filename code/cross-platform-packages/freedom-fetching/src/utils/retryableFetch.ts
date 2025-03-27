import type { PR, ShouldRetryFunc } from 'freedom-async';
import { callAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { extractErrorInfo } from 'freedom-basic-data';
import { HttpError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';

export const retryableFetch = (
  trace: Trace,
  input: string | URL | Request,
  { shouldRetry, ...init }: RequestInit & { shouldRetry?: ShouldRetryFunc } = {}
) =>
  callAsyncResultFunc(trace, { shouldRetry }, async (trace): PR<Response> => {
    const res = await fetch(input, init);
    if (!res.ok) {
      const { message = '-no message-' } = extractErrorInfo(res.body);
      return makeFailure(
        new HttpError(trace, { status: res.status, message: `Request to ${init.method ?? 'GET'} ${res.url} failed: ${message ?? ''}` })
      );
    }

    return makeSuccess(res);
  });
