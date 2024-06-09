import { PlusIcon } from "@radix-ui/react-icons";
import { Button, Flex } from "@radix-ui/themes";
import cx from "clsx";
import Link from "next/link";
import React from "react";

import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  fill: true;
};

export default function SideBar({ className, style }: Props) {
  return (
    <Flex
      className={cx(styles.container, className)}
      style={style}
      direction="column"
    >
      <Link href="/">{"WeHere"}</Link>
      {/* <Button>
        <PlusIcon />
        {"New Thread"}
      </Button> */}
    </Flex>
  );
}
