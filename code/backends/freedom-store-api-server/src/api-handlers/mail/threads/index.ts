import { makeRegisterAllWithExpress } from 'freedom-server-api-handling';

import get from './get.ts';

export default makeRegisterAllWithExpress(get);
