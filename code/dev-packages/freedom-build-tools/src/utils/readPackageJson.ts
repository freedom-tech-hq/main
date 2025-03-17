import fs from 'node:fs/promises';

import { schema } from 'yaschema';

const packageSchema = schema.object({
  name: schema.string()
});

export const readPackageJson = async () => {
  const packageDeserialization = await packageSchema.deserializeAsync(JSON.parse(await fs.readFile('./package.json', 'utf-8')), {
    validation: 'hard'
  });
  if (packageDeserialization.error !== undefined) {
    throw new Error(`Unable to parse package.json file: ${packageDeserialization.error}`);
  }

  return packageDeserialization.deserialized;
};
