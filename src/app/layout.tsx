import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Availability",
  description: "A calmer way to share when I'm free.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
