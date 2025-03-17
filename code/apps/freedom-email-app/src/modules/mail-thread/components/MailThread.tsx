import { VirtualList } from '../../virtual-list/components/VirtualList.tsx';
import { useMailThreadDataSource } from '../hooks/useMailThreadDataSource.ts';
import { useMailThreadDelegate } from '../hooks/useMailThreadDelegate.tsx';

export interface MailThreadProps {
  scrollParent: HTMLElement | string;
}

export const MailThread = ({ scrollParent }: MailThreadProps) => {
  const mailDataSource = useMailThreadDataSource();

  const mailDelegate = useMailThreadDelegate(mailDataSource);

  return <VirtualList scrollParent={scrollParent} dataSource={mailDataSource} delegate={mailDelegate} />;
};
