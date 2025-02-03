-- Create function to handle account deletion
CREATE OR REPLACE FUNCTION delete_user_account(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete user's data
  DELETE FROM auth.users WHERE id = user_id_param;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_account(uuid) TO anon;