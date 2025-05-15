import type { EmailTasksWebWorkerConfig } from 'freedom-email-tasks-web-worker';

export const production: EmailTasksWebWorkerConfig = {
  defaultEmailDomain: 'freedommail.me',
  mailApiServerBaseUrl: 'https://api.freedommail.me'
};
