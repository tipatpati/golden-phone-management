
-- 1) Product history table
CREATE TABLE IF NOT EXISTS public.product_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  operation_type text NOT NULL, -- 'insert' | 'update' | 'delete'
  changed_by uuid NULL, -- auth.uid()
  changed_at timestamptz NOT NULL DEFAULT now(),
  old_data jsonb NULL,
  new_data jsonb NULL,
  note text NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_product_history_product_id ON public.product_history (product_id);
CREATE INDEX IF NOT EXISTS idx_product_history_changed_at ON public.product_history (changed_at DESC);

-- Enable RLS
ALTER TABLE public.product_history ENABLE ROW LEVEL SECURITY;

-- Policy: allow reads for admins/managers/inventory managers
DROP POLICY IF EXISTS "Authorized users can view product history" ON public.product_history;
CREATE POLICY "Authorized users can view product history"
  ON public.product_history
  FOR SELECT
  USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role,'admin'::app_role,'manager'::app_role,'inventory_manager'::app_role]));

-- Policy: allow inserts (performed by trigger function)
DROP POLICY IF EXISTS "System can insert product history" ON public.product_history;
CREATE POLICY "System can insert product history"
  ON public.product_history
  FOR INSERT
  WITH CHECK (true);

-- 2) Product unit history table
CREATE TABLE IF NOT EXISTS public.product_unit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_unit_id uuid NOT NULL,
  product_id uuid NOT NULL,
  operation_type text NOT NULL, -- 'insert' | 'update' | 'delete'
  changed_by uuid NULL, -- auth.uid()
  changed_at timestamptz NOT NULL DEFAULT now(),
  old_data jsonb NULL,
  new_data jsonb NULL,
  note text NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_unit_history_unit_id ON public.product_unit_history (product_unit_id);
CREATE INDEX IF NOT EXISTS idx_product_unit_history_product_id ON public.product_unit_history (product_id);
CREATE INDEX IF NOT EXISTS idx_product_unit_history_changed_at ON public.product_unit_history (changed_at DESC);

-- Enable RLS
ALTER TABLE public.product_unit_history ENABLE ROW LEVEL SECURITY;

-- Policy: allow reads for admins/managers/inventory managers
DROP POLICY IF EXISTS "Authorized users can view product unit history" ON public.product_unit_history;
CREATE POLICY "Authorized users can view product unit history"
  ON public.product_unit_history
  FOR SELECT
  USING (get_current_user_role() = ANY (ARRAY['super_admin'::app_role,'admin'::app_role,'manager'::app_role,'inventory_manager'::app_role]));

-- Policy: allow inserts (performed by trigger function)
DROP POLICY IF EXISTS "System can insert product unit history" ON public.product_unit_history;
CREATE POLICY "System can insert product unit history"
  ON public.product_unit_history
  FOR INSERT
  WITH CHECK (true);

-- 3) Trigger functions (security definer) to capture row snapshots

CREATE OR REPLACE FUNCTION public.log_product_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  op text;
  actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    op := 'insert';
    INSERT INTO public.product_history (product_id, operation_type, changed_by, old_data, new_data)
    VALUES (NEW.id, op, actor, NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    op := 'update';
    INSERT INTO public.product_history (product_id, operation_type, changed_by, old_data, new_data)
    VALUES (NEW.id, op, actor, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    op := 'delete';
    INSERT INTO public.product_history (product_id, operation_type, changed_by, old_data, new_data)
    VALUES (OLD.id, op, actor, to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_product_unit_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  op text;
  actor uuid := auth.uid();
  pid uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    op := 'insert';
    pid := NEW.product_id;
    INSERT INTO public.product_unit_history (product_unit_id, product_id, operation_type, changed_by, old_data, new_data)
    VALUES (NEW.id, pid, op, actor, NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    op := 'update';
    pid := NEW.product_id;
    INSERT INTO public.product_unit_history (product_unit_id, product_id, operation_type, changed_by, old_data, new_data)
    VALUES (NEW.id, pid, op, actor, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    op := 'delete';
    pid := OLD.product_id;
    INSERT INTO public.product_unit_history (product_unit_id, product_id, operation_type, changed_by, old_data, new_data)
    VALUES (OLD.id, pid, op, actor, to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 4) Attach triggers to products and product_units

DROP TRIGGER IF EXISTS trg_log_products ON public.products;
CREATE TRIGGER trg_log_products
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.log_product_changes();

DROP TRIGGER IF EXISTS trg_log_product_units ON public.product_units;
CREATE TRIGGER trg_log_product_units
AFTER INSERT OR UPDATE OR DELETE ON public.product_units
FOR EACH ROW
EXECUTE FUNCTION public.log_product_unit_changes();

-- 5) Ensure updated_at is always maintained on update
-- Uses existing function public.update_updated_at_column()

DROP TRIGGER IF EXISTS set_timestamp_products ON public.products;
CREATE TRIGGER set_timestamp_products
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_timestamp_product_units ON public.product_units;
CREATE TRIGGER set_timestamp_product_units
BEFORE UPDATE ON public.product_units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
