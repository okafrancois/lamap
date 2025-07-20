import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { hashPassword } from "@/lib/auth";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  email: z.string().email("Format d'email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = registerSchema.parse(body);

    const existingUserByUsername = await db.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: "Ce nom d'utilisateur est déjà utilisé" },
        { status: 400 },
      );
    }

    const existingUserByEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "Cette adresse email est déjà utilisée" },
        { status: 400 },
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name: username,
      },
    });

    return NextResponse.json(
      {
        message: "Compte créé avec succès",
        user: { id: user.id, username: user.username, email: user.email },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Données invalides" },
        { status: 400 },
      );
    }

    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
