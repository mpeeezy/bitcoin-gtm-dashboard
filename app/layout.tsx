import "./globals.css";
import type { Metadata } from "next";

export const metadata = {
  title: "Cash Bitcoin 2.0 GTM Command Center",
  description:
    "Live top-of-funnel dashboard across social, earned media, and owned channels.",
  openGraph: {
    title: "Cash Bitcoin 2.0 GTM Command Center",
    description:
      "Live top-of-funnel dashboard across social, earned media, and owned channels.",
    url: "https://bitcoin-gtm-dashboard.vercel.app",
    siteName: "Cash Bitcoin 2.0",
    type: "website",
  },
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