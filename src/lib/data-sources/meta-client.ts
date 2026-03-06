/**
 * Real Meta Marketing API client using facebook-nodejs-business-sdk.
 * Exports a MetaClient object with the same method signatures as MockMeta.
 */

import bizSdk from 'facebook-nodejs-business-sdk';
import { config } from '@/lib/config';
import type {
  MetaAccountOverview,
  MetaCampaign,
  MetaDailySpend,
  MetaDemographic,
  MetaPlatformBreakdown,
  MetaAdset,
  MetaAd,
  MetaRoasTrend,
} from './mock-data';

const { FacebookAdsApi, AdAccount } = bizSdk;

// ---------------------------------------------------------------------------
// Lazy initialization
// ---------------------------------------------------------------------------

let initialized = false;
let adAccount: any;

function init() {
  if (initialized) return;
  FacebookAdsApi.init(config.metaAccessToken);
  adAccount = new AdAccount(config.metaAdAccountId);
  initialized = true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getInsights(
  fields: string[],
  params: {
    time_range: { since: string; until: string };
    level: string;
    time_increment?: number;
    breakdowns?: string[];
  }
): Promise<Record<string, any>[]> {
  init();
  const cursor = await adAccount.getInsights(fields, params);

  const results: Record<string, any>[] = [];

  // Read the initial page
  if (cursor && Array.isArray(cursor)) {
    for (const row of cursor) {
      results.push(row._data || row);
    }
  } else if (cursor) {
    // Handle cursor-based pagination
    let page = cursor;
    while (page) {
      if (Array.isArray(page)) {
        for (const row of page) {
          results.push(row._data || row);
        }
      } else if (page._data) {
        results.push(page._data);
      }

      // Attempt to get next page
      if (typeof page.hasNext === 'function' && page.hasNext()) {
        page = await page.next();
      } else {
        break;
      }
    }
  }

  return results;
}

function parseConversions(actions: { action_type: string; value: string }[] | undefined): number {
  if (!actions || !Array.isArray(actions)) return 0;
  const purchase = actions.find((a) => a.action_type === 'purchase');
  return purchase ? parseFloat(purchase.value) || 0 : 0;
}

function parseRevenue(actionValues: { action_type: string; value: string }[] | undefined): number {
  if (!actionValues || !Array.isArray(actionValues)) return 0;
  const purchase = actionValues.find((a) => a.action_type === 'purchase');
  return purchase ? parseFloat(purchase.value) || 0 : 0;
}

function pf(value: any): number {
  return parseFloat(value) || 0;
}

// ---------------------------------------------------------------------------
// MetaClient
// ---------------------------------------------------------------------------

export const MetaClient = {
  async getAccountOverview(startDate: string, endDate: string): Promise<MetaAccountOverview> {
    try {
      const fields = [
        'impressions',
        'clicks',
        'spend',
        'ctr',
        'cpc',
        'cpm',
        'actions',
        'action_values',
      ];
      const params = {
        time_range: { since: startDate, until: endDate },
        level: 'account' as const,
      };

      const rows = await getInsights(fields, params);
      if (rows.length === 0) {
        return { spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0, cpm: 0, conversions: 0, revenue: 0, roas: 0 };
      }

      const row = rows[0];
      const spend = pf(row.spend);
      const impressions = pf(row.impressions);
      const clicks = pf(row.clicks);
      const ctr = pf(row.ctr);
      const cpc = pf(row.cpc);
      const cpm = pf(row.cpm);
      const conversions = parseConversions(row.actions);
      const revenue = parseRevenue(row.action_values);
      const roas = spend > 0 ? revenue / spend : 0;

      return {
        spend: Math.round(spend * 100) / 100,
        impressions,
        clicks,
        ctr: Math.round(ctr * 10000) / 10000,
        cpc: Math.round(cpc * 100) / 100,
        cpm: Math.round(cpm * 100) / 100,
        conversions,
        revenue: Math.round(revenue * 100) / 100,
        roas: Math.round(roas * 100) / 100,
      };
    } catch (error) {
      console.error('[MetaClient] getAccountOverview failed:', error);
      return { spend: 0, impressions: 0, clicks: 0, ctr: 0, cpc: 0, cpm: 0, conversions: 0, revenue: 0, roas: 0 };
    }
  },

  async getCampaigns(startDate: string, endDate: string): Promise<MetaCampaign[]> {
    try {
      const fields = [
        'campaign_id',
        'campaign_name',
        'impressions',
        'clicks',
        'spend',
        'ctr',
        'cpc',
        'cpm',
        'actions',
        'action_values',
      ];
      const params = {
        time_range: { since: startDate, until: endDate },
        level: 'campaign' as const,
      };

      const rows = await getInsights(fields, params);

      return rows.map((row) => {
        const spend = pf(row.spend);
        const conversions = parseConversions(row.actions);
        const revenue = parseRevenue(row.action_values);
        const roas = spend > 0 ? revenue / spend : 0;

        return {
          id: row.campaign_id,
          name: row.campaign_name,
          status: 'ACTIVE',
          objective: '',
          spend: Math.round(spend * 100) / 100,
          impressions: pf(row.impressions),
          clicks: pf(row.clicks),
          ctr: Math.round(pf(row.ctr) * 10000) / 10000,
          cpc: Math.round(pf(row.cpc) * 100) / 100,
          conversions,
          revenue: Math.round(revenue * 100) / 100,
          roas: Math.round(roas * 100) / 100,
        };
      });
    } catch (error) {
      console.error('[MetaClient] getCampaigns failed:', error);
      return [];
    }
  },

  async getDailySpend(startDate: string, endDate: string): Promise<MetaDailySpend[]> {
    try {
      const fields = [
        'impressions',
        'clicks',
        'spend',
        'ctr',
        'cpc',
        'cpm',
        'actions',
        'action_values',
      ];
      const params = {
        time_range: { since: startDate, until: endDate },
        level: 'account' as const,
        time_increment: 1,
      };

      const rows = await getInsights(fields, params);

      return rows.map((row) => {
        const spend = pf(row.spend);
        const conversions = parseConversions(row.actions);
        const revenue = parseRevenue(row.action_values);
        const roas = spend > 0 ? revenue / spend : 0;

        return {
          date: row.date_start,
          spend: Math.round(spend * 100) / 100,
          impressions: pf(row.impressions),
          clicks: pf(row.clicks),
          ctr: Math.round(pf(row.ctr) * 10000) / 10000,
          cpc: Math.round(pf(row.cpc) * 100) / 100,
          cpm: Math.round(pf(row.cpm) * 100) / 100,
          conversions,
          revenue: Math.round(revenue * 100) / 100,
          roas: Math.round(roas * 100) / 100,
        };
      });
    } catch (error) {
      console.error('[MetaClient] getDailySpend failed:', error);
      return [];
    }
  },

  async getDemographics(startDate: string, endDate: string): Promise<MetaDemographic[]> {
    try {
      const fields = [
        'impressions',
        'clicks',
        'spend',
        'ctr',
        'cpc',
        'actions',
      ];
      const params = {
        time_range: { since: startDate, until: endDate },
        level: 'account' as const,
        breakdowns: ['age', 'gender'],
      };

      const rows = await getInsights(fields, params);

      return rows.map((row) => ({
        ageGroup: row.age,
        gender: row.gender,
        impressions: pf(row.impressions),
        clicks: pf(row.clicks),
        spend: Math.round(pf(row.spend) * 100) / 100,
        ctr: Math.round(pf(row.ctr) * 10000) / 10000,
        cpc: Math.round(pf(row.cpc) * 100) / 100,
      }));
    } catch (error) {
      console.error('[MetaClient] getDemographics failed:', error);
      return [];
    }
  },

  async getPlatformBreakdown(startDate: string, endDate: string): Promise<MetaPlatformBreakdown[]> {
    try {
      const fields = [
        'impressions',
        'clicks',
        'spend',
        'ctr',
        'cpc',
        'actions',
        'action_values',
      ];
      const params = {
        time_range: { since: startDate, until: endDate },
        level: 'account' as const,
        breakdowns: ['publisher_platform'],
      };

      const rows = await getInsights(fields, params);

      const totalSpend = rows.reduce((sum, row) => sum + pf(row.spend), 0);

      return rows.map((row) => {
        const spend = pf(row.spend);
        const conversions = parseConversions(row.actions);
        const revenue = parseRevenue(row.action_values);
        const roas = spend > 0 ? revenue / spend : 0;
        const percentage = totalSpend > 0 ? (spend / totalSpend) * 100 : 0;

        return {
          platform: row.publisher_platform,
          spend: Math.round(spend * 100) / 100,
          impressions: pf(row.impressions),
          clicks: pf(row.clicks),
          ctr: Math.round(pf(row.ctr) * 10000) / 10000,
          conversions,
          revenue: Math.round(revenue * 100) / 100,
          roas: Math.round(roas * 100) / 100,
          percentage: Math.round(percentage * 10) / 10,
        };
      });
    } catch (error) {
      console.error('[MetaClient] getPlatformBreakdown failed:', error);
      return [];
    }
  },

  async getAdsets(startDate: string, endDate: string): Promise<MetaAdset[]> {
    try {
      const fields = [
        'adset_id',
        'adset_name',
        'campaign_name',
        'impressions',
        'clicks',
        'spend',
        'ctr',
        'cpc',
        'actions',
        'action_values',
      ];
      const params = {
        time_range: { since: startDate, until: endDate },
        level: 'adset' as const,
      };

      const rows = await getInsights(fields, params);

      return rows.map((row) => {
        const spend = pf(row.spend);
        const conversions = parseConversions(row.actions);
        const revenue = parseRevenue(row.action_values);
        const roas = spend > 0 ? revenue / spend : 0;

        return {
          id: row.adset_id,
          name: row.adset_name,
          campaignName: row.campaign_name,
          status: 'ACTIVE',
          spend: Math.round(spend * 100) / 100,
          impressions: pf(row.impressions),
          clicks: pf(row.clicks),
          ctr: Math.round(pf(row.ctr) * 10000) / 10000,
          conversions,
          roas: Math.round(roas * 100) / 100,
        };
      });
    } catch (error) {
      console.error('[MetaClient] getAdsets failed:', error);
      return [];
    }
  },

  async getAds(startDate: string, endDate: string): Promise<MetaAd[]> {
    try {
      const fields = [
        'ad_id',
        'ad_name',
        'adset_name',
        'impressions',
        'clicks',
        'spend',
        'ctr',
        'cpc',
        'actions',
        'action_values',
      ];
      const params = {
        time_range: { since: startDate, until: endDate },
        level: 'ad' as const,
      };

      const rows = await getInsights(fields, params);

      return rows.map((row) => {
        const spend = pf(row.spend);
        const conversions = parseConversions(row.actions);
        const revenue = parseRevenue(row.action_values);
        const roas = spend > 0 ? revenue / spend : 0;

        return {
          id: row.ad_id,
          name: row.ad_name,
          adsetName: row.adset_name,
          status: 'ACTIVE',
          spend: Math.round(spend * 100) / 100,
          impressions: pf(row.impressions),
          clicks: pf(row.clicks),
          ctr: Math.round(pf(row.ctr) * 10000) / 10000,
          conversions,
          revenue: Math.round(revenue * 100) / 100,
          roas: Math.round(roas * 100) / 100,
        };
      });
    } catch (error) {
      console.error('[MetaClient] getAds failed:', error);
      return [];
    }
  },

  async getRoasTrend(startDate: string, endDate: string): Promise<MetaRoasTrend[]> {
    try {
      const daily = await this.getDailySpend(startDate, endDate);
      return daily.map((d) => ({
        date: d.date,
        roas: d.roas,
        spend: d.spend,
        revenue: d.revenue,
      }));
    } catch (error) {
      console.error('[MetaClient] getRoasTrend failed:', error);
      return [];
    }
  },
};
