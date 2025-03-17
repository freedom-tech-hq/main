export const formatTimeIfSameDateOrFormatDate = (timeMSec: number) => {
  const nowDate = new Date();
  const nowDateString = nowDate.toLocaleDateString();

  const date = new Date(timeMSec);
  const dateString = date.toLocaleDateString();

  if (dateString === nowDateString) {
    return date.toLocaleTimeString(undefined, { timeStyle: 'short' });
  } else {
    return dateString;
  }
};
