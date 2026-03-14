-- ============================================================================
-- Migration: Convert JSONB snake_case keys to camelCase
-- Reason: postgresStore now preserves JSONB values as-is (no recursive key
--         transformation). Existing data was written with snake_case keys
--         by the old recursive transformToDb. The App expects camelCase.
-- ============================================================================

-- Helper: recursively convert snake_case keys to camelCase in JSONB
CREATE OR REPLACE FUNCTION pg_temp.snake_to_camel(val JSONB)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  result JSONB;
  key TEXT;
  new_key TEXT;
  value JSONB;
BEGIN
  IF jsonb_typeof(val) = 'object' THEN
    result := '{}';
    FOR key, value IN SELECT * FROM jsonb_each(val) LOOP
      -- Convert snake_case key to camelCase
      new_key := regexp_replace(key, '_([a-z])', '\1', 'g');
      -- Uppercase the character after each underscore
      new_key := key;
      -- Iterative approach for snake_case -> camelCase
      LOOP
        EXIT WHEN position('_' IN new_key) = 0;
        new_key := substring(new_key, 1, position('_' IN new_key) - 1)
                || upper(substring(new_key, position('_' IN new_key) + 1, 1))
                || substring(new_key, position('_' IN new_key) + 2);
      END LOOP;
      result := result || jsonb_build_object(new_key, pg_temp.snake_to_camel(value));
    END LOOP;
    RETURN result;
  ELSIF jsonb_typeof(val) = 'array' THEN
    result := '[]';
    FOR value IN SELECT * FROM jsonb_array_elements(val) LOOP
      result := result || pg_temp.snake_to_camel(value);
    END LOOP;
    RETURN result;
  ELSE
    RETURN val;
  END IF;
END;
$$;

-- ── Trails ──────────────────────────────────────────────────────────────────

UPDATE trails
SET options = pg_temp.snake_to_camel(options)
WHERE options IS NOT NULL;

UPDATE trails
SET boundary = pg_temp.snake_to_camel(boundary)
WHERE boundary IS NOT NULL;

UPDATE trails
SET map = pg_temp.snake_to_camel(map)
WHERE map IS NOT NULL;

UPDATE trails
SET viewport = pg_temp.snake_to_camel(viewport)
WHERE viewport IS NOT NULL;

UPDATE trails
SET overview = pg_temp.snake_to_camel(overview)
WHERE overview IS NOT NULL;

-- ── Spots ───────────────────────────────────────────────────────────────────

UPDATE spots
SET options = pg_temp.snake_to_camel(options)
WHERE options IS NOT NULL;

UPDATE spots
SET content_blocks = pg_temp.snake_to_camel(content_blocks)
WHERE content_blocks IS NOT NULL;

-- ── Sensor Scans ────────────────────────────────────────────────────────────

UPDATE sensor_scans
SET clues = pg_temp.snake_to_camel(clues)
WHERE clues IS NOT NULL AND clues != '[]'::jsonb;

-- ── Stumble POIs ────────────────────────────────────────────────────────────

UPDATE stumble_pois
SET metadata = pg_temp.snake_to_camel(metadata)
WHERE metadata IS NOT NULL;
