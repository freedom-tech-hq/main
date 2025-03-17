/* node:coverage disable */

export const sleep = (durationMSec: number) => new Promise((resolve) => setTimeout(resolve, durationMSec));
