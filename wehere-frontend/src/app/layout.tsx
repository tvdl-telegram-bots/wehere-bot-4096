import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import React from "react";

import "normalize.css";
import "@radix-ui/themes/styles.css";
import "./global.css";
import WehereTheme from "../components/WehereTheme";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
});

// TODO: apply template here
// https://nextjs.org/docs/app/building-your-application/optimizing/metadata#dynamic-metadata
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "WeHere",
    description:
      "Dự án tâm lý do Thư viện Dương Liễu sáng lập, nhằm chia sẻ kiến thức, câu chuyện, sự kiện về sức khỏe tinh thần của người trẻ.",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // console.log(cookies().getAll());
  return (
    <html lang="vi">
      <body className={roboto.className}>
        <WehereTheme>{children}</WehereTheme>
      </body>
    </html>
  );
}
