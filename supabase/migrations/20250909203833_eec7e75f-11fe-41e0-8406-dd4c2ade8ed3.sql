-- 1) Enable pg_trgm for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2) Slugify helper function
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  result text;
BEGIN
  result := lower(coalesce(input, ''));
  -- Replace any sequence of non-alphanumeric characters with a single hyphen
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  -- Trim hyphens from start/end
  result := regexp_replace(result, '(^-|-$)', '', 'g');
  RETURN result;
END;
$$;

-- 3) Add columns for slugs and search vectors
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS search_vector tsvector;

ALTER TABLE public.models ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 4) Backfill slug and search vectors for existing data
UPDATE public.brands SET slug = slugify(name) WHERE slug IS NULL;
UPDATE public.brands SET search_vector = to_tsvector('simple', coalesce(name, '')) WHERE search_vector IS NULL;

UPDATE public.models m
SET slug = slugify(m.name)
WHERE m.slug IS NULL;

UPDATE public.models m
SET search_vector = to_tsvector('simple', coalesce(m.name, '') || ' ' || coalesce(b.name, ''))
FROM public.brands b
WHERE b.id = m.brand_id AND m.search_vector IS NULL;

-- 5) Indexes: performance for search and lookup
-- Non-unique functional indexes for safety (avoid migration failures on existing duplicates)
CREATE INDEX IF NOT EXISTS idx_brands_name_lower ON public.brands (lower(name));
CREATE INDEX IF NOT EXISTS idx_models_brand_name_lower ON public.models (brand_id, lower(name));

-- Slug indexes
CREATE INDEX IF NOT EXISTS idx_brands_slug ON public.brands (slug);
CREATE INDEX IF NOT EXISTS idx_models_brand_slug ON public.models (brand_id, slug);

-- Trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_brands_name_trgm ON public.brands USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_models_name_trgm ON public.models USING GIN (name gin_trgm_ops);

-- Full-text vector indexes
CREATE INDEX IF NOT EXISTS idx_brands_search_vector ON public.brands USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_models_search_vector ON public.models USING GIN (search_vector);

-- 6) Derived fields triggers for brands/models (slug + search_vector + updated_at)
CREATE OR REPLACE FUNCTION public.brands_set_derived_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.slug := slugify(coalesce(NEW.name, ''));
  NEW.search_vector := to_tsvector('simple', coalesce(NEW.name, ''));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_brands_set_derived_fields ON public.brands;
CREATE TRIGGER trg_brands_set_derived_fields
BEFORE INSERT OR UPDATE OF name ON public.brands
FOR EACH ROW EXECUTE FUNCTION public.brands_set_derived_fields();

CREATE OR REPLACE FUNCTION public.models_set_derived_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  brand_name text;
BEGIN
  SELECT name INTO brand_name FROM public.brands WHERE id = NEW.brand_id;
  NEW.slug := slugify(coalesce(NEW.name, ''));
  NEW.search_vector := to_tsvector('simple', coalesce(NEW.name, '') || ' ' || coalesce(brand_name, ''));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_models_set_derived_fields ON public.models;
CREATE TRIGGER trg_models_set_derived_fields
BEFORE INSERT OR UPDATE OF name, brand_id ON public.models
FOR EACH ROW EXECUTE FUNCTION public.models_set_derived_fields();

-- 7) Relationship hardening (FKs added as NOT VALID to avoid migration failures; enforced for new rows)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brands_category_fk'
  ) THEN
    ALTER TABLE public.brands
      ADD CONSTRAINT brands_category_fk FOREIGN KEY (category_id)
      REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL NOT VALID;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'models_brand_fk'
  ) THEN
    ALTER TABLE public.models
      ADD CONSTRAINT models_brand_fk FOREIGN KEY (brand_id)
      REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'models_category_fk'
  ) THEN
    ALTER TABLE public.models
      ADD CONSTRAINT models_category_fk FOREIGN KEY (category_id)
      REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL NOT VALID;
  END IF;
END $$;

