import type { Breakpoint } from '@mui/material';
import { useDerivedBinding } from 'react-bindings';

import { useSizeClass } from './useSizeClass.ts';

const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];

type IsSizeClassOp = '>' | '>=' | '===' | '<=' | '<' | '!==';

const inclusiveOps = new Set<IsSizeClassOp>(['>=', '===', '<=']);
const greaterThanTypeOps = new Set<IsSizeClassOp>(['>', '>=']);

export const useIsSizeClass = (op: IsSizeClassOp, breakpoint: Breakpoint) => {
  const sizeClass = useSizeClass();

  const isInclusiveOp = inclusiveOps.has(op);
  const isGreaterOp = greaterThanTypeOps.has(op);

  return useDerivedBinding(
    sizeClass,
    (sizeClass) => {
      if (sizeClass === breakpoint) {
        return isInclusiveOp;
      } else if (op === '===') {
        return false;
      }

      const sizeClassIndex = breakpointOrder.indexOf(sizeClass);
      const breakpointIndex = breakpointOrder.indexOf(breakpoint);

      return isGreaterOp === sizeClassIndex > breakpointIndex;
    },
    { id: 'useIsSizeClass' }
  );
};
