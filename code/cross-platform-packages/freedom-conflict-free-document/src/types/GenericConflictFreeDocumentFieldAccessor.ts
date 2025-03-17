import type { JsonObject, Schema } from 'yaschema';
import type * as Y from 'yjs';

import { reservedFieldNamePrefix } from '../internal/consts/fields.ts';
import type { ConflictFreeDocumentFieldInfos } from '../internal/types/ConflictFreeDocumentFieldInfos.ts';
import { makeConflictFreeArrayFieldFromYArray } from '../internal/utils/makeConflictFreeArrayFieldFromYArray.ts';
import { makeConflictFreeBooleanFieldFromYText } from '../internal/utils/makeConflictFreeBooleanFieldFromYText.ts';
import { makeConflictFreeMapFieldFromYMap } from '../internal/utils/makeConflictFreeMapFieldFromYMap.ts';
import { makeConflictFreeNumericFieldFromYText } from '../internal/utils/makeConflictFreeNumericFieldFromYText.ts';
import { makeConflictFreeObjectFieldFromYArray } from '../internal/utils/makeConflictFreeObjectFieldFromYArray.ts';
import { makeConflictFreeRestrictedTextFieldFromYText } from '../internal/utils/makeConflictFreeRestrictedTextFieldFromYText.ts';
import { makeConflictFreeSetFieldFromYMap } from '../internal/utils/makeConflictFreeSetFieldFromYMap.ts';
import { makeConflictFreeTextFieldFromYText } from '../internal/utils/makeConflictFreeTextFieldFromYText.ts';
import type { ConflictFreeArrayField } from './ConflictFreeArrayField.ts';
import type { ConflictFreeBooleanField } from './ConflictFreeBooleanField.ts';
import type { ConflictFreeMapField } from './ConflictFreeMapField.ts';
import type { ConflictFreeNumericField } from './ConflictFreeNumericField.ts';
import type { ConflictFreeObjectField } from './ConflictFreeObjectField.ts';
import type { ConflictFreeRestrictedTextField } from './ConflictFreeRestrictedTextField.ts';
import type { ConflictFreeSetField } from './ConflictFreeSetField.ts';
import type { ConflictFreeTextField } from './ConflictFreeTextField.ts';

export class GenericConflictFreeDocumentFieldAccessor {
  readonly #yDoc: Y.Doc;
  readonly #fieldInfos: ConflictFreeDocumentFieldInfos;

  constructor(yDoc: Y.Doc, fieldInfos: ConflictFreeDocumentFieldInfos) {
    this.#yDoc = yDoc;
    this.#fieldInfos = fieldInfos;
  }

  public getArrayField<ValueT>(fieldName: string, schema: Schema<ValueT>): ConflictFreeArrayField<ValueT> {
    /* node:coverage disable */
    if (fieldName.startsWith(reservedFieldNamePrefix)) {
      throw new Error(`${fieldName} is reserved`);
    }
    /* node:coverage enable */

    return makeConflictFreeArrayFieldFromYArray(this.#yDoc, this.#fieldInfos, fieldName, schema);
  }

  public getArrayFieldNames(): Set<string> {
    return new Set(this.#fieldInfos.array);
  }

  public getBooleanField(fieldName: string): ConflictFreeBooleanField {
    /* node:coverage disable */
    if (fieldName.startsWith(reservedFieldNamePrefix)) {
      throw new Error(`${fieldName} is reserved`);
    }
    /* node:coverage enable */

    return makeConflictFreeBooleanFieldFromYText(this.#yDoc, this.#fieldInfos, fieldName);
  }

  public getBooleanFieldNames(): Set<string> {
    return new Set(this.#fieldInfos.boolean);
  }

  public getMapField<KeyT extends string, ValueT>(fieldName: string, schema: Schema<ValueT>): ConflictFreeMapField<KeyT, ValueT> {
    /* node:coverage disable */
    if (fieldName.startsWith(reservedFieldNamePrefix)) {
      throw new Error(`${fieldName} is reserved`);
    }
    /* node:coverage enable */

    return makeConflictFreeMapFieldFromYMap(this.#yDoc, this.#fieldInfos, fieldName, schema);
  }

  public getMapFieldNames(): Set<string> {
    return new Set(this.#fieldInfos.map);
  }

  public getNumericField(fieldName: string): ConflictFreeNumericField {
    /* node:coverage disable */
    if (fieldName.startsWith(reservedFieldNamePrefix)) {
      throw new Error(`${fieldName} is reserved`);
    }
    /* node:coverage enable */

    return makeConflictFreeNumericFieldFromYText(this.#yDoc, this.#fieldInfos, fieldName);
  }

  public getNumericFieldNames(): Set<string> {
    return new Set(this.#fieldInfos.numeric);
  }

  public getObjectField<ValueT>(fieldName: string, schema: Schema<ValueT>): ConflictFreeObjectField<ValueT> {
    /* node:coverage disable */
    if (fieldName.startsWith(reservedFieldNamePrefix)) {
      throw new Error(`${fieldName} is reserved`);
    }
    /* node:coverage enable */

    return makeConflictFreeObjectFieldFromYArray(this.#yDoc, this.#fieldInfos, fieldName, schema);
  }

  public getRestrictedTextField<ValueT extends string>(
    fieldName: string,
    defaultValue: NoInfer<ValueT>
  ): ConflictFreeRestrictedTextField<ValueT> {
    /* node:coverage disable */
    if (fieldName.startsWith(reservedFieldNamePrefix)) {
      throw new Error(`${fieldName} is reserved`);
    }
    /* node:coverage enable */

    return makeConflictFreeRestrictedTextFieldFromYText(this.#yDoc, this.#fieldInfos, fieldName, defaultValue);
  }

  public getRestrictedTextFieldNames(): Set<string> {
    return new Set(this.#fieldInfos.restrictedText);
  }

  public getSetField<ValueT extends string = string>(fieldName: string): ConflictFreeSetField<ValueT> {
    /* node:coverage disable */
    if (fieldName.startsWith(reservedFieldNamePrefix)) {
      throw new Error(`${fieldName} is reserved`);
    }
    /* node:coverage enable */

    return makeConflictFreeSetFieldFromYMap(this.#yDoc, this.#fieldInfos, fieldName);
  }

  public getSetFieldNames(): Set<string> {
    return new Set(this.#fieldInfos.set);
  }

  public getTextField<AttribT extends JsonObject = Record<string, never>>(fieldName: string): ConflictFreeTextField<AttribT> {
    /* node:coverage disable */
    if (fieldName.startsWith(reservedFieldNamePrefix)) {
      throw new Error(`${fieldName} is reserved`);
    }
    /* node:coverage enable */

    return makeConflictFreeTextFieldFromYText(this.#yDoc, this.#fieldInfos, fieldName);
  }

  public getTextFieldNames(): Set<string> {
    return new Set(this.#fieldInfos.text);
  }
}
