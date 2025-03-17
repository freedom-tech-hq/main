export const formatDateTime = (timeMSec: number) => {
  const date = new Date(timeMSec);
  return `${date.toLocaleDateString(undefined, { dateStyle: 'short' })} ${date.toLocaleTimeString(undefined, { timeStyle: 'short' })}`;
};
