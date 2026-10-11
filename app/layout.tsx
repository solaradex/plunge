import type { Metadata } from "next";
import "./globals.css";

const title = "Plunge — Meet people nearby";
const description =
  "Meet nearby. Connect naturally. Plunge is a local-first social and dating platform for adults to discover people, chat, make friends, and find dates.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "Plunge",
  keywords: [
    "local dating",
    "meet people nearby",
    "make friends",
    "local social",
    "adult dating",
    "Northeast Florida",
  ],
  openGraph: {
    type: "website",
    siteName: "Plunge",
    title,
    description,
    images: [{ url: "/plunge-mark.svg", alt: "Plunge" }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/plunge-mark.svg"],
  },
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
