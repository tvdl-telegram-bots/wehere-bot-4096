import React from "react";
import styles from "./index.module.scss";
import cx from "clsx";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

export default function PageChat({ className, style }: Props) {
  return (
    <div className={cx(styles.container, className)} style={style}>
      Content here...
    </div>
  );
}
