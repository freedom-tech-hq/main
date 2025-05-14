const basicTypes = new Set(['bigint', 'boolean', 'function', 'number', 'string', 'symbol']);

export const genericValueType = (value: any): string => {
  if (value === undefined) {
    return 'undefined';
  } else if (value === null) {
    return 'null';
  }

  const theType = typeof value;
  if (basicTypes.has(theType)) {
    return theType;
  } else if (Array.isArray(value)) {
    return 'array';
  } else {
    return 'object';
  }
};
