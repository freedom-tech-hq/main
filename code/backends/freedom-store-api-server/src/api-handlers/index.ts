import { makeRegisterAllWithExpress } from 'freedom-server-api-handling';

import checkNameAvailability from './check-name-availability.ts';
import health from './health.ts';
import mail from './mail/index.ts';
import publicKeys from './publicKeys.ts';
import register from './register.ts';
import retrieveCredential from './retrieve-credential.ts';
import storeCredential from './store-credential.ts';

export default makeRegisterAllWithExpress(checkNameAvailability, health, mail, publicKeys, register, retrieveCredential, storeCredential);
