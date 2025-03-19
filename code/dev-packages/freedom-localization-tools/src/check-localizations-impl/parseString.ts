import { AppError } from '../types/AppError.ts';
import { parseDoubleQuoteString } from './parseDoubleQuoteString.ts';
import { parseSingleQuoteString } from './parseSingleQuoteString.ts';
import { parseTemplateString } from './parseTemplateString.ts';

export const parseString = (value: string) => {
  switch (value.charAt(0)) {
    case "'":
      return parseSingleQuoteString(value);
    case '"':
      return parseDoubleQuoteString(value);
    case '`':
      return parseTemplateString(value);
    default:
      throw new AppError('A non-string value was encountered');
  }
};
