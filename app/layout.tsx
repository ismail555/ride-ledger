import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ride Ledger — Weekly Fitness Dashboard",
  description: "Cycling performance & nutrition tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
