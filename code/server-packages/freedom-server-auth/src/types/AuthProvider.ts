import type { NextFunction, Request, Response } from 'express';
import type { PR } from 'freedom-async';
import type { Trace } from 'freedom-contexts';

import type { AuthToken } from './AuthToken.ts';

export interface AuthProvider {
  getHttpAuthToken?: (
    trace: Trace,
    express: {
      req: Request;
      res: Response;
      next: NextFunction;
    }
  ) => PR<AuthToken | undefined, never>;
}
