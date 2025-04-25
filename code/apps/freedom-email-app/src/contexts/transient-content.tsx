import { DoubleLinkedList } from 'doublell';
import { noop } from 'lodash-es';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { BC, useBinding } from 'react-bindings';

import { ANIMATION_DURATION_MSEC } from '../modules/virtual-list/consts/animation.ts';

export type TransientNodeMaker = (args: { dismiss: () => void }) => ReactNode;

export interface TransientContentController {
  present: (makeNode: TransientNodeMaker) => () => void;
}

const TransientContentContext = createContext<TransientContentController>({ present: () => noop });

export const TransientContentProvider = ({ children }: { children: ReactNode }) => {
  const presented = useBinding(() => new DoubleLinkedList<ReactNode>(), { id: 'presented' });

  const controller = useMemo<TransientContentController>(
    () => ({
      present: (makeNode: TransientNodeMaker) => {
        const thePresented = presented.get();

        let wasRemoved = false;
        const dismiss = () => {
          if (wasRemoved) {
            return;
          }
          wasRemoved = true;

          setTimeout(() => {
            thePresented.remove(newNode);
            presented.set(thePresented);
          }, ANIMATION_DURATION_MSEC);
        };

        const newNode = thePresented.append(makeNode({ dismiss }));
        presented.set(thePresented);

        return dismiss;
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

export const useTransientContent = () => useContext(TransientContentContext);
