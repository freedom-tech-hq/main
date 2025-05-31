import type { TypographyVariant } from '@mui/material';
import { Chip, Stack } from '@mui/material';
import type { ParsedGroup, ParsedMailbox } from 'email-addresses';
import { LOCALIZE, PLURALIZE } from 'freedom-localization';
import { ELSE, IF } from 'freedom-logical-web-components';
import { useP } from 'freedom-react-localization';
import React, { Fragment } from 'react';
import type { Binding } from 'react-bindings';
import { BC, useCallbackRef } from 'react-bindings';

import type { TxtProps } from '../../../../components/reusable/aliases/Txt.ts';
import { Txt } from '../../../../components/reusable/aliases/Txt.ts';
import { BreakableEmailAddressTxt } from '../../../../components/reusable/BreakableEmailAddressTxt.tsx';
import { TxtPlaceholder } from '../../../../components/reusable/TxtPlaceholder.tsx';
import { formatInt } from '../../../../utils/formatInt.ts';
import { makeTagsForParsedEmailAddresses } from '../../../../utils/makeTagsForParsedEmailAddresses.ts';

const enSpace = '\u2002';
const emSpace = '\u2003';

const ns = 'ui';
const $groupMembers = PLURALIZE({
  one: LOCALIZE`${'count'} member`({ ns }),
  other: LOCALIZE`${'count'} members`({ ns })
});

export interface MailListItemFormattedEmailAddressesProps {
  addresses: Array<ParsedMailbox | ParsedGroup>;
  showGroupMembers: Binding<boolean>;
  mode: 'from' | 'to';
}

export const MailListItemFormattedEmailAddresses = ({ addresses, showGroupMembers, mode }: MailListItemFormattedEmailAddressesProps) => {
  const p = useP();

  const toggleShowGroupMembers = useCallbackRef(() => showGroupMembers.set(!showGroupMembers.get()));

  return makeTagsForParsedEmailAddresses(addresses, {
    group: (group, index) =>
      BC(showGroupMembers, (showGroupMembers) => (
        <Stack
          key={index}
          direction={showGroupMembers ? 'column' : 'row'}
          alignItems={showGroupMembers ? 'flex-start' : 'baseline'}
          columnGap={1.5}
          className="flex-auto overflow-hidden"
        >
          <Txt
            variant={nameVariantByMode[mode]}
            color={nameColorByMode[mode]}
            title={group.name}
            className={`semibold ${showGroupMembers ? '' : 'overflow-hidden whitespace-nowrap text-ellipsis'}`}
          >
            {group.name}
          </Txt>
          {IF(
            showGroupMembers,
            () => (
              <Chip
                label={
                  <Stack direction="row" flexWrap="wrap" className="flex-auto overflow-hidden">
                    {group.addresses.map((member, index) => (
                      <Fragment key={index}>
                        {member.name !== null ? (
                          <Txt variant="inherit" color={nameColorByMode[mode]} component="span" className="semibold">
                            {`${member.name}${enSpace}`}
                          </Txt>
                        ) : null}
                        <BreakableEmailAddressTxt
                          component="span"
                          color="textDisabled"
                        >{`${member.address}${index < group.addresses.length - 1 ? `,${emSpace}` : ''}`}</BreakableEmailAddressTxt>
                      </Fragment>
                    ))}
                  </Stack>
                }
                title={group.addresses.map((from) => from.address).join(', ')}
                onClick={toggleShowGroupMembers}
              />
            ),
            ELSE(() => (
              <Chip
                label={$groupMembers(group.addresses.length, p, { count: formatInt(group.addresses.length) })}
                title={group.addresses.map((member) => member.address).join(', ')}
                onClick={toggleShowGroupMembers}
              />
            ))
          )}
        </Stack>
      )),
    single: (single, index) => (
      <Stack key={index} direction="row" flexWrap="wrap" alignItems="baseline" columnGap={1.5} className="flex-auto overflow-hidden">
        {single.name !== null ? (
          <Txt variant={nameVariantByMode[mode]} color={nameColorByMode[mode]} className="semibold" title={single.name}>
            {single.name}
          </Txt>
        ) : null}
        <Txt variant="body2" color="textDisabled" title={single.address}>
          <BreakableEmailAddressTxt component="span">{`${single.address}${index < addresses.length - 1 ? `,${emSpace}` : ''}`}</BreakableEmailAddressTxt>
        </Txt>
      </Stack>
    )
  });
};

export const MailListItemFormattedEmailAddressesPlaceholder = ({
  mode
}: Omit<MailListItemFormattedEmailAddressesProps, 'addresses' | 'showGroupMembers'>) => (
  <Stack direction="row" flexWrap="wrap" alignItems="baseline" columnGap={1.5} className="flex-auto overflow-hidden">
    <TxtPlaceholder variant={nameVariantByMode[mode]} className="semibold">
      Placeholder
    </TxtPlaceholder>
    <TxtPlaceholder variant="body2" color="textDisabled" className="shrink overflow-hidden">
      example@freedommail.me
    </TxtPlaceholder>
  </Stack>
);

// Helpers

const nameColorByMode: Record<'from' | 'to', TxtProps['color']> = {
  from: 'textPrimary',
  to: 'textDisabled'
};

const nameVariantByMode: Record<'from' | 'to', TypographyVariant> = {
  from: 'body1',
  to: 'body2'
};
