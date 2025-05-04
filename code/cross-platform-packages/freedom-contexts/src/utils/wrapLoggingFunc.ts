import { defaultLoggingMode } from '../consts/logging.ts';
import { makeStructuredLog } from '../internal/utils/makeStructuredLog.ts';
import type { LoggingFunc } from '../types/LoggingFunc.ts';
import type { LoggingMode } from '../types/LoggingMode.ts';
import { LogJson } from '../types/LogJson.ts';
import { isTrace } from '../types/Trace.ts';
import { getTraceStack } from './getTraceStack.ts';

type TypeOrDeferredType<T> = T | (() => T);
type SingleOrArrayType<T> = T | T[];

export interface WrapLoggingFuncOptions {
  prefix?: TypeOrDeferredType<SingleOrArrayType<any>>;
  suffix?: TypeOrDeferredType<SingleOrArrayType<any>>;
  /** @defaultValue `defaultLoggingMode` */
  mode?: LoggingMode;
}

/** Supports adding prefixes and/or suffixes to each log and logs traces nicely */
export function wrapLoggingFunc(loggingFunc: LoggingFunc, options?: WrapLoggingFuncOptions): LoggingFunc;
export function wrapLoggingFunc(loggingFunc: undefined, options?: WrapLoggingFuncOptions): undefined;
export function wrapLoggingFunc(loggingFunc: LoggingFunc | undefined, options?: WrapLoggingFuncOptions): LoggingFunc | undefined;
export function wrapLoggingFunc(
  loggingFunc: LoggingFunc | undefined,
  { prefix, suffix, mode = defaultLoggingMode }: WrapLoggingFuncOptions = {}
): LoggingFunc | undefined {
  if (loggingFunc === undefined) {
    return undefined;
  }

  switch (mode) {
    case 'none':
      return undefined;
    case 'flat':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return makeFlatLoggingFunc(loggingFunc, { prefix, suffix });
    case 'structured':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return makeStructuredLoggingFunc(loggingFunc, { prefix, suffix });
    case 'pretty-print':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return makePrettyPrintLoggingFunc(loggingFunc, { prefix, suffix });
  }
}

// Helpers

const makeFlatLoggingFunc =
  (loggingFunc: LoggingFunc, { prefix, suffix }: Pick<WrapLoggingFuncOptions, 'prefix' | 'suffix'>): LoggingFunc =>
  (...params: any[]) => {
    const messageParts: any[] = [new Date().toISOString()];

    const traceStacks: string[][] = [];

    const addArgs = (param: any) => {
      if (param === undefined) {
        return;
      } else if (param instanceof LogJson) {
        messageParts.push(`${param.name}=${JSON.stringify(param.value)}`);
      } else if (param instanceof Error) {
        messageParts.push(param.toString());
      } else if (isTrace(param)) {
        // Attachments aren't included in flat mode
        traceStacks.push(getTraceStack(param));
      } else if (Array.isArray(param)) {
        if (param.length > 0) {
          for (const subparam of param) {
            addArgs(subparam);
          }
          messageParts.push(':');
        }
      } else if (typeof param === 'string') {
        messageParts.push(param.replace(/[\r\n]/g, '    '));
      } else {
        try {
          messageParts.push(JSON.stringify(param).replace(/[\r\n]/g, '    '));
        } catch (_e) {
          messageParts.push(String(param).replace(/[\r\n]/g, '    '));
        }
      }
    };

    if (prefix !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const thePrefix = typeof prefix === 'function' ? prefix() : prefix;
      if (thePrefix !== undefined) {
        if (Array.isArray(thePrefix)) {
          for (const param of thePrefix) {
            addArgs(param);
          }
        } else {
          addArgs(thePrefix);
        }
      }
    }

    for (const param of params) {
      addArgs(param);
    }

    if (suffix !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const theSuffix = typeof suffix === 'function' ? suffix() : suffix;
      if (theSuffix !== undefined) {
        if (Array.isArray(theSuffix)) {
          for (const param of theSuffix) {
            addArgs(param);
          }
        } else {
          addArgs(theSuffix);
        }
      }
    }

    loggingFunc(messageParts.join(' '), 'trace:', traceStacks.map((stack) => JSON.stringify(stack)).join(';'));
  };

const makeStructuredLoggingFunc =
  (loggingFunc: LoggingFunc, options: Pick<WrapLoggingFuncOptions, 'prefix' | 'suffix'>): LoggingFunc =>
  (...params: any[]) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- TODO: disable this rule globally - the types match
    const logObject = makeStructuredLog(options, ...params);
    loggingFunc(JSON.stringify(logObject));
  };

const makePrettyPrintLoggingFunc =
  (loggingFunc: LoggingFunc, options: Pick<WrapLoggingFuncOptions, 'prefix' | 'suffix'>): LoggingFunc =>
  (...params: any[]) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- TODO: disable this rule globally - the types match
    const logObject = makeStructuredLog(options, ...params);

    // Extract main components
    const { time, severity, message: msgContent, traceIds, traceStacks, ...rest } = logObject;

    // Format the date to be more readable
    const prettyTime = time.replace('T', ' ').replace('Z', '');

    // Paint severity
    let paintedSeverity;
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- TODO: check for rule updates, it seems broken
    switch (severity) {
      case 'ERROR':
        paintedSeverity = '\x1b[31mERROR\x1b[0m'; // Red
        break;
      case 'WARNING':
        paintedSeverity = '\x1b[33mWARNING\x1b[0m'; // Yellow
        break;
      case 'INFO':
      case undefined: // <-- this is log().log?.(...)
        paintedSeverity = '\x1b[34mINFO\x1b[0m'; // Blue
        break;
      case 'DEBUG':
        paintedSeverity = '\x1b[90mDEBUG\x1b[0m'; // Gray
        break;
      default:
        // It is not structured, so stringifying the unexpected values
        paintedSeverity = JSON.stringify(severity);
        break;
    }

    const paleLines = [];

    // Join traceIds
    if (traceIds.length > 0) {
      paleLines.push(`  traceIds: ${traceIds.join(', ')}`);
    }

    // Hide traceStacks if empty. Format each otherwise. Triangle is bright enough to be noticeable taking one space
    for (let i = 0; i < traceStacks.length; i++) {
      paleLines.push(`  traceStacks ${i}: ${traceStacks[i].join('▶︎')}`);
    }

    // Format the rest
    Object.entries(rest).forEach(([key, value]) => {
      paleLines.push(`  ${key}: ${formatPrettyPrintValue(value)}`);
    });

    loggingFunc(
      // Form the main bright line and wrap the pale lines with 'faint' color
      `${prettyTime} - ${paintedSeverity} - ${msgContent || '<No message>'}${
        paleLines.length > 0 ? `\n\x1b[2m${paleLines.join('\n')}\x1b[0m` : ''
      }`
    );
  };

const formatPrettyPrintValue = (value: any): string => {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  } else if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
};
