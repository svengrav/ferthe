-- Make created_by nullable (required for ON DELETE SET NULL)
ALTER TABLE "public"."communities" ALTER COLUMN "created_by" DROP NOT NULL;
ALTER TABLE "public"."trails" ALTER COLUMN "created_by" DROP NOT NULL;

-- communities.created_by → SET NULL on account delete
ALTER TABLE "public"."communities"
  DROP CONSTRAINT "communities_created_by_fkey",
  ADD CONSTRAINT "communities_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;

-- spots.created_by → SET NULL on account delete
ALTER TABLE "public"."spots"
  DROP CONSTRAINT "spots_created_by_fkey",
  ADD CONSTRAINT "spots_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;

-- trails.created_by → SET NULL on account delete
ALTER TABLE "public"."trails"
  DROP CONSTRAINT "trails_created_by_fkey",
  ADD CONSTRAINT "trails_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;

-- discovery_profiles.last_active_trail_id → SET NULL on trail delete
ALTER TABLE "public"."discovery_profiles"
  DROP CONSTRAINT "discovery_profiles_last_active_trail_id_fkey",
  ADD CONSTRAINT "discovery_profiles_last_active_trail_id_fkey"
    FOREIGN KEY ("last_active_trail_id") REFERENCES "public"."trails"("id") ON DELETE SET NULL;

-- sensor_scans.trail_id → CASCADE on trail delete (scan without trail is worthless)
ALTER TABLE "public"."sensor_scans"
  DROP CONSTRAINT "sensor_scans_trail_id_fkey",
  ADD CONSTRAINT "sensor_scans_trail_id_fkey"
    FOREIGN KEY ("trail_id") REFERENCES "public"."trails"("id") ON DELETE CASCADE;

-- stumble_visits.spot_id → SET NULL on spot delete (visit can exist without spot)
ALTER TABLE "public"."stumble_visits"
  DROP CONSTRAINT "stumble_visits_spot_id_fkey",
  ADD CONSTRAINT "stumble_visits_spot_id_fkey"
    FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE SET NULL;
