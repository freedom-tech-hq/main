import { useDerivedBinding } from 'react-bindings';

import { useHistory } from './context/history.tsx';

export const useHash = () => {
  const history = useHistory()!;

  return useDerivedBinding(history.top, (top) => top.hash ?? '', { id: 'hash' });
};
