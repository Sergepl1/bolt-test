-- Create search subscription table
CREATE TABLE search_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  min_price decimal(10,2),
  max_price decimal(10,2),
  condition text CHECK (condition IN ('new', 'used', 'any')),
  location jsonb,
  radius_km integer,
  keywords text[],
  with_shipping boolean,
  with_trade boolean,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_notified_at timestamptz,
  
  CONSTRAINT valid_price_range CHECK (
    (min_price IS NULL AND max_price IS NULL) OR
    (min_price IS NOT NULL AND max_price IS NOT NULL AND min_price <= max_price)
  ),
  CONSTRAINT valid_radius CHECK (
    radius_km IS NULL OR radius_km > 0
  )
);

-- Enable RLS
ALTER TABLE search_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their search subscriptions"
  ON search_subscriptions FOR ALL
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN user_id = '00000000-0000-0000-0000-000000000000'
      ELSE auth.uid() = user_id
    END
  );

-- Create function to check if a listing matches a search subscription
CREATE OR REPLACE FUNCTION matches_search_criteria(
  listing_record listings,
  subscription_record search_subscriptions
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  listing_location point;
  search_location point;
  distance_km double precision;
BEGIN
  -- Category check
  IF subscription_record.category IS NOT NULL 
    AND subscription_record.category != listing_record.category THEN
    RETURN false;
  END IF;

  -- Price range check
  IF subscription_record.min_price IS NOT NULL 
    AND listing_record.price < subscription_record.min_price THEN
    RETURN false;
  END IF;
  
  IF subscription_record.max_price IS NOT NULL 
    AND listing_record.price > subscription_record.max_price THEN
    RETURN false;
  END IF;

  -- Condition check
  IF subscription_record.condition != 'any' 
    AND subscription_record.condition IS NOT NULL 
    AND subscription_record.condition != listing_record.condition THEN
    RETURN false;
  END IF;

  -- Location check
  IF subscription_record.location IS NOT NULL AND subscription_record.radius_km IS NOT NULL THEN
    -- Convert locations to points
    listing_location := point(
      (listing_record.location->>'lng')::float,
      (listing_record.location->>'lat')::float
    );
    search_location := point(
      (subscription_record.location->>'lng')::float,
      (subscription_record.location->>'lat')::float
    );
    
    -- Calculate distance
    distance_km := point_distance(listing_location, search_location) / 1000;
    
    IF distance_km > subscription_record.radius_km THEN
      RETURN false;
    END IF;
  END IF;

  -- Shipping check
  IF subscription_record.with_shipping = true 
    AND NOT listing_record.shipping_available THEN
    RETURN false;
  END IF;

  -- Trade check
  IF subscription_record.with_trade = true 
    AND NOT listing_record.allow_trade THEN
    RETURN false;
  END IF;

  -- Keyword check
  IF subscription_record.keywords IS NOT NULL AND array_length(subscription_record.keywords, 1) > 0 THEN
    IF NOT EXISTS (
      SELECT 1
      FROM unnest(subscription_record.keywords) keyword
      WHERE listing_record.title ILIKE '%' || keyword || '%'
         OR listing_record.description ILIKE '%' || keyword || '%'
    ) THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$;

-- Create function to notify users about matching listings
CREATE OR REPLACE FUNCTION notify_matching_subscriptions()
RETURNS TRIGGER AS $$
DECLARE
  subscription_record record;
  user_email text;
BEGIN
  -- Only proceed if the listing is being activated
  IF NEW.status != 'active' THEN
    RETURN NEW;
  END IF;

  -- Find matching subscriptions
  FOR subscription_record IN
    SELECT s.*, u.email
    FROM search_subscriptions s
    JOIN auth.users u ON u.id = s.user_id
    WHERE s.active = true
  LOOP
    -- Check if listing matches subscription criteria
    IF matches_search_criteria(NEW, subscription_record) THEN
      -- Create notification
      INSERT INTO notifications (
        user_id,
        type,
        title,
        content,
        data
      )
      VALUES (
        subscription_record.user_id,
        'system',
        'Neues passendes Inserat',
        'Ein neues Inserat entspricht Ihrer Suchabonnement "' || subscription_record.name || '"',
        jsonb_build_object(
          'listing_id', NEW.id,
          'listing_title', NEW.title,
          'subscription_id', subscription_record.id,
          'subscription_name', subscription_record.name
        )
      );

      -- Update last notification timestamp
      UPDATE search_subscriptions
      SET last_notified_at = now()
      WHERE id = subscription_record.id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new listing notifications
CREATE TRIGGER on_listing_activated
  AFTER UPDATE ON listings
  FOR EACH ROW
  WHEN (OLD.status != 'active' AND NEW.status = 'active')
  EXECUTE FUNCTION notify_matching_subscriptions();

-- Create indexes
CREATE INDEX idx_search_subscriptions_user ON search_subscriptions(user_id);
CREATE INDEX idx_search_subscriptions_active ON search_subscriptions(active);
CREATE INDEX idx_search_subscriptions_category ON search_subscriptions(category);
CREATE INDEX idx_search_subscriptions_updated ON search_subscriptions(updated_at);