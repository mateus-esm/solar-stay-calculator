-- Fix the broken RLS policy (infinite recursion bug)
DROP POLICY IF EXISTS "Users can view properties shared with them" ON properties;

CREATE POLICY "Users can view properties shared with them" 
ON properties FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM property_access 
    WHERE property_access.property_id = properties.id 
    AND property_access.user_id = auth.uid()
  )
);

-- Add solar system fields to properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS modules_count integer,
ADD COLUMN IF NOT EXISTS modules_power numeric,
ADD COLUMN IF NOT EXISTS modules_brand text,
ADD COLUMN IF NOT EXISTS inverter_power numeric,
ADD COLUMN IF NOT EXISTS inverter_brand text,
ADD COLUMN IF NOT EXISTS is_microinverter boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS microinverter_count integer;