import { hideBin } from 'yargs/helpers';

import { build } from './build.ts';
import { runApp } from './runApp.ts';

export default () => runApp(hideBin(process.argv), { main: build });
