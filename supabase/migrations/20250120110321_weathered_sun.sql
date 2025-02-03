-- Create function to handle account deletion
CREATE OR REPLACE FUNCTION delete_user_account(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user is deleting their own account
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'You can only delete your own account';
  END IF;

  -- Delete user's data
  DELETE FROM auth.users 
  WHERE id = user_id_param 
  AND id = auth.uid();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account(uuid) TO authenticated;