import { NotificationManager } from 'freedom-notification-types';
import type * as Y from 'yjs';

import type { ConflictFreeDocumentField } from '../../types/ConflictFreeDocumentField.ts';
import type { ConflictFreeDocumentFieldNotification } from '../../types/ConflictFreeDocumentFieldNotification.ts';

export const makeChangeListenerSupportForConflictFreeDocumentField = <FieldT extends ConflictFreeDocumentField<FieldT>>({
  fieldName,
  getField,
  getNativeField
}: {
  fieldName: string;
  getField: () => FieldT;
  getNativeField: () => Y.AbstractType<any>;
}) => {
  const triggerChangeListeners = () => notificationManager.notify('change', { fieldName, field: getField() });

  const notificationManager = new NotificationManager<ConflictFreeDocumentFieldNotification<FieldT>>({
    hookType: (type) => {
      switch (type) {
        case 'change': {
          const nativeField = getNativeField();
          nativeField.observeDeep(triggerChangeListeners);
          break;
        }
      }
    },
    unhookType: (type) => {
      switch (type) {
        case 'change': {
          const nativeField = getNativeField();
          nativeField.unobserveDeep(triggerChangeListeners);
          break;
        }
      }
    }
  });

  return {
    addListener: notificationManager.addListener
  };
};
