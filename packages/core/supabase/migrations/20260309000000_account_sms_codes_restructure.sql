-- Restructure account_sms_codes: replace phone_number+code with phone_hash+verification_sid
-- phone_hash: hashed phone number for privacy
-- verification_sid: Twilio verification session ID

ALTER TABLE "public"."account_sms_codes"
  RENAME COLUMN "phone_number" TO "phone_hash";

ALTER TABLE "public"."account_sms_codes"
  DROP COLUMN IF EXISTS "code";

ALTER TABLE "public"."account_sms_codes"
  ADD COLUMN IF NOT EXISTS "verification_sid" text NOT NULL DEFAULT '';
