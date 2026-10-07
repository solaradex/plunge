import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plunge — Meet people nearby",
  description:
    "Plunge is a local-first social and dating platform for adults to discover, chat, and connect with people nearby.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
