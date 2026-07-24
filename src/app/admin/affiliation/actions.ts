"use server";

import { MerchantNetwork } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export type AffiliationFormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
};

export const INITIAL_AFFILIATION_FORM_STATE: AffiliationFormState = {
  success: false,
  message: "",
  errors: {},
};

/* -------------------------------------------------------------------------- */
/*                                  RÉSEAUX                                   */
/* -------------------------------------------------------------------------- */

export async function createAffiliateNetworkAction(
  _previousState: AffiliationFormState,
  formData: FormData
): Promise<AffiliationFormState> {
  const name = getString(formData, "name");
  const slug =
    normalizeSlug(getString(formData, "slug")) ||
    normalizeSlug(name);

  const websiteUrl = nullableString(
    getString(formData, "websiteUrl")
  );

  const active = formData.get("active") === "on";

  const errors: Record<string, string> = {};

  if (!name) {
    errors.name = "Le nom du réseau est obligatoire.";
  }

  if (!slug) {
    errors.slug = "Le slug du réseau est obligatoire.";
  }

  if (websiteUrl && !isValidHttpUrl(websiteUrl)) {
    errors.websiteUrl =
      "Le site web doit être une URL HTTP ou HTTPS valide.";
  }

  if (Object.keys(errors).length > 0) {
    return invalidState(errors);
  }

  const existing = await prisma.affiliateNetwork.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return {
      success: false,
      message: "Un réseau utilise déjà ce slug.",
      errors: {
        slug: "Ce slug est déjà utilisé.",
      },
    };
  }

  try {
    await prisma.affiliateNetwork.create({
      data: {
        name,
        slug,
        websiteUrl,
        active,
      },
    });

    revalidateAffiliationPaths();
    redirect("/admin/affiliation");
  } catch (error) {
    rethrowRedirect(error);

    return actionError(
      error,
      "La création du réseau a échoué."
    );
  }
}

export async function updateAffiliateNetworkAction(
  networkId: number,
  _previousState: AffiliationFormState,
  formData: FormData
): Promise<AffiliationFormState> {
  if (!isPositiveInteger(networkId)) {
    return invalidIdentifier();
  }

  const name = getString(formData, "name");
  const slug =
    normalizeSlug(getString(formData, "slug")) ||
    normalizeSlug(name);

  const websiteUrl = nullableString(
    getString(formData, "websiteUrl")
  );

  const active = formData.get("active") === "on";

  const errors: Record<string, string> = {};

  if (!name) {
    errors.name = "Le nom du réseau est obligatoire.";
  }

  if (!slug) {
    errors.slug = "Le slug du réseau est obligatoire.";
  }

  if (websiteUrl && !isValidHttpUrl(websiteUrl)) {
    errors.websiteUrl =
      "Le site web doit être une URL valide.";
  }

  if (Object.keys(errors).length > 0) {
    return invalidState(errors);
  }

  const duplicate = await prisma.affiliateNetwork.findFirst({
    where: {
      slug,
      id: {
        not: networkId,
      },
    },
    select: {
      id: true,
    },
  });

  if (duplicate) {
    return {
      success: false,
      message: "Un autre réseau utilise déjà ce slug.",
      errors: {
        slug: "Ce slug est déjà utilisé.",
      },
    };
  }

  try {
    await prisma.affiliateNetwork.update({
      where: {
        id: networkId,
      },
      data: {
        name,
        slug,
        websiteUrl,
        active,
      },
    });

    revalidateAffiliationPaths();
    redirect("/admin/affiliation");
  } catch (error) {
    rethrowRedirect(error);

    return actionError(
      error,
      "La modification du réseau a échoué."
    );
  }
}

