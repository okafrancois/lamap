/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

import { db } from "@/server/db";
import type { Role } from "@prisma/client";
import { routes } from "@/lib/routes";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      username: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
    role: Role;
  }
}

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const authConfig = {
  providers: [
    Credentials({
      id: "username",
      name: "Connexion",
      credentials: {
        username: { label: "Nom d'utilisateur", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { username, password } = loginSchema.parse(credentials);

          const user = await db.user.findFirst({
            where: { username: username },
            include: {
              accounts: {
                where: { provider: "credentials" },
              },
            },
          });

          const account = user?.accounts?.[0];
          if (!user || !account?.password) return null;

          const isValid = await compare(password, account.password as string);
          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name ?? "",
            username: user.username ?? "",
            role: user.role as Role,
          };
        } catch {
          return null;
        }
      },
    }),
    Credentials({
      id: "register",
      name: "Inscription",
      credentials: {
        username: { label: "Nom d'utilisateur", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { username, password } = registerSchema.parse(credentials);

          const existing = await db.user.findFirst({
            where: { username: username },
          });

          if (existing) return null;

          const hashedPassword = await hash(password, 12);

          const user = await db.user.create({
            data: {
              name: username,
              username: username,
              role: "USER",
              accounts: {
                create: {
                  type: "credentials",
                  provider: "credentials",
                  providerAccountId: username,
                  password: hashedPassword,
                },
              },
            },
          });

          return {
            id: user.id,
            name: user.name ?? "",
            username: user.username ?? "",
            role: user.role as Role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  adapter: PrismaAdapter(db) as Adapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: routes.login,
    error: routes.login,
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
        username: token.username as string,
        role: token.role as Role,
      },
    }),
  },
} satisfies NextAuthConfig;
