/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

import { db } from "@/server/db";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
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
            where: { name: username },
          });

          if (!user?.password) return null;

          const isValid = await compare(password, user.password as string);
          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name ?? "",
            email: user.email ?? "",
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
          const { username, email, password } = registerSchema.parse(credentials);

          const existing = await db.user.findFirst({
            where: {
              OR: [{ name: username }, { email: email }],
            },
          });

          if (existing) return null;

          const hashedPassword = await hash(password, 12);

          const user = await db.user.create({
            data: {
              name: username,
              email: email,
              password: hashedPassword,
              role: "USER",
            },
          });

          return {
            id: user.id,
            name: user.name ?? "",
            email: user.email ?? "",
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
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
        role: token.role as Role,
      },
    }),
  },
} satisfies NextAuthConfig;
