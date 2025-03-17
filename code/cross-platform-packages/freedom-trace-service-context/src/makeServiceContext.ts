import { makeUuid } from 'freedom-contexts';

import { defaultServiceContext } from './defaultServiceContext.ts';
import type { ServiceContext } from './ServiceContext.ts';

const globalServiceContextMap = new WeakMap<any, ServiceContext>();

export const makeServiceContext = (value: any) => {
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
