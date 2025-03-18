export const formatTime = (timeMSec: number) => {
  const date = new Date(timeMSec);
  return date.toLocaleTimeString(undefined, { timeStyle: 'short' });
};
