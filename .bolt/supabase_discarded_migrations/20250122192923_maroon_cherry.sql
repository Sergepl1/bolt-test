-- Add premium status to profiles
ALTER TABLE profiles
ADD COLUMN is_premium boolean DEFAULT false;

-- Create function to check if user is premium
CREATE OR REPLACE FUNCTION is_user_premium(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id
    AND is_premium = true
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_user_premium(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_premium(uuid) TO anon;