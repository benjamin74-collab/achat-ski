# Moteur d'import V2 — Meilleur-Ski

## Fonctionnement

- aucune création de SKU ;
- regroupement des tailles et couleurs en un seul Product ;
- une seule Offer par couple Product / Merchant ;
- filtrage strict via Category.mapEkosport ;
- mise à jour quotidienne ;
- désactivation des offres absentes du flux ;
- suppression des produits orphelins sans tests, avis ni clics ;
- désactivation des produits éditoriaux qui ne doivent pas être supprimés.

## 1. Modifier schema.prisma

Appliquer les changements décrits dans :

prisma/schema-import-v2.patch.txt

Puis :

```bash
npx prisma format
npx prisma migrate dev --name catalog_import_v2
npx prisma generate
```

Sur la base de production :

```bash
npx prisma migrate deploy
```

## 2. Variables d'environnement

```env
CRON_SECRET=une-cle-aleatoire-de-plus-de-16-caracteres
KWANKO_INGEST_SECRET=une-autre-cle-secrete
EKOSPORT_SALOMON_FEED_URL=https://flux.netaffiliation.com/feed.php?...
```

Ne pas committer l'URL privée du flux dans Git.

## 3. Mapping des catégories

Chaque catégorie importable doit contenir au moins une valeur exacte dans :

```prisma
Category.mapEkosport
```

Exemple :

```text
Ski > Ski alpin > Ski de piste
```

Le moteur accepte aussi les sous-catégories de ce chemin.

Tout produit sans mapping est ignoré avant la création de la marque, du produit et de l'offre.

## 4. Test local par URL

```bash
npm run feed:import:ekosport -- "%EKOSPORT_SALOMON_FEED_URL%" ekosport-brands-salomon
```

Sous PowerShell :

```powershell
npm run feed:import:ekosport -- $env:EKOSPORT_SALOMON_FEED_URL ekosport-brands-salomon
```

## 5. Test local par fichier

```bash
npm run feed:import:ekosport -- prisma/feed-data/ekosport-salomon.csv ekosport-brands-salomon
```

## 6. Cron Vercel

Le fichier vercel.json lance :

```text
/api/cron/catalog-sync
```

tous les jours à 04:00 UTC.

Le cron appelle directement le service TypeScript. Il ne lance pas de child_process.

## 7. Vérification avant production

```bash
npm run build
```

Puis contrôler dans FeedImport :

- totalRows
- importedRows
- skippedRows
- createdProducts
- updatedProducts
- createdOffers
- updatedOffers
- deactivatedOffers
- deletedProducts
- errorsCount
