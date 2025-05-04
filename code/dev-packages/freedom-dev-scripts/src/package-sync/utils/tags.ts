import * as _ from 'lodash-es';

import type { EffectiveValue, TemplateContext, TemplateFunction, TemplateObject } from '../types/types.ts';

export const ALLOW_ANY: TemplateFunction = ({ value }) => value;

export function PER_PACKAGE(options: TemplateObject): TemplateFunction {
  return (context: TemplateContext) => {
    // Select
    let selectedTemplate = options['*'];
    if (_.has(options, context.package)) {
      selectedTemplate = options[context.package];
    }

    // Standard check
    return context.validate(selectedTemplate);
  };
}

export function KEEP_ORDER(objectTemplate: TemplateObject): TemplateFunction {
  return ({ value: rawValue, exposeValue, validate, error }: TemplateContext) => {
    // Type check
    if (!_.isPlainObject(rawValue)) {
      return error(`Expected object, got ${exposeValue(rawValue)}`);
    }
    const value = rawValue as Record<string, EffectiveValue>;

    // Reorder template to preserve the keys
    const reorderedTemplate: TemplateObject = {};
    for (const key of Object.keys(value)) {
      reorderedTemplate[key] = _.has(objectTemplate, key) ? objectTemplate[key] : value[key];
    }
    for (const key of Object.keys(objectTemplate)) {
      if (!_.has(value, key)) {
        reorderedTemplate[key] = objectTemplate[key];
      }
    }

    // Standard check
    return validate(reorderedTemplate);
  };
}
