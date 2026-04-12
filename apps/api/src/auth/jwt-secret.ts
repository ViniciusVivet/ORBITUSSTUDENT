const DEV_JWT_SECRET = 'orbitus-dev-secret-change-me';

export function getJwtSecret() {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (configuredSecret) return configuredSecret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be defined in production.');
  }

  return DEV_JWT_SECRET;
}

export function isUsingDevJwtSecret() {
  return !process.env.JWT_SECRET?.trim() && process.env.NODE_ENV !== 'production';
}
