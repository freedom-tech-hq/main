import { hideBin } from 'yargs/helpers';

import { runApp } from './runApp.ts';
import { serve } from './serve.ts';

export default () => runApp(hideBin(process.argv), { main: serve });
