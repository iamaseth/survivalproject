ALTER TABLE public.creator_workspace
  ADD COLUMN IF NOT EXISTS product_requested text,
  ADD COLUMN IF NOT EXISTS quantity integer,
  ADD COLUMN IF NOT EXISTS shipping_note text;