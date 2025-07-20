"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";

type RegisterFormProps = React.ComponentProps<"div">;

export function RegisterForm({ className, ...props }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const data = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    if (data.password !== data.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Une erreur est survenue");
        return;
      }

      setSuccess("Compte créé avec succès ! Redirection vers la connexion...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError("Une erreur est survenue lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Créer un compte</h1>
                <p className="text-muted-foreground text-balance">
                  Rejoignez LaMap241 dès maintenant
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border p-3 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-md border border-green-200 bg-green-100 p-3 text-sm text-green-800">
                  {success}
                </div>
              )}

              <div className="grid gap-3">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Choisissez un nom d'utilisateur"
                  required
                  minLength={3}
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre.email@exemple.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Choisissez un mot de passe"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">
                  Confirmer le mot de passe
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Création en cours..." : "Créer un compte"}
              </Button>

              <div className="text-center text-sm">
                Vous avez déjà un compte ?{" "}
                <a href="/login" className="underline underline-offset-4">
                  Se connecter
                </a>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/background-card.jpeg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        En créant un compte, vous acceptez nos{" "}
        <a href="#">Conditions d'utilisation</a> et{" "}
        <a href="#">Politique de confidentialité</a>.
      </div>
    </div>
  );
}
