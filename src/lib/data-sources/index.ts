import { isDemoMode } from '@/lib/config';
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

let _ga4Client: GA4DataSource | null = null;
let _metaClient: MetaDataSource | null = null;

export async function getGA4Client(): Promise<GA4DataSource> {
  if (isDemoMode()) return MockGA4;
  if (!_ga4Client) {
    const { GA4Client } = await import('./ga4-client');
    _ga4Client = GA4Client;
  }
  return _ga4Client;
}

export async function getMetaClient(): Promise<MetaDataSource> {
  if (isDemoMode()) return MockMeta;
  if (!_metaClient) {
    const { MetaClient } = await import('./meta-client');
    _metaClient = MetaClient;
  }
  return _metaClient;
}
