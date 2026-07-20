import { LegalPageType } from "@prisma/client";

export type LegalPageDefinition = {
  type: LegalPageType;
  adminSlug: string;
  publicPath: string;
  label: string;
  description: string;
  defaultTitle: string;
};

export const LEGAL_PAGE_DEFINITIONS: LegalPageDefinition[] = [
  {
    type: LegalPageType.LEGAL_NOTICE,
    adminSlug: "mentions-legales",
    publicPath: "/mentions-legales",
    label: "Mentions légales",
    description:
      "Informations sur l’éditeur, l’hébergeur et les responsabilités du site.",
    defaultTitle: "Mentions légales",
  },
  {
    type: LegalPageType.PRIVACY_POLICY,
    adminSlug: "confidentialite",
    publicPath: "/confidentialite",
    label: "Confidentialité",
    description:
      "Politique de protection et de traitement des données personnelles.",
    defaultTitle: "Politique de confidentialité",
  },
  {
    type: LegalPageType.COOKIE_POLICY,
    adminSlug: "cookies",
    publicPath: "/cookies",
    label: "Cookies",
    description:
      "Informations sur les cookies, traceurs et outils de mesure d’audience.",
    defaultTitle: "Politique relative aux cookies",
  },
  {
    type: LegalPageType.TERMS_OF_USE,
    adminSlug: "cgu",
    publicPath: "/cgu",
    label: "CGU",
    description: "Conditions générales d’utilisation du site.",
    defaultTitle: "Conditions générales d’utilisation",
  },
  {
    type: LegalPageType.CONTACT,
    adminSlug: "contact",
    publicPath: "/contact",
    label: "Contact",
    description: "Informations et moyens permettant de contacter le site.",
    defaultTitle: "Contact",
  },
];

export function getLegalPageDefinitionByAdminSlug(
  slug: string,
): LegalPageDefinition | undefined {
  return LEGAL_PAGE_DEFINITIONS.find((page) => page.adminSlug === slug);
}

export function getLegalPageDefinitionByType(
  type: LegalPageType,
): LegalPageDefinition | undefined {
  return LEGAL_PAGE_DEFINITIONS.find((page) => page.type === type);
}