import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cash Bitcoin 2.0 • GTM Command Center",
  description:
    "Live GTM readout — mentions, impressions, sentiment, and earned media coverage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}