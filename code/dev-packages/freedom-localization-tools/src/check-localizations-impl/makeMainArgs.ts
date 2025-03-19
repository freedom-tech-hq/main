import yargs from 'yargs/yargs';

export const makeMainArgs = (args: string[]) =>
  yargs(args).option('in', { alias: 'i', type: 'string', default: './', describe: 'The folder to look for files in' });
