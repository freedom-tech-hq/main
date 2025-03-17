import fs from 'node:fs/promises';

import { schema } from 'yaschema';

const tsConfigSchema = schema.object({
  compilerOptions: schema.object({
    outDir: schema.string().allowEmptyString()
  }),
  include: schema.array({ items: schema.string().allowEmptyString() }),
  exclude: schema.array({ items: schema.string().allowEmptyString() })
});

export const readTsConfig = async ({ tsconfigPath }: { tsconfigPath: string }) => {
  const tsConfigDeserialization = await tsConfigSchema.deserializeAsync(JSON.parse(await fs.readFile(tsconfigPath, 'utf-8')), {
    validation: 'hard'
  });
  if (tsConfigDeserialization.error !== undefined) {
    throw new Error(`Unable to parse ${tsconfigPath} file: ${tsConfigDeserialization.error}`);
  }
  return tsConfigDeserialization.deserialized;
};
