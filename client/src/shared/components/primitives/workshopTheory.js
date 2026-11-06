/** Returns the public URL of a theory chapter Markdown file. */
export function getTheoryPath(theoryId) {
  if (!theoryId) return undefined;
  return `/public/theory/${encodeURIComponent(theoryId)}.md`;
}
