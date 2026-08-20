/** User-facing product identity. Persist keys and package names stay on old ids. */
export const BRAND = {
  name: 'ScharfEdge',
  wordmark: 'scharfedge',
  domain: 'scharfedge.com',
  url: 'https://scharfedge.com',
  supportEmail: 'support@scharfedge.com',
  legalEffective: 'August 20, 2026',
} as const;

export const SUPPORT_MAILTO = `mailto:${BRAND.supportEmail}`;
