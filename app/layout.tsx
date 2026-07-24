import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Avalanche Fuji NFT Drop Studio",
  description:
    "thirdweb を使った Avalanche Fuji テストネット向け NFT Drop（Minting）サイト",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
