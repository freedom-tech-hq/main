export function normalizeForLocalizationKey(defaultLangValue: string): string;
export function normalizeForLocalizationKey<ParamT extends string>(strings: TemplateStringsArray, ...params: ParamT[]): string;
export function normalizeForLocalizationKey<ParamT extends string>(
  defaultLangValueOrStrings: string | TemplateStringsArray,
  ...params: ParamT[]
): string;
export function normalizeForLocalizationKey<ParamT extends string>(
  defaultLangValueOrStrings: string | TemplateStringsArray,
  ...params: ParamT[]
): string {
  if (typeof defaultLangValueOrStrings === 'string') {
    return normalizeStringForLocalizationKey(defaultLangValueOrStrings);
  }

  return normalizeTemplateStringsArrayForLocalizationKey(defaultLangValueOrStrings, ...params);
}

// Helpers

const normalizeStringForLocalizationKey = (value: string) => value.normalize('NFD').toLocaleLowerCase().replace(/\s+|_/g, '');

const normalizeTemplateStringsArrayForLocalizationKey = <ParamT extends string>(value: TemplateStringsArray, ...params: ParamT[]) => {
  const defaultValueParts: string[] = [];
  const keyParts: string[] = [];
  for (let index = 0; index < value.length; index += 1) {
    defaultValueParts.push(value[index]);
    keyParts.push(normalizeForLocalizationKey(value[index]));
    if (index < params.length) {
      defaultValueParts.push(`{{${params[index]}}}`);
      keyParts.push(`_${normalizeForLocalizationKey(params[index])}_`);
    }
  }

  return keyParts.join('');
};
