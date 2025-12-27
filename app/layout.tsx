import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";
import { Suspense } from "react";
import { Toaster } from "sonner";
import ReactQueryProvider from "@/provider/ReactQueryProvider";
import ThemeProvider from "@/provider/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Percepta",
  description: "Percepta- See connections. Understand context.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  headers();
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Suspense
            fallback={
              <div className="flex h-screen w-screen items-center justify-center">
                Loading...
              </div>
            }
          >
            <ThemeProvider>
              <ReactQueryProvider>{children}</ReactQueryProvider>
            </ThemeProvider>
          </Suspense>
          <Toaster position="top-center" richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
