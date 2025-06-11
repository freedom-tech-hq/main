import { useMemo } from 'react';

import { useIsWebAuthnAvailable } from './useIsWebAuthnAvailable.ts';
import { useWebAuthnAuthenticator } from './useWebAuthnAuthenticator.ts';
import { useWebAuthnRegisterer } from './useWebAuthnRegisterer.tsx';

export const useWebAuthn = () => {
  const isAvailable = useIsWebAuthnAvailable();
  const authenticate = useWebAuthnAuthenticator();
  const register = useWebAuthnRegisterer();

  return useMemo(() => ({ authenticate, isAvailable, register }), [authenticate, isAvailable, register]);
};
