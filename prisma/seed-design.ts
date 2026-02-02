import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Tile = { slug: string; title: string; desc: string; cta: string; img: string };
type Brand = { name: string; slug: string; logo: string };

function defaultsFor(siteId: string) {
  if (siteId === "meilleur-robot") {
    const categoryTiles: Tile[] = [
      { slug: "robots-aspirateurs", title: "Robots aspirateurs", desc: "Autonomie, navigation, app, entretien : compare les meilleurs modèles.", cta: "Comparer", img: "/categories/robots-aspirateurs.jpg" },
      { slug: "robots-tondeuses", title: "Robots tondeuses", desc: "Surface, pente, câble ou RTK : trouve le robot adapté à ton jardin.", cta: "Comparer", img: "/categories/robots-tondeuses.jpg" },
      { slug: "robots-cuisine", title: "Robots cuisine", desc: "Pétrir, mixer, cuire : le bon robot pour gagner du temps au quotidien.", cta: "Comparer", img: "/categories/robots-cuisine.jpg" },
      { slug: "robots-lave-vitres", title: "Robots lave-vitres", desc: "Aspiration, sécurité, efficacité : les meilleurs robots vitre.", cta: "Comparer", img: "/categories/robots-lave-vitres.jpg" },
      { slug: "robots-piscine", title: "Robots piscine", desc: "Fond, parois, ligne d’eau : compare les robots les plus efficaces.", cta: "Comparer", img: "/categories/robots-piscine.jpg" },
    ];

    const topBrands: Brand[] = [
      { name: "Roborock", slug: "roborock", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Roborock_logo.png" },
      { name: "iRobot", slug: "irobot", logo: "https://upload.wikimedia.org/wikipedia/commons/2/21/IRobot_logo.svg" },
      { name: "Ecovacs", slug: "ecovacs", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Ecovacs_logo.svg" },
      { name: "Dreame", slug: "dreame", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Dreame_logo.svg" },
      { name: "Husqvarna", slug: "husqvarna", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Husqvarna-logo.svg" },
    ];

    return {
      siteId,
      name: "Meilleur Robot",
      tagline: "Comparer & choisir",
      logoSrc: "/brands/meilleur-robot/logo.svg",
      logoAlt: "Meilleur Robot",
      faviconSrc: "/brands/meilleur-robot/favicon.ico",

      primary: "#22c55e",
      secondary: "#0f172a",
      accent: "#a855f7",
      background: "#ffffff",
      foreground: "#0b1220",
      muted: "#f1f5f9",
      mutedForeground: "#64748b",
      border: "#e2e8f0",

      fontSans: "inter",
      fontDisplay: "plusJakarta",

      heroTitle: "Le comparateur des meilleurs robots",
      heroHighlight: "robots",
      heroSubtitle: "Aspirateur, tondeuse, cuisine… compare les modèles et trouve le meilleur rapport qualité/prix.",
      heroCtas: [
        { label: "Comparer", href: "/search", variant: "primary" },
        { label: "Explorer les catégories", href: "#categories", variant: "outline" },
      ],

      showCategories: true,
      showLatestGuides: true,
      showTopBrands: true,

      categoryTiles,
      topBrands,
    };
  }

  // default meilleur-ski
  return {
    siteId,
    name: "Meilleur Ski",
    tagline: "Comparer & gagner",
    logoSrc: "/brands/meilleur-ski/logo.svg",
    logoAlt: "Meilleur Ski",
    faviconSrc: "/brands/meilleur-ski/favicon.ico",

    primary: "#0ea5e9",
    secondary: "#111827",
    accent: "#f97316",
    background: "#ffffff",
    foreground: "#0b1220",
    muted: "#f3f4f6",
    mutedForeground: "#6b7280",
    border: "#e5e7eb",

    fontSans: "inter",
    fontDisplay: "manrope",

    heroTitle: "Le comparateur des passionnés de ski",
    heroHighlight: "comparateur",
    heroSubtitle: "Comparez les prix, consultez les tests et les avis pour trouver le matériel parfait.",
    heroCtas: [
      { label: "Rechercher un modèle", href: "/search", variant: "primary" },
      { label: "Explorer les catégories", href: "#categories", variant: "outline" },
      { label: "Lire nos guides", href: "/pages", variant: "outline" },
    ],

    showCategories: true,
    showLatestGuides: true,
    showTopBrands: true,
  };
}

async function main() {
  const siteId = process.env.SITE_ID || "meilleur-ski";
  const data = defaultsFor(siteId);

  await prisma.siteSettings.upsert({
    where: { siteId },
    update: data,
    create: data,
  });

  console.log(`[seed-design] SiteSettings upserted for ${siteId}`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
