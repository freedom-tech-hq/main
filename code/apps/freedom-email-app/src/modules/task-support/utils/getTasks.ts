import { once } from 'lodash-es';

import type { Tasks } from '../../../tasks.ts';
import { getRemoteConstructor } from '../../../utils/getRemoteConstructor.ts';

export const getTasks = once(async (): Promise<Tasks> => {
  const Tasks = getRemoteConstructor<Tasks>(
    `/mjs/tasks${(process.env.FREEDOM_BUILD_UUID ?? '').length > 0 ? `-${process.env.FREEDOM_BUILD_UUID}` : ''}.mjs`
  );
  return await new Tasks();
});
