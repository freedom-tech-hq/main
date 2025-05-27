/* node:coverage disable */

let id = 0;

/**
 * When you log a series of events and a graphical diff tool
 * struggles to match up the respective entries from different runs, add this:
 *
 *   console.log(your, step, data, getDiffAnchor());
 *
 * or in the beginning if you like.
 */
export const getDiffAnchor = () => {
  id++;
  return `\n======= .${`${id}.`.repeat(30)} =======\n`;
};
