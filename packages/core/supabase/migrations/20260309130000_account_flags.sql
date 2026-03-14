-- Add flags JSONB column to accounts for flexible server-side flag storage
ALTER TABLE "public"."accounts"
  ADD COLUMN IF NOT EXISTS "flags" "jsonb" DEFAULT '{}';
