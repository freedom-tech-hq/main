import type { TFunction } from 'i18next';

export type Stringy = string | ((t: TFunction | void) => string);

export const isStringy = (value: any): value is Stringy => typeof value === 'string' || typeof value === 'function';

export const resolveStringy = (value: Stringy, t: TFunction | void) => (typeof value === 'string' ? value : value(t));
