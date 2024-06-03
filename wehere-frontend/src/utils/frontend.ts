export function getUrl(
  path: string,
  query: Record<string, string | number | boolean | null | undefined> = {}
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null) {
      search.append(key, value.toString());
    }
  }
  return search.size > 0 ? path + "?" + search.toString() : path;
}
