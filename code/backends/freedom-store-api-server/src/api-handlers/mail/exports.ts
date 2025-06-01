import messagesGet from './messages.get.ts';
import messagesIdDelete from './messages.id.delete.ts';
import messagesIdGet from './messages.id.get.ts';
import messagesIdPut from './messages.id.put.ts';
import messagesPost from './messages.post.ts';
import threadsGet from './threads.get.ts';
import threadsIdGet from './threads.id.get.ts';

export const mail = [messagesGet, messagesIdDelete, messagesIdGet, messagesIdPut, messagesPost, threadsGet, threadsIdGet];
