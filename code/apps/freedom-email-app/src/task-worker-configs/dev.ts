import type { EmailTasksWebWorkerConfig } from 'freedom-email-tasks-web-worker';

export const dev: EmailTasksWebWorkerConfig = {
  defaultEmailDomain: 'mail-host.dev.linefeedr.com',
  mailApiServerBaseUrl: 'https://api.dev.linefeedr.com'
};
