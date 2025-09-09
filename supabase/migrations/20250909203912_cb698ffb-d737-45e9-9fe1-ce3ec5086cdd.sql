-- Fix security warning for search functions by setting search_path
CREATE OR REPLACE FUNCTION public.search_brands(search_term text, max_results integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  category_id integer,
  logo_url text,
  score real
) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
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
) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
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