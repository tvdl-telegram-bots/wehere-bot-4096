import useSWR, { useSWRConfig } from "swr";

const NAME = "theme";

function getThemeCookie(): string | undefined {
  const row = document.cookie
    .split("; ")
    .find((row) => row.startsWith(NAME + "="));
  if (!row) return undefined;
  return row.slice(NAME.length + 1);
}

function setThemeCookie(value: string) {
  document.cookie = `${NAME}=${value}; SameSite=Strict`;
}

export function useThemeControl() {
  const swr_cookie_theme = useSWR("cookie:theme", () => getThemeCookie());
  const { mutate } = useSWRConfig();

  return {
    dark: swr_cookie_theme.data === "dark",
    setDark: (dark: boolean) => {
      setThemeCookie(dark ? "dark" : "light");
      mutate("cookie:theme", dark ? "dark" : "light");
    },
  };
}
