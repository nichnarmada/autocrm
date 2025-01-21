-- Remove is_profile_setup column
ALTER TABLE profiles DROP COLUMN IF EXISTS is_profile_setup;

-- Add email column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Ensure user_role enum exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'agent', 'customer');
    END IF;
END $$;

-- First, drop the default
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- Then change the type
ALTER TABLE profiles 
    ALTER COLUMN role TYPE user_role 
    USING (role::user_role);

-- Finally, set the new default
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'customer'::user_role;