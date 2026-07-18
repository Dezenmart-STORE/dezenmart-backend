/**
 * Shared frontend origin allowlist used by OAuth redirects and CORS.
 */
export const getAllowedFrontendOrigins = (): string[] => {
  const domains = [
    process.env.DEZENMART_FRONTEND_URL,
    process.env.DEZENTRA_FRONTEND_URL,
    process.env.DEZENMART_DEPLOYED_URL,
    process.env.DEZENMART_LOGISTICS_FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter((url): url is string => !!url);

  return [...new Set(domains)];
};
