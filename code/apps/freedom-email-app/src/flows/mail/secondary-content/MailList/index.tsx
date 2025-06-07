import { VirtualList } from 'freedom-web-virtual-list';
import React from 'react';
import { useBindingEffect } from 'react-bindings';

import { useSelectedMailThreadId } from '../../../../contexts/selected-mail-thread-id.tsx';
import type { MailListControls } from './MailListControls.ts';
import {
  MailListItemTransientStatesBindingPersistenceProvider,
  useMailListItemTransientStatesBindingPersistence
} from './primary-components/mail-list-item-transient-states-binding-persistence.tsx';
import { useMailListDataSource } from './useMailListDataSource.ts';
import { useMailListDelegate } from './useMailListDelegate.tsx';

export interface MailListProps {
  scrollParent: HTMLElement | string | Window;
  controls?: MailListControls;
}

export const MailList = (props: MailListProps) => (
  <MailListItemTransientStatesBindingPersistenceProvider>
    {<InternalMailList {...props} />}
  </MailListItemTransientStatesBindingPersistenceProvider>
);

// Helpers

const InternalMailList = ({ scrollParent, controls }: MailListProps) => {
  const dataSource = useMailListDataSource();
  const delegate = useMailListDelegate(dataSource);
  const mailListItemTransientStatesBindingPersistence = useMailListItemTransientStatesBindingPersistence();
  const selectedThreadId = useSelectedMailThreadId();

  useBindingEffect(selectedThreadId, () => mailListItemTransientStatesBindingPersistence.clear());

  if (controls !== undefined) {
    controls.getMostRecentMailId = dataSource.getMostRecentMailId;
  }

  return <VirtualList scrollParent={scrollParent} dataSource={dataSource} delegate={delegate} />;
};
