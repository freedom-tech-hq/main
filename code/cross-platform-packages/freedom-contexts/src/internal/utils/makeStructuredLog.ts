import type { JsonValue } from 'yaschema';

import { LogJson } from '../../types/LogJson.ts';
import { isTrace } from '../../types/Trace.ts';
import { getTraceStackWithAttachments } from '../../utils/getTraceStackWithAttachments.ts';

type TypeOrDeferredType<T> = T | (() => T);
type SingleOrArrayType<T> = T | T[];

// TODO: unify with WrapLoggingFuncOptions
export interface MakeStructuredLogOptions {
  prefix?: TypeOrDeferredType<SingleOrArrayType<any>>;
  suffix?: TypeOrDeferredType<SingleOrArrayType<any>>;
}

export interface StructuredLogObject {
  time: string;
  message: string;
  traceIds: string[];
  traceStacks: string[][];
  [key: string]: JsonValue;
}

/**
 * Create a structured log object by processing the provided parameters
 * @param options - Prefix and suffix options
 * @param params - Log parameters
 * @returns A structured log object with processed parameters
 */
export const makeStructuredLog = ({ prefix, suffix }: MakeStructuredLogOptions = {}, ...params: any[]): StructuredLogObject => {
  const structuredLogValues: Partial<StructuredLogObject> = {
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

  return structuredLogValues as StructuredLogObject; // Was partial
};
