import { makeRegisterAllWithExpress } from 'freedom-server-api-handling';

import draft from './draft/index.ts';
import id from './id/index.ts';

export default makeRegisterAllWithExpress(draft, id);
