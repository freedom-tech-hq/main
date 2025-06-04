import { VirtualList } from 'freedom-web-virtual-list';
import React from 'react';

import { useMailListDataSource } from './useMailListDataSource.ts';
import { useMailListDelegate } from './useMailListDelegate.tsx';

export interface MailListProps {
  scrollParent: HTMLElement | string | Window;
}

export const MailList = ({ scrollParent }: MailListProps) => {
  const dataSource = useMailListDataSource();

  const delegate = useMailListDelegate(dataSource);

  return <VirtualList scrollParent={scrollParent} dataSource={dataSource} delegate={delegate} />;
};
