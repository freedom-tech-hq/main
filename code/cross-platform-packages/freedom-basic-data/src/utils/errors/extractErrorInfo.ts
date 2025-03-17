import { get } from 'lodash-es';

import type { InferErrorCode } from '../../types/InferErrorCode.ts';

export const extractErrorInfo = <BodyT>(body: BodyT): { errorCode: NonNullable<InferErrorCode<BodyT>> | 'generic'; message?: string } => {
  if (body !== null && typeof body === 'object') {
    const errorCode = get(body, 'errorCode');
    const message = get(body, 'message');
    return {
      errorCode: typeof errorCode === 'string' ? ((errorCode ?? 'generic') as NonNullable<InferErrorCode<BodyT>> | 'generic') : 'generic',
      message: typeof message === 'string' ? message : undefined
    };
  } else if (typeof body === 'string') {
    return { errorCode: 'generic', message: body };
  }

  return { errorCode: 'generic' };
};
