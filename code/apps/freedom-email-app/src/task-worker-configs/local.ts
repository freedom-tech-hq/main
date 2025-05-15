import type { EmailTasksWebWorkerConfig } from 'freedom-email-tasks-web-worker';

export const local: EmailTasksWebWorkerConfig = {
  defaultEmailDomain: 'local.dev.freedommail.me',
  mailApiServerBaseUrl: 'https://mail.local.dev.freedommail.me:8443'
};
