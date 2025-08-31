// Centralized auth redirect URLs to ensure consistent, valid links in emails
// Always point to the production domain to avoid preview/staging mismatches

export const CANONICAL_BASE_URL = "https://golden-phone-management.lovable.app";

export function getCanonicalBaseUrl(): string {
  return CANONICAL_BASE_URL;
}

export function getResetRedirectUrl(): string {
  return `${CANONICAL_BASE_URL}/reset-password`;
}

export function getSignupRedirectUrl(): string {
  return `${CANONICAL_BASE_URL}/`;
}
