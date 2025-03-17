/* node:coverage disable */

import type { AuthProvider } from 'freedom-server-auth';

let globalAuthProvider: AuthProvider | undefined;

export const authProvider = () => globalAuthProvider;

export const setAuthProvider = (authProvider: AuthProvider) => {
  globalAuthProvider = authProvider;
};
