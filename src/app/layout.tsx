import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "LaMap241",
  description:
    "Le jeu consiste en une bataille pour conserver la main, le joueur joue une carte d'une famille et l'adversaire doit pour gagner la main aligner une carte de la même famille",
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
        <TRPCReactProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
