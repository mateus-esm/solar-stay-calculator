-- Drop ALL SELECT policies on properties to start fresh
DROP POLICY IF EXISTS "Users can view properties shared with them" ON properties;
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;

-- Create a security definer function to check property ownership (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_property_owner(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties WHERE id = _property_id AND owner_id = _user_id
  )
$$;

-- Create a security definer function to check property access via property_access table
CREATE OR REPLACE FUNCTION public.has_shared_access(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.property_access WHERE property_id = _property_id AND user_id = _user_id
  )
$$;

-- Recreate SELECT policies using the security definer functions
CREATE POLICY "Users can view their own properties" 
ON properties FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Users can view properties shared with them" 
ON properties FOR SELECT 
USING (public.has_shared_access(auth.uid(), id));

-- Also fix property_access policies to use security definer function
DROP POLICY IF EXISTS "Property owners can grant access" ON property_access;
DROP POLICY IF EXISTS "Property owners can revoke access" ON property_access;
DROP POLICY IF EXISTS "Property owners can view access" ON property_access;

CREATE POLICY "Property owners can grant access" 
ON property_access FOR INSERT 
WITH CHECK (public.is_property_owner(auth.uid(), property_id));

CREATE POLICY "Property owners can revoke access" 
ON property_access FOR DELETE 
USING (public.is_property_owner(auth.uid(), property_id));

CREATE POLICY "Property owners can view access" 
ON property_access FOR SELECT 
USING (public.is_property_owner(auth.uid(), property_id));