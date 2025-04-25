import type { Uuid } from 'freedom-basic-data';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

const ActiveLocallyStoredCredentialUuidContext = createContext<Binding<Uuid | undefined>>(
  makeBinding(() => undefined, { id: 'activeLocallyStoredCredentialUuid' })
);

export interface ActiveLocallyStoredCredentialUuidProviderProps {
  activeLocallyStoredCredentialUuid: Binding<Uuid | undefined>;
}

export const ActiveLocallyStoredCredentialUuidProvider = ({
  children,
  activeLocallyStoredCredentialUuid
}: ActiveLocallyStoredCredentialUuidProviderProps & { children: ReactNode }) => (
  <ActiveLocallyStoredCredentialUuidContext value={activeLocallyStoredCredentialUuid}>{children}</ActiveLocallyStoredCredentialUuidContext>
);

export const useActiveLocallyStoredCredentialUuid = () => useContext(ActiveLocallyStoredCredentialUuidContext);
