"use client";

import { Box, Container, Flex } from "@radix-ui/themes";
import cx from "clsx";
import Image from "next/image";
import React from "react";
import useSWR from "swr";
import { Result$GetTemplates } from "wehere-frontend/src/app/api/get-templates/typing";
import WehereTheme from "wehere-frontend/src/components/WehereTheme";
import { httpGet } from "wehere-frontend/src/utils/shared";

import pngLogoColor from "../PageHome/assets/logo-color.png";
import RichTextViewer from "../PageThreadV3/components/RichTextViewer";

import InfoLayout from "./components/InfoLayout";
import styles from "./index.module.scss";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

export default function PageAbout({ className, style }: Props) {
  const swr_GetTemplates = useSWR("/api/get-templates", (url) =>
    httpGet(url, { cache: "default" }).then(Result$GetTemplates.parse)
  );

  const aboutDescription = swr_GetTemplates.data?.aboutDescription;

  return (
    <WehereTheme>
      <InfoLayout
        className={cx(styles.container, className)}
        style={style}
        activePage={{ type: "about" }}
      >
        <Container size="2">
          <Flex justify="center" mt="8" mb="4">
            <Image className={styles.logo} src={pngLogoColor} alt="WeHere" />
          </Flex>
          <Box p="2">
            {aboutDescription ? (
              <RichTextViewer
                className={styles.description}
                text={aboutDescription.text || ""}
                entities={aboutDescription.entities || []}
                unstyled={["a", "b", "i", "p", "u"]}
              />
            ) : undefined}
          </Box>
        </Container>
      </InfoLayout>
    </WehereTheme>
  );
}