export async function deleteAffiliateNetworkAction(
  networkId: number
): Promise<AffiliationFormState> {
  if (!isPositiveInteger(networkId)) {
    return invalidIdentifier();
  }

  const network = await prisma.affiliateNetwork.findUnique({
    where: {
      id: networkId,
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          programs: true,
        },
      },
    },
  });

  if (!network) {
    return {
      success: false,
      message: "Ce réseau n’existe plus.",
    };
  }

  if (network._count.programs > 0) {
    return {
      success: false,
      message:
        "Ce réseau est encore utilisé par un ou plusieurs programmes. Désactivez-le plutôt que de le supprimer.",
    };
  }

  try {
    await prisma.affiliateNetwork.delete({
      where: {
        id: networkId,
      },
    });

    revalidateAffiliationPaths();

    return {
      success: true,
      message: `Le réseau « ${network.name} » a été supprimé.`,
    };
  } catch (error) {
    return actionError(
      error,
      "La suppression du réseau a échoué."
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                 MARCHANDS                                  */
/* -------------------------------------------------------------------------- */

export async function createMerchantAction(
  _previousState: AffiliationFormState,
  formData: FormData
): Promise<AffiliationFormState> {
  const parsed = parseMerchantForm(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const duplicate = await prisma.merchant.findFirst({
    where: {
      OR: [
        {
          name: parsed.values.name,
        },
        {
          slug: parsed.values.slug,
        },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (duplicate) {
    return {
      success: false,
      message:
        "Un marchand utilise déjà ce nom ou ce slug.",
      errors: {
        slug: "Vérifiez le nom et le slug.",
      },
    };
  }

  try {
    await prisma.merchant.create({
      data: parsed.values,
    });

    revalidateAffiliationPaths();
    redirect("/admin/affiliation");
  } catch (error) {
    rethrowRedirect(error);

    return actionError(
      error,
      "La création du marchand a échoué."
    );
  }
}

export async function updateMerchantAction(
  merchantId: number,
  _previousState: AffiliationFormState,
  formData: FormData
): Promise<AffiliationFormState> {
  if (!isPositiveInteger(merchantId)) {
    return invalidIdentifier();
  }

  const parsed = parseMerchantForm(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const duplicate = await prisma.merchant.findFirst({
    where: {
      id: {
        not: merchantId,
      },
      OR: [
        {
          name: parsed.values.name,
        },
        {
          slug: parsed.values.slug,
        },
      ],
    },
    select: {
      id: true,
    },
  });

  if (duplicate) {
    return {
      success: false,
      message:
        "Un autre marchand utilise déjà ce nom ou ce slug.",
      errors: {
        slug: "Vérifiez le nom et le slug.",
      },
    };
  }

  try {
    await prisma.merchant.update({
      where: {
        id: merchantId,
      },
      data: parsed.values,
    });

    revalidateAffiliationPaths();
    redirect("/admin/affiliation");
  } catch (error) {
    rethrowRedirect(error);

    return actionError(
      error,
      "La modification du marchand a échoué."
    );
  }
}

export async function deleteMerchantAction(
  merchantId: number
): Promise<AffiliationFormState> {
  if (!isPositiveInteger(merchantId)) {
    return invalidIdentifier();
  }

  const merchant = await prisma.merchant.findUnique({
    where: {
      id: merchantId,
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          affiliatePrograms: true,
          offers: true,
          feedImports: true,
        },
      },
    },
  });

  if (!merchant) {
    return {
      success: false,
      message: "Ce marchand n’existe plus.",
    };
  }

  const used =
    merchant._count.affiliatePrograms > 0 ||
    merchant._count.offers > 0 ||
    merchant._count.feedImports > 0;

  if (used) {
    return {
      success: false,
      message:
        "Ce marchand possède encore des programmes, des offres ou un historique d’import. Désactivez-le plutôt que de le supprimer.",
    };
  }

  try {
    await prisma.merchant.delete({
      where: {
        id: merchantId,
      },
    });

    revalidateAffiliationPaths();

    return {
      success: true,
      message: `Le marchand « ${merchant.name} » a été supprimé.`,
    };
  } catch (error) {
    return actionError(
      error,
      "La suppression du marchand a échoué."
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                PROGRAMMES                                  */
/* -------------------------------------------------------------------------- */

export async function createAffiliateProgramAction(
  _previousState: AffiliationFormState,
  formData: FormData
): Promise<AffiliationFormState> {
  const parsed = parseAffiliateProgramForm(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const duplicate = await prisma.affiliateProgram.findUnique({
    where: {
      siteId_merchantId_networkId: {
        siteId: parsed.values.siteId,
        merchantId: parsed.values.merchantId,
        networkId: parsed.values.networkId,
      },
    },
    select: {
      id: true,
    },
  });

  if (duplicate) {
    return {
      success: false,
      message:
        "Un programme existe déjà pour ce site, ce marchand et ce réseau.",
    };
  }

  try {
    const program = await prisma.affiliateProgram.create({
      data: parsed.values,
      select: {
        id: true,
      },
    });

    revalidateAffiliationPaths();

    const returnTo = sanitizeReturnTo(
      getString(formData, "returnTo")
    );

    redirect(
      returnTo ||
        `/admin/affiliation/programs/${program.id}/edit`
    );
  } catch (error) {
    rethrowRedirect(error);

    return actionError(
      error,
      "La création du programme a échoué."
    );
  }
}

export async function updateAffiliateProgramAction(
  programId: number,
  _previousState: AffiliationFormState,
  formData: FormData
): Promise<AffiliationFormState> {
  if (!isPositiveInteger(programId)) {
    return invalidIdentifier();
  }

  const parsed = parseAffiliateProgramForm(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  const duplicate = await prisma.affiliateProgram.findFirst({
    where: {
      id: {
        not: programId,
      },
      siteId: parsed.values.siteId,
      merchantId: parsed.values.merchantId,
      networkId: parsed.values.networkId,
    },
    select: {
      id: true,
    },
  });

  if (duplicate) {
    return {
      success: false,
      message:
        "Un autre programme utilise déjà cette combinaison site, marchand et réseau.",
    };
  }

  try {
    await prisma.affiliateProgram.update({
      where: {
        id: programId,
      },
      data: parsed.values,
    });

    revalidateAffiliationPaths();
    redirect("/admin/affiliation");
  } catch (error) {
    rethrowRedirect(error);

    return actionError(
      error,
      "La modification du programme a échoué."
    );
  }
}

export async function deleteAffiliateProgramAction(
  programId: number
): Promise<AffiliationFormState> {
  if (!isPositiveInteger(programId)) {
    return invalidIdentifier();
  }

  const program = await prisma.affiliateProgram.findUnique({
    where: {
      id: programId,
    },
    select: {
      id: true,
      name: true,
      siteId: true,
      merchant: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          feeds: true,
          offers: true,
        },
      },
    },
  });

  if (!program) {
    return {
      success: false,
      message: "Ce programme n’existe plus.",
    };
  }

  if (
    program._count.feeds > 0 ||
    program._count.offers > 0
  ) {
    return {
      success: false,
      message:
        "Ce programme est encore utilisé par des flux ou des offres. Désactivez-le plutôt que de le supprimer.",
    };
  }

  try {
    await prisma.affiliateProgram.delete({
      where: {
        id: programId,
      },
    });

    revalidateAffiliationPaths();

    return {
      success: true,
      message: `Le programme « ${
        program.name ||
        `${program.merchant.name} / ${program.siteId}`
      } » a été supprimé.`,
    };
  } catch (error) {
    return actionError(
      error,
      "La suppression du programme a échoué."
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                  PARSING                                   */
/* -------------------------------------------------------------------------- */

function parseMerchantForm(formData: FormData):
  | {
      success: true;
      values: {
        name: string;
        slug: string;
        platform: MerchantNetwork;
        network: string | null;
        programId: string | null;
        status: string | null;
        websiteUrl: string | null;
        active: boolean;
      };
    }
  | {
      success: false;
      state: AffiliationFormState;
    } {
  const name = getString(formData, "name");

  const slug =
    normalizeSlug(getString(formData, "slug")) ||
    normalizeSlug(name);

  const platformValue = getString(
    formData,
    "platform"
  );

  const websiteUrl = nullableString(
    getString(formData, "websiteUrl")
  );

  const errors: Record<string, string> = {};

  if (!name) {
    errors.name = "Le nom du marchand est obligatoire.";
  }

  if (!slug) {
    errors.slug = "Le slug est obligatoire.";
  }

  if (
    !Object.values(MerchantNetwork).includes(
      platformValue as MerchantNetwork
    )
  ) {
    errors.platform = "La plateforme est invalide.";
  }

  if (websiteUrl && !isValidHttpUrl(websiteUrl)) {
    errors.websiteUrl =
      "Le site web doit être une URL valide.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      state: invalidState(errors),
    };
  }

  return {
    success: true,
    values: {
      name,
      slug,
      platform: platformValue as MerchantNetwork,
      network: nullableString(
        getString(formData, "network")
      ),
      programId: nullableString(
        getString(formData, "programId")
      ),
      status: nullableString(
        getString(formData, "status")
      ),
      websiteUrl,
      active: formData.get("active") === "on",
    },
  };
}

function parseAffiliateProgramForm(formData: FormData):
  | {
      success: true;
      values: {
        siteId: string;
        merchantId: number;
        networkId: number;
        name: string | null;
        externalProgramId: string | null;
        trackingId: string | null;
        active: boolean;
      };
    }
  | {
      success: false;
      state: AffiliationFormState;
    } {
  const siteId = getString(formData, "siteId");
  const merchantId = parsePositiveInteger(
    formData.get("merchantId")
  );
  const networkId = parsePositiveInteger(
    formData.get("networkId")
  );

  const errors: Record<string, string> = {};

  if (!siteId) {
    errors.siteId = "Le site est obligatoire.";
  }

  if (!merchantId) {
    errors.merchantId =
      "Sélectionnez un marchand.";
  }

  if (!networkId) {
    errors.networkId =
      "Sélectionnez un réseau.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      state: invalidState(errors),
    };
  }

  return {
    success: true,
    values: {
      siteId,
      merchantId: merchantId!,
      networkId: networkId!,
      name: nullableString(
        getString(formData, "name")
      ),
      externalProgramId: nullableString(
        getString(formData, "externalProgramId")
      ),
      trackingId: nullableString(
        getString(formData, "trackingId")
      ),
      active: formData.get("active") === "on",
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function revalidateAffiliationPaths(): void {
  revalidatePath("/admin/affiliation");
  revalidatePath("/admin/feeds");
  revalidatePath("/admin/feeds/new");
}

function invalidState(
  errors: Record<string, string>
): AffiliationFormState {
  return {
    success: false,
    message: "Certains champs doivent être corrigés.",
    errors,
  };
}

function invalidIdentifier(): AffiliationFormState {
  return {
    success: false,
    message: "Identifiant invalide.",
  };
}

function actionError(
  error: unknown,
  fallback: string
): AffiliationFormState {
  console.error("[admin affiliation]", error);

  return {
    success: false,
    message:
      error instanceof Error
        ? error.message
        : fallback,
  };
}

function getString(
  formData: FormData,
  key: string
): string {
  const value = formData.get(key);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function nullableString(
  value: string
): string | null {
  return value || null;
}

function parsePositiveInteger(
  value: FormDataEntryValue | null
): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : null;
}

function isPositiveInteger(
  value: number
): boolean {
  return Number.isInteger(value) && value > 0;
}

function normalizeSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function sanitizeReturnTo(
  value: string
): string | null {
  if (
    !value ||
    !value.startsWith("/admin/") ||
    value.startsWith("//")
  ) {
    return null;
  }

  return value;
}

function rethrowRedirect(error: unknown): void {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String(error.digest).startsWith("NEXT_REDIRECT")
  ) {
    throw error;
  }
}