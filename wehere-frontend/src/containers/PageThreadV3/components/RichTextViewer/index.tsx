import cx from "clsx";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import React from "react";
import type * as Telegram from "wehere-bot/src/typing/telegram";

import styles from "./index.module.scss";
import { schema, toDoc } from "./utils";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  text: string;
  entities: Telegram.MessageEntity[];
  unstyled: true | ["a", "b", "i", "p", "u"];
};

export default function RichTextViewer({
  className,
  style,
  text,
  entities,
}: Props) {
  const [container, setContainer] = React.useState<Element | null>(null);

  React.useEffect(() => {
    if (!container) return;
    const doc = toDoc(text, entities);
    const state = EditorState.create({ schema, doc });
    const view = new EditorView(container, { state, editable: () => false });
    return () => view.destroy();
  }, [container, entities, text]);

  return (
    <div
      className={cx(
        styles.container,
        className,
        container ? styles.mounted : undefined
      )}
      style={style}
      ref={setContainer}
    >
      {container ? undefined : text}
    </div>
  );
}
