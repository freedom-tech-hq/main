import { makeSuccess } from 'freedom-async';
import { useWaitableFunction } from 'react-waitables';

import { isWebAuthnAvailable } from '../../utils/webauthn/isWebAuthnAvailable.ts';

export const useIsWebAuthnAvailable = () =>
  useWaitableFunction(async () => makeSuccess(await isWebAuthnAvailable()), { id: 'isWebAuthnAvailable' });
