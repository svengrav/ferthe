/**
 * Ferthe Core API Manifest
 * Zentrale Definition von API-Metadaten
 */

export const manifest = {
  name: "Ferthe Core API",
  version: "1.0.0",
  description: "Ferthe Core API",
  env: "dev",
} as const;

export type Manifest = typeof manifest;
