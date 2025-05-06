import type { Sha256Hash } from 'freedom-basic-data';
import type { Notifiable } from 'freedom-notification-types';

import type { RemoteId } from './RemoteId.ts';

export type RemoteChangeNotifications = Record<`contentChange:${string}`, { remoteId: RemoteId; hash: Sha256Hash }>;

export type RemoteChangeNotificationClient = Notifiable<RemoteChangeNotifications>;
