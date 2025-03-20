import { hideBin } from 'yargs/helpers';

import { copyTemplate } from './copyTemplate.ts';
import { runApp } from './runApp.ts';

export default () => runApp(hideBin(process.argv), { main: copyTemplate });
