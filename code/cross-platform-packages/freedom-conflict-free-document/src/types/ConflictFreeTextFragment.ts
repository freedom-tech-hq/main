import type { JsonObject } from 'yaschema';

export interface ConflictFreeTextFragment<AttribT extends JsonObject = JsonObject> {
  /** The text in this fragment */
  text: string;

  /** The attributes for the fragment */
  attributes?: AttribT;
}
