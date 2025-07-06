"use client";

import { createContext, useContext } from "react";
import { api } from "@/trpc/react";
import type { UserData } from "@/server/api/routers/auth";
import { useSession } from "next-auth/react";

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();

  const {
    data: userData,
    isLoading: userDataLoading,
    refetch: refetchUserData,
  } = api.auth.userData.useQuery(undefined, {
    enabled: !!session?.user?.id,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const isLoading =
    sessionStatus === "loading" || (!!session && userDataLoading);

  const isAuthenticated = !!session && !!userData;

  const value = {
    user: userData ?? null,
    isLoading,
    isAuthenticated,
    refetchUser: () => void refetchUserData(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
