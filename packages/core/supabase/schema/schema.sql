


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."calculate_distance"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) RETURNS double precision
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN ST_Distance(
    ST_SetSRID(ST_MakePoint(lon1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lon2, lat2), 4326)::geography
  );
END;
$$;


ALTER FUNCTION "public"."calculate_distance"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_accessible_spots"("account_id_param" "text", "trail_id_param" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'location', json_build_object(
          'latitude', ST_Y(s.location::geometry),
          'longitude', ST_X(s.location::geometry)
        ),
        'imageUrl', s.image_url,
        'visibility', s.visibility,
        'createdBy', s.created_by,
        'source', CASE
          WHEN s.created_by = account_id_param THEN 'created'
          WHEN d.id IS NOT NULL THEN 'discovered'
          ELSE 'preview'
        END
      )
    )
    FROM spots s
    LEFT JOIN discoveries d ON d.spot_id = s.id AND d.account_id = account_id_param
    WHERE (
      s.created_by = account_id_param  -- User created it
      OR d.id IS NOT NULL              -- User discovered it
      OR s.visibility = 'public'       -- Public spot
    )
    AND (trail_id_param IS NULL OR s.id IN (
      SELECT spot_id FROM trail_spots WHERE trail_id = trail_id_param
    ))
  );
END;
$$;


ALTER FUNCTION "public"."get_accessible_spots"("account_id_param" "text", "trail_id_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_account_public_profile"("account_id_param" "text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'accountId', a.id,
      'displayName', a.display_name,
      'description', a.description,
      'avatarUrl', a.avatar_url,
      'spotCount', (
        SELECT COUNT(*) FROM spots WHERE created_by = account_id_param
      ),
      'trailCount', (
        SELECT COUNT(*) FROM trails WHERE created_by = account_id_param
      ),
      'avgRating', COALESCE((
        SELECT AVG(sr.rating)
        FROM spot_ratings sr
        INNER JOIN spots s ON s.id = sr.spot_id
        WHERE s.created_by = account_id_param
      ), 0),
      'ratingCount', (
        SELECT COUNT(*)
        FROM spot_ratings sr
        INNER JOIN spots s ON s.id = sr.spot_id
        WHERE s.created_by = account_id_param
      )
    )
    FROM accounts a
    WHERE a.id = account_id_param
  );
END;
$$;


ALTER FUNCTION "public"."get_account_public_profile"("account_id_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_community_discoveries"("community_id_param" "text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'discoveryId', cd.discovery_id,
        'sharedBy', cd.shared_by,
        'sharedAt', cd.shared_at,
        'spot', json_build_object(
          'id', s.id,
          'name', s.name,
          'location', json_build_object(
            'latitude', ST_Y(s.location::geometry),
            'longitude', ST_X(s.location::geometry)
          )
        ),
        'trail', json_build_object(
          'id', t.id,
          'name', t.name
        ),
        'sharedByProfile', json_build_object(
          'accountId', a.id,
          'displayName', a.display_name,
          'avatarUrl', a.avatar_url
        )
      )
    )
    FROM community_discoveries cd
    INNER JOIN discoveries d ON d.id = cd.discovery_id
    INNER JOIN spots s ON s.id = d.spot_id
    INNER JOIN trails t ON t.id = d.trail_id
    INNER JOIN accounts a ON a.id = cd.shared_by
    WHERE cd.community_id = community_id_param
    ORDER BY cd.shared_at DESC
  );
END;
$$;


