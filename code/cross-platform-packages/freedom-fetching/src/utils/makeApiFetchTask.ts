import type { Result } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { InferErrorCode } from 'freedom-basic-data';
import { extractErrorInfo } from 'freedom-basic-data';
import { HttpError } from 'freedom-common-errors';
import type { AnyBody, AnyHeaders, AnyParams, AnyQuery, AnyStatus, ApiRequest, ApiRoutingContext, HttpApi } from 'yaschema-api';
import { apiFetch } from 'yaschema-api-fetcher';

export const makeApiFetchTask = <
  ReqHeadersT extends AnyHeaders,
  ReqParamsT extends AnyParams,
  ReqQueryT extends AnyQuery,
  ReqBodyT extends AnyBody,
  ResStatusT extends AnyStatus,
  ResHeadersT extends AnyHeaders,
  ResBodyT extends AnyBody,
  ErrResStatusT extends AnyStatus,
  ErrResHeadersT extends AnyHeaders,
  ErrResBodyT extends AnyBody
>(
  idStack: string[],
  api: HttpApi<ReqHeadersT, ReqParamsT, ReqQueryT, ReqBodyT, ResStatusT, ResHeadersT, ResBodyT, ErrResStatusT, ErrResHeadersT, ErrResBodyT>
) =>
  makeAsyncResultFunc(
    idStack,
    async (
      trace,
      { context, ...req }: ApiRequest<ReqHeadersT, ReqParamsT, ReqQueryT, ReqBodyT> & { context: ApiRoutingContext }
    ): Promise<
      Result<{ status: ResStatusT; headers: ResHeadersT; body: ResBodyT }, Exclude<NonNullable<InferErrorCode<ErrResBodyT>>, 'generic'>>
    > => {
      const response = await apiFetch(api, req as ApiRequest<ReqHeadersT, ReqParamsT, ReqQueryT, ReqBodyT>, { context });
      if (!response.ok) {
        const { errorCode, message = response.error ?? '-no message-' } = extractErrorInfo(response.body);
        return makeFailure(
          new HttpError(trace, {
            status: response.status,
            errorCode: errorCode as Exclude<NonNullable<InferErrorCode<ErrResBodyT>>, 'generic'>,
            message:
              response.fetchRes !== undefined ? `Request to ${api.method} ${response.fetchRes.url} failed: ${message ?? ''}` : message
          })
        );
      }

      return makeSuccess({ status: response.status, headers: response.headers!, body: response.body! });
    }
  );
