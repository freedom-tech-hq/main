import { makeUuid } from 'freedom-contexts';
import { useMemo } from 'react';
import { BC, useDerivedBinding } from 'react-bindings';

import { useActiveUserId } from '../contexts/active-user-id.tsx';
import { useSelectedMailThreadId } from '../contexts/selected-mail-thread.tsx';
import { MailThread } from '../modules/mail-thread/components/MailThread.tsx';
import { AccountCreationOrLogin } from './AccountCreationOrLogin.tsx';

export const AppMainContent = () => {
  const uuid = useMemo(() => makeUuid(), []);
  const activeUserId = useActiveUserId();
  const selectedMailThreadId = useSelectedMailThreadId();

  const hasActiveUserId = useDerivedBinding(activeUserId, (activeUserId) => activeUserId !== undefined, { id: 'hasActiveUserId' });
  const hasSelectedMailThreadId = useDerivedBinding(selectedMailThreadId, (selectedThreadId) => selectedThreadId !== undefined, {
    id: 'hasSelectedMailThreadId'
  });

  return (
    <>
      {BC(hasActiveUserId, (hasActiveUserId) =>
        hasActiveUserId ? (
          <>
            {BC(hasSelectedMailThreadId, (hasSelectedThreadId) =>
              hasSelectedThreadId ? <MailThread scrollParent={`${uuid}-main`} /> : null
            )}
          </>
        ) : (
          <AccountCreationOrLogin />
        )
      )}
    </>
  );
};
