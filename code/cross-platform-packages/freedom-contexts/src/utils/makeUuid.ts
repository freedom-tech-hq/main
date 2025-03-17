import { v4 } from 'uuid';

import type { Uuid } from '../types/Uuid.ts';

export const makeUuid = (): Uuid => v4() as Uuid;
