import { z } from "zod";

/**
 * Central validators used across domain + request schemas.
 * Keep this file dependency-light and stable.
 */

export const StringLimits = {
  shortText: 200,     // names, titles
  blockText: 3000,    // content blocks
  mediumText: 5000,   // descriptions, summaries
  longText: 50000,    // articles, blog content
} as const;

const baseText = z.string().trim();

export const guard = {
  // Text lengths
  shortText: baseText.max(StringLimits.shortText),
  blockText: baseText.max(StringLimits.blockText),
  mediumText: baseText.max(StringLimits.mediumText),
  longText: baseText.max(StringLimits.longText),

  // Optional text variants
  shortTextOptional: baseText.max(StringLimits.shortText).optional(),
  blockTextOptional: baseText.max(StringLimits.blockText).optional(),
  mediumTextOptional: baseText.max(StringLimits.mediumText).optional(),
  longTextOptional: baseText.max(StringLimits.longText).optional(),

  // ID formats
  cuid: z.string().regex(/^[c][a-z0-9]{24}$/, 'Invalid CUID format'),
  idString: z.string().min(1).max(50, 'ID too long'),

  // Slug: alphanumeric, hyphens, underscores, no spaces
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/, 'Slug must be lowercase alphanumeric with hyphens/underscores'),

  // Base64 (max 10MB ≈ 13.6M chars when base64-encoded)
  base64String: z.string().regex(/^[A-Za-z0-9+/=]*$/, 'Invalid base64').max(13_600_000, 'Image too large (max 10MB)'),

  // Tokens & hashes
  token: z.jwt(),
  hash: z.string().min(32).max(256),
  inviteCode: z.string().min(6).max(50).regex(/^[A-Z0-9]+$/, 'Invite code must be uppercase alphanumeric'),

  // Phone hash (normalized format check)
  phoneHash: z.string().min(40).max(64, 'Invalid phone hash'),

  // IP Address (IPv4 or IPv6)
  ipAddress: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-f]{0,4}:){1,7}[0-9a-f]{0,4}$/i, 'Invalid IP address').optional(),

  // OS Version (single word, version numbers only)
  osVersion: z.string().max(20).regex(/^[a-zA-Z0-9._-]+$/, 'Invalid OS version format').optional(),

  // Numbers with ranges
  positiveInt: z.number().int().positive(),
  nonNegativeInt: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
  bearing: z.number().min(0).max(360),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  rating: z.number().int().min(1).max(5),

  // Array size limits
  maxArraySize: (max: number) => z.number().int().min(0).max(max),
  arrayWithMax: <T>(schema: z.ZodSchema<T>, max: number) => z.array(schema).max(max),
};