import type { Tasks } from 'freedom-email-tasks-web-worker';
import type { ThreadLikeId } from 'freedom-email-user';
import { nonAnchoredThreadLikeIdRegex } from 'freedom-email-user';
import { nest } from 'freedom-nest';
import type { IHistory } from 'freedom-web-navigation';
import type { TypeOrPromisedType } from 'yaschema';

export interface AppPathSegmentInfo<SegmentT extends string | [string, RegExp]> {
  segment: SegmentT;
  auth: 'none' | 'optional' | 'required';
  /**
   * If auth is 'optional', this will never be called

  * By default:
   * - if auth is 'none', this deactivates the current user
   * - if auth is 'required', this will redirect to /
   */
  onIncorrectAuth?: (args: { tasks: Tasks; history: IHistory; hasAuth: boolean }) => TypeOrPromisedType<void>;
}

const SEGMENT_INFO = <SegmentT extends string | [string, RegExp]>(
  segment: SegmentT,
  args: Omit<AppPathSegmentInfo<SegmentT>, 'segment'>
): AppPathSegmentInfo<SegmentT> => ({
  ...args,
  segment
});

const segmentInfo = nest(SEGMENT_INFO('', { auth: 'none' }), {
  signIn: SEGMENT_INFO(['sign-in', /[^/]+/], { auth: 'none' }),
  addAccount: SEGMENT_INFO('sign-in', { auth: 'none' }),
  newAccount: SEGMENT_INFO('new-account', { auth: 'none' }),
  importCredential: SEGMENT_INFO('import-credential', { auth: 'none' }),

  mail: nest(SEGMENT_INFO('mail', { auth: 'required' }), {
    compose: SEGMENT_INFO('compose', { auth: 'required' }),
    thread: SEGMENT_INFO(['thread', nonAnchoredThreadLikeIdRegex], { auth: 'required' })
  })
});

const path = nest(
  [segmentInfo],
  (level) => level.value.segment,
  (parent, level) => ({
    signIn: (email: string) => `${parent}/${level.signIn.segment[0]}/${encodeURIComponent(email)}`,
    addAccount: `${parent}/${level.addAccount.segment}`,
    newAccount: `${parent}/${level.newAccount.segment}`,
    importCredential: `${parent}/${level.importCredential.segment}`,

    mail: nest(
      [level.mail],
      (level) => `${parent}/${level.value.segment}`,
      (parent, level) => ({
        compose: `${parent}/${level.compose.segment}`,
        thread: (threadId: ThreadLikeId) => `${parent}/${level.thread.segment[0]}/${threadId}`
      })
    )
  })
);

export const appRoot = { segmentInfo, path };
