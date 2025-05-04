/* node:coverage disable */

import type { Trace } from 'freedom-contexts';
import { getTraceStack, getTraceStackTop } from 'freedom-contexts';
import { escapeRegExp } from 'lodash-es';

import { tokenize } from '../utils/tokenize.ts';

/**
 * - If patterns is empty, returns a function that always returns `false`
 * - If patterns is 'all', returns a function that always returns `true`
 * - Otherwise, splits the patterns string on commas/newlines and uses the following matching logic:
 *   - If a pattern is a simple ID, like "`freedom-crypto-service/utils/makeUserKeys>generateSignedValue`", it will be matched if the
 *     ID string at the top of the trace stack matches it
 *   - If a pattern contains '`**`', it will match '`**`' anywhere in the trace stack
 *   - If a pattern contains '`*`', it will allow anything except '`>`' in place of '`*`'
 *   - The special modifiers may be used together
 */
export const makeShouldIncludeTraceForDebuggingFunc = (patterns: string | undefined) => {
  patterns = patterns?.trim() ?? '';

  if (patterns.length === 0) {
    return () => false;
  } else if (patterns === 'all') {
    return () => true;
  }

  const parts = patterns.split(/[,\n]/).map((value) => value.trim());
  const includedSimpleIds = new Set(parts.filter((part) => !part.includes('*')));
  const includedIdMatchers = parts
    .filter((part) => part.includes('*'))
    .map((part) => {
      const useAllTraceLevels = part.includes('**');
      const regex = new RegExp(
        // When searching all levels, we allow any partial match.  Otherwise, we expect the entire trace levels to match
        `${useAllTraceLevels ? '' : '^'}${tokenize(part, /\*{1,2}/)
          .map((part) => {
            if (part.isToken) {
              switch (part.value) {
                case '**':
                  return '[^]*';
                case '*':
                  return '[^>]*';
                default:
                  return escapeRegExp(part.value);
              }
            } else {
              return escapeRegExp(part.value);
            }
          })
          .join('')}$`
      );
      return { useAllTraceLevels, regex };
    });

  return (trace: Trace): boolean => {
    if (includedSimpleIds.has(getTraceStackTop(trace))) {
      return true;
    }

    for (const includedIdMatcher of includedIdMatchers) {
      const searchString = includedIdMatcher.useAllTraceLevels ? getTraceStack(trace).join('>') : getTraceStackTop(trace);
      if (includedIdMatcher.regex.test(searchString)) {
        return true;
      }
    }

    return false;
  };
};
