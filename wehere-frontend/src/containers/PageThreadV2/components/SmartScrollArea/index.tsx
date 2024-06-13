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

// import { Box } from "@radix-ui/themes";
// import cx from "clsx";
// import React from "react";

// import styles from "./index.module.scss";

// type Lock =
//   | {
//       type: "lock-top";
//       focusedElement: Element;
//       distanceToViewportTop: number;
//     }
//   | {
//       type: "lock-bottom";
//       distanceToViewportBottom: number;
//     };

// class State {
//   private items: Set<Element>;
//   private container: Element | undefined;
//   private lock: Lock | undefined;

//   constructor() {
//     this.items = new Set();
//     this.container = undefined;
//     this.lock = undefined;
//   }

//   getLockFromDom(): Lock | undefined {
//     if (!this.container || !this.items.size) return undefined;
//     const container = this.container;
//     let minDistanceToViewportBottom = Infinity;

//     this.items.forEach((item) => {
//       const itemRect = item.getBoundingClientRect();
//       minDistanceToViewportBottom = Math.min(
//         minDistanceToViewportBottom,
//         container.clientHeight - itemRect.bottom
//       );
//     });

//     return {
//       type: "lock-bottom",
//       distanceToViewportBottom: minDistanceToViewportBottom,
//     };
//   }

//   updateLockToMatchDom() {
//     this.lock = this.getLockFromDom();
//   }

//   updateDomToMatchLock() {
//     if (!this.container || !this.lock) return;

//     if (this.lock.type === "lock-bottom") {
//       this.container.scrollTop =
//         this.container.scrollHeight -
//         this.container.clientHeight -
//         this.lock.distanceToViewportBottom;
//     }
//   }

//   addItem(element: Element) {
//     this.items.add(element);
//     console.log(this.items);
//   }

//   removeItem(element: Element) {
//     this.items.delete(element);
//     console.log(this.items);
//   }

//   addContainer(container: Element) {
//     if (this.container) {
//       throw new Error("container already set");
//     }
//     this.container = container;
//   }

//   removeContainer(container: Element) {
//     if (this.container !== container) {
//       throw new Error("container not set");
//     }
//     this.container = undefined;
//   }
// }

// const ViewportContext = React.createContext<State | undefined>(undefined);

// type Props$Viewport = {
//   className?: string;
//   style?: React.CSSProperties;
//   content?: React.ReactNode;
//   children?: React.ReactNode;
//   fill: true;
// };

// function Viewport({
//   className,
//   style,
//   content,
//   children = content,
// }: Props$Viewport) {
//   const stateRef = React.useRef(new State());
//   const state = stateRef.current;
//   const [container, setContainer] = React.useState<Element | null>(null);

//   React.useEffect(() => {
//     if (!container) return;
//     state.addContainer(container);
//     return () => state.removeContainer(container);
//   }, [container]);

//   React.useEffect(() => {
//     if (!container) return;
//     const handler = () => {
//       state.updateLockToMatchDom();
//     };
//     container.addEventListener("scroll", handler);
//     return () => container.removeEventListener("scroll", handler);
//   }, [container]);

//   React.useEffect(() => {
//     if (!container) return;

//     const observer = new ResizeObserver(() => {
//       state.updateDomToMatchLock();
//     });
//     observer.observe(container);

//     return () => observer.unobserve(container);
//   }, [container]);

//   return (
//     <ViewportContext.Provider value={stateRef.current}>
//       <Box
//         className={cx(styles.Viewport, className)}
//         style={style}
//         ref={setContainer}
//         position="absolute"
//         inset="0"
//       >
//         <Box>{children}</Box>
//       </Box>
//     </ViewportContext.Provider>
//   );
// }

// type Props$Item = {
//   className?: string;
//   style?: React.CSSProperties;
//   content?: React.ReactNode;
//   children?: React.ReactNode;
// };

// function Item({ className, style, content, children = content }: Props$Item) {
//   const state = React.useContext(ViewportContext);
//   const [element, setElement] = React.useState<Element | null>(null);

//   React.useEffect(() => {
//     if (!state || !element) return;
//     state.addItem(element);
//     return () => state.removeItem(element);
//   }, [element, state]);

//   return (
//     <Box className={cx(styles.Item, className)} style={style} ref={setElement}>
//       <Box>{children}</Box>
//     </Box>
//   );
// }

// const SmartScrollArea = {
//   Viewport,
//   Item,
// };

// export default SmartScrollArea;
