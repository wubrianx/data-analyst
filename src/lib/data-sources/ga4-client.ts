/**
 * Real GA4 Data API client using @google-analytics/data.
 * Exports a GA4Client object with the same method signatures as MockGA4.
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { config } from '@/lib/config';
import type {
  GaDailyTraffic,
  GaTrafficSource,
  GaTopPage,
  GaDemographics,
  GaConversion,
  GaChannelGroup,
} from './mock-data';

// ---------------------------------------------------------------------------
// Client setup (lazy initialization to avoid crash when credentials are absent)
// ---------------------------------------------------------------------------

let _client: BetaAnalyticsDataClient | null = null;

function getClient(): BetaAnalyticsDataClient {
  if (!_client) {
    if (!config.ga4Credentials) {
      throw new Error('GA4_CREDENTIALS environment variable is required when not in demo mode');
    }
    const credentials = JSON.parse(config.ga4Credentials);
    _client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      projectId: credentials.project_id,
    });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatDate(yyyymmdd: string): string {
  // Convert YYYYMMDD → YYYY-MM-DD
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

interface RawRow {
  [key: string]: string | number;
}

async function runReport(
  property: string,
  dimensions: string[],
  metrics: string[],
  startDate: string,
  endDate: string
): Promise<RawRow[]> {
  const [response] = await getClient().runReport({
    property,
    dimensions: dimensions.map((d) => ({ name: d })),
    metrics: metrics.map((m) => ({ name: m })),
    dateRanges: [{ startDate, endDate }],
  });

  const rows: RawRow[] = [];
  if (!response.rows) return rows;

  for (const row of response.rows) {
    const obj: RawRow = {};

    if (row.dimensionValues) {
      row.dimensionValues.forEach((dv, i) => {
        const dimName = dimensions[i];
        let value = dv.value ?? '';
        // Convert date dimensions from YYYYMMDD to YYYY-MM-DD
        if (dimName === 'date' && /^\d{8}$/.test(value)) {
          value = formatDate(value);
        }
        obj[dimName] = value;
      });
    }

    if (row.metricValues) {
      row.metricValues.forEach((mv, i) => {
        obj[metrics[i]] = parseFloat(mv.value ?? '0');
      });
    }

    rows.push(obj);
  }

  return rows;
}

// ---------------------------------------------------------------------------
// GA4Client
// ---------------------------------------------------------------------------

export const GA4Client = {
  async getTrafficOverview(
    startDate: string,
    endDate: string
  ): Promise<GaDailyTraffic[]> {
    try {
      const rows = await runReport(
        config.ga4PropertyId,
        ['date'],
        [
          'sessions',
          'activeUsers',
          'bounceRate',
          'engagementRate',
          'conversions',
          'purchaseRevenue',
        ],
        startDate,
        endDate
      );

      return rows
        .map((r) => ({
          date: r.date as string,
          sessions: r.sessions as number,
          activeUsers: r.activeUsers as number,
          bounceRate: r.bounceRate as number,
          engagementRate: r.engagementRate as number,
          conversions: r.conversions as number,
          revenue: r.purchaseRevenue as number,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('[GA4Client] getTrafficOverview failed:', error);
      return [];
    }
  },

  async getTrafficSources(
    startDate: string,
    endDate: string
  ): Promise<GaTrafficSource[]> {
    try {
      const rows = await runReport(
        config.ga4PropertyId,
        ['date', 'sessionSource', 'sessionMedium'],
        ['sessions', 'activeUsers', 'conversions'],
        startDate,
        endDate
      );

      return rows
        .map((r) => ({
          date: r.date as string,
          source: r.sessionSource as string,
          medium: r.sessionMedium as string,
          sessions: r.sessions as number,
          activeUsers: r.activeUsers as number,
          conversions: r.conversions as number,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('[GA4Client] getTrafficSources failed:', error);
      return [];
    }
  },

  async getTopPages(
    startDate: string,
    endDate: string
  ): Promise<GaTopPage[]> {
    try {
      const rows = await runReport(
        config.ga4PropertyId,
        ['pagePath', 'pageTitle'],
        ['screenPageViews', 'averageSessionDuration', 'bounceRate'],
        startDate,
        endDate
      );

      return rows.map((r) => ({
        pagePath: r.pagePath as string,
        pageTitle: r.pageTitle as string,
        pageViews: r.screenPageViews as number,
        avgEngagementTime: r.averageSessionDuration as number,
        bounceRate: r.bounceRate as number,
      }));
    } catch (error) {
      console.error('[GA4Client] getTopPages failed:', error);
      return [];
    }
  },

  async getUserDemographics(
    startDate: string,
    endDate: string
  ): Promise<GaDemographics> {
    try {
      // Report a: countries
      const countryRows = await runReport(
        config.ga4PropertyId,
        ['country'],
        ['sessions'],
        startDate,
        endDate
      );

      const totalCountrySessions = countryRows.reduce(
        (sum, r) => sum + (r.sessions as number),
        0
      );
      const countries = countryRows.map((r) => {
        const sessions = r.sessions as number;
        const percentage =
          totalCountrySessions > 0
            ? Math.round((sessions / totalCountrySessions) * 1000) / 10
            : 0;
        return {
          country: r.country as string,
          sessions,
          percentage,
        };
      });

      // Report b: devices
      const deviceRows = await runReport(
        config.ga4PropertyId,
        ['deviceCategory'],
        ['sessions'],
        startDate,
        endDate
      );

      const totalDeviceSessions = deviceRows.reduce(
        (sum, r) => sum + (r.sessions as number),
        0
      );
      const devices = deviceRows.map((r) => {
        const sessions = r.sessions as number;
        const percentage =
          totalDeviceSessions > 0
            ? Math.round((sessions / totalDeviceSessions) * 1000) / 10
            : 0;
        return {
          device: r.deviceCategory as string,
          sessions,
          percentage,
        };
      });

      return { countries, devices };
    } catch (error) {
      console.error('[GA4Client] getUserDemographics failed:', error);
      return { countries: [], devices: [] };
    }
  },

  async getConversions(
    startDate: string,
    endDate: string
  ): Promise<GaConversion[]> {
    try {
      const rows = await runReport(
        config.ga4PropertyId,
        ['date', 'eventName'],
        ['conversions', 'purchaseRevenue'],
        startDate,
        endDate
      );

      // Filter to conversion events only
      const conversionRows = rows.filter(
        (r) => (r.conversions as number) > 0
      );

      return conversionRows
        .map((r) => ({
          date: r.date as string,
          eventName: r.eventName as string,
          conversions: r.conversions as number,
          revenue: r.purchaseRevenue as number,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('[GA4Client] getConversions failed:', error);
      return [];
    }
  },

  async getChannelGroups(
    startDate: string,
    endDate: string
  ): Promise<GaChannelGroup[]> {
    try {
      const rows = await runReport(
        config.ga4PropertyId,
        ['sessionDefaultChannelGroup'],
        ['sessions', 'conversions', 'purchaseRevenue'],
        startDate,
        endDate
      );

      const totalSessions = rows.reduce(
        (sum, r) => sum + (r.sessions as number),
        0
      );

      return rows.map((r) => {
        const sessions = r.sessions as number;
        const percentage =
          totalSessions > 0
            ? Math.round((sessions / totalSessions) * 1000) / 10
            : 0;
        return {
          channel: r.sessionDefaultChannelGroup as string,
          sessions,
          percentage,
          conversions: r.conversions as number,
          revenue: r.purchaseRevenue as number,
        };
      });
    } catch (error) {
      console.error('[GA4Client] getChannelGroups failed:', error);
      return [];
    }
  },
};
