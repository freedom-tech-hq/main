import type { JsonObject } from 'yaschema';

import type { ConflictFreeDocumentField } from './ConflictFreeDocumentField.ts';
import type { ConflictFreeTextFragment } from './ConflictFreeTextFragment.ts';

export interface ConflictFreeTextField<AttribT extends JsonObject = JsonObject>
  extends ConflictFreeDocumentField<ConflictFreeTextField<AttribT>> {
  /** Deletes all text */
  readonly clear: () => void;

  /** Deletes the text in the specified range */
  readonly delete: (start: number, end?: number) => void;

  /** Gets the number of characters in the text */
  readonly getLength: () => number;

  /** Gets all of part of the text, without attributes */
  readonly getString: (start?: number, end?: number) => string;

  /** Gets an array of text fragments, each of which may have attributes */
  readonly getTextFragments: () => ConflictFreeTextFragment<AttribT>[];

  /** Insert (if a position or empty range is given) or replaces text or update attributes.  If a value is not provided, text is kept as is
   * but the attributes are updated (new attributes are merged with old attributes for the specified range). */
  readonly replace: (positionOrRange: number | [number, number | undefined], value: string | undefined, attributes?: AttribT) => void;
}
