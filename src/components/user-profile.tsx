"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export function UserProfile() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <a href="/login">Se connecter</a>
        </Button>
        <Button asChild>
          <a href="/signup">S&apos;inscrire</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <p className="font-medium">{user.name}</p>
        <p className="text-muted-foreground">@{user.username}</p>
        <p className="text-muted-foreground text-xs">Rôle: {user.role}</p>
      </div>
      <Button variant="outline" onClick={() => signOut()}>
        Déconnexion
      </Button>
    </div>
  );
}
