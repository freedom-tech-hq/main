import { makeRegisterAllWithExpress } from 'freedom-server-api-handling';

import health from './health.ts';
import pull from './pull.ts';
import push from './push.ts';
import register from './register.ts';

export default makeRegisterAllWithExpress(health, pull, push, register);
