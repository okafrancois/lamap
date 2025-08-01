"use client";

import { createContext, useContext } from "react";
import type { Session } from "next-auth";

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
  initialData: {
    user: Session["user"];
  } | null;
}

export function UserProvider({ children, initialData }: UserProviderProps) {
  return (
    <UserDataContext.Provider value={initialData}>
      {children}
    </UserDataContext.Provider>
  );
}
