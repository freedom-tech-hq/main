import type { Express, Response } from 'express';
import type { HttpApiHandlerOptions, YaschemaApiExpressContextAccessor } from 'express-yaschema-api-handler';
import { registerHttpApiHandler } from 'express-yaschema-api-handler';
import type { FuncOptions } from 'freedom-async';
import { callAsyncFunc, log } from 'freedom-async';
import { Cast } from 'freedom-cast';
import { attachToTrace, makeTrace } from 'freedom-contexts';
import { LogJson } from 'freedom-logging-types';
import { authTokenContextProvider } from 'freedom-server-trace-auth-token';
import { makeServiceContext, traceServiceContextProvider } from 'freedom-trace-service-context';
import { StatusCodes } from 'http-status-codes';
import type { AnyBody, AnyHeaders, AnyParams, AnyQuery, AnyStatus, HttpApi, OptionalIfPossiblyUndefined } from 'yaschema-api';

import { authProvider } from '../config/auth.ts';
import { metricsCollector } from '../config/metrics.ts';
import { isAcceptedRouteType } from '../config/route-types.ts';
import type { GenericallyFailableHttpOutput } from '../internal/types/GenericallyFailableHttpOutput.ts';
import { httpError } from '../internal/utils/http-error.ts';
import type { LogPrefixedHttpApiHandler } from '../types/LogPrefixedHttpApiHandler.ts';

export const makeHttpApiHandler =
  <
    ReqHeadersT extends AnyHeaders,
    ReqParamsT extends AnyParams,
    ReqQueryT extends AnyQuery,
    ReqBodyT extends AnyBody,
    ResStatusT extends AnyStatus,
    ResHeadersT extends AnyHeaders,
    ResBodyT extends AnyBody,
    ErrResStatusT extends AnyStatus,
    ErrResHeadersT extends AnyHeaders,
    ErrResBodyT extends AnyBody,
    ExtrasT extends Record<string, any> = Record<string, never>
  >(
    idStack: string[],
    {
      api,
      disableLam,
      ...handlerOptions
    }: HttpApiHandlerOptions &
      Pick<FuncOptions<any>, 'disableLam'> & {
        api: HttpApi<
          ReqHeadersT,
          ReqParamsT,
          ReqQueryT,
          ReqBodyT,
          ResStatusT,
          ResHeadersT,
          ResBodyT,
          ErrResStatusT,
          ErrResHeadersT,
          ErrResBodyT
        >;
      },
    handler: LogPrefixedHttpApiHandler<
      ReqHeadersT,
      ReqParamsT,
      ReqQueryT,
      ReqBodyT,
      ResStatusT,
      ResHeadersT,
      ResBodyT,
      ErrResStatusT,
      ErrResHeadersT,
      ErrResBodyT,
      ExtrasT
    >
  ) =>
  (app: Express & YaschemaApiExpressContextAccessor) => {
    /* node:coverage disable */
    if (!isAcceptedRouteType(api.routeType)) {
      return;
    }
    /* node:coverage enable */

    const options: FuncOptions<void | Response<any, Record<string, any>>> = { disableLam };

    return registerHttpApiHandler<
      ReqHeadersT,
      ReqParamsT,
      ReqQueryT,
      ReqBodyT,
      ResStatusT,
      ResHeadersT,
      ResBodyT,
      ErrResStatusT,
      ErrResHeadersT,
      ErrResBodyT
    >(app, api, handlerOptions, async ({ express, input, output, extras }) => {
      const start = performance.now();
      const resolveDurationTracking = metricsCollector()?.trackDuration({ id: `server:api:${api.name}` });

      const trace = makeTrace(...idStack);
      await traceServiceContextProvider(trace, makeServiceContext(app.getYaschemaApiExpressContext?.()), (trace) =>
        callAsyncFunc(trace, options, async (trace) => {
          express.res.setHeader('X-Trace-Id', trace.traceId);

          const genericOutput = Cast<GenericallyFailableHttpOutput>(output);

          let ok = true;
          try {
            const selectedAuthToken =
              (api.credentials ?? 'omit') !== 'omit' ? await authProvider()?.getHttpAuthToken?.(trace, express) : undefined;
            /* node:coverage disable */
            if (selectedAuthToken !== undefined && !selectedAuthToken.ok) {
              ok = false;
              express.res.setHeader('Cache-Control', 'no-store');
              return httpError(trace, genericOutput, selectedAuthToken.value);
            }
            /* node:coverage enable */

            const authToken = selectedAuthToken?.value;

            await authTokenContextProvider(trace, authToken, async (trace) => {
              /* node:coverage disable */
              const debugUserInfo = () => {
                if (authToken === undefined) {
                  return 'anonymous';
                } else if (!authToken.details.isVerified) {
                  return 'unverified';
                } else {
                  return 'verified';
                }
              };
              /* node:coverage enable */
              log().debug?.(trace, `Handling request for api=${JSON.stringify(api.name)}, user=${debugUserInfo()} `);

              /* node:coverage disable */
              if (authToken !== undefined) {
                attachToTrace(trace, { isAuthVerified: authToken.details.isVerified });
              }
              /* node:coverage enable */

              const handlerResult = await handler(trace, { express, input, output, extras: extras as ExtrasT });
              /* node:coverage disable */
              if (handlerResult === undefined) {
                return; // Result must have been returned using output
              }
              /* node:coverage enable */

              if (handlerResult.ok) {
                const { status, ...value } = handlerResult.value;
                output.success(
                  (status ?? StatusCodes.OK) as ResStatusT,
                  value as OptionalIfPossiblyUndefined<'headers', ResHeadersT> & OptionalIfPossiblyUndefined<'body', ResBodyT>
                );
              } else {
                ok = false;
                httpError(trace, genericOutput, handlerResult.value);
              }
            });
          } catch (e) {
            ok = false;
            log().error?.(trace, 'HTTP Internal Server Error:', e);
            metricsCollector()?.trackPostCaptureDuration({
              id: 'server:http:internal-server-error',
              timeMSec: Date.now(),
              durationMSec: 0,
              ok: false
            });
            return express.res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Internal server error');
          } finally {
            resolveDurationTracking?.({ ok });
            const stop = performance.now();
            log().debug?.(
              trace,
              `Handler for ${express.req.path} ended with status: ${express.res.statusCode}`,
              new LogJson('durationMSec', stop - start)
            );
          }
        })
      );
    });
  };
