// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const pseudo = String(body.pseudo || "").trim();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const emailRaw = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const passwordConfirm = String(body.passwordConfirm || "");
    const marketingOptIn = Boolean(body.marketingOptIn);

    if (!emailRaw) {
      return NextResponse.json({ error: "L'email est obligatoire." }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: "La confirmation du mot de passe ne correspond pas." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: emailRaw },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nameFromProfile =
      pseudo || [firstName, lastName].filter(Boolean).join(" ") || null;

    await prisma.user.create({
      data: {
        email: emailRaw,
        name: nameFromProfile,
        role: Role.USER,
        pseudo: pseudo || null,
        firstName: firstName || null,
        lastName: lastName || null,
        marketingOptIn,
        passwordHash,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Signup error", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création du compte." },
      { status: 500 }
    );
  }
}
