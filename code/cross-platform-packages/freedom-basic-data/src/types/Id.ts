import { MAX_ID_LENGTH, MIN_ID_LENGTH } from '../consts/id.ts';
import { makePrefixedStringSchema } from './PrefixedString.ts';

/** The length of the prefix doesn't count towards the length of the identifier, in terms of fitting within the `MIN_ID_LENGTH` and
 * `MAX_ID_LENGTH` limits. */
export const makeIdSchema = <PrefixT extends `${string}_`>(prefix: PrefixT) =>
  makePrefixedStringSchema(prefix, { allowEmpty: false })
    .clone()
    .setAllowedLengthRange(prefix.length + MIN_ID_LENGTH, prefix.length + MAX_ID_LENGTH);
export type Id<PrefixT extends `${string}_`> = `${PrefixT}${string}`;
