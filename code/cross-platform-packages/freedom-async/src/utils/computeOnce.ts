const globalCache: Record<string, any> = {};

/** Computes a value once and caches the result using the specified global key */
export const computeOnce = <T>(key: string, producer: () => T): T => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const cached = globalCache[key];
  if (cached !== undefined) {
    return cached as T;
  }

  const output = producer();
  globalCache[key] = output;

  return output;
};
