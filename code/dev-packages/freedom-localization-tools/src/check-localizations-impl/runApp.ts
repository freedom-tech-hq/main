import yargs from 'yargs/yargs';

import type { MainArgs } from './MainArgs.ts';
import { makeMainArgs } from './makeMainArgs.ts';

export const runApp = (
  args: string[],
  commandCallbacks: {
    main: (args: MainArgs) => Promise<void>;
  }
) =>
  yargs(args)
    .parserConfiguration({ 'unknown-options-as-args': true })
    .help(false)
    .command({
      command: '$0',
      builder: {},
      handler: async (args) => {
        const parsedArgs = await makeMainArgs(args._ as string[]).parse();
        commandCallbacks.main(parsedArgs);
      }
    })
    .parse();
