import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { NextAuthSessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "sonner";
import { auth } from "@/server/auth";
import { UserProvider } from "@/components/layout/user-provider";

export const metadata: Metadata = {
  title: "LaMap241",
  description:
    "Le jeu consiste en une bataille pour conserver la main, le joueur joue une carte d'une famille et l'adversaire doit pour gagner la main aligner une carte de la même famille",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  const initialData = session?.user
    ? {
        user: session.user,
      }
    : null;

  return (
    <html lang="fr" className={`${geist.variable}`}>
      <body>
        <NextAuthSessionProvider>
          <TRPCReactProvider>
            <UserProvider initialData={initialData}>{children}</UserProvider>
            <Toaster position="bottom-right" richColors />
          </TRPCReactProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
