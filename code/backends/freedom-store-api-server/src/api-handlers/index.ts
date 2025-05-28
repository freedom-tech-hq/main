import { makeRegisterAllWithExpress } from 'freedom-server-api-handling';

import checkNameAvailability from './check-name-availability.ts';
import health from './health.ts';
import { mail } from './mail/exports.ts';
import publicKeys from './publicKeys.ts';
import pull from './pull.ts';
import push from './push.ts';
import register from './register.ts';
import retrieveCredentials from './retrieve-credentials.ts';
import storeCredentials from './store-credentials.ts';

export default makeRegisterAllWithExpress(
  ...mail,
  checkNameAvailability,
  health,
  pull,
  publicKeys,
  push,
  register,
  retrieveCredentials,
  storeCredentials
);
