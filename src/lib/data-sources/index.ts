import { isDemoMode, config } from '@/lib/config';
import { MockGA4, MockMeta } from './mock-data';
import type {
  GaDailyTraffic,
  GaTrafficSource,
  GaTopPage,
  GaDemographics,
  GaConversion,
  GaChannelGroup,
  MetaAccountOverview,
  MetaCampaign,
  MetaDailySpend,
  MetaDemographic,
  MetaPlatformBreakdown,
  MetaAdset,
  MetaAd,
  MetaRoasTrend,
} from './mock-data';

export interface GA4DataSource {
  getTrafficOverview(startDate: string, endDate: string): GaDailyTraffic[] | Promise<GaDailyTraffic[]>;
  getTrafficSources(startDate: string, endDate: string): GaTrafficSource[] | Promise<GaTrafficSource[]>;
  getTopPages(startDate: string, endDate: string): GaTopPage[] | Promise<GaTopPage[]>;
  getUserDemographics(startDate: string, endDate: string): GaDemographics | Promise<GaDemographics>;
  getConversions(startDate: string, endDate: string): GaConversion[] | Promise<GaConversion[]>;
  getChannelGroups(startDate: string, endDate: string): GaChannelGroup[] | Promise<GaChannelGroup[]>;
}

export interface MetaDataSource {
  getAccountOverview(startDate: string, endDate: string): MetaAccountOverview | Promise<MetaAccountOverview>;
  getCampaigns(startDate: string, endDate: string): MetaCampaign[] | Promise<MetaCampaign[]>;
  getDailySpend(startDate: string, endDate: string): MetaDailySpend[] | Promise<MetaDailySpend[]>;
  getDemographics(startDate: string, endDate: string): MetaDemographic[] | Promise<MetaDemographic[]>;
  getPlatformBreakdown(startDate: string, endDate: string): MetaPlatformBreakdown[] | Promise<MetaPlatformBreakdown[]>;
  getAdsets(startDate: string, endDate: string): MetaAdset[] | Promise<MetaAdset[]>;
  getAds(startDate: string, endDate: string): MetaAd[] | Promise<MetaAd[]>;
  getRoasTrend(startDate: string, endDate: string): MetaRoasTrend[] | Promise<MetaRoasTrend[]>;
}

// ---------------------------------------------------------------------------
// In-memory TTL cache for API responses
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const MAX_CACHE_ENTRIES = 200;

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  // Evict oldest entries if cache is too large
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/**
 * Wrap a data source method with TTL-based caching.
 * The cache key is derived from the method name and date range.
 */
function withCache<T>(
  prefix: string,
  method: string,
  startDate: string,
  endDate: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const ttl = config.cacheTtlSeconds;
  if (ttl <= 0) return fn();

  const key = `${prefix}:${method}:${startDate}:${endDate}`;
  const cached = getCached<T>(key);
  if (cached !== undefined) return cached;

  const result = fn();
  if (result instanceof Promise) {
    return result.then((data) => {
      setCache(key, data, ttl);
      return data;
    });
  }
  setCache(key, result, ttl);
  return result;
}

/**
 * Create a caching proxy around a data source object.
 * Every method call is transparently cached by (method, startDate, endDate).
 */
function createCachingProxy<T extends Record<string, (startDate: string, endDate: string) => unknown>>(
  prefix: string,
  source: T
): T {
  const proxy = {} as Record<string, unknown>;
  for (const key of Object.keys(source)) {
    const originalMethod = source[key];
    if (typeof originalMethod === 'function') {
      proxy[key] = (startDate: string, endDate: string) =>
        withCache(prefix, key, startDate, endDate, () =>
          originalMethod.call(source, startDate, endDate)
        );
    }
  }
  return proxy as T;
}

// ---------------------------------------------------------------------------
// Client factories
// ---------------------------------------------------------------------------

let _ga4Client: GA4DataSource | null = null;
let _metaClient: MetaDataSource | null = null;

export async function getGA4Client(): Promise<GA4DataSource> {
  if (isDemoMode()) return createCachingProxy('ga4', MockGA4);
  if (!_ga4Client) {
    const { GA4Client } = await import('./ga4-client');
    _ga4Client = createCachingProxy('ga4', GA4Client);
  }
  return _ga4Client;
}

export async function getMetaClient(): Promise<MetaDataSource> {
  if (isDemoMode()) return createCachingProxy('meta', MockMeta);
  if (!_metaClient) {
    const { MetaClient } = await import('./meta-client');
    _metaClient = createCachingProxy('meta', MetaClient);
  }
  return _metaClient;
}
