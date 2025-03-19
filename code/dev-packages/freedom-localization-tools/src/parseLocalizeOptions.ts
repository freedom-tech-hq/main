import { get as safeGet } from 'lodash-es';

import { safeParse } from './check-localizations-impl/safeParse.ts';
import { AppError } from './types/AppError.ts';

interface Property {
  type: 'Property';
  key: { name: string };
  value: IdentifierValue | LiteralValue;
}

interface IdentifierValue {
  type: 'Identifier';
  name: string;
}

interface LiteralValue {
  type: 'Literal';
  value: string;
}

export const parseLocalizeOptions = (unparsedOptions: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const parsedOptions = safeParse(unparsedOptions);
  const parsedOptionsProperties = safeGet(parsedOptions, 'body.0.expression.properties') as Property[];

  const parsedNsProperty = parsedOptionsProperties.find((prop) => prop.key.name === 'ns');
  let ns: LiteralValue | undefined;
  if (parsedNsProperty !== undefined && parsedNsProperty.value.type === 'Identifier') {
    if (parsedNsProperty.value.name !== 'ns') {
      throw new AppError(`ns property must be the "ns" identifier or a string literal, if specified`);
    }
  } else {
    ns = parsedNsProperty?.value as LiteralValue | undefined;
  }

  const parsedKeyProperty = parsedOptionsProperties.find((prop) => prop.key.name === 'key');
  let key: LiteralValue | undefined;
  if (parsedKeyProperty !== undefined && parsedKeyProperty.value.type !== 'Literal') {
    throw new AppError(`key property must be a string literal, if specified`);
  } else {
    key = parsedKeyProperty?.value as LiteralValue | undefined;
  }

  return { ns, key };
};
