import type { PFunction } from '../types/PFunction.ts';
import type { ParameterizedPluralizableStringResolver, PluralizableStringResolver } from '../types/PluralizableStringResolver.ts';
import type { ParameterizedPluralizationRules, PluralizationRules } from '../types/PluralizationRules.ts';
import type { Stringy } from '../types/Stringy.ts';
import { resolveStringy } from '../types/Stringy.ts';

export function PLURALIZE(rules: PluralizationRules): PluralizableStringResolver;
export function PLURALIZE<ParamT extends string>(
  rules: ParameterizedPluralizationRules<ParamT>
): ParameterizedPluralizableStringResolver<ParamT>;
export function PLURALIZE<ParamT extends string>(rules: PluralizationRules | ParameterizedPluralizationRules<ParamT>) {
  return ((count: number, pOrParams: PFunction | Record<ParamT, Stringy>, params?: Record<ParamT, string>) => {
    if (typeof pOrParams === 'function') {
      const p = pOrParams;
      const rule = p(count);
      return (rules[rule] ?? rules.other)(p.t, (params ?? {}) as Record<ParamT, string>);
    } else {
      return (p: PFunction) => {
        const resolvedParams = (Object.entries(pOrParams) as Array<[ParamT, Stringy]>).reduce(
          (out, [key, value]) => {
            out[key] = resolveStringy(value, p.t);
            return out;
          },
          {} as Partial<Record<ParamT, string>>
        ) as Record<ParamT, string>;

        const rule = p(count);
        return (rules[rule] ?? rules.other)(p.t, resolvedParams);
      };
    }
  }) as PluralizableStringResolver | ParameterizedPluralizableStringResolver<ParamT>;
}
