-- Drop existing listing_drafts table if it exists
DROP TABLE IF EXISTS listing_drafts CASCADE;

-- Create listing drafts table
CREATE TABLE listing_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  condition text CHECK (condition IN ('new', 'used')),
  type listing_type NOT NULL,
  price decimal(10,2),
  location jsonb NOT NULL,
  allow_trade boolean DEFAULT false,
  shipping_available boolean DEFAULT false,
  images jsonb[] DEFAULT array[]::jsonb[],
  title_image_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one draft per user
  CONSTRAINT unique_user_draft UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE listing_drafts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their drafts"
  ON listing_drafts FOR ALL
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN user_id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = user_id
    END
  );

-- Create function to save draft
CREATE OR REPLACE FUNCTION save_listing_draft(
  draft_data jsonb,
  images_data jsonb[],
  title_image_index integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  draft_id uuid;
BEGIN
  -- Insert or update draft
  INSERT INTO listing_drafts (
    user_id,
    title,
    description,
    category,
    condition,
    type,
    price,
    location,
    allow_trade,
    shipping_available,
    images,
    title_image_index,
    updated_at
  )
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    draft_data->>'title',
    draft_data->>'description',
    draft_data->>'category',
    draft_data->>'condition',
    (draft_data->>'type')::listing_type,
    (draft_data->>'price')::decimal,
    draft_data->'location',
    COALESCE((draft_data->>'allow_trade')::boolean, false),
    COALESCE((draft_data->>'shipping_available')::boolean, false),
    images_data,
    title_image_index,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    condition = EXCLUDED.condition,
    type = EXCLUDED.type,
    price = EXCLUDED.price,
    location = EXCLUDED.location,
    allow_trade = EXCLUDED.allow_trade,
    shipping_available = EXCLUDED.shipping_available,
    images = EXCLUDED.images,
    title_image_index = EXCLUDED.title_image_index,
    updated_at = now()
  RETURNING id INTO draft_id;

  RETURN draft_id;
END;
$$;

-- Create function to get draft
CREATE OR REPLACE FUNCTION get_listing_draft()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  draft_data jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'title', title,
    'description', description,
    'category', category,
    'condition', condition,
    'type', type,
    'price', price,
    'location', location,
    'allow_trade', allow_trade,
    'shipping_available', shipping_available,
    'images', images,
    'title_image_index', title_image_index,
    'updated_at', updated_at
  )
  INTO draft_data
  FROM listing_drafts
  WHERE user_id = COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000')
  ORDER BY updated_at DESC
  LIMIT 1;

  RETURN COALESCE(draft_data, '{}'::jsonb);
END;
$$;

-- Create function to delete draft
CREATE OR REPLACE FUNCTION delete_listing_draft()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM listing_drafts
  WHERE user_id = COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000');
END;
$$;

-- Create indexes
CREATE INDEX idx_listing_drafts_user_id ON listing_drafts(user_id);
CREATE INDEX idx_listing_drafts_updated_at ON listing_drafts(updated_at DESC);