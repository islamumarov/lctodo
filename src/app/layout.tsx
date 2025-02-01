import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SessionProvider } from "next-auth/react";
import { JotaiProvider } from "@/components/JotaiProvider";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";
import { TooltipProvider } from "@/components/ui/tooltip";

import "jotai-devtools/styles.css";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";

const geistSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeetCode Todo list",
  description: "A simple todo list",
};

export default function RootLayout({
  children,
  todos,
}: Readonly<{
  children: React.ReactNode;
  todos: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={`${geistSans.variable} antialiased dark`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientProviders>
            <SessionProvider>
              <JotaiProvider>
                <TooltipProvider>
                  <div className="min-h-screen p-8 max-sm:p-4 font-[family-name:var(--font-inter)]">
                    <main>
                      {children}
                      {todos}
                    </main>
                  </div>
                  <hr className="mb-2" />
                  <Footer />
                </TooltipProvider>
              </JotaiProvider>
            </SessionProvider>
          </ClientProviders>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
