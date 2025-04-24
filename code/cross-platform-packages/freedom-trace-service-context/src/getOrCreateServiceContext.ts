import { makeUuid } from 'freedom-contexts';

import { defaultServiceContext } from './defaultServiceContext.ts';
import type { ServiceContext } from './ServiceContext.ts';

const globalServiceContextMap = new WeakMap<any, ServiceContext>();

/**
 * A service context is essentially a unique identifier that allows one to run multiple services in a single node process, and to
 * differentiate between them.  E.g. one might run two or more web servers, on different ports, in the same node process, and have separate
 * shutdown procedures for each server.  This allows one to do that, and to have a unique identifier for each service.
 *
 * Uses a WeakMap to determine if the provided value has been used or not.  If the provided value is `undefined`, `defaultServiceContext`
 * is returned.  If the exact value has been used before, the previously created service context is returned.  Otherwise, a new service
 * context is created and returned.
 *
 * The value itself isn't represented in the actual service context.
 */
export const getOrCreateServiceContext = (value: any) => {
  if (value === undefined) {
    return defaultServiceContext;
  }

  const found = globalServiceContextMap.get(value);
  if (found !== undefined) {
    return found;
  }

  const newServiceContext: ServiceContext = { id: makeUuid() };
  globalServiceContextMap.set(value, newServiceContext);
  return newServiceContext;
};
