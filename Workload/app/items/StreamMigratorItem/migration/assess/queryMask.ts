/**
 * Comment and string-literal masking shared by the query scanners.
 *
 * Kept apart from queryAnalysis.ts so queryStructure.ts can use it without an
 * import cycle.
 */

/**
 * Blanks comments and string literals with spaces, preserving offsets and newlines.
 *
 * `stringFill` replaces string literals with that character instead of spaces,
 * for scanners that must still see where a literal sits (e.g. to keep a
 * trailing `WHERE x = 'y'` inside a statement's span) without reading it.
 */
export function maskQuery(query: string, stringFill = " "): string {
  const blank = (text: string) => text.replace(/[^\n]/g, " ");
  const fill = (text: string) => text.replace(/[^\n]/g, stringFill);
  return (query || "")
    .replace(/\/\*[\s\S]*?\*\/|--[^\n\r]*|'(?:[^']|'')*'/g, text =>
      text[0] === "'" ? fill(text) : blank(text)
    );
}
