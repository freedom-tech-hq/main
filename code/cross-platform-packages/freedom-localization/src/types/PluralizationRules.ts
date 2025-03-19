import type { LocalizableStringResolver, ParameterizedLocalizableStringResolver } from './LocalizableStringResolver.ts';

/** Ref: https://lingohub.com/blog/pluralization */
export interface ParameterizedPluralizationRules<ParamT extends string> {
  zero?: ParameterizedLocalizableStringResolver<ParamT>;
  one?: ParameterizedLocalizableStringResolver<ParamT>;
  two?: ParameterizedLocalizableStringResolver<ParamT>;
  few?: ParameterizedLocalizableStringResolver<ParamT>;
  many?: ParameterizedLocalizableStringResolver<ParamT>;
  other: ParameterizedLocalizableStringResolver<ParamT>;
}

/** Ref: https://lingohub.com/blog/pluralization */
export interface PluralizationRules {
  zero?: LocalizableStringResolver;
  one?: LocalizableStringResolver;
  two?: LocalizableStringResolver;
  few?: LocalizableStringResolver;
  many?: LocalizableStringResolver;
  other: LocalizableStringResolver;
}
