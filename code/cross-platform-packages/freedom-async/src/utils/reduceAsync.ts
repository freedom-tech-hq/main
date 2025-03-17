/** Reduces using an async function */
export const reduceAsync = async <T, R>(
  values: T[],
  callback: (out: R, value: T, index: number) => Promise<R>,
  initialOut: R
): Promise<R> => {
  let out = initialOut;
  let index = 0;
  for (const value of values) {
    out = await callback(out, value, index);
    index += 1;
  }

  return out;
};
