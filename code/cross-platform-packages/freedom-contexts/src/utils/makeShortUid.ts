import { v4 } from 'uuid';

export const makeShortUid = () => v4().substring(0, 8);
