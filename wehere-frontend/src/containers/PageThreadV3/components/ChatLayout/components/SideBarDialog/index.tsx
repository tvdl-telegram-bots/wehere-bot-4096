import * as RxDialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { Box, Flex, IconButton } from "@radix-ui/themes";
import React from "react";
import WehereTheme from "wehere-frontend/src/components/WehereTheme";
import SideBarV2 from "wehere-frontend/src/containers/PageThreadV3/containers/SideBarV2";
import { flex } from "wehere-frontend/src/utils/frontend";

import type { ActivePage } from "../../types";

import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
  trigger: React.ReactNode;
  activePage?: ActivePage;
};

export default function SideBarDialog({ trigger, activePage }: Props) {
  return (
    <RxDialog.Root modal>
      <RxDialog.Trigger asChild>{trigger}</RxDialog.Trigger>
      <RxDialog.Portal>
        <WehereTheme asChild>
          <RxDialog.Overlay className={styles.overlay}>
            <RxDialog.Content className={styles.content}>
              <Flex position="absolute" inset="0" direction="column">
                <Flex {...flex.hard} height="56px" align="center" px="4">
                  <RxDialog.Close asChild>
                    <IconButton variant="ghost" color="gray">
                      <Cross2Icon width="24px" height="24px" />
                    </IconButton>
                  </RxDialog.Close>
                </Flex>
                <Box {...flex.soft} position="relative" width="100%">
                  <SideBarV2 activePage={activePage} transparent fill />
                </Box>
              </Flex>
            </RxDialog.Content>
          </RxDialog.Overlay>
        </WehereTheme>
      </RxDialog.Portal>
    </RxDialog.Root>
  );
}
