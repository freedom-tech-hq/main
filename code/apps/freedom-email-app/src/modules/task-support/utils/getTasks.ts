import type { Tasks } from 'freedom-email-tasks-web-worker';
import { once } from 'lodash-es';

import { getRemoteConstructor } from '../../../utils/getRemoteConstructor.ts';

export const getTasks = once(async (): Promise<Tasks> => {
  const Tasks = getRemoteConstructor<Tasks>(
    `/tasks${(process.env.FREEDOM_BUILD_UUID ?? '').length > 0 ? `-${process.env.FREEDOM_BUILD_UUID}` : ''}.mjs`
  );
  return await new Tasks();
});
