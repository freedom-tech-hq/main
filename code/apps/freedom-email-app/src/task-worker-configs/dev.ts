import type { EmailTasksWebWorkerConfig } from 'freedom-email-tasks-web-worker';

export const dev: EmailTasksWebWorkerConfig = {
  defaultEmailDomain: 'dev.freedommail.me',
  mailApiServerBaseUrl: 'https://api.dev.linefeedr.com'
};
