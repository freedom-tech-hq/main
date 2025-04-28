import type { GenericWsApiRequestHandler, WsApiHandlerWrapper } from 'express-yaschema-ws-api-handler';
import {
  setOnCommandRequestValidationErrorHandler,
  setOnCommandResponseValidationErrorHandler,
  setOnRequestValidationErrorHandler,
  setWsApiHandlerWrapper
} from 'express-yaschema-ws-api-handler';
import { makeAsyncFunc } from 'freedom-async';
import { log } from 'freedom-contexts';
import { once } from 'lodash-es';

export const init = once(
  makeAsyncFunc([import.meta.filename], async (trace) => {
    const wsApiHandlerWrapper: WsApiHandlerWrapper =
      (handler: GenericWsApiRequestHandler): GenericWsApiRequestHandler =>
      async (fwd) => {
        try {
          return await handler(fwd);
        } catch (e) {
          log().error?.(trace, 'WS Internal server error:', e);
        }
      };
    setWsApiHandlerWrapper(wsApiHandlerWrapper);

    setOnRequestValidationErrorHandler(({ api, invalidPart, validationError }) => {
      log().debug?.(trace, `HTTP request validation error for ${api.url}: ${invalidPart} - ${validationError}`);
    });

    setOnCommandRequestValidationErrorHandler(({ api, command, invalidPart, validationError }) => {
      log().debug?.(
        trace,
        `WS request validation error for ${api.url}, command = ${JSON.stringify(command)}: ${invalidPart} - ${validationError}`
      );
    });

    setOnCommandResponseValidationErrorHandler(({ api, command, invalidPart, validationError }) => {
      log().warn?.(
        trace,
        `WS response validation error for ${api.url}, command = ${JSON.stringify(command)}: ${invalidPart} - ${validationError}`
      );
    });
  })
);
