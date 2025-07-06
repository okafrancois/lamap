"use client";

import { Button } from "@/components/ui/button";
import * as React from "react";
import { LogOutIcon, LoaderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";
import { signOut } from "next-auth/react";
import { useAuth } from "../providers/auth-provider";

type LogoutButtonProps = {
  customClass?: string;
};

export function LogoutButton({ customClass }: LogoutButtonProps) {
  const { user } = useAuth();
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut();
      router.push(routes.login);
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Button
      onClick={() => {
        startTransition(handleLogout);
      }}
      type={"button"}
      variant={"ghost"}
      className={"w-max gap-2 " + customClass}
      disabled={isPending}
    >
      {isPending ? (
        <LoaderIcon className="mr-2 size-4 animate-spin" />
      ) : (
        <LogOutIcon className={"size-4"} />
      )}
      <span>Se déconnecter</span>
    </Button>
  );
}
