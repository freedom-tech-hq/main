import { makeRegisterAllWithExpress } from 'freedom-server-api-handling';

import id from './id/index.ts';
import post from './post.ts';

export default makeRegisterAllWithExpress(id, post);
