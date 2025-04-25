import { useDerivedBinding } from 'react-bindings';

import { useHistory } from './context/history.tsx';

export const useSearch = () => {
  const history = useHistory()!;

  return useDerivedBinding(history.top, (top) => top.search ?? {}, { id: 'search' });
};
