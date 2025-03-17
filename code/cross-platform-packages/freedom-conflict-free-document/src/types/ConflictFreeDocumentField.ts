import type { Notifiable } from 'freedom-notification-types';

import type { ConflictFreeDocumentFieldNotification } from './ConflictFreeDocumentFieldNotification.ts';

export type ConflictFreeDocumentField<FieldT extends ConflictFreeDocumentField<any>> = Notifiable<
  ConflictFreeDocumentFieldNotification<FieldT>
>;
