-- Finalize RLS adjustments safely with conditional blocks

-- Remove outdated broad clients policy if it still exists
DROP POLICY IF EXISTS "Managers can view basic client data" ON public.clients;

-- Rate limit attempts: replace permissive policy with granular ones
DROP POLICY IF EXISTS "System can manage rate limit attempts" ON public.rate_limit_attempts;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'rate_limit_attempts' AND policyname = 'System can insert rate limit attempts'
  ) THEN
    EXECUTE $$CREATE POLICY "System can insert rate limit attempts"
    ON public.rate_limit_attempts
    FOR INSERT
    WITH CHECK (true)$$;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'rate_limit_attempts' AND policyname = 'Admins can view rate limit attempts'
  ) THEN
    EXECUTE $$CREATE POLICY "Admins can view rate limit attempts"
    ON public.rate_limit_attempts
    FOR SELECT
    USING (get_current_user_role() IN ('super_admin','admin'))$$;
  END IF;
END$$;