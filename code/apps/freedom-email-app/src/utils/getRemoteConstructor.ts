import { wrap } from 'comlink';

import type { RemoteConstructor } from '../types/RemoteConstructor.ts';

export const getRemoteConstructor = <T>(scriptPath: string): RemoteConstructor<T> =>
  wrap<T>(new Worker(scriptPath, { type: 'module' })) as any as RemoteConstructor<T>;
