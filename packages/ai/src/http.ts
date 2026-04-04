export const jsonRequest = async <T>(input: {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: unknown;
}): Promise<T> => {
  const response = await fetch(input.url, {
    method: input.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(input.headers ?? {})
    },
    body: input.body ? JSON.stringify(input.body) : undefined
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
};
