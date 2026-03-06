// Settings configuration that reads from environment variables

interface Config {
  ga4PropertyId: string;
  ga4Credentials: string;
  metaAppId: string;
  metaAppSecret: string;
  metaAccessToken: string;
  metaAdAccountId: string;
  anthropicApiKey: string;
  demoMode: boolean;
  cacheTtlSeconds: number;
}

function getEnv(key: string, defaultValue = ''): string {
  return process.env[key] ?? defaultValue;
}

function getBoolEnv(key: string, defaultValue: boolean): boolean {
  const val = process.env[key];
  if (val === undefined) return defaultValue;
  return val.toLowerCase() === 'true' || val === '1';
}

function getIntEnv(key: string, defaultValue: number): number {
  const val = process.env[key];
  if (val === undefined) return defaultValue;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export const config: Config = {
  ga4PropertyId: getEnv('GA4_PROPERTY_ID'),
  ga4Credentials: getEnv('GA4_CREDENTIALS'),
  metaAppId: getEnv('META_APP_ID'),
  metaAppSecret: getEnv('META_APP_SECRET'),
  metaAccessToken: getEnv('META_ACCESS_TOKEN'),
  metaAdAccountId: getEnv('META_AD_ACCOUNT_ID'),
  anthropicApiKey: getEnv('ANTHROPIC_API_KEY'),
  demoMode: getBoolEnv('DEMO_MODE', true),
  cacheTtlSeconds: getIntEnv('CACHE_TTL_SECONDS', 3600),
};

export function hasGa4Credentials(): boolean {
  return !!(config.ga4PropertyId && config.ga4Credentials);
}

export function hasMetaCredentials(): boolean {
  return !!(config.metaAccessToken && config.metaAdAccountId);
}

export function hasAnthropicKey(): boolean {
  return !!config.anthropicApiKey;
}

export function isDemoMode(): boolean {
  return config.demoMode;
}
