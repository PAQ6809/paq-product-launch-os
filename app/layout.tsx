import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "PAQ Product Launch OS",
  description: "Mock AI demo for product positioning, launch reports, ecommerce copy, and launch planning."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={inter.variable}>
      <body className="font-sans antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}

