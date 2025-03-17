import type { IsoDateTime } from '../types/IsoDateTime.ts';

export const makeIsoDateTime = (date = new Date()): IsoDateTime => date.toISOString() as IsoDateTime;
