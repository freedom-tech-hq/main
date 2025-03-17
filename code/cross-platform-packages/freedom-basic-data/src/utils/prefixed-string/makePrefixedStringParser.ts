import { escapeRegExp } from 'lodash-es';

import type { PrefixedString } from '../../types/PrefixedString.ts';

export const makePrefixedStringParser =
  <PrefixT extends `${string}_`, NonPrefixedT extends string = string>(prefix: PrefixT) =>
  (value: string, start: number = 0): { value: PrefixedString<PrefixT, NonPrefixedT>; numUsedChars: number } | undefined => {
    let stickyNonAnchoredRegex = new RegExp(`${escapeRegExp(prefix)}[^]*`, 'y');
    if (!stickyNonAnchoredRegex.sticky) {
      stickyNonAnchoredRegex = new RegExp(stickyNonAnchoredRegex.source, `${stickyNonAnchoredRegex.flags}y`);
    }

    stickyNonAnchoredRegex.lastIndex = start;
    const match = stickyNonAnchoredRegex.exec(value);
    /* node:coverage disable */
    if (match === null) {
      return undefined;
    }
    /* node:coverage enable */

    return {
      value: match[0] as PrefixedString<PrefixT, NonPrefixedT>,
      numUsedChars: match[0].length
    };
  };
