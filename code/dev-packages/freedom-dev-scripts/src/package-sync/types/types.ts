export interface FoundPackage {
  group: string;
  package: string;
  packageName: string;
  packagePath: string;
}

export type PropertyPath = (string | number)[];

export interface TemplateContext {
  group: string;
  packageName: string;
  package: string;
  value: EffectiveValue;
  exposeValue: (value: TemplateValue | EffectiveValue) => string;
  valuePath: string;
  validate: (templateValue: TemplateValue) => EffectiveValue;
  error: (message: string) => EffectiveValue;
  isDryRun: boolean;
}

export type PackageContext = Pick<TemplateContext, 'group' | 'packageName' | 'package' | 'isDryRun'>;

export interface TemplateFunction {
  (context: TemplateContext): EffectiveValue;
}

// JSON + undefined (= no field)
export type EffectiveValue = string | number | boolean | null | EffectiveValueObject | EffectiveValue[] | undefined;
export type EffectiveValueObject = { [key: string]: EffectiveValue };

export type TemplateValue =
  // JSON-like
  | TemplateObject
  | TemplateValue[]
  | string
  | number
  | boolean
  | null
  // No key
  | undefined
  // Template variants
  | TemplateFunction
  | RegExp;
export type TemplateObject = { [key: string]: TemplateValue };
