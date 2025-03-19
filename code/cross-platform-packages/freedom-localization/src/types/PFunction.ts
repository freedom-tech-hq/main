import type { TFunction } from 'i18next';

import type { PCategory } from './PCategory.ts';

export type PFunction = ((count: number) => PCategory) & { t: TFunction | void };
