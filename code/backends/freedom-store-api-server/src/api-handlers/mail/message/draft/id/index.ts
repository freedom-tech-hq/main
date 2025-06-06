import { makeRegisterAllWithExpress } from 'freedom-server-api-handling';

import send from './send.ts';

export default makeRegisterAllWithExpress(send);
