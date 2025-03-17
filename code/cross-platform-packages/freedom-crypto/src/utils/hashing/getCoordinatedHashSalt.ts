import { ONE_DAY_MSEC } from 'freedom-basic-data';
import { NotificationManager } from 'freedom-notification-types';

/** Gets a predictable salt that is used when hashing IDs in publicly readable spaces, which is rotated every 24 hours in a semi-coordinated
 * manner */
export const getCoordinatedHashSalt = (timeMSec?: number) => String(Math.floor((timeMSec ?? Date.now()) / ONE_DAY_MSEC));

/** Adds a listener that will be called soon after the coordinated hash salt has changed for the day */
export const addCoordinatedHashSaltChangeListener = (callback: () => void) =>
  globalCoordinatedHashSaltNotificationManager.addListener('coordinatedHashSaltChanged', callback);

// Helpers

type CoordinatedHashSaltNotification = { coordinatedHashSaltChanged: { newValue: string } };

let isGlobalCoordinatedHashSaltNotificationManagerHooked = false;
let lastTriggerCoordinatedHashSaltChangedEventTimeout: ReturnType<typeof setTimeout> | undefined;

const globalCoordinatedHashSaltNotificationManager = new NotificationManager<CoordinatedHashSaltNotification>({
  hookType: () => {
    isGlobalCoordinatedHashSaltNotificationManagerHooked = true;

    lastTriggerCoordinatedHashSaltChangedEventTimeout = setTimeout(
      triggerCoordinatedHashSaltChangedEvent,
      ONE_DAY_MSEC - (Date.now() % ONE_DAY_MSEC)
    );
  },
  unhookType: () => {
    isGlobalCoordinatedHashSaltNotificationManagerHooked = false;

    clearTimeout(lastTriggerCoordinatedHashSaltChangedEventTimeout);
    lastTriggerCoordinatedHashSaltChangedEventTimeout = undefined;
  }
});

const triggerCoordinatedHashSaltChangedEvent = () => {
  globalCoordinatedHashSaltNotificationManager.notify('coordinatedHashSaltChanged', { newValue: getCoordinatedHashSalt() });

  if (isGlobalCoordinatedHashSaltNotificationManagerHooked) {
    lastTriggerCoordinatedHashSaltChangedEventTimeout = setTimeout(
      triggerCoordinatedHashSaltChangedEvent,
      ONE_DAY_MSEC - (Date.now() % ONE_DAY_MSEC)
    );
  }
};
