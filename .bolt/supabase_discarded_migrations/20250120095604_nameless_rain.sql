-- Add PostGIS extension for location-based queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add coordinates columns to listings table
ALTER TABLE listings
ADD COLUMN coordinates geometry(Point, 4326);

-- Create function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R constant double precision := 6371; -- Earth's radius in kilometers
  phi1 double precision;
  phi2 double precision;
  delta_phi double precision;
  delta_lambda double precision;
  a double precision;
  c double precision;
BEGIN
  -- Convert degrees to radians
  phi1 := radians(lat1);
  phi2 := radians(lat2);
  delta_phi := radians(lat2 - lat1);
  delta_lambda := radians(lon2 - lon1);

  -- Haversine formula
  a := sin(delta_phi/2) * sin(delta_phi/2) +
       cos(phi1) * cos(phi2) *
       sin(delta_lambda/2) * sin(delta_lambda/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));

  RETURN R * c;
END;
$$;

-- Update existing listings to set coordinates from location
UPDATE listings
SET coordinates = ST_SetSRID(ST_MakePoint(
  (location->>'lng')::float,
  (location->>'lat')::float
), 4326)
WHERE location->>'lat' IS NOT NULL
  AND location->>'lng' IS NOT NULL;

-- Create index for spatial queries
CREATE INDEX idx_listings_coordinates ON listings USING GIST (coordinates);

-- Create function to search listings within radius
CREATE OR REPLACE FUNCTION search_listings_within_radius(
  center_lat double precision,
  center_lng double precision,
  radius_km double precision
)
RETURNS TABLE (
  id uuid,
  title text,
  distance double precision
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    calculate_distance(
      center_lat,
      center_lng,
      ST_Y(l.coordinates::geometry),
      ST_X(l.coordinates::geometry)
    ) as distance
  FROM listings l
  WHERE l.coordinates IS NOT NULL
    AND l.status = 'active'
    AND calculate_distance(
      center_lat,
      center_lng,
      ST_Y(l.coordinates::geometry),
      ST_X(l.coordinates::geometry)
    ) <= radius_km
  ORDER BY distance;
END;
$$;