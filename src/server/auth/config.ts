import { type DefaultSession, type NextAuthConfig } from "next-auth";

import { db } from "@/server/db";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/auth";
import { z } from "zod";
import type { Role } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { JWT } from "next-auth/jwt";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
      username: string;
      email?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    username: string;
    email?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    email: string | null;
    username: string;
    name?: string;
    image?: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
const loginSchema = z.object({
  username: z.string().min(1, "Nom d'utilisateur requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const authConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: {
          label: "Nom d'utilisateur",
          type: "text",
          placeholder: "votre_nom_utilisateur",
        },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { username, password } = loginSchema.parse(credentials);

          const user = await db.user.findUnique({
            where: { username },
          });

          if (!user?.password) {
            return null;
          }

          const isValidPassword = await verifyPassword(
            password,
            user.password as string,
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            name: user.name ?? user.username,
            email: user.email,
            username: user.username as string,
            role: user.role,
          };
        } catch (error) {
          console.error(
            "Erreur lors de l'authentification:",
            error instanceof Error ? error.message : String(error),
          );
          return null;
        }
      },
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id,
        role: token.role,
        username: token.username,
        email: token.email,
      },
    }),
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id!;
        token.role = user.role!;
        token.email = user.email!;
        token.username = user.username!;
        token.name = user.name!;
        token.image = user.image!;
      }

      return token;
    },
  },
} satisfies NextAuthConfig;
