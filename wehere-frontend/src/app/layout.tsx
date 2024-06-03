import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "normalize.css";
import "milligram";

const roboto = Roboto({
  weight: ["300", "700"],
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
  return (
    <html lang="vi">
      <body className={roboto.className}>{children}</body>
    </html>
  );
}
