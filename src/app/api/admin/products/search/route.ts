import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json({
      products: [],
    });
  }

  const products = await prisma.product.findMany({
    where: {
      active: true,

      OR: [
        {
          name: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          model: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          brand: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          slug: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          manufacturerReference: {
            contains: q,
            mode: "insensitive",
          },
        },
      ],
    },

    orderBy: [
      {
        published: "desc",
      },
      {
        name: "asc",
      },
    ],

    take: 20,

    select: {
      id: true,
      name: true,
      model: true,
      slug: true,
      brand: true,
      imageUrl: true,
    },
  });

  return NextResponse.json({
    products,
  });
}