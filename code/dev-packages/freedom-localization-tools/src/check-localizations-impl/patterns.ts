// Example: LOCALIZE('Hello')({ ns: 'demo' })
// Example: LOCALIZE('Hello')({ ns: 'demo', key: 'hello' })
// Example: LOCALIZE`Hello ${'name'}`({ ns: 'demo' });
// Example: LOCALIZE`Hello ${'name'}`({ ns: 'demo', key: 'hello' });

const singleQuoteStringRegex = /'(?:[^'\\\\]|\\.)*?'/;
const doubleQuoteStringRegex = /"(?:[^"\\\\]|\\.)*?"/;
const backtickQuoteStringRegex = /`(?:[^`\\\\]|\\.)*?`/; // Not supporting template parameters here
const anyStringRegex = new RegExp(
  `(?:(?:${singleQuoteStringRegex.source})|(?:${doubleQuoteStringRegex.source})|(?:${backtickQuoteStringRegex.source}))`
);
const anyIdentifierRegex = /[$_a-zA-Z][$_a-zA-Z0-9]*/; // This is very simplified from the actual JavaScript identifier spec
const recordKeyRegex = new RegExp(`(?:${anyIdentifierRegex.source}|\\[\\s*${anyStringRegex.source}\\s*\\])`);
const stringValueRecordEntryRegex = new RegExp(`(?:${recordKeyRegex.source}(?:\\s*:\\s*(?:${anyStringRegex.source}))?)`);
const optionsRegex = new RegExp(
  `\\((?:\\{\\s*(?:${stringValueRecordEntryRegex.source}(?:\\s*,\\s*${stringValueRecordEntryRegex.source}\\s*)*)?\\s*\\})?\\)`
);
export const simpleLocalizeRegex = new RegExp(`LOCALIZE\\(\\s*(${anyStringRegex.source})\\s*\\)(${optionsRegex.source})`);
export const simpleLocalizeRegexGlobal = new RegExp(simpleLocalizeRegex.source, 'g');

const templateParameterRegex = new RegExp(`\\$\\{\\s*(?:${anyStringRegex.source})\\s*\\}`);
export const templateParameterRegexCapturing = new RegExp(`\\$\\{\\s*(${anyStringRegex.source})\\s*\\}`);
export const templateStringPartRegex = new RegExp(`(?:[^\`$\\\\]|\\\\.|(?:${templateParameterRegex.source}))`);
export const templateStringPartRegexGlobal = new RegExp(`(${templateStringPartRegex.source})`, 'g');
export const parameterizedLocalizeRegex = new RegExp(`LOCALIZE\`((?:${templateStringPartRegex.source})*?)\`(${optionsRegex.source})`);
export const parameterizedLocalizeRegexGlobal = new RegExp(parameterizedLocalizeRegex.source, 'g');

// Example: const ns = 'demo';
export const nsDefinitionRegex = new RegExp(`const\\s+ns\\s+=\\s+(${anyStringRegex.source})\\s*;`);
