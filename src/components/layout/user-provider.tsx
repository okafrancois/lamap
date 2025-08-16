"use client";

import { createContext, useContext } from "react";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";

export const UserDataContext = createContext<{
  user: Session["user"];
} | null>(null);

export function useUserDataContext(): {
  user: Session["user"];
} | null {
  return useContext(UserDataContext);
}

interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const session = useSession();

  return (
    <UserDataContext.Provider value={session.data}>
      {children}
    </UserDataContext.Provider>
  );
}
