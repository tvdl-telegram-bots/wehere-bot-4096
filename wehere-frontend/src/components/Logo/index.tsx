import { Flex } from "@radix-ui/themes";
import cx from "clsx";
import Image from "next/image";
import React from "react";

import pngLogoColor from "./assets/logo-color.png";
import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  fill: true;
};

export default function Logo({ className, style }: Props) {
  const [src, setSrc] = React.useState<string>();

  return (
    <Flex
      className={cx(
        styles.container,
        className,
        src ? styles.loaded : undefined
      )}
      style={
        {
          ...style,
          "--mask-image": src ? `url(${src})` : undefined,
        } as React.CSSProperties
      }
      position="absolute"
      inset="0"
    >
      <Image
        className={styles.image}
        src={pngLogoColor}
        alt="WeHere"
        onLoad={(e) => setSrc(e.currentTarget.src)}
        fill
      />
      <Flex className={styles.colorMatte} position="absolute" inset="0"></Flex>
    </Flex>
  );
}
