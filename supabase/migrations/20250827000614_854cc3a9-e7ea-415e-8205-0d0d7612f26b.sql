-- Add unique index on employees.profile_id to prevent duplicate employee records per auth user
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_profile_id_unique
ON public.employees(profile_id)
WHERE profile_id IS NOT NULL;

-- Add foreign key from employees.profile_id to profiles.id to ensure referential integrity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public'
      AND table_name = 'employees'
      AND constraint_name = 'employees_profile_id_fkey'
  ) THEN
    ALTER TABLE public.employees
    ADD CONSTRAINT employees_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
    ON DELETE SET NULL;
  END IF;
END $$;