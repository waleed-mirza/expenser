import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { RegisterSW } from "./register-sw";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Expenser",
  description: "Offline-friendly expense tracker",
  manifest: "/manifest.json",
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#09090b", // Zinc 950
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <RegisterSW />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