ALTER FUNCTION "public"."get_community_discoveries"("community_id_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_discovery_state"("account_id_param" "text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'lastActiveTrailId', dp.last_active_trail_id,
    'discoveries', (
      SELECT json_agg(json_build_object(
        'id', d.id,
        'spotId', d.spot_id,
        'trailId', d.trail_id,
        'discoveredAt', d.discovered_at
      ))
      FROM discoveries d
      WHERE d.account_id = account_id_param
    ),
    'spots', (
      SELECT json_agg(json_build_object(
        'id', s.id,
        'name', s.name,
        'location', json_build_object(
          'latitude', ST_Y(s.location::geometry),
          'longitude', ST_X(s.location::geometry)
        ),
        'imageUrl', s.image_url
      ))
      FROM spots s
      INNER JOIN discoveries d ON d.spot_id = s.id
      WHERE d.account_id = account_id_param
    ),
    'activeTrail', (
      SELECT json_build_object(
        'trailId', t.id,
        'spotIds', (
          SELECT json_agg(ts.spot_id ORDER BY ts."order")
          FROM trail_spots ts
          WHERE ts.trail_id = t.id
        ),
        'discoveryIds', (
          SELECT json_agg(d.id)
          FROM discoveries d
          WHERE d.trail_id = t.id AND d.account_id = account_id_param
        )
      )
      FROM trails t
      WHERE t.id = dp.last_active_trail_id
    )
  ) INTO result
  FROM discovery_profiles dp
  WHERE dp.account_id = account_id_param;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_discovery_state"("account_id_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_nearby_spots"("user_lat" double precision, "user_lon" double precision, "radius_meters" integer DEFAULT 1000, "limit_param" integer DEFAULT 20) RETURNS json
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN (
    SELECT json_agg(result)
    FROM (
      SELECT json_build_object(
        'id', s.id,
        'name', s.name,
        'location', json_build_object(
          'latitude', ST_Y(s.location::geometry),
          'longitude', ST_X(s.location::geometry)
        ),
        'distance', ROUND(ST_Distance(
          s.location,
          ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography
        )::numeric, 2),
        'imageUrl', s.blurred_image_url
      ) as result
      FROM spots s
      WHERE ST_DWithin(
        s.location,
        ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
        radius_meters
      )
      AND s.visibility IN ('public', 'preview')
      ORDER BY s.location <-> ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography
      LIMIT limit_param
    ) ranked
  );
END;
$$;


ALTER FUNCTION "public"."get_nearby_spots"("user_lat" double precision, "user_lon" double precision, "radius_meters" integer, "limit_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pois_in_radius"("lat" double precision, "lon" double precision, "radius_meters" integer) RETURNS TABLE("id" "text", "name" "text", "poi_type" "text", "distance_meters" double precision)
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


ALTER FUNCTION "public"."get_pois_in_radius"("lat" double precision, "lon" double precision, "radius_meters" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_spot_rating_summary"("spot_id_param" "text") RETURNS TABLE("average" double precision, "count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(AVG(rating)::DOUBLE PRECISION, 0.0) AS average,
    COUNT(*)::BIGINT AS count
  FROM spot_ratings
  WHERE spot_id = spot_id_param;
END;
$$;


ALTER FUNCTION "public"."get_spot_rating_summary"("spot_id_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_spots_in_radius"("lat" double precision, "lon" double precision, "radius_meters" integer) RETURNS TABLE("id" "text", "name" "text", "distance_meters" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    ST_Distance(
      s.location,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
    ) AS distance_meters
  FROM spots s
  WHERE ST_DWithin(
    s.location,
    ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
    radius_meters
  )
  ORDER BY distance_meters;
END;
$$;


ALTER FUNCTION "public"."get_spots_in_radius"("lat" double precision, "lon" double precision, "radius_meters" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_rated_trails"("limit_param" integer DEFAULT 10) RETURNS json
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN (
    SELECT json_agg(result)
    FROM (
      SELECT json_build_object(
        'id', t.id,
        'name', t.name,
        'description', t.description,
        'imageUrl', t.image_url,
        'avgRating', COALESCE(AVG(tr.rating), 0),
        'ratingCount', COUNT(tr.id),
        'spotCount', (
          SELECT COUNT(*) FROM trail_spots WHERE trail_id = t.id
        )
      ) as result
      FROM trails t
      LEFT JOIN trail_ratings tr ON tr.trail_id = t.id
      GROUP BY t.id
      HAVING COUNT(tr.id) >= 3  -- Minimum 3 ratings
      ORDER BY AVG(tr.rating) DESC, COUNT(tr.id) DESC
      LIMIT limit_param
    ) ranked
  );
END;
$$;


ALTER FUNCTION "public"."get_top_rated_trails"("limit_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_trail_rating_summary"("trail_id_param" "text") RETURNS TABLE("average" double precision, "count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(AVG(rating)::DOUBLE PRECISION, 0.0) AS average,
    COUNT(*)::BIGINT AS count
  FROM trail_ratings
  WHERE trail_id = trail_id_param;
END;
$$;


ALTER FUNCTION "public"."get_trail_rating_summary"("trail_id_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_trail_with_spots"("trail_id_param" "text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'trail', json_build_object(
        'id', t.id,
        'name', t.name,
        'description', t.description,
        'imageUrl', t.image_url
      ),
      'spots', (
        SELECT json_agg(
          json_build_object(
            'id', s.id,
            'name', s.name,
            'order', ts."order",
            'location', json_build_object(
              'latitude', ST_Y(s.location::geometry),
              'longitude', ST_X(s.location::geometry)
            ),
            'imageUrl', s.image_url,
            'blurredImageUrl', s.blurred_image_url
          )
          ORDER BY ts."order"
        )
        FROM trail_spots ts
        INNER JOIN spots s ON s.id = ts.spot_id
        WHERE ts.trail_id = trail_id_param
      )
    )
    FROM trails t
    WHERE t.id = trail_id_param
  );
END;
$$;


ALTER FUNCTION "public"."get_trail_with_spots"("trail_id_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."account_sessions" (
    "id" "text" NOT NULL,
    "account_id" "text" NOT NULL,
    "session_token" "text" NOT NULL,
    "client_audience" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "account_sessions_client_audience_check" CHECK (("client_audience" = ANY (ARRAY['app'::"text", 'creator'::"text"])))
);


ALTER TABLE "public"."account_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."account_sms_codes" (
    "id" "text" NOT NULL,
    "phone_hash" "text" NOT NULL,
    "verification_sid" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "verified" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."account_sms_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "text" NOT NULL,
    "account_type" "text" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "phone_hash" "text",
    "is_phone_verified" boolean DEFAULT false NOT NULL,
    "display_name" "text",
    "description" "text",
    "avatar_url" "text",
    "avatar_blob_path" "text",
    "last_login_at" timestamp with time zone,
    "flags" jsonb DEFAULT '{}',
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "accounts_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'creator'::"text", 'admin'::"text"]))),
    CONSTRAINT "accounts_type_check" CHECK (("account_type" = ANY (ARRAY['sms_verified'::"text", 'local_unverified'::"text", 'public'::"text"])))
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."communities" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "trail_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_by" "text" NOT NULL,
    "invite_code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."communities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_discoveries" (
    "id" "text" NOT NULL,
    "discovery_id" "text" NOT NULL,
    "community_id" "text" NOT NULL,
    "shared_by" "text" NOT NULL,
    "shared_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."community_discoveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_members" (
    "id" "text" NOT NULL,
    "community_id" "text" NOT NULL,
    "account_id" "text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."community_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_tokens" (
    "id" "text" NOT NULL,
    "account_id" "text" NOT NULL,
    "token" "text" NOT NULL,
    "platform" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "device_tokens_platform_check" CHECK (("platform" = ANY (ARRAY['ios'::"text", 'android'::"text", 'web'::"text"])))
);


ALTER TABLE "public"."device_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discoveries" (
    "id" "text" NOT NULL,
    "account_id" "text" NOT NULL,
    "spot_id" "text" NOT NULL,
    "trail_id" "text" NOT NULL,
    "discovered_at" timestamp with time zone NOT NULL,
    "scan_event_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."discoveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."discovery_profiles" (
    "id" "text" NOT NULL,
    "account_id" "text" NOT NULL,
    "last_active_trail_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."discovery_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sensor_scans" (
    "id" "text" NOT NULL,
    "account_id" "text" NOT NULL,
    "trail_id" "text",
    "location" "public"."geography"(Point,4326) NOT NULL,
    "scanned_at" timestamp with time zone NOT NULL,
    "radius_used" integer NOT NULL,
    "successful" boolean DEFAULT false NOT NULL,
    "silent" boolean DEFAULT false,
    "clues" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sensor_scans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."spot_ratings" (
    "id" "text" NOT NULL,
    "spot_id" "text" NOT NULL,
    "account_id" "text" NOT NULL,
    "rating" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "spot_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."spot_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."spots" (
    "id" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "location" "public"."geography"(Point,4326) NOT NULL,
    "image_url" "text",
    "image_blob_path" "text",
    "blurred_image_url" "text",
    "blurred_image_blob_path" "text",
    "micro_image_url" "text",
    "content_blocks" "jsonb",
    "source" "text",
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "options" "jsonb" NOT NULL,
    CONSTRAINT "spots_source_check" CHECK (("source" = ANY (ARRAY['ai'::"text", 'user'::"text", 'import'::"text"])))
);


ALTER TABLE "public"."spots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stories" (
    "id" "text" NOT NULL,
    "account_id" "text" NOT NULL,
    "discovery_id" "text",
    "spot_id" "text",
    "trail_id" "text",
    "image_url" "text",
    "image_blob_path" "text",
    "comment" "text",
    "visibility" "text" DEFAULT 'private'::"text" NOT NULL,
    "liked_by_account_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "stories_check" CHECK ((("discovery_id" IS NOT NULL) OR ("trail_id" IS NOT NULL))),
    CONSTRAINT "stories_visibility_check" CHECK (("visibility" = ANY (ARRAY['private'::"text", 'public'::"text"])))
);


ALTER TABLE "public"."stories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stumble_pois" (
    "id" "text" NOT NULL,
    "external_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "location" "public"."geography"(Point,4326) NOT NULL,
    "poi_type" "text" NOT NULL,
    "source" "text" DEFAULT 'osm'::"text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stumble_pois" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stumble_visits" (
    "id" "text" NOT NULL,
    "account_id" "text" NOT NULL,
    "poi_id" "text" NOT NULL,
    "spot_id" "text",
    "visited_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stumble_visits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trail_ratings" (
    "id" "text" NOT NULL,
    "trail_id" "text" NOT NULL,
    "account_id" "text" NOT NULL,
    "rating" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "trail_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."trail_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trail_spots" (
    "id" "text" NOT NULL,
    "trail_id" "text" NOT NULL,
    "spot_id" "text" NOT NULL,
    "order" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."trail_spots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trails" (
    "id" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "kind" "text" DEFAULT 'discovery'::"text" NOT NULL,
    "image_url" "text",
    "image_blob_path" "text",
    "boundary" "jsonb",
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "map" "jsonb" NOT NULL,
    "viewport" "jsonb",
    "overview" "jsonb",
    "options" "jsonb" NOT NULL,
    CONSTRAINT "trails_kind_check" CHECK (("kind" = ANY (ARRAY['discovery'::"text", 'stumble'::"text"])))
);


ALTER TABLE "public"."trails" OWNER TO "postgres";


ALTER TABLE ONLY "public"."account_sessions"
    ADD CONSTRAINT "account_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."account_sessions"
    ADD CONSTRAINT "account_sessions_session_token_key" UNIQUE ("session_token");



ALTER TABLE ONLY "public"."account_sms_codes"
    ADD CONSTRAINT "account_sms_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_invite_code_key" UNIQUE ("invite_code");



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_discoveries"
    ADD CONSTRAINT "community_discoveries_discovery_id_community_id_key" UNIQUE ("discovery_id", "community_id");



ALTER TABLE ONLY "public"."community_discoveries"
    ADD CONSTRAINT "community_discoveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_community_id_account_id_key" UNIQUE ("community_id", "account_id");



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."discoveries"
    ADD CONSTRAINT "discoveries_account_id_spot_id_trail_id_key" UNIQUE ("account_id", "spot_id", "trail_id");



ALTER TABLE ONLY "public"."discoveries"
    ADD CONSTRAINT "discoveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."discovery_profiles"
    ADD CONSTRAINT "discovery_profiles_account_id_key" UNIQUE ("account_id");



ALTER TABLE ONLY "public"."discovery_profiles"
    ADD CONSTRAINT "discovery_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sensor_scans"
    ADD CONSTRAINT "sensor_scans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."spot_ratings"
    ADD CONSTRAINT "spot_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."spot_ratings"
    ADD CONSTRAINT "spot_ratings_spot_id_account_id_key" UNIQUE ("spot_id", "account_id");



ALTER TABLE ONLY "public"."spots"
    ADD CONSTRAINT "spots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."spots"
    ADD CONSTRAINT "spots_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stumble_pois"
    ADD CONSTRAINT "stumble_pois_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stumble_visits"
    ADD CONSTRAINT "stumble_visits_account_id_poi_id_key" UNIQUE ("account_id", "poi_id");



ALTER TABLE ONLY "public"."stumble_visits"
    ADD CONSTRAINT "stumble_visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trail_ratings"
    ADD CONSTRAINT "trail_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trail_ratings"
    ADD CONSTRAINT "trail_ratings_trail_id_account_id_key" UNIQUE ("trail_id", "account_id");



ALTER TABLE ONLY "public"."trail_spots"
    ADD CONSTRAINT "trail_spots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trail_spots"
    ADD CONSTRAINT "trail_spots_trail_id_spot_id_key" UNIQUE ("trail_id", "spot_id");



ALTER TABLE ONLY "public"."trails"
    ADD CONSTRAINT "trails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trails"
    ADD CONSTRAINT "trails_slug_key" UNIQUE ("slug");



CREATE INDEX "idx_account_sessions_account_id" ON "public"."account_sessions" USING "btree" ("account_id");



CREATE INDEX "idx_account_sessions_expires_at" ON "public"."account_sessions" USING "btree" ("expires_at");



CREATE INDEX "idx_accounts_phone_hash" ON "public"."accounts" USING "btree" ("phone_hash");



CREATE INDEX "idx_accounts_type" ON "public"."accounts" USING "btree" ("account_type");



CREATE INDEX "idx_communities_created_by" ON "public"."communities" USING "btree" ("created_by");



CREATE INDEX "idx_community_discoveries_community_id" ON "public"."community_discoveries" USING "btree" ("community_id");



CREATE INDEX "idx_community_discoveries_discovery_id" ON "public"."community_discoveries" USING "btree" ("discovery_id");



CREATE INDEX "idx_community_members_account_id" ON "public"."community_members" USING "btree" ("account_id");



CREATE INDEX "idx_community_members_community_id" ON "public"."community_members" USING "btree" ("community_id");



CREATE INDEX "idx_device_tokens_account_id" ON "public"."device_tokens" USING "btree" ("account_id");



CREATE INDEX "idx_discoveries_account_id" ON "public"."discoveries" USING "btree" ("account_id");



CREATE INDEX "idx_discoveries_discovered_at" ON "public"."discoveries" USING "btree" ("discovered_at");



CREATE INDEX "idx_discoveries_spot_id" ON "public"."discoveries" USING "btree" ("spot_id");



CREATE INDEX "idx_discoveries_trail_id" ON "public"."discoveries" USING "btree" ("trail_id");



CREATE INDEX "idx_discovery_profiles_account_id" ON "public"."discovery_profiles" USING "btree" ("account_id");



CREATE INDEX "idx_sensor_scans_account_id" ON "public"."sensor_scans" USING "btree" ("account_id");



CREATE INDEX "idx_sensor_scans_created_at" ON "public"."sensor_scans" USING "btree" ("created_at");



CREATE INDEX "idx_sensor_scans_trail_id" ON "public"."sensor_scans" USING "btree" ("trail_id");



CREATE INDEX "idx_spot_ratings_account_id" ON "public"."spot_ratings" USING "btree" ("account_id");



CREATE INDEX "idx_spot_ratings_spot_id" ON "public"."spot_ratings" USING "btree" ("spot_id");



CREATE INDEX "idx_spots_created_by" ON "public"."spots" USING "btree" ("created_by");



CREATE INDEX "idx_spots_location" ON "public"."spots" USING "gist" ("location");



CREATE INDEX "idx_spots_name_trgm" ON "public"."spots" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_spots_slug" ON "public"."spots" USING "btree" ("slug");



CREATE INDEX "idx_stories_account_id" ON "public"."stories" USING "btree" ("account_id");



CREATE INDEX "idx_stories_discovery_id" ON "public"."stories" USING "btree" ("discovery_id");



CREATE INDEX "idx_stories_spot_id" ON "public"."stories" USING "btree" ("spot_id");



CREATE INDEX "idx_stories_trail_id" ON "public"."stories" USING "btree" ("trail_id");



CREATE INDEX "idx_stumble_pois_external_id" ON "public"."stumble_pois" USING "btree" ("external_id");



CREATE INDEX "idx_stumble_pois_location" ON "public"."stumble_pois" USING "gist" ("location");



CREATE INDEX "idx_stumble_visits_account_id" ON "public"."stumble_visits" USING "btree" ("account_id");



CREATE INDEX "idx_stumble_visits_poi_id" ON "public"."stumble_visits" USING "btree" ("poi_id");



CREATE INDEX "idx_trail_ratings_account_id" ON "public"."trail_ratings" USING "btree" ("account_id");



CREATE INDEX "idx_trail_ratings_trail_id" ON "public"."trail_ratings" USING "btree" ("trail_id");



CREATE INDEX "idx_trail_spots_order" ON "public"."trail_spots" USING "btree" ("trail_id", "order");



CREATE INDEX "idx_trail_spots_spot_id" ON "public"."trail_spots" USING "btree" ("spot_id");



CREATE INDEX "idx_trail_spots_trail_id" ON "public"."trail_spots" USING "btree" ("trail_id");



CREATE INDEX "idx_trails_created_by" ON "public"."trails" USING "btree" ("created_by");



CREATE INDEX "idx_trails_kind" ON "public"."trails" USING "btree" ("kind");



CREATE INDEX "idx_trails_name_trgm" ON "public"."trails" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_trails_slug" ON "public"."trails" USING "btree" ("slug");



CREATE OR REPLACE TRIGGER "update_accounts_updated_at" BEFORE UPDATE ON "public"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_communities_updated_at" BEFORE UPDATE ON "public"."communities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_discoveries_updated_at" BEFORE UPDATE ON "public"."discoveries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_discovery_profiles_updated_at" BEFORE UPDATE ON "public"."discovery_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_spots_updated_at" BEFORE UPDATE ON "public"."spots" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_stories_updated_at" BEFORE UPDATE ON "public"."stories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_trails_updated_at" BEFORE UPDATE ON "public"."trails" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."account_sessions"
    ADD CONSTRAINT "account_sessions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."community_discoveries"
    ADD CONSTRAINT "community_discoveries_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_discoveries"
    ADD CONSTRAINT "community_discoveries_discovery_id_fkey" FOREIGN KEY ("discovery_id") REFERENCES "public"."discoveries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_discoveries"
    ADD CONSTRAINT "community_discoveries_shared_by_fkey" FOREIGN KEY ("shared_by") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."device_tokens"
    ADD CONSTRAINT "device_tokens_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discoveries"
    ADD CONSTRAINT "discoveries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discoveries"
    ADD CONSTRAINT "discoveries_spot_id_fkey" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discoveries"
    ADD CONSTRAINT "discoveries_trail_id_fkey" FOREIGN KEY ("trail_id") REFERENCES "public"."trails"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discovery_profiles"
    ADD CONSTRAINT "discovery_profiles_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."discovery_profiles"
    ADD CONSTRAINT "discovery_profiles_last_active_trail_id_fkey" FOREIGN KEY ("last_active_trail_id") REFERENCES "public"."trails"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sensor_scans"
    ADD CONSTRAINT "sensor_scans_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sensor_scans"
    ADD CONSTRAINT "sensor_scans_trail_id_fkey" FOREIGN KEY ("trail_id") REFERENCES "public"."trails"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."spot_ratings"
    ADD CONSTRAINT "spot_ratings_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."spot_ratings"
    ADD CONSTRAINT "spot_ratings_spot_id_fkey" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."spots"
    ADD CONSTRAINT "spots_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_discovery_id_fkey" FOREIGN KEY ("discovery_id") REFERENCES "public"."discoveries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_spot_id_fkey" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_trail_id_fkey" FOREIGN KEY ("trail_id") REFERENCES "public"."trails"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stumble_visits"
    ADD CONSTRAINT "stumble_visits_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stumble_visits"
    ADD CONSTRAINT "stumble_visits_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "public"."stumble_pois"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stumble_visits"
    ADD CONSTRAINT "stumble_visits_spot_id_fkey" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trail_ratings"
    ADD CONSTRAINT "trail_ratings_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trail_ratings"
    ADD CONSTRAINT "trail_ratings_trail_id_fkey" FOREIGN KEY ("trail_id") REFERENCES "public"."trails"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trail_spots"
    ADD CONSTRAINT "trail_spots_spot_id_fkey" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trail_spots"
    ADD CONSTRAINT "trail_spots_trail_id_fkey" FOREIGN KEY ("trail_id") REFERENCES "public"."trails"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trails"
    ADD CONSTRAINT "trails_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."accounts"("id") ON DELETE SET NULL;



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_distance"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_distance"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_distance"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_accessible_spots"("account_id_param" "text", "trail_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_accessible_spots"("account_id_param" "text", "trail_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_accessible_spots"("account_id_param" "text", "trail_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_account_public_profile"("account_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_account_public_profile"("account_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_account_public_profile"("account_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_community_discoveries"("community_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_community_discoveries"("community_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_community_discoveries"("community_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_discovery_state"("account_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_discovery_state"("account_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_discovery_state"("account_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_nearby_spots"("user_lat" double precision, "user_lon" double precision, "radius_meters" integer, "limit_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_nearby_spots"("user_lat" double precision, "user_lon" double precision, "radius_meters" integer, "limit_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_nearby_spots"("user_lat" double precision, "user_lon" double precision, "radius_meters" integer, "limit_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pois_in_radius"("lat" double precision, "lon" double precision, "radius_meters" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_pois_in_radius"("lat" double precision, "lon" double precision, "radius_meters" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pois_in_radius"("lat" double precision, "lon" double precision, "radius_meters" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_spot_rating_summary"("spot_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_spot_rating_summary"("spot_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_spot_rating_summary"("spot_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_spots_in_radius"("lat" double precision, "lon" double precision, "radius_meters" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_spots_in_radius"("lat" double precision, "lon" double precision, "radius_meters" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_spots_in_radius"("lat" double precision, "lon" double precision, "radius_meters" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_rated_trails"("limit_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_rated_trails"("limit_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_rated_trails"("limit_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_trail_rating_summary"("trail_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_trail_rating_summary"("trail_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_trail_rating_summary"("trail_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_trail_with_spots"("trail_id_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_trail_with_spots"("trail_id_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_trail_with_spots"("trail_id_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."account_sessions" TO "anon";
GRANT ALL ON TABLE "public"."account_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."account_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."account_sms_codes" TO "anon";
GRANT ALL ON TABLE "public"."account_sms_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."account_sms_codes" TO "service_role";



GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."communities" TO "anon";
GRANT ALL ON TABLE "public"."communities" TO "authenticated";
GRANT ALL ON TABLE "public"."communities" TO "service_role";



GRANT ALL ON TABLE "public"."community_discoveries" TO "anon";
GRANT ALL ON TABLE "public"."community_discoveries" TO "authenticated";
GRANT ALL ON TABLE "public"."community_discoveries" TO "service_role";



GRANT ALL ON TABLE "public"."community_members" TO "anon";
GRANT ALL ON TABLE "public"."community_members" TO "authenticated";
GRANT ALL ON TABLE "public"."community_members" TO "service_role";



GRANT ALL ON TABLE "public"."device_tokens" TO "anon";
GRANT ALL ON TABLE "public"."device_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."device_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."discoveries" TO "anon";
GRANT ALL ON TABLE "public"."discoveries" TO "authenticated";
GRANT ALL ON TABLE "public"."discoveries" TO "service_role";



GRANT ALL ON TABLE "public"."discovery_profiles" TO "anon";
GRANT ALL ON TABLE "public"."discovery_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."discovery_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."sensor_scans" TO "anon";
GRANT ALL ON TABLE "public"."sensor_scans" TO "authenticated";
GRANT ALL ON TABLE "public"."sensor_scans" TO "service_role";



GRANT ALL ON TABLE "public"."spot_ratings" TO "anon";
GRANT ALL ON TABLE "public"."spot_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."spot_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."spots" TO "anon";
GRANT ALL ON TABLE "public"."spots" TO "authenticated";
GRANT ALL ON TABLE "public"."spots" TO "service_role";



GRANT ALL ON TABLE "public"."stories" TO "anon";
GRANT ALL ON TABLE "public"."stories" TO "authenticated";
GRANT ALL ON TABLE "public"."stories" TO "service_role";



GRANT ALL ON TABLE "public"."stumble_pois" TO "anon";
GRANT ALL ON TABLE "public"."stumble_pois" TO "authenticated";
GRANT ALL ON TABLE "public"."stumble_pois" TO "service_role";



GRANT ALL ON TABLE "public"."stumble_visits" TO "anon";
GRANT ALL ON TABLE "public"."stumble_visits" TO "authenticated";
GRANT ALL ON TABLE "public"."stumble_visits" TO "service_role";



GRANT ALL ON TABLE "public"."trail_ratings" TO "anon";
GRANT ALL ON TABLE "public"."trail_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."trail_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."trail_spots" TO "anon";
GRANT ALL ON TABLE "public"."trail_spots" TO "authenticated";
GRANT ALL ON TABLE "public"."trail_spots" TO "service_role";



GRANT ALL ON TABLE "public"."trails" TO "anon";
GRANT ALL ON TABLE "public"."trails" TO "authenticated";
GRANT ALL ON TABLE "public"."trails" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







