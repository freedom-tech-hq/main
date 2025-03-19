import { hideBin } from 'yargs/helpers';

import { checkLocalizationConsistency } from './checkLocalizationConsistency.ts';
import { runApp } from './runApp.ts';

export default () => runApp(hideBin(process.argv), { main: checkLocalizationConsistency });
