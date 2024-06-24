import { Theme } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";

import styles from "./index.module.scss";

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
  return (
    <Theme
      className={cx(styles.container, className)}
      style={style}
      //   style={{ ...style, "--cursor-button": "pointer" } as React.CSSProperties}
      accentColor="indigo"
      grayColor="slate"
      radius="medium"
      {...others}
    >
      {children}
    </Theme>
  );
}
