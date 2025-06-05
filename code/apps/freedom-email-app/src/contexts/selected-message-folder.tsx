import type { MessageFolder } from 'freedom-email-api';
import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

const SelectedMessageFolderContext = createContext<Binding<MessageFolder | undefined>>(
  makeBinding<MessageFolder | undefined>(() => 'inbox', { id: 'selectedMessageFolder', detectChanges: true })
);

export interface SelectedMessageFolderProviderProps {
  selectedMessageFolder: Binding<MessageFolder | undefined>;
}

export const SelectedMessageFolderProvider = ({
  children,
  selectedMessageFolder
}: SelectedMessageFolderProviderProps & { children?: ReactNode }) => (
  <SelectedMessageFolderContext value={selectedMessageFolder}>{children}</SelectedMessageFolderContext>
);

export const useSelectedMessageFolder = () => useContext(SelectedMessageFolderContext);
