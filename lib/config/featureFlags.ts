/**
 * Feature flags for Open Beta Data Acquisition Mode.
 * Switch BETA_MODE=false to restore monetization immediately.
 * Server: BETA_MODE, MONETIZATION_ENABLED
 * Client: NEXT_PUBLIC_BETA_MODE, NEXT_PUBLIC_MONETIZATION_ENABLED
 */
export const BETA_MODE = process.env.BETA_MODE === 'true' || process.env.NEXT_PUBLIC_BETA_MODE === 'true';
export const MONETIZATION_ENABLED =
  process.env.MONETIZATION_ENABLED !== 'false' && process.env.NEXT_PUBLIC_MONETIZATION_ENABLED !== 'false';
