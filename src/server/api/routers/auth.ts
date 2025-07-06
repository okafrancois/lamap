/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";

const UserDataSelect: Prisma.UserSelect = {
  id: true,
  name: true,
  username: true,
  role: true,
  email: true,
  emailVerified: true,
  phoneNumber: true,
  phoneNumberVerified: true,
  image: true,
  koras: true,
  totalWins: true,
  totalGames: true,
};

export type UserData = Prisma.UserGetPayload<{
  select: typeof UserDataSelect;
}>;

const loginSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      const { username, password } = input;

      const user = await db.user.findFirst({
        where: { username: username },
        include: {
          accounts: {
            where: { provider: "credentials" },
          },
        },
      });

      const account = user?.accounts?.[0];
      if (!user || !account?.password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Nom d'utilisateur ou mot de passe incorrect",
        });
      }

      const isValid = await compare(password, account.password);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Nom d'utilisateur ou mot de passe incorrect",
        });
      }

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        koras: user.koras,
      };
    }),

  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      const { username, password } = input;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await db.user.findFirst({
        where: { username: username },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Nom d'utilisateur déjà utilisé",
        });
      }

      // Hasher le mot de passe
      const hashedPassword = await hash(password, 12);

      // Créer l'utilisateur avec son compte credentials
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
        name: user.name,
        username: user.username,
        role: user.role,
        koras: user.koras,
      };
    }),
    
  userData: protectedProcedure.query(async ({ ctx }): Promise<UserData> => {
    const user = await db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: UserDataSelect,
    });
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }
    return user;
  }),
}); 