import { schema } from 'yaschema';

import { base64String } from './Base64String.ts';

export const uint8ArraySchema = schema.custom<Uint8Array, any>({
  typeName: 'Uint8Array',
  serDes: {
    isValueType: (value) => value instanceof Uint8Array,
    serializedSchema: () => schema.any(),
    serialize: (value) => base64String.schema.serializeAsync(base64String.makeWithBuffer(value)),
    deserialize: async (value) => {
      if (value instanceof Uint8Array) {
        // For binary requests, the body is already a Uint8Array

        return { deserialized: value };
      }

      const deserialization = await base64String.schema.deserializeAsync(value);
      if (deserialization.error !== undefined) {
        return { ...deserialization, deserialized: undefined };
      }

      return { deserialized: base64String.toBuffer(deserialization.deserialized) };
    }
  }
});
