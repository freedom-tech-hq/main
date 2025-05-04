import * as _ from 'lodash-es';

import type { EffectiveValue, EffectiveValueObject, PropertyPath, TemplateObject, TemplateValue } from '../types/types.ts';

export function isObjectTemplate(template: TemplateValue): template is TemplateObject {
  return _.isPlainObject(template);
}

export function isEffectiveValueObject(value: EffectiveValue): value is EffectiveValueObject {
  return _.isPlainObject(value);
}

export function formatPath(path: PropertyPath): string {
  return path.join('.') || '.';
}

export function exposeValue(value: TemplateValue | EffectiveValue): string {
  if (value === undefined) {
    return '<no key>';
  }

  const s = JSON.stringify(value);
  return s.length > 40 ? s.slice(0, 40) + '…' : s;
}
