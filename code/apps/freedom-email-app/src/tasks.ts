import { expose } from 'comlink';

import type { getMailCollectionsTask } from './tasks/mail/getMailCollectionsTask.ts';
import type { getMailForThreadTask } from './tasks/mail/getMailForThreadTask.ts';
import type { getMailThreadsForCollectionTask } from './tasks/mail/getMailThreadsForCollectionTask.ts';
import type { FuncForceReturnTypePromise } from './types/FuncForceReturnTypePromise.ts';

type GetMailForThreadTask = FuncForceReturnTypePromise<typeof getMailForThreadTask>;
type GetMailCollectionsTask = FuncForceReturnTypePromise<typeof getMailCollectionsTask>;
type GetMailThreadsForCollectionTask = FuncForceReturnTypePromise<typeof getMailThreadsForCollectionTask>;

export interface Tasks {
  readonly getMailForThreadTask: GetMailForThreadTask;
  readonly getMailCollectionsTask: GetMailCollectionsTask;
  readonly getMailThreadsForCollectionTask: GetMailThreadsForCollectionTask;
}

class TasksImpl implements Tasks {
  public readonly getMailForThreadTask = async (...args: Parameters<GetMailForThreadTask>): ReturnType<GetMailForThreadTask> =>
    (await import('./tasks/mail/getMailForThreadTask.ts')).getMailForThreadTask(...args);
  public readonly getMailCollectionsTask = async (...args: Parameters<GetMailCollectionsTask>): ReturnType<GetMailCollectionsTask> =>
    (await import('./tasks/mail/getMailCollectionsTask.ts')).getMailCollectionsTask(...args);
  public readonly getMailThreadsForCollectionTask = async (
    ...args: Parameters<GetMailThreadsForCollectionTask>
  ): ReturnType<GetMailThreadsForCollectionTask> =>
    (await import('./tasks/mail/getMailThreadsForCollectionTask.ts')).getMailThreadsForCollectionTask(...args);
}

expose(TasksImpl);
