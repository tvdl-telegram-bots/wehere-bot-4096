export function getUrl(
  origin: string,
  path: string,
  query: Record<string, string | number | boolean | null | undefined> = {}
) {
  if (origin.endsWith("/")) throw RangeError("invalid origin");
  if (!path.startsWith("/")) throw RangeError("invalid path");

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null) {
      search.append(key, value.toString());
    }
  }
  return search.size > 0
    ? origin + path + "?" + search.toString()
    : origin + path;
}

export async function httpPost(
  url: string,
  body: unknown,
  options: { signal?: AbortSignal; cache?: RequestCache } = {}
): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body, null, 2),
    signal: options.signal,
    cache: options.cache || "no-cache",
  });
  if (!response.ok) {
    const text = await response.text().catch(() => undefined);
    throw new Error(
      `response not ok (status=${response.status}), url=${url}`, //
      { cause: { status: response.status, text } }
    );
  }
  const data = await response.json();
  return data;
}

export async function httpGet(
  url: string,
  options: {
    signal?: AbortSignal;
    cache: RequestCache;
    next?: NextFetchRequestConfig; // https://nextjs.org/docs/app/api-reference/functions/fetch
  }
): Promise<unknown> {
  const response = await fetch(url, {
    signal: options.signal,
    cache:
      options.next?.revalidate != null
        ? undefined
        : options.cache || "no-cache",
    next: options.next,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => undefined);
    throw new Error(
      `response not ok (status=${response.status}), url=${url}`, //
      { cause: { status: response.status, text } }
    );
  }
  const data = await response.json();
  return data;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function doesExist<T>(value: T | null | undefined): value is T {
  return value != null;
}

export function minElement<T>(
  values: (T | null | undefined)[],
  initialValue: T
): T {
  let result = initialValue;
  for (const value of values) {
    if (value != null && value < result) {
      result = value;
    }
  }
  return result;
}

export function maxElement<T>(
  values: (T | null | undefined)[],
  initialValue: T
): T {
  let result = initialValue;
  for (const value of values) {
    if (value != null && value > result) {
      result = value;
    }
  }
  return result;
}
