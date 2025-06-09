import type { TypographyVariant } from '@mui/material';
import { Box, Chip, Stack } from '@mui/material';
import type { MailAddressList } from 'freedom-email-api';
import { LOCALIZE, PLURALIZE } from 'freedom-localization';
import { ELSE, IF } from 'freedom-logical-web-components';
import { useP } from 'freedom-react-localization';
import React, { Fragment } from 'react';
import type { Binding } from 'react-bindings';
import { BC, useCallbackRef } from 'react-bindings';

import type { TxtProps } from '../../../../../components/reusable/aliases/Txt.ts';
import { Txt } from '../../../../../components/reusable/aliases/Txt.ts';
import { TxtPlaceholder } from '../../../../../components/reusable/TxtPlaceholder.tsx';
import { formatInt } from '../../../../../utils/formatInt.ts';
import { makeTagsFromMailAddressList } from '../../../../../utils/makeTagsFromMailAddressList.ts';

const enSpace = '\u2002';
const emSpace = '\u2003';

const ns = 'ui';
const $groupMembers = PLURALIZE({
  one: LOCALIZE`${'count'} member`({ ns }),
  other: LOCALIZE`${'count'} members`({ ns })
});

export interface MailListItemFormattedEmailAddressesProps {
  addresses: MailAddressList;
  showGroupMembers: Binding<boolean>;
  mode: 'from' | 'to';
}

export const MailListItemFormattedEmailAddresses = ({ addresses, showGroupMembers, mode }: MailListItemFormattedEmailAddressesProps) => {
  const p = useP();

  const toggleShowGroupMembers: React.MouseEventHandler<HTMLElement> = useCallbackRef((event) => {
    event.stopPropagation();

    showGroupMembers.set(!showGroupMembers.get());
  });

  return makeTagsFromMailAddressList(addresses, {
    group: (group, index) =>
      BC(showGroupMembers, (showGroupMembers) => (
        <Stack
          key={index}
          direction={showGroupMembers ? 'column' : 'row'}
          alignItems={showGroupMembers ? 'flex-start' : 'baseline'}
          className="flex-auto overflow-hidden"
          sx={{ display: showGroupMembers ? 'flex' : 'span' }}
        >
          <Txt
            variant={nameVariantByMode[mode]}
            color={nameColorByMode[mode]}
            title={group.groupName}
            className={`semibold ${showGroupMembers ? '' : 'overflow-hidden whitespace-nowrap text-ellipsis'}`}
          >
            {`${group.groupName}${emSpace}`}
          </Txt>
          {IF(
            showGroupMembers,
            () => (
              <Chip
                label={
                  <Stack direction="row" flexWrap="wrap" className="flex-auto overflow-hidden">
                    {group.addresses.map((member, index) => (
                      <Fragment key={index}>
                        {(member.name?.length ?? 0) > 0 ? (
                          <Txt variant="inherit" color={nameColorByMode[mode]} component="span" className="semibold">
                            {`${member.name}${enSpace}`}
                          </Txt>
                        ) : null}
                        <Txt
                          component="span"
                          variant="inherit"
                          color="textDisabled"
                        >{`${member.address}${index < group.addresses.length - 1 ? `,${emSpace}` : ''}`}</Txt>
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
      <Box key={index} component="span" className="flex-auto overflow-hidden">
        {(single.name?.length ?? 0) > 0 ? (
          <Txt
            component="span"
            variant={nameVariantByMode[mode]}
            color={nameColorByMode[mode]}
            className="semibold whitespace-nowrap overflow-hidden text-ellipsis"
            title={single.name}
          >
            {`${single.name}${emSpace}`}
          </Txt>
        ) : null}
        <Txt
          component="span"
          variant="body2"
          color="textDisabled"
          title={single.address}
          className="whitespace-nowrap overflow-hidden text-ellipsis"
        >
          {`${single.address}${index < addresses.length - 1 ? `,${emSpace}` : ''}`}
        </Txt>
      </Box>
    )
  });
};

export const MailListItemFormattedEmailAddressesPlaceholder = ({
  mode
}: Omit<MailListItemFormattedEmailAddressesProps, 'addresses' | 'showGroupMembers'>) => (
  <Box component="span" className="flex-auto overflow-hidden">
    <TxtPlaceholder component="span" variant={nameVariantByMode[mode]} className="semibold">
      Placeholder
    </TxtPlaceholder>
    {emSpace}
    <TxtPlaceholder component="span" variant="body2" color="textDisabled" className="shrink overflow-hidden">
      example@freedommail.me
    </TxtPlaceholder>
  </Box>
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
