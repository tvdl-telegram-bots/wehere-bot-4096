import { Theme } from "@radix-ui/themes";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "normalize.css";
import "@radix-ui/themes/styles.css";
import "./global.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "WeHere",
  description: "WeHere",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // console.log(cookies().getAll());
  return (
    <html lang="vi">
      <body className={roboto.className}>
        <Theme
          style={{ "--cursor-button": "pointer" } as React.CSSProperties}
          accentColor="indigo"
          grayColor="slate"
          radius="medium"
        >
          {children}
        </Theme>
      </body>
    </html>
  );
}
