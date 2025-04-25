import type { HistoryStateOptions } from '../history/types/HistoryStateOptions.ts';

export const makeUrl = (path: string, { search, hash, baseUrl }: HistoryStateOptions & { baseUrl: string | URL }): URL => {
  const url = new URL(path, baseUrl);

  if (search !== undefined) {
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined) {
        url.searchParams.append(key, value);
      }
    }
  }

  if (hash !== undefined) {
    url.hash = hash;
  }

  return url;
};
