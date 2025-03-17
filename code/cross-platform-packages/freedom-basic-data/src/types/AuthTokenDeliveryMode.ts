import { schema } from 'yaschema';

export const authTokenDeliveryModeSchema = schema.string('cookie', 'header', 'cookie+header', 'none');
export type AuthTokenDeliveryMode = typeof authTokenDeliveryModeSchema.valueType;
