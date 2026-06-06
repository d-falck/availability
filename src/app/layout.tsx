import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "damon",
  description: "A calmer way to share when I'm free.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-stone-900 antialiased dark:bg-stone-950 dark:text-stone-100">
        {children}
      </body>
    </html>
  );
}
