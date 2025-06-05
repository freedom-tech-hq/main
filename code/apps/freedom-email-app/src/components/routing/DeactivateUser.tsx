import { inline } from 'freedom-async';
import React, { useEffect } from 'react';

import { useTasks } from '../../contexts/tasks.tsx';

export const DeactivateUser = () => {
  const tasks = useTasks();

  useEffect(() => {
    if (tasks === undefined) {
      return;
    }

    inline(async () => {
      await tasks.deactivateUser();
    });
  }, [tasks]);

  return <></>;
};
