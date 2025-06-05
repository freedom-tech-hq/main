import { makeRegisterAllWithExpress } from 'freedom-server-api-handling';

import del from './delete.ts';
import get from './get.ts';
import put from './put.ts';

export default makeRegisterAllWithExpress(del, get, put);
