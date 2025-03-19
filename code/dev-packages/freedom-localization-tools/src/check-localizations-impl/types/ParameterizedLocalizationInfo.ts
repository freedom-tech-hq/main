export interface ParameterizedLocalizationInfo {
  type: 'parameterized';
  key: string;
  parameters: string[];
  defaultValue: string;
}
