// src/app/llms.txt/route.ts
import { getCurrentSiteId, getCurrentSiteUrl } from "@/lib/currentSite";
import { getSiteConfig } from "@/config/site";

export const runtime = "nodejs";
export const revalidate = 3600;

function buildSkiLlms(base: string) {
  return `# Meilleur Ski

> Meilleur Ski est un comparateur de matériel de ski qui aide à trouver, comparer et choisir des skis, chaussures, fixations et autres équipements grâce à des pages catégories, des fiches produits, des guides et des pages marques.

Meilleur Ski propose :
- des pages catégories pour explorer les grandes familles de produits
- des fiches produits avec prix, marchands, avis et tests quand ils sont disponibles
- des pages marques
- des guides et contenus éditoriaux pour aider au choix

## Pages clés

- [Homepage](${base}/): point d’entrée principal du site
- [Recherche](${base}/search): recherche globale
- [Guides et articles](${base}/pages): contenus éditoriaux
- [Annuaire des marques](${base}/marques): pages marques

## Catégories importantes

- [Skis](${base}/c/skis)
- [Skis All-Mountain](${base}/c/skis-all-mountain)
- [Skis Freeride](${base}/c/skis-freeride)
- [Skis de randonnée](${base}/c/skis-randonnee)
- [Fixations](${base}/c/fixations)
- [Chaussures de ski](${base}/c/chaussures-ski)
- [Snowboard](${base}/c/snowboard)

## Marques importantes

- [Rossignol](${base}/marques/rossignol)
- [Salomon](${base}/marques/salomon)
- [Head](${base}/marques/head)
- [Black Crows](${base}/marques/black-crows)
- [Atomic](${base}/marques/atomic)

## Types de pages

### Pages catégories
Les pages catégories regroupent les produits d’un même univers. Elles contiennent généralement :
- une introduction éditoriale
- des filtres
- une liste de produits
- une FAQ
- des données structurées de type CollectionPage et ItemList

### Pages produits
Les fiches produits contiennent généralement :
- le nom complet du produit
- la marque
- la catégorie
- des offres marchands
- des avis utilisateurs
- des tests ou essais éditoriaux si disponibles
- des données structurées de type Product

### Pages marques
Les pages marques présentent :
- la marque
- son descriptif
- une sélection de produits associés
- des données structurées de type Brand et CollectionPage

### Guides et articles
Les pages /pages contiennent :
- des guides d’achat
- des comparatifs
- des contenus d’aide au choix
- des données structurées de type Article ou BlogPosting selon les cas

## Conseils d’interprétation

- Les pages catégories sont les meilleures portes d’entrée pour comprendre l’offre d’un univers produit.
- Les pages produits sont les meilleures sources pour les prix, offres, tests et avis.
- Les pages marques servent à relier une marque à ses produits et contenus.
- Les guides servent à comprendre les différences entre types de produits, usages et niveaux.

## Sitemaps

- [Sitemap](${base}/sitemap.xml)

## Robots

- [robots.txt](${base}/robots.txt)
`;
}

function buildRobotLlms(base: string) {
  return `# Meilleur Robot

> Meilleur Robot est un comparateur dédié aux robots du quotidien : aspirateurs, tondeuses, cuisine, piscine, lave-vitres et autres appareils automatisés.

Meilleur Robot propose :
- des pages catégories pour comparer chaque famille de robots
- des fiches produits avec prix et marchands
- des pages marques
- des guides pour aider au choix selon les usages

## Pages clés

- [Homepage](${base}/)
- [Recherche](${base}/search)
- [Guides et articles](${base}/pages)
- [Annuaire des marques](${base}/marques)

## Catégories importantes

- [Robots aspirateurs](${base}/c/robots-aspirateurs)
- [Robots tondeuses](${base}/c/robots-tondeuses)
- [Robots cuisine](${base}/c/robots-cuisine)
- [Robots lave-vitres](${base}/c/robots-lave-vitres)
- [Robots piscine](${base}/c/robots-piscine)

## Types de pages

### Pages catégories
Les pages catégories regroupent les produits d’un même univers et servent à comparer les modèles selon leur usage, leurs fonctionnalités et leurs prix.

### Pages produits
Les fiches produits présentent le modèle, la marque, les offres, les prix disponibles et les informations utiles à la comparaison.

### Pages marques
Les pages marques relient une marque à ses produits et à son univers.

## Conseils d’interprétation

- Les pages catégories sont les meilleures portes d’entrée pour comprendre un univers produit.
- Les pages produits sont les meilleures sources pour les prix et offres.
- Les guides servent à comprendre les différences entre usages, technologies et niveaux de gamme.

## Sitemaps

- [Sitemap](${base}/sitemap.xml)

## Robots

- [robots.txt](${base}/robots.txt)
`;
}

function buildDefaultLlms(base: string, siteName: string) {
  return `# ${siteName}

> ${siteName} est un site de comparaison de produits et de contenus éditoriaux.

## Pages clés

- [Homepage](${base}/)
- [Recherche](${base}/search)
- [Guides et articles](${base}/pages)
- [Marques](${base}/marques)

## Sitemaps

- [Sitemap](${base}/sitemap.xml)

## Robots

- [robots.txt](${base}/robots.txt)
`;
}

export async function GET() {
  const siteId = await getCurrentSiteId();
  const siteConfig = getSiteConfig(siteId);
  const base = (await getCurrentSiteUrl()).replace(/\/+$/, "");

  let body: string;

  if (siteId === "meilleur-ski") {
    body = buildSkiLlms(base);
  } else if (siteId === "meilleur-robot") {
    body = buildRobotLlms(base);
  } else {
    body = buildDefaultLlms(base, siteConfig.name);
  }

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}