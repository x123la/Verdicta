export const normalizeQuery = (query: string) =>
  query
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s:/.-]+/g, "");
