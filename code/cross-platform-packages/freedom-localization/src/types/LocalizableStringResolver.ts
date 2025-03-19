import type { TFunction } from 'i18next';

import type { Stringy } from './Stringy.ts';

type ParameterizedLocalizableStringFinalResolver<ParamT extends string> = (t: TFunction | void, params: Record<ParamT, string>) => string;
type ParameterizedLocalizableStringPartialResolver<ParamT extends string> = (
  params: Record<ParamT, Stringy>
) => (t: TFunction | void) => string;

export type ParameterizedLocalizableStringResolver<ParamT extends string> = ParameterizedLocalizableStringFinalResolver<ParamT> &
  ParameterizedLocalizableStringPartialResolver<ParamT>;

export type LocalizableStringResolver = (t: TFunction | void) => string;
