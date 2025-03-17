import { makeUuid } from 'freedom-contexts';

import type { ServiceContext } from './ServiceContext.ts';

export const defaultServiceContext: ServiceContext = { id: makeUuid() };
