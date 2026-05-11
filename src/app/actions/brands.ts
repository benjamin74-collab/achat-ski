"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleBrandHomepage(id: number, value: boolean) {
  await prisma.brand.update({
    where: { id },
    data: { showOnHomepage: value },
  });

  revalidatePath("/");
  revalidatePath("/admin/brands");
}