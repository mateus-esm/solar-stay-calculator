-- Add pix_key column to stays table for storing PIX key at booking time
ALTER TABLE public.stays ADD COLUMN pix_key text;