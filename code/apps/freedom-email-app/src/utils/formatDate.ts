export const formatDate = (timeMSec: number) => {
  const date = new Date(timeMSec);
  return date.toLocaleDateString(undefined, { dateStyle: 'short' });
};