-- 8) Alias tables to support alternate names and enhanced search
CREATE TABLE IF NOT EXISTS public.brand_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  alias text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.model_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL,
  brand_id uuid NOT NULL,
  alias text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- FKs for alias tables
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brand_aliases_brand_fk'
  ) THEN
    ALTER TABLE public.brand_aliases
      ADD CONSTRAINT brand_aliases_brand_fk FOREIGN KEY (brand_id)
      REFERENCES public.brands(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'model_aliases_model_fk'
  ) THEN
    ALTER TABLE public.model_aliases
      ADD CONSTRAINT model_aliases_model_fk FOREIGN KEY (model_id)
      REFERENCES public.models(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'model_aliases_brand_fk'
  ) THEN
    ALTER TABLE public.model_aliases
      ADD CONSTRAINT model_aliases_brand_fk FOREIGN KEY (brand_id)
      REFERENCES public.brands(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Useful indexes and uniqueness (case-insensitive alias uniqueness per scope)
CREATE UNIQUE INDEX IF NOT EXISTS brand_aliases_brand_alias_lower_uniq ON public.brand_aliases (brand_id, lower(alias));
CREATE UNIQUE INDEX IF NOT EXISTS model_aliases_brand_alias_lower_uniq ON public.model_aliases (brand_id, lower(alias));

CREATE INDEX IF NOT EXISTS idx_brand_aliases_alias_trgm ON public.brand_aliases USING GIN (alias gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_model_aliases_alias_trgm ON public.model_aliases USING GIN (alias gin_trgm_ops);

-- RLS for alias tables (mirror brands/models policies)
ALTER TABLE public.brand_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_aliases ENABLE ROW LEVEL SECURITY;

-- Policies: view for authenticated roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'brand_aliases' AND policyname = 'Authenticated users can view brand aliases'
  ) THEN
    CREATE POLICY "Authenticated users can view brand aliases"
    ON public.brand_aliases FOR SELECT
    USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role,'admin'::app_role,'manager'::app_role,'inventory_manager'::app_role,'salesperson'::app_role,'technician'::app_role]));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'brand_aliases' AND policyname = 'Inventory managers can manage brand aliases'
  ) THEN
    CREATE POLICY "Inventory managers can manage brand aliases"
    ON public.brand_aliases FOR ALL
    USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role,'admin'::app_role,'manager'::app_role,'inventory_manager'::app_role]))
    WITH CHECK (get_current_user_role() = ANY (ARRAY['super_admin'::app_role,'admin'::app_role,'manager'::app_role,'inventory_manager'::app_role]));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'model_aliases' AND policyname = 'Authenticated users can view model aliases'
  ) THEN
    CREATE POLICY "Authenticated users can view model aliases"
    ON public.model_aliases FOR SELECT
    USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role,'admin'::app_role,'manager'::app_role,'inventory_manager'::app_role,'salesperson'::app_role,'technician'::app_role]));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'model_aliases' AND policyname = 'Inventory managers can manage model aliases'
  ) THEN
    CREATE POLICY "Inventory managers can manage model aliases"
    ON public.model_aliases FOR ALL
    USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role,'admin'::app_role,'manager'::app_role,'inventory_manager'::app_role]))
    WITH CHECK (get_current_user_role() = ANY (ARRAY['super_admin'::app_role,'admin'::app_role,'manager'::app_role,'inventory_manager'::app_role]));
  END IF;
END $$;

-- 9) Update timestamps triggers for alias tables (reuse shared function)
DROP TRIGGER IF EXISTS trg_brand_aliases_updated_at ON public.brand_aliases;
CREATE TRIGGER trg_brand_aliases_updated_at
BEFORE UPDATE ON public.brand_aliases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_model_aliases_updated_at ON public.model_aliases;
CREATE TRIGGER trg_model_aliases_updated_at
BEFORE UPDATE ON public.model_aliases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10) Optimized search functions to leverage aliases + trigram + FTS
CREATE OR REPLACE FUNCTION public.search_brands(search_term text, max_results integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  category_id integer,
  logo_url text,
  score real
) LANGUAGE sql STABLE AS $$
  SELECT b.id, b.name, b.slug, b.category_id, b.logo_url,
         GREATEST(similarity(b.name, coalesce(search_term, '')), 0)::real AS score
  FROM public.brands b
  WHERE search_term IS NULL
     OR b.name ILIKE '%' || search_term || '%'
     OR EXISTS (
          SELECT 1 FROM public.brand_aliases ba
          WHERE ba.brand_id = b.id AND ba.alias ILIKE '%' || search_term || '%'
        )
  ORDER BY score DESC, b.name ASC
  LIMIT max_results
$$;

CREATE OR REPLACE FUNCTION public.search_models(search_term text, brand_name text DEFAULT NULL, max_results integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  brand_id uuid,
  brand_name text,
  category_id integer,
  storage_variants text[],
  color_variants text[],
  release_year integer,
  score real
) LANGUAGE sql STABLE AS $$
  SELECT m.id, m.name, m.slug, m.brand_id, b.name AS brand_name, m.category_id, m.storage_variants, m.color_variants, m.release_year,
         GREATEST(similarity(m.name, coalesce(search_term, '')), similarity(coalesce(b.name,''), coalesce(brand_name,'')), 0)::real AS score
  FROM public.models m
  JOIN public.brands b ON b.id = m.brand_id
  WHERE (brand_name IS NULL OR b.name ILIKE '%' || brand_name || '%')
    AND (
      search_term IS NULL
      OR m.name ILIKE '%' || search_term || '%'
      OR EXISTS (
           SELECT 1 FROM public.model_aliases ma
           WHERE ma.model_id = m.id AND ma.alias ILIKE '%' || search_term || '%'
         )
    )
  ORDER BY score DESC, b.name ASC, m.name ASC
  LIMIT max_results
$$;