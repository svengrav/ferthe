-- Stumble V2: DB-first caching + feedback system

-- Add new columns to stumble_pois
ALTER TABLE "public"."stumble_pois"
  ADD COLUMN IF NOT EXISTS "tags" "jsonb" DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "address" "text",
  ADD COLUMN IF NOT EXISTS "description" "text",
  ADD COLUMN IF NOT EXISTS "feedback_score" integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "feature_category" "text";

-- Backfill feature_category from poi_type where not set
UPDATE "public"."stumble_pois"
  SET "feature_category" = "poi_type"
  WHERE "feature_category" IS NULL AND "poi_type" IS NOT NULL;

-- Index for feedback_score sorting
CREATE INDEX IF NOT EXISTS "idx_stumble_pois_feedback_score"
  ON "public"."stumble_pois" ("feedback_score" DESC);

-- Index for external_id dedup lookups
CREATE UNIQUE INDEX IF NOT EXISTS "idx_stumble_pois_external_id_unique"
  ON "public"."stumble_pois" ("external_id");

-- Stumble feedback table
CREATE TABLE IF NOT EXISTS "public"."stumble_feedback" (
  "id" "text" NOT NULL,
  "poi_id" "text" NOT NULL,
  "account_id" "text" NOT NULL,
  "vote" "text" NOT NULL CHECK ("vote" IN ('up', 'down')),
  "created_at" bigint NOT NULL,
  CONSTRAINT "stumble_feedback_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "stumble_feedback_poi_fkey" FOREIGN KEY ("poi_id")
    REFERENCES "public"."stumble_pois"("id") ON DELETE CASCADE,
  CONSTRAINT "stumble_feedback_account_fkey" FOREIGN KEY ("account_id")
    REFERENCES "public"."accounts"("id") ON DELETE CASCADE,
  CONSTRAINT "stumble_feedback_unique" UNIQUE ("account_id", "poi_id")
);

CREATE INDEX IF NOT EXISTS "idx_stumble_feedback_account"
  ON "public"."stumble_feedback" ("account_id");

CREATE INDEX IF NOT EXISTS "idx_stumble_feedback_poi"
  ON "public"."stumble_feedback" ("poi_id");

-- Update get_pois_in_radius RPC to return all fields
CREATE OR REPLACE FUNCTION "public"."get_pois_in_radius"(
  "lat" double precision,
  "lon" double precision,
  "radius_meters" integer
) RETURNS TABLE(
  "id" "text",
  "name" "text",
  "poi_type" "text",
  "distance_meters" double precision
)
LANGUAGE "plpgsql"
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.poi_type,
    ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
    ) AS distance_meters
  FROM stumble_pois p
  WHERE ST_DWithin(
    p.location,
    ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
    radius_meters
  )
  ORDER BY distance_meters;
END;
$$;
