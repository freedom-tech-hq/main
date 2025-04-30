import { makeRegisterAllWithExpress } from 'freedom-server-api-handling';

import checkNameAvailability from './check-name-availability.ts';
import health from './health.ts';
import publicKeys from './publicKeys.ts';
import pull from './pull.ts';
import push from './push.ts';
import register from './register.ts';

export default makeRegisterAllWithExpress(checkNameAvailability, health, pull, publicKeys, push, register);
