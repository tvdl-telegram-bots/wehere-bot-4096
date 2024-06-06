import React from "react";

export function useHiddenQuery(
  key: string,
  storagePath: string[]
): string | null | undefined {
  const [fromLS, setFromLS] = React.useState<string | null | undefined>();
  const [fromURL, setFromURL] = React.useState<string | null | undefined>();
  const resolvedStorageKey = ["useHiddenQuery", ...storagePath].join("::");

  React.useEffect(() => {
    const valueFromLocalStorage = localStorage.getItem(resolvedStorageKey);
    setFromLS(valueFromLocalStorage);
  }, []);

  React.useEffect(() => {
    const url = new URL(location.href);
    const valueFromUrl = url.searchParams.get(key);
    setFromURL(valueFromUrl);
    if (valueFromUrl != null) {
      const search = new URLSearchParams(url.searchParams);
      search.delete(key);
      url.search = search.toString();
      history.replaceState(history.state, "", url);
      localStorage.setItem(resolvedStorageKey, valueFromUrl);
    }
  }, []);

  return fromURL ?? fromLS;
}
