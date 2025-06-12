import { makeUuid } from 'freedom-contexts';
import { useMemo } from 'react';

export const useUuid = () => useMemo(() => makeUuid(), []);
