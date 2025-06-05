import type { ParsedGroup, ParsedMailbox } from 'email-addresses';
import { type ReactNode } from 'react';

export const makeTagsForParsedEmailAddresses = (
  parsed: Array<ParsedMailbox | ParsedGroup>,
  {
    single,
    group
  }: {
    single: (parsed: ParsedMailbox, index: number) => ReactNode;
    group: (parsed: ParsedGroup, index: number) => ReactNode;
  }
): ReactNode[] =>
  parsed.map((parsed, index) => {
    switch (parsed.type) {
      case 'group':
        return group(parsed, index);

      case 'mailbox':
        return single(parsed, index);
    }
  });
