import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./providers/AuthProvider";

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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}