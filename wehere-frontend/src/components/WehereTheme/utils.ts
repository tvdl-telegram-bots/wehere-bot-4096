const NAME = "theme";

export function getThemeCookie(): string | undefined {
  const row = document.cookie
    .split("; ")
    .find((row) => row.startsWith(NAME + "="));
  if (!row) return undefined;
  return row.slice(NAME.length + 1);
}

export function setThemeCookie(value: string) {
  document.cookie = `${NAME}=${value}; SameSite=Strict`;
}
