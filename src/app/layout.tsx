import { Providers } from "./providers";
import "./globals.css";
import type { Metadata } from "next";
import ClientOnly from "@/components/ClientOnly";

export const metadata: Metadata = {
  title: "🐧 Remenguiny",
  description: "A blockchain memory game powered by Abstract",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          sizes="180x180"
        />
      </head>
      <body className="bg-sky-200">
        <ClientOnly>
          <Providers>{children}</Providers>
        </ClientOnly>
      </body>
    </html>
  );
}
