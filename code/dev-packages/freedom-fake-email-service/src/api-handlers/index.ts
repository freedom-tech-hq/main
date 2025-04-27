import { makeRegisterAllWithExpress } from 'freedom-server-api-handling';

import credentials from './credentials.ts';
import health from './health.ts';
import publicKeys from './publicKeys.ts';
import pull from './pull.ts';
import push from './push.ts';
import register from './register.ts';

export default makeRegisterAllWithExpress(credentials, health, pull, publicKeys, push, register);
