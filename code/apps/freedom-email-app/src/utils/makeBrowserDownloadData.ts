import type { PR, Result } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, Resolvable } from 'freedom-async';
import { ONE_SEC_MSEC } from 'freedom-basic-data';

export const makeBrowserDownloadData = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    _trace,
    { data, mimeType, filename }: { data: BufferSource | Blob | string; mimeType: string; filename: string }
  ): PR<undefined> => {
    const downloadUrl = URL.createObjectURL(new Blob([data], { type: mimeType }));

    const a = document.createElement('a') as HTMLAnchorElement;
    a.style.display = 'none';
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);

    a.click();

    const resolvable = new Resolvable<Result<undefined>>();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      resolvable.resolve(makeSuccess(undefined));
    }, ONE_SEC_MSEC);

    return await resolvable.promise;
  }
);
