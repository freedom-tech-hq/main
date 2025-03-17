import { omit } from 'lodash-es';

import { inline } from '../internal/utils/inline.ts';
import { makePrefixedStringInfo } from '../utils/prefixed-string/makePrefixedStringInfo.ts';

const base64StringRegex = /^[A-Za-z0-9+/]*={0,2}$/;

export const base64String = inline(() => {
  const prefixedStringInfo = makePrefixedStringInfo('B64_', {
    allowEmpty: true,
    isNonPrefixedValueValid: (nonPrefixedValue: string) => base64StringRegex.test(nonPrefixedValue)
  });

  return {
    ...omit(prefixedStringInfo, 'make'),
    makeWithNonPrefixBase64String: prefixedStringInfo.make,
    makeWithUtf8String: (utf8String: string) => prefixedStringInfo.make(Buffer.from(utf8String, 'utf-8').toString('base64')),
    makeWithBuffer: (buffer: Uint8Array | ArrayBuffer) => prefixedStringInfo.make(Buffer.from(buffer).toString('base64')),
    toBuffer: (base64String: Base64String): Uint8Array => Buffer.from(prefixedStringInfo.removePrefix(base64String), 'base64'),
    toUtf8String: (base64String: Base64String): string =>
      Buffer.from(prefixedStringInfo.removePrefix(base64String), 'base64').toString('utf-8')
  };
});
export type Base64String = `B64_${string}`;
