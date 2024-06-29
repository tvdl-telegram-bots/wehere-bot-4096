import { Theme } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";
import useSWR from "swr";

import styles from "./index.module.scss";
import { getThemeCookie } from "./utils";

type OwnProps = {
  className?: string;
  style?: React.CSSProperties;
  content?: React.ReactNode;
  children?: React.ReactNode;
};

type ForwardedProps = React.ComponentProps<typeof Theme>;

type Props = OwnProps & Omit<ForwardedProps, keyof OwnProps>;

export default function WehereTheme({
  className,
  style,
  content,
  children = content,
  ...others
}: Props) {
  const swr_cookie_theme = useSWR("cookie:theme", () => getThemeCookie());
  const dark = swr_cookie_theme.data === "dark";

  return (
    <Theme
      className={cx(styles.container, className, dark ? "dark" : undefined)}
      style={style}
      accentColor="indigo"
      grayColor="slate"
      radius="medium"
      {...others}
    >
      {children}
    </Theme>
  );
}
