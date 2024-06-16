import { Box } from "@radix-ui/themes";
import cx from "clsx";
import React from "react";

import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  content?: React.ReactNode;
  children?: React.ReactNode;
  minChildKey: React.Key;
  maxChildKey: React.Key;
  fill: true;
};

type Snapshot = {
  scrollDelta: number; // container.scrollHeight - container.scrollTop
  stickToBottom: boolean;
};

// https://legacy.reactjs.org/docs/react-component.html#getsnapshotbeforeupdate
export default class SmartScrollArea extends React.Component<
  Props,
  Record<string, never>,
  Snapshot | undefined
> {
  private containerRef: React.RefObject<HTMLDivElement>;

  constructor(props: Props) {
    super(props);
    this.containerRef = React.createRef();
  }

  getSnapshotBeforeUpdate(): Snapshot | undefined {
    // Are we adding new items to the list?
    // Capture the scroll position so we can adjust scroll later.
    const container = this.containerRef.current;
    if (!container) return undefined;
    return {
      scrollDelta: container.scrollHeight - container.scrollTop,
      stickToBottom:
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - Math.E,
    };
  }

  componentDidUpdate(
    prevProps: Props,
    _prevState: Record<string, never>,
    snapshot: Snapshot | undefined
  ) {
    const container = this.containerRef.current;
    if (!snapshot) return;
    if (!container) return;

    if (
      this.props.maxChildKey > prevProps.maxChildKey &&
      snapshot.stickToBottom
    ) {
      // new elements appended
      container.scrollTop = container.scrollHeight;
    } else if (this.props.minChildKey < prevProps.minChildKey) {
      // new elements prepended
      container.scrollTop = container.scrollHeight - snapshot.scrollDelta;
    }
  }

  render() {
    return (
      <Box
        className={cx(styles.container, this.props.className)}
        style={this.props.style}
        ref={this.containerRef}
        overflowX="hidden"
        overflowY="auto"
        position="absolute"
        inset="0"
      >
        {this.props.children}
      </Box>
    );
  }
}
