import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { SessionProvider } from "next-auth/react";

import { TRPCReactProvider } from "@/trpc/react";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "LaMap241",
  description: "Plateforme de jeux de cartes en ligne",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${geist.variable}`}>
      <body>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TRPCReactProvider>
              <AuthProvider>{children}</AuthProvider>
              <Toaster position="top-right" />
            </TRPCReactProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
