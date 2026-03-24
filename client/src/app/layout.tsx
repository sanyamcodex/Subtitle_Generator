import "./globals.css";
import { Navbar } from "../components/layout/navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CaptionForge",
  description: "AI subtitle generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}