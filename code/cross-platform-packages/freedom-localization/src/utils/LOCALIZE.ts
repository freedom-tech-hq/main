import type { TFunction } from 'i18next';
import * as i18next from 'i18next';

import type { LocalizableStringResolver, ParameterizedLocalizableStringResolver } from '../types/LocalizableStringResolver.ts';
import { resolveStringy, type Stringy } from '../types/Stringy.ts';
import { normalizeForLocalizationKey } from './normalizeForLocalizationKey.ts';

const defaultT = i18next.t;

const LOCALIZATION_NOT_FOUND = 'LOCALIZATION_NOT_FOUND';

export function LOCALIZE(defaultLangValue: string): (options: { ns: string; key?: string }) => LocalizableStringResolver;
export function LOCALIZE<ParamT extends string>(
  strings: TemplateStringsArray,
  ...params: ParamT[]
): (options: { ns: string; key?: string }) => ParameterizedLocalizableStringResolver<ParamT>;
export function LOCALIZE<ParamT extends string>(
  defaultLangValueOrStrings: string | TemplateStringsArray,
  ...params: ParamT[]
): (options: { ns: string; key?: string }) => LocalizableStringResolver | ParameterizedLocalizableStringResolver<ParamT> {
  const defaultKey = normalizeForLocalizationKey(defaultLangValueOrStrings, ...params);

  if (typeof defaultLangValueOrStrings === 'string') {
    return ({ ns, key }) => {
      const resolvedKey = key ?? defaultKey;

      return (t: TFunction | void) => {
        t = t ?? defaultT;
        const resolved = t(resolvedKey, { ns, defaultValue: LOCALIZATION_NOT_FOUND });

        if (resolved === LOCALIZATION_NOT_FOUND) {
          i18next.loadNamespaces(ns);
          return t(resolvedKey, { ns, defaultValue: defaultLangValueOrStrings });
        } else {
          return resolved;
        }
      };
    };
  } else {
    const templateStrings = defaultLangValueOrStrings as TemplateStringsArray;

    const defaultValueParts: string[] = [];
    for (let index = 0; index < templateStrings.length; index += 1) {
      defaultValueParts.push(templateStrings[index]);
      if (index < params.length) {
        defaultValueParts.push(`{{${params[index]}}}`);
      }
    }

    const defaultValue = defaultValueParts.join('');

    return ({ ns, key }) => {
      const resolvedKey = key ?? defaultKey;

      return ((tOrParams: TFunction | void | Record<ParamT, Stringy>, params?: Record<ParamT, string>) => {
        if (tOrParams === undefined || typeof tOrParams === 'function') {
          const t = tOrParams ?? defaultT;
          const resolved = t(resolvedKey, { ...(params as Record<any, string>), ns, defaultValue: LOCALIZATION_NOT_FOUND });

          if (resolved === LOCALIZATION_NOT_FOUND) {
            i18next.loadNamespaces(ns);
            return t(resolvedKey, { ...(params as Record<any, string>), ns, defaultValue });
          } else {
            return resolved;
          }
        } else {
          return (t: TFunction | void) => {
            t = t ?? defaultT;

            const resolvedParams = (Object.entries(tOrParams) as Array<[ParamT, Stringy]>).reduce(
              (out, [key, value]) => {
                out[key] = resolveStringy(value, t);
                return out;
              },
              {} as Partial<Record<ParamT, string>>
            ) as Record<ParamT, string>;

            const resolved = t(resolvedKey, { ...resolvedParams, ns, defaultValue: LOCALIZATION_NOT_FOUND });

            if (resolved === LOCALIZATION_NOT_FOUND) {
              i18next.loadNamespaces(ns);
              return t(resolvedKey, { ...resolvedParams, ns, defaultValue });
            } else {
              return resolved;
            }
          };
        }
      }) as LocalizableStringResolver | ParameterizedLocalizableStringResolver<ParamT>;
    };
  }
}
