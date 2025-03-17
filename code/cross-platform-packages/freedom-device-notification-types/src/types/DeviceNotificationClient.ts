import type { Base64String, Sha256Hash } from 'freedom-basic-data';
import type { Notifiable } from 'freedom-notification-types';

export type DeviceNotifications = Record<`contentChange:${Base64String}`, { hash: Sha256Hash }>;

export type DeviceNotificationClient = Notifiable<DeviceNotifications>;
