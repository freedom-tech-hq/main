import { makeRegisterAllWithExpress } from 'freedom-server-api-handling';

import post from './post.ts';

export default makeRegisterAllWithExpress(post);
