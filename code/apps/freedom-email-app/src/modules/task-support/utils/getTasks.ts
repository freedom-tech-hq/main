import { once } from 'lodash-es';

import type { Tasks } from '../../../tasks.ts';
import { getRemoteConstructor } from '../../../utils/getRemoteConstructor.ts';

export const getTasks = once(async (): Promise<Tasks> => {
  const Tasks = getRemoteConstructor<Tasks>('/mjs/tasks.mjs');
  return await new Tasks();
});
