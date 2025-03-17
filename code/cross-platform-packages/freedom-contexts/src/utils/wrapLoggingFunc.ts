import type { LoggingFunc, LoggingMode } from 'freedom-logging-types';
import { defaultLoggingMode, LogJson } from 'freedom-logging-types';
import type { JsonValue } from 'yaschema';

import { isTrace } from '../types/Trace.ts';
import { getTraceStack } from './getTraceStack.ts';
import { getTraceStackWithAttachments } from './getTraceStackWithAttachments.ts';

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

    loggingFunc(messageParts.join(' '), 'trace:', traceStacks.map((stack) => stack.join('>')).join(';'));
  };

const makeStructuredLoggingFunc =
  (loggingFunc: LoggingFunc, { prefix, suffix }: Pick<WrapLoggingFuncOptions, 'prefix' | 'suffix'>): LoggingFunc =>
  (...params: any[]) => {
    const structuredLogValues: Record<string, JsonValue> = {
      time: new Date().toISOString()
    };

    const messageParts: any[] = [];

    const traceIds = new Set<string>();
    const traceStacks: string[][] = [];

    const addArgs = (param: any) => {
      if (param === undefined) {
        return;
      } else if (param instanceof LogJson) {
        structuredLogValues[param.name] = param.value;
      } else if (param instanceof Error) {
        messageParts.push(param.toString());
      } else if (isTrace(param)) {
        traceIds.add(param.traceId);
        traceStacks.push(getTraceStackWithAttachments(param));
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

    structuredLogValues.message = messageParts.join(' ');
    structuredLogValues.traceIds = Array.from(traceIds);
    structuredLogValues.traceStacks = traceStacks;

    loggingFunc(JSON.stringify(structuredLogValues));
  };
