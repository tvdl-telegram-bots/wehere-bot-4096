import { Badge, Button, Flex } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";

import { useIsGonnaVisible } from "./hooks/useIsGonnaVisible";
import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  labelReady?: React.ReactNode;
  labelBusy?: React.ReactNode;
  labelDisabled?: React.ReactNode;
  height?: string;
  onClick?: () => void;
};

export default function AutoTrigger({
  className,
  style,
  disabled,
  labelReady,
  labelBusy,
  labelDisabled,
  height,
  onClick,
}: Props) {
  const [busy, setBusy] = React.useState(false);
  const [container, setContainer] = React.useState<Element | null>(null);
  const [numTrialsRemaining, setNumTrialsRemaining] = React.useState(8);

  const trigger = onClick
    ? async (isAutoTriggered: boolean) => {
        setBusy(true);
        setNumTrialsRemaining((value) =>
          isAutoTriggered ? Math.max(value - 1, 0) : 8
        );
        try {
          await Promise.resolve(onClick());
        } finally {
          setBusy(false);
        }
      }
    : undefined;

  const isContainerGonnaVisible = useIsGonnaVisible({
    element: container,
    rootMargin: "5%",
  });

  React.useEffect(() => {
    if (
      isContainerGonnaVisible &&
      !busy &&
      !disabled &&
      trigger &&
      numTrialsRemaining > 0
    ) {
      trigger(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isContainerGonnaVisible,
    busy,
    disabled,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    !trigger,
    numTrialsRemaining,
  ]);

  return (
    <Flex
      className={cx(styles.container, className)}
      style={style}
      ref={setContainer}
      justify="center"
      align="center"
      height={height}
    >
      {disabled ? (
        <Badge
          className={styles.slowlyAppear}
          key={1}
          color="gray"
          variant="solid"
          size="2"
        >
          {labelDisabled}
        </Badge>
      ) : busy ? (
        <Badge
          className={styles.slowlyAppear}
          key={2}
          color="gray"
          variant="solid"
          size="2"
        >
          {labelBusy}
        </Badge>
      ) : (
        <Button
          className={styles.slowlyAppear}
          key={3}
          disabled={!trigger}
          onClick={() => trigger?.(false)}
          variant="solid"
        >
          {labelReady}
        </Button>
      )}
    </Flex>
  );
}
