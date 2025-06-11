import { DoubleLinkedList } from 'doublell';
import { Resolvable } from 'freedom-async';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import { BC, useBinding } from 'react-bindings';

export type TransientNodeMaker<ResultT> = (args: { dismiss: (value?: ResultT) => void }) => ReactNode;

export interface TransientContentController {
  present: <ResultT>(makeNode: TransientNodeMaker<ResultT>) => { dismiss: () => void; promise: Promise<ResultT | undefined> };
}

const TransientContentContext = createContext<TransientContentController | undefined>(undefined);

export const TransientContentProvider = ({ children }: { children?: ReactNode }) => {
  const presented = useBinding(() => new DoubleLinkedList<ReactNode>(), { id: 'presented' });

  const controller = useMemo<TransientContentController>(
    () => ({
      present: <ResultT,>(makeNode: TransientNodeMaker<ResultT>) => {
        const thePresented = presented.get();

        const resolvable = new Resolvable<ResultT | undefined>();

        let wasRemoved = false;
        const dismiss = (value?: ResultT) => {
          if (wasRemoved) {
            return;
          }
          wasRemoved = true;

          resolvable.resolve(value);

          setTimeout(() => {
            thePresented.remove(newNode);
            presented.set(thePresented);
          }, ANIMATION_DURATION_MSEC);
        };

        const newNode = thePresented.append(makeNode({ dismiss }));
        presented.set(thePresented);

        return { dismiss, promise: resolvable.promise };
      }
    }),
    [presented]
  );

  return (
    <TransientContentContext value={controller}>
      {BC(presented, (presented) => presented.toArray())}
      {children}
    </TransientContentContext>
  );
};

export const useTransientContent = () => {
  const transientContent = useContext(TransientContentContext);
  if (transientContent === undefined) {
    throw new Error('useTransientContent must be used within a TransientContentProvider');
  }

  return transientContent;
};
