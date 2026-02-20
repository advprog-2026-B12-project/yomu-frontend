import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yomu Integration Test",
  description: "Minimal setup for Next.js, Spring Boot, and PostgreSQL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}