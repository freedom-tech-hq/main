export const genericValueToString = (value: any): string => internalGenericValueToString(value).substring(0, 1024).normalize('NFD');

// Helpers

const internalGenericValueToString = (value: any): string => {
  try {
    if (value === undefined) {
      return 'undefined';
    } else if (value === null) {
      return 'null';
    } else if (typeof value === 'bigint') {
      return String(value);
    } else if (typeof value === 'function') {
      return 'function';
    } else if (typeof value === 'object' && typeof (value as { toString?: any }).toString === 'function') {
      const toStringFunc = (value as { toString: () => string }).toString;
      return toStringFunc !== Object.prototype.toString ? toStringFunc() : JSON.stringify(value);
    } else {
      return JSON.stringify(value);
    }
  } catch (_e) {
    return String(value);
  }
};
