-- Fix missing user profile and role for current user
-- First, let's get the current user's details
DO $$
DECLARE
    current_user_id uuid;
    user_email text;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        -- Get user email from auth.users if accessible, otherwise use default
        SELECT COALESCE(
            (SELECT email FROM auth.users WHERE id = current_user_id),
            'admin@example.com'
        ) INTO user_email;
        
        -- Insert profile if it doesn't exist
        INSERT INTO public.profiles (id, username, role)
        VALUES (
            current_user_id,
            'Admin',
            'admin'::app_role
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'admin'::app_role,
            username = COALESCE(profiles.username, 'Admin');
        
        -- Insert user role if it doesn't exist
        INSERT INTO public.user_roles (user_id, role)
        VALUES (current_user_id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'User profile and role created/updated for user %', current_user_id;
    ELSE
        RAISE NOTICE 'No authenticated user found';
    END IF;
END
$$;