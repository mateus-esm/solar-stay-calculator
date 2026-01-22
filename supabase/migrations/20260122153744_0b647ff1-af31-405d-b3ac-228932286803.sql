-- Drop existing check constraint on status
ALTER TABLE public.stays DROP CONSTRAINT IF EXISTS stays_status_check;

-- Add new check constraint with all valid statuses including "pending"
ALTER TABLE public.stays ADD CONSTRAINT stays_status_check 
  CHECK (status IN ('pending', 'in_progress', 'completed', 'paid'));