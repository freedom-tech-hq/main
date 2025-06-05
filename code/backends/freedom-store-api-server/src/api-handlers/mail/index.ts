import { makeRegisterAllWithExpress } from 'freedom-server-api-handling';

import message from './message/index.ts';
import messages from './messages/index.ts';
import thread from './thread/index.ts';
import threads from './threads/index.ts';

export default makeRegisterAllWithExpress(message, messages, thread, threads);
