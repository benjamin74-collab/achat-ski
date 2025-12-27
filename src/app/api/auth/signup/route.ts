// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendMail } from "@/lib/mailer";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      pseudo,
      firstName,
      lastName,
      email,
      password,
      passwordConfirm,
      marketingOptIn,
      callbackUrl,
    } = body as {
      pseudo: string;
      firstName?: string;
      lastName?: string;
      email: string;
      password: string;
      passwordConfirm?: string;
      marketingOptIn?: boolean;
      callbackUrl?: string;
    };

    const cleanEmail = (email || "").toLowerCase().trim();

    // 🚨 validations côté serveur
    if (!cleanEmail || !password || !pseudo) {
      return NextResponse.json(
        { error: "Pseudo, email et mot de passe sont obligatoires." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    if (passwordConfirm !== undefined && passwordConfirm !== password) {
      return NextResponse.json(
        { error: "La confirmation du mot de passe ne correspond pas." },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur en base, non vérifié
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: pseudo || `${firstName || ""} ${lastName || ""}`.trim(),
        role: Role.USER,
        // Champs ajoutés dans les migrations précédentes
        passwordHash,
        // Si tu as un champ de type opt-in en base, on pourra brancher ici :
        // marketingOptIn: !!marketingOptIn,
        // emailVerified reste null (non vérifié)
      },
    });

    // Créer un token de vérification
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    await prisma.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: expires,
      },
    });

    const baseUrl = getBaseUrl();
    const verifyUrl = `${baseUrl}/auth/verify?token=${encodeURIComponent(
      token
    )}`;

    const html = `
      <p>Bonjour ${pseudo || ""},</p>
      <p>Merci de t'être inscrit sur <strong>Meilleur-Ski</strong> !</p>
      <p>Pour activer ton compte, clique sur le lien ci-dessous :</p>
      <p><a href="${verifyUrl}">Valider mon compte</a></p>
      <p>Ce lien est valable 24 heures.</p>
      <p>À très vite sur Meilleur-Ski !</p>
    `;

    const text = `
Bonjour ${pseudo || ""},

Merci de t'être inscrit sur Meilleur-Ski !
Pour activer ton compte, clique sur le lien ci-dessous :

${verifyUrl}

Ce lien est valable 24 heures.

À très vite sur Meilleur-Ski !
`;

    await sendMail({
      to: cleanEmail,
      subject: "Confirme ton compte Meilleur-Ski",
      html,
      text,
    });

    return NextResponse.json(
      {
        ok: true,
        message:
          "Compte créé. Un email de validation t'a été envoyé. Merci de vérifier ta boîte de réception.",
        redirectTo: `/auth/check-email?email=${encodeURIComponent(
          cleanEmail
        )}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du compte." },
      { status: 500 }
    );
  }
}
