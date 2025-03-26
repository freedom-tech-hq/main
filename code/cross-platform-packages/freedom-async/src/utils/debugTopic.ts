import { getEnv } from 'freedom-contexts';
import type { LoggingFunc } from 'freedom-logging-types';
import isPromise from 'is-promise';
import type { TypeOrPromisedType } from 'yaschema';

import { log } from '../config/logging.ts';
import { inline } from './inline.ts';

let shouldDebugTopic: (topic: string) => boolean = () => false;

export let debugTopic: <R extends TypeOrPromisedType<any>>(
  topic: string,
  callback: (log: LoggingFunc) => R
) => void | (R extends Promise<any> ? Promise<void> : void) = () => {};

DEV: {
  shouldDebugTopic = inline(() => {
    const topicsString = getEnv('FREEDOM_DEBUG_TOPICS', process.env.FREEDOM_DEBUG_TOPICS)?.trim() ?? '';

    if (topicsString.length === 0) {
      return () => false;
    } else if (topicsString === 'all') {
      return () => true;
    }

    const topics = new Set(topicsString.split(/[,\n]/).map((value) => value.trim()));
    return (topic: string) => topics.has(topic);
  });

  debugTopic = <R extends TypeOrPromisedType<any>>(
    topic: string,
    callback: (log: LoggingFunc) => R
  ): void | (R extends Promise<any> ? Promise<void> : void) => {
    if (!shouldDebugTopic(topic)) {
      return;
    }

    const logFunc = log().debug;
    if (logFunc === undefined) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = callback((...args: any[]) => logFunc(`[${topic}]`, ...args));
    if (isPromise(result)) {
      return inline(async () => {
        await result;
      }) as R extends Promise<any> ? Promise<void> : void;
    }
  };
}
