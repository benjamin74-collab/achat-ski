-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1) Ajouter description si absente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Product' AND column_name='description'
  ) THEN
    ALTER TABLE "public"."Product" ADD COLUMN "description" TEXT;
  END IF;
END$$;

-- 2) Ajouter fts si absente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Product' AND column_name='fts'
  ) THEN
    ALTER TABLE "public"."Product" ADD COLUMN "fts" tsvector;
  END IF;
END$$;

-- 3) Fonction & trigger pour maintenir fts
CREATE OR REPLACE FUNCTION product_fts_update() RETURNS trigger AS $$
BEGIN
  NEW.fts :=
    to_tsvector(
      'french',
      unaccent(COALESCE(NEW.brand,'') || ' ' || COALESCE(NEW.model,'') || ' ' || COALESCE(NEW.category,'') || ' ' || COALESCE(NEW.season,''))
    );
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- (Re)créer le trigger
DROP TRIGGER IF EXISTS product_fts_update_trg ON "public"."Product";
CREATE TRIGGER product_fts_update_trg
BEFORE INSERT OR UPDATE ON "public"."Product"
FOR EACH ROW EXECUTE FUNCTION product_fts_update();

-- 4) Initialiser fts pour les lignes existantes
UPDATE "public"."Product" p
SET "fts" = to_tsvector(
  'french',
  unaccent(COALESCE(p.brand,'') || ' ' || COALESCE(p.model,'') || ' ' || COALESCE(p.category,'') || ' ' || COALESCE(p.season,''))
)
WHERE p."fts" IS NULL;

-- 5) (Re)créer les index GIN sans ASC/DESC
DROP INDEX IF EXISTS "product_brand_trgm";
CREATE INDEX "product_brand_trgm" ON "public"."Product" USING GIN ("brand" gin_trgm_ops);

DROP INDEX IF EXISTS "product_model_trgm";
CREATE INDEX "product_model_trgm" ON "public"."Product" USING GIN ("model" gin_trgm_ops);

DROP INDEX IF EXISTS "product_fts_gin";
CREATE INDEX "product_fts_gin" ON "public"."Product" USING GIN ("fts");
