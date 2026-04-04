import type { DocumentSearchResult } from "@verdicta/shared";

export const rankSearchResults = (results: DocumentSearchResult[]) =>
  [...results].sort((left, right) => right.matchScore - left.matchScore);
