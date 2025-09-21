import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Ajoute une colonne tsvector, un index GIN et un trigger
 * pour tenir à jour l’index plein-texte sur Product(brand, model, season, category).
 * Config française pour une meilleure racinisation.
 */
const SQL = `
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE "Product"
SET search_vector = to_tsvector('french',
  coalesce(brand,'') || ' ' || coalesce(model,'') || ' ' || coalesce(season,'') || ' ' || coalesce(category,'')
);

CREATE INDEX IF NOT EXISTS product_search_idx
  ON "Product" USING GIN (search_vector);

CREATE OR REPLACE FUNCTION product_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('french',
    coalesce(NEW.brand,'') || ' ' || coalesce(NEW.model,'') || ' ' || coalesce(NEW.season,'') || ' ' || coalesce(NEW.category,'')
  );
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_search_vector_update ON "Product";
CREATE TRIGGER product_search_vector_update
  BEFORE INSERT OR UPDATE OF brand, model, season, category
  ON "Product"
  FOR EACH ROW EXECUTE FUNCTION product_search_vector_trigger();
`;

async function main() {
  console.log("▶️  Setup FTS (tsvector/index/trigger)...");
  await prisma.$executeRawUnsafe(SQL);
  console.log("✅ FTS prêt.");
}

main().finally(async () => {
  await prisma.$disconnect();
});
