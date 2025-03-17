export interface TokensOrText {
  isToken: boolean;
  value: string;
}

export const tokenize = (value: string, regex: RegExp): TokensOrText[] => {
  const searchRegex = new RegExp(`([^]*?)(${regex.source})`, regex.flags + 'y');

  const output: TokensOrText[] = [];

  searchRegex.lastIndex = 0;
  while (true) {
    const startIndex = searchRegex.lastIndex;
    const match = searchRegex.exec(value);
    if (match === null) {
      output.push({ isToken: false, value: value.substring(startIndex) });
      break;
    } else {
      if (match[1].length > 0) {
        output.push({ isToken: false, value: match[1] });
      }
      output.push({ isToken: true, value: match[2] });
    }
  }

  return output;
};
