import type { PFunction } from './PFunction.ts';
import type { Stringy } from './Stringy.ts';

type ParameterizedPluralizableStringFinalResolver<ParamT extends string> = (
  count: number,
  p: PFunction,
  params: Record<ParamT, string>
) => string;
type ParameterizedPluralizableStringPartialResolver<ParamT extends string> = (
  count: number,
  params: Record<ParamT, Stringy>
) => (p: PFunction) => string;

export type ParameterizedPluralizableStringResolver<ParamT extends string> = ParameterizedPluralizableStringFinalResolver<ParamT> &
  ParameterizedPluralizableStringPartialResolver<ParamT>;

export type PluralizableStringResolver = (count: number, p: PFunction, params?: undefined) => string;
