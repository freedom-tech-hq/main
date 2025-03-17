import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type DisableErrorsForLoggingAndMetrics = boolean | Function | string | Array<Function | string>;

export interface LoggingAndMetricsControl {
  /** Specify error types or strings for error codes, to disable conditionally.  Example:
   * `[UserAuthenticationError, 'username-already-taken']` */
  disable: DisableErrorsForLoggingAndMetrics;
}

const LoggingAndMetricsControlContext = createTraceContext<LoggingAndMetricsControl>(() => ({
  disable: false
}));

/** Logging and metrics control */
export const useLamControlContext = (trace: Trace) => useTraceContext(trace, LoggingAndMetricsControlContext);

/** Disable logging and metrics for sub-trace */
export const disableLam = <ReturnT>(trace: Trace, disable: DisableErrorsForLoggingAndMetrics, callback: (trace: Trace) => ReturnT) =>
  lamControlContextModifier(trace, { disable }, callback);

export const lamControlContextModifier = <ReturnT>(
  trace: Trace,
  {
    mode = 'merge',
    ...modifications
  }: (LoggingAndMetricsControl & { mode: 'override' }) | (Partial<LoggingAndMetricsControl> & { mode?: 'merge' }),
  callback: (trace: Trace) => ReturnT
) => {
  const parentControls = useLamControlContext(trace);

  switch (mode) {
    case 'override':
      return LoggingAndMetricsControlContext.provider(trace, modifications as LoggingAndMetricsControl, callback);

    case 'merge': {
      const newDisable = modifications.disable ?? [];

      if (typeof newDisable === 'boolean') {
        return LoggingAndMetricsControlContext.provider(trace, { disable: newDisable }, callback);
      } else if (parentControls.disable === true) {
        return LoggingAndMetricsControlContext.provider(trace, { disable: true }, callback);
      } else {
        return LoggingAndMetricsControlContext.provider(
          trace,
          {
            disable: [
              ...(parentControls.disable === false
                ? []
                : Array.isArray(parentControls.disable)
                  ? parentControls.disable
                  : [parentControls.disable]),
              ...(Array.isArray(newDisable) ? newDisable : [newDisable])
            ]
          },
          callback
        );
      }
    }
  }
};

export const shouldDisableErrorForLoggingAndMetrics = <ErrorCodeT extends string = never>(
  disable: DisableErrorsForLoggingAndMetrics,
  {
    error,
    errorCode
  }: {
    error: Error | undefined;
    errorCode: ErrorCodeT | 'generic';
  }
): boolean =>
  disable !== false &&
  (disable === true ||
    (Array.isArray(disable) ? disable : [disable]).find((errorType) =>
      typeof errorType === 'string' ? errorCode === errorType : error instanceof errorType
    ) !== undefined);
