import { schema } from 'yaschema';

import type { PushBundle } from './PushBundle.ts';
import { pushBundleSchema } from './PushBundle.ts';
import type { PushFile } from './PushFile.ts';
import { pushFileSchema } from './PushFile.ts';
import type { PushFolder } from './PushFolder.ts';
import { pushFolderSchema } from './PushFolder.ts';

export const pushContentSchema = schema.oneOf3(pushFolderSchema, pushFileSchema, pushBundleSchema);
export type PushContent = PushFolder | PushFile | PushBundle;
