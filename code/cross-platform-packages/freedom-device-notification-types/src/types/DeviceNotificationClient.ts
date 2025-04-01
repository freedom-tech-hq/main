import type { Sha256Hash } from 'freedom-basic-data';
import type { Notifiable } from 'freedom-notification-types';

export type DeviceNotifications = Record<`contentChange:${string}`, { hash: Sha256Hash }>;

export type DeviceNotificationClient = Notifiable<DeviceNotifications>;
