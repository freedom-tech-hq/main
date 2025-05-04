import * as _ from 'lodash-es';

import type { EffectiveValue, EffectiveValueObject, PackageContext, PropertyPath, TemplateObject, TemplateValue } from '../types/types.ts';
import { inform } from './inform.ts';
import { exposeValue, formatPath, isEffectiveValueObject, isObjectTemplate } from './utils.ts';

export function validateEntry(
  template: TemplateValue,
  value: EffectiveValue,
  context: PackageContext,
  path: PropertyPath = []
): EffectiveValue {
  if (_.isFunction(template)) {
    try {
      let loggedInside = false;
      const result = template({
        ...context,
        // Enrich context
        value,
        exposeValue,
        validate: (newTemplateValue: TemplateValue) => {
          loggedInside = true;
          return validateEntry(newTemplateValue, value, context, path);
        },
        valuePath: formatPath(path),
        error: (message: string) => {
          loggedInside = true;
          inform(false, context, path, message);
          return value; // Allow `return error(...)`
        }
      });

      if (!loggedInside && !_.isEqual(result, value)) {
        inform(true, context, path, `Expected ${exposeValue(result)}, got ${exposeValue(value)}`);
      }

      return result;
    } catch (e: unknown) {
      const error = e as Error;
      inform(false, context, path, error.message);
      return value;
    }
  }

  if (isObjectTemplate(template)) {
    if (!isEffectiveValueObject(value)) {
      inform(false, context, path, `Expected object value, got ${exposeValue(value)}`);
      return value;
    }
    return validateObjectEntry(template, value, context, path);
  }

  if (_.isArray(template)) {
    if (!_.isArray(value)) {
      inform(false, context, path, `Expected array value, got ${exposeValue(value)}`);
      return value;
    }
    const result = template.map((t, i) => validateEntry(t, value[i], context, [...path, i]));

    if (value.length > result.length) {
      inform(true, context, path, `Last ${value.length - result.length} values are being dropped`);
    }

    return result;
  }

  if (template instanceof RegExp) {
    if (!_.isString(value) || !template.test(value)) {
      inform(false, context, path, `Expected to match ${template}, got ${exposeValue(value)}`);
      return value;
    }
    return value;
  }

  if (value !== template) {
    inform(true, context, path, `Expected ${exposeValue(template)}, got ${exposeValue(value)}`);
    return template;
  }

  return template;
}

export function validateObjectEntry(
  objectTemplate: TemplateObject,
  objectValue: EffectiveValueObject,
  context: PackageContext,
  path: PropertyPath = []
): EffectiveValueObject {
  const result: EffectiveValueObject = {};

  // First process template keys in order
  for (const [key, templateValue] of Object.entries(objectTemplate)) {
    const validated = validateEntry(templateValue, objectValue[key] /* can be undefined */, context, [...path, key]);
    // Don't. It is reported inside validateEntry():
    // if (!_.isEqual(validated, objectValue[key])) {
    //   inform(true, context, [...path, key], `Expected ${exposeValue(validated)}, got ${exposeValue(objectValue[key])}`);
    // }
    if (validated !== undefined) {
      result[key] = validated;
    }
  }

  // Then add remaining keys from package.json
  for (const [key, value] of Object.entries(objectValue)) {
    if (!_.has(objectTemplate, key)) {
      result[key] = value;
    }
  }

  if (!_.isEqual(Object.keys(objectValue), Object.keys(result))) {
    inform(true, context, path, `Has different fields set and/or order`);
  }

  return result;
}
