import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import React from "react";
import { Result$GetTemplates$WehereBackend } from "wehere-backend/src/app/api/get-templates/typing";

import { SERVER_ENV } from "../env/server";
import { getUrl, httpGet } from "../utils/shared";

import "normalize.css";
import "@radix-ui/themes/styles.css";
import "./global.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
});

// https://nextjs.org/docs/app/building-your-application/optimizing/metadata#dynamic-metadata
export async function generateMetadata(): Promise<Metadata> {
  const data = await httpGet(
    getUrl(SERVER_ENV.WEHERE_BACKEND_ORIGIN, "/api/get-templates"),
    {
      cache: "force-cache",
      next: {
        revalidate: 60, // https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnextrevalidate
      },
    }
  ).then(Result$GetTemplates$WehereBackend.parse);

  return {
    metadataBase: SERVER_ENV.METADATA_BASE
      ? new URL(SERVER_ENV.METADATA_BASE)
      : undefined,
    title:
      data.templates.find((t) => t.key === "opengraph_title")?.text || "WeHere",
    description:
      data.templates.find((t) => t.key === "opengraph_description")?.text ||
      "Dự án tâm lý do Thư viện Dương Liễu sáng lập, nhằm chia sẻ kiến thức, câu chuyện, sự kiện về sức khỏe tinh thần của người trẻ.",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={roboto.className}>{children}</body>
    </html>
  );
}
