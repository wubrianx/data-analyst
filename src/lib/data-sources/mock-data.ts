/**
 * Mock data generators for GA4 and Meta Ads, producing realistic
 * data for demo/development mode. Uses a seedable PRNG for determinism.
 */

// ---------------------------------------------------------------------------
// Seedable PRNG (mulberry32)
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createRng(seed = 42) {
  const next = mulberry32(seed);

  return {
    /** Random float in [0, 1) */
    random: () => next(),
    /** Random float in [min, max) */
    uniform: (min: number, max: number) => min + next() * (max - min),
    /** Roughly normal via Box-Muller (mean, stddev) */
    normal: (mean: number, stddev: number) => {
      const u1 = next() || 0.0001;
      const u2 = next();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return mean + z * stddev;
    },
    /** Random integer in [min, max] inclusive */
    randInt: (min: number, max: number) =>
      Math.floor(min + next() * (max - min + 1)),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function datesToArray(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function getWeekday(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDay();
}

const WEEKDAY_FACTORS = [0.72, 1.08, 1.12, 1.1, 1.06, 0.95, 0.78];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface GaDailyTraffic {
  date: string;
  sessions: number;
  activeUsers: number;
  bounceRate: number;
  engagementRate: number;
  conversions: number;
  revenue: number;
}

export interface GaTrafficSource {
  date: string;
  source: string;
  medium: string;
  sessions: number;
  activeUsers: number;
  conversions: number;
}

export interface GaTopPage {
  pagePath: string;
  pageTitle: string;
  pageViews: number;
  avgEngagementTime: number;
  bounceRate: number;
}

export interface GaDemographics {
  countries: { country: string; sessions: number; percentage: number }[];
  devices: { device: string; sessions: number; percentage: number }[];
}

export interface GaConversion {
  date: string;
  eventName: string;
  conversions: number;
  revenue: number;
}

export interface GaChannelGroup {
  channel: string;
  sessions: number;
  percentage: number;
  conversions: number;
  revenue: number;
}

export interface MetaAccountOverview {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  revenue: number;
  roas: number;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  revenue: number;
  roas: number;
}

export interface MetaDailySpend {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  revenue: number;
  roas: number;
}

export interface MetaDemographic {
  ageGroup: string;
  gender: string;
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpc: number;
}

export interface MetaPlatformBreakdown {
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  revenue: number;
  roas: number;
  percentage: number;
}

export interface MetaAdset {
  id: string;
  name: string;
  campaignName: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  roas: number;
}

export interface MetaAd {
  id: string;
  name: string;
  adsetName: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  revenue: number;
  roas: number;
}

export interface MetaRoasTrend {
  date: string;
  roas: number;
  spend: number;
  revenue: number;
}

// ---------------------------------------------------------------------------
// MockGA4
// ---------------------------------------------------------------------------

export const MockGA4 = {
  getTrafficOverview(startDate: string, endDate: string): GaDailyTraffic[] {
    const rng = createRng(101);
    const dates = datesToArray(startDate, endDate);
    return dates.map((date) => {
      const wf = WEEKDAY_FACTORS[getWeekday(date)];
      const baseSessions = Math.round(
        1800 * wf * clamp(rng.normal(1, 0.08), 0.7, 1.3)
      );
      const sessions = Math.max(baseSessions, 200);
      const activeUsers = Math.round(sessions * rng.uniform(0.78, 0.88));
      const bounceRate = clamp(rng.normal(0.42, 0.04), 0.25, 0.6);
      const engagementRate = clamp(1 - bounceRate + rng.normal(0, 0.02), 0.35, 0.75);
      const conversionRate = clamp(rng.normal(0.032, 0.008), 0.01, 0.06);
      const conversions = Math.max(1, Math.round(sessions * conversionRate));
      const avgOrderValue = rng.normal(1250, 300);
      const revenue = Math.round(conversions * Math.max(avgOrderValue, 300));
      return {
        date,
        sessions,
        activeUsers,
        bounceRate: Math.round(bounceRate * 10000) / 10000,
        engagementRate: Math.round(engagementRate * 10000) / 10000,
        conversions,
        revenue,
      };
    });
  },

  getTrafficSources(startDate: string, endDate: string): GaTrafficSource[] {
    const rng = createRng(202);
    const dates = datesToArray(startDate, endDate);

    const sources: { source: string; medium: string; share: number }[] = [
      { source: 'google', medium: 'organic', share: 0.3 },
      { source: 'facebook', medium: 'cpc', share: 0.22 },
      { source: '(direct)', medium: '(none)', share: 0.18 },
      { source: 'instagram', medium: 'referral', share: 0.1 },
      { source: 'yahoo', medium: 'organic', share: 0.07 },
      { source: 'line', medium: 'social', share: 0.06 },
      { source: 'google', medium: 'cpc', share: 0.04 },
      { source: 'bing', medium: 'organic', share: 0.03 },
    ];

    const results: GaTrafficSource[] = [];
    for (const date of dates) {
      const wf = WEEKDAY_FACTORS[getWeekday(date)];
      const totalSessions = Math.round(
        1800 * wf * clamp(rng.normal(1, 0.08), 0.7, 1.3)
      );
      for (const s of sources) {
        const sessions = Math.max(
          1,
          Math.round(totalSessions * s.share * rng.uniform(0.85, 1.15))
        );
        const activeUsers = Math.round(sessions * rng.uniform(0.75, 0.9));
        const conversions = Math.max(
          0,
          Math.round(sessions * rng.uniform(0.01, 0.05))
        );
        results.push({
          date,
          source: s.source,
          medium: s.medium,
          sessions,
          activeUsers,
          conversions,
        });
      }
    }
    return results;
  },

  getTopPages(startDate: string, endDate: string): GaTopPage[] {
    const rng = createRng(303);
    const days = datesToArray(startDate, endDate).length;

    const pages = [
      { path: '/', title: '首頁' },
      { path: '/products', title: '產品列表' },
      { path: '/products/best-seller', title: '熱銷產品' },
      { path: '/products/new-arrivals', title: '新品上市' },
      { path: '/products/category/skincare', title: '護膚系列' },
      { path: '/products/category/makeup', title: '彩妝系列' },
      { path: '/products/category/haircare', title: '髮品系列' },
      { path: '/about', title: '關於我們' },
      { path: '/blog', title: '美容部落格' },
      { path: '/blog/skincare-tips', title: '護膚秘訣' },
      { path: '/blog/makeup-tutorial', title: '彩妝教學' },
      { path: '/cart', title: '購物車' },
      { path: '/checkout', title: '結帳' },
      { path: '/account', title: '會員中心' },
      { path: '/account/orders', title: '訂單查詢' },
      { path: '/promotions', title: '促銷活動' },
      { path: '/faq', title: '常見問題' },
      { path: '/contact', title: '聯絡我們' },
      { path: '/terms', title: '服務條款' },
      { path: '/privacy', title: '隱私政策' },
    ];

    return pages.map((p, i) => {
      const rank = i + 1;
      const baseViews = Math.round((5000 / Math.pow(rank, 0.7)) * days);
      const pageViews = Math.max(
        10,
        Math.round(baseViews * rng.uniform(0.85, 1.15))
      );
      const avgEngagementTime = clamp(rng.normal(45 + 80 / rank, 15), 8, 300);
      const bounceRate = clamp(rng.normal(0.4 + rank * 0.008, 0.05), 0.2, 0.75);
      return {
        pagePath: p.path,
        pageTitle: p.title,
        pageViews,
        avgEngagementTime: Math.round(avgEngagementTime * 10) / 10,
        bounceRate: Math.round(bounceRate * 10000) / 10000,
      };
    });
  },

  getUserDemographics(startDate: string, endDate: string): GaDemographics {
    const rng = createRng(404);
    const days = datesToArray(startDate, endDate).length;
    const totalSessions = Math.round(1800 * days * rng.uniform(0.95, 1.05));

    const countryShares: { country: string; pct: number }[] = [
      { country: '台灣', pct: 0.65 },
      { country: '日本', pct: 0.12 },
      { country: '香港', pct: 0.08 },
      { country: '美國', pct: 0.06 },
      { country: '中國', pct: 0.04 },
      { country: '新加坡', pct: 0.03 },
      { country: '其他', pct: 0.02 },
    ];

    const countries = countryShares.map((c) => {
      const pct = clamp(c.pct * rng.uniform(0.9, 1.1), 0.005, 1);
      const sessions = Math.round(totalSessions * pct);
      return { country: c.country, sessions, percentage: Math.round(pct * 1000) / 10 };
    });

    const deviceShares: { device: string; pct: number }[] = [
      { device: 'mobile', pct: 0.62 },
      { device: 'desktop', pct: 0.3 },
      { device: 'tablet', pct: 0.08 },
    ];

    const devices = deviceShares.map((d) => {
      const pct = clamp(d.pct * rng.uniform(0.92, 1.08), 0.01, 1);
      const sessions = Math.round(totalSessions * pct);
      return { device: d.device, sessions, percentage: Math.round(pct * 1000) / 10 };
    });

    return { countries, devices };
  },

  getConversions(startDate: string, endDate: string): GaConversion[] {
    const rng = createRng(505);
    const dates = datesToArray(startDate, endDate);
    const events = ['purchase', 'add_to_cart', 'begin_checkout', 'sign_up'];
    const results: GaConversion[] = [];

    for (const date of dates) {
      const wf = WEEKDAY_FACTORS[getWeekday(date)];
      for (const eventName of events) {
        let baseCount: number;
        let hasRevenue: boolean;
        switch (eventName) {
          case 'purchase':
            baseCount = 28;
            hasRevenue = true;
            break;
          case 'add_to_cart':
            baseCount = 95;
            hasRevenue = false;
            break;
          case 'begin_checkout':
            baseCount = 48;
            hasRevenue = false;
            break;
          case 'sign_up':
            baseCount = 18;
            hasRevenue = false;
            break;
          default:
            baseCount = 10;
            hasRevenue = false;
        }
        const conversions = Math.max(
          1,
          Math.round(baseCount * wf * rng.uniform(0.8, 1.2))
        );
        const revenue = hasRevenue
          ? Math.round(conversions * rng.normal(1250, 250))
          : 0;
        results.push({ date, eventName, conversions, revenue: Math.max(0, revenue) });
      }
    }
    return results;
  },

  getChannelGroups(startDate: string, endDate: string): GaChannelGroup[] {
    const rng = createRng(606);
    const days = datesToArray(startDate, endDate).length;
    const totalSessions = Math.round(1800 * days * rng.uniform(0.95, 1.05));

    const channels: {
      channel: string;
      pct: number;
      convRate: number;
      aov: number;
    }[] = [
      { channel: 'Organic Search', pct: 0.3, convRate: 0.035, aov: 1300 },
      { channel: 'Paid Social', pct: 0.22, convRate: 0.028, aov: 1100 },
      { channel: 'Direct', pct: 0.18, convRate: 0.04, aov: 1400 },
      { channel: 'Referral', pct: 0.1, convRate: 0.025, aov: 1000 },
      { channel: 'Organic Social', pct: 0.08, convRate: 0.022, aov: 950 },
      { channel: 'Email', pct: 0.06, convRate: 0.045, aov: 1500 },
      { channel: 'Paid Search', pct: 0.04, convRate: 0.038, aov: 1250 },
      { channel: 'Display', pct: 0.02, convRate: 0.012, aov: 800 },
    ];

    return channels.map((c) => {
      const sessions = Math.round(totalSessions * c.pct * rng.uniform(0.9, 1.1));
      const conversions = Math.max(
        1,
        Math.round(sessions * c.convRate * rng.uniform(0.85, 1.15))
      );
      const revenue = Math.round(conversions * c.aov * rng.uniform(0.9, 1.1));
      return {
        channel: c.channel,
        sessions,
        percentage: Math.round(c.pct * 1000) / 10,
        conversions,
        revenue,
      };
    });
  },
};

// ---------------------------------------------------------------------------
// MockMeta
// ---------------------------------------------------------------------------

export const MockMeta = {
  getAccountOverview(startDate: string, endDate: string): MetaAccountOverview {
    const daily = this.getDailySpend(startDate, endDate);
    const spend = daily.reduce((s, d) => s + d.spend, 0);
    const impressions = daily.reduce((s, d) => s + d.impressions, 0);
    const clicks = daily.reduce((s, d) => s + d.clicks, 0);
    const conversions = daily.reduce((s, d) => s + d.conversions, 0);
    const revenue = daily.reduce((s, d) => s + d.revenue, 0);
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const roas = spend > 0 ? revenue / spend : 0;

    return {
      spend: Math.round(spend),
      impressions,
      clicks,
      ctr: Math.round(ctr * 10000) / 10000,
      cpc: Math.round(cpc * 100) / 100,
      cpm: Math.round(cpm * 100) / 100,
      conversions,
      revenue: Math.round(revenue),
      roas: Math.round(roas * 100) / 100,
    };
  },

  getCampaigns(startDate: string, endDate: string): MetaCampaign[] {
    const rng = createRng(701);
    const days = datesToArray(startDate, endDate).length;

    const campaigns: {
      name: string;
      objective: string;
      dailySpend: number;
      ctrBase: number;
      convRate: number;
      roasBase: number;
    }[] = [
      {
        name: '品牌知名度 - 護膚系列',
        objective: 'BRAND_AWARENESS',
        dailySpend: 320,
        ctrBase: 0.018,
        convRate: 0.02,
        roasBase: 1.8,
      },
      {
        name: '轉換 - 熱銷產品推廣',
        objective: 'CONVERSIONS',
        dailySpend: 280,
        ctrBase: 0.032,
        convRate: 0.045,
        roasBase: 3.2,
      },
      {
        name: '流量 - 部落格內容',
        objective: 'LINK_CLICKS',
        dailySpend: 120,
        ctrBase: 0.025,
        convRate: 0.015,
        roasBase: 1.2,
      },
      {
        name: '再行銷 - 購物車未結帳',
        objective: 'CONVERSIONS',
        dailySpend: 95,
        ctrBase: 0.042,
        convRate: 0.065,
        roasBase: 4.5,
      },
      {
        name: '新客獲取 - 彩妝系列',
        objective: 'CONVERSIONS',
        dailySpend: 180,
        ctrBase: 0.028,
        convRate: 0.035,
        roasBase: 2.6,
      },
    ];

    return campaigns.map((c, i) => {
      const spend = Math.round(c.dailySpend * days * rng.uniform(0.9, 1.1));
      const cpm = rng.uniform(120, 280);
      const impressions = Math.round((spend / cpm) * 1000);
      const ctr = clamp(c.ctrBase * rng.uniform(0.85, 1.15), 0.005, 0.08);
      const clicks = Math.round(impressions * ctr);
      const cpc = clicks > 0 ? spend / clicks : 0;
      const conversions = Math.max(
        1,
        Math.round(clicks * c.convRate * rng.uniform(0.8, 1.2))
      );
      const revenue = Math.round(
        spend * c.roasBase * rng.uniform(0.85, 1.15)
      );
      const roas = spend > 0 ? revenue / spend : 0;

      return {
        id: `camp_${1000 + i}`,
        name: c.name,
        status: 'ACTIVE',
        objective: c.objective,
        spend,
        impressions,
        clicks,
        ctr: Math.round(ctr * 10000) / 10000,
        cpc: Math.round(cpc * 100) / 100,
        conversions,
        revenue,
        roas: Math.round(roas * 100) / 100,
      };
    });
  },

  getDailySpend(startDate: string, endDate: string): MetaDailySpend[] {
    const rng = createRng(702);
    const dates = datesToArray(startDate, endDate);

    return dates.map((date) => {
      const wf = WEEKDAY_FACTORS[getWeekday(date)];
      const spend = Math.round(850 * wf * clamp(rng.normal(1, 0.1), 0.7, 1.3));
      const cpm = rng.uniform(130, 260);
      const impressions = Math.round((spend / cpm) * 1000);
      const ctr = clamp(rng.normal(0.028, 0.005), 0.01, 0.06);
      const clicks = Math.max(1, Math.round(impressions * ctr));
      const cpc = spend / clicks;
      const cpmActual = impressions > 0 ? (spend / impressions) * 1000 : 0;
      const convRate = clamp(rng.normal(0.035, 0.008), 0.01, 0.07);
      const conversions = Math.max(1, Math.round(clicks * convRate));
      const avgOrderValue = rng.normal(1150, 200);
      const revenue = Math.round(conversions * Math.max(avgOrderValue, 400));
      const roas = spend > 0 ? revenue / spend : 0;

      return {
        date,
        spend,
        impressions,
        clicks,
        ctr: Math.round(ctr * 10000) / 10000,
        cpc: Math.round(cpc * 100) / 100,
        cpm: Math.round(cpmActual * 100) / 100,
        conversions,
        revenue,
        roas: Math.round(roas * 100) / 100,
      };
    });
  },

  getDemographics(startDate: string, endDate: string): MetaDemographic[] {
    const rng = createRng(703);
    const days = datesToArray(startDate, endDate).length;
    const totalSpend = 850 * days;

    const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    const genders = ['female', 'male'];
    const ageShares = [0.12, 0.32, 0.25, 0.16, 0.1, 0.05];
    const genderShares = [0.6, 0.4];

    const results: MetaDemographic[] = [];
    for (let a = 0; a < ageGroups.length; a++) {
      for (let g = 0; g < genders.length; g++) {
        const share = ageShares[a] * genderShares[g] * rng.uniform(0.85, 1.15);
        const spend = Math.round(totalSpend * share);
        const cpm = rng.uniform(130, 260);
        const impressions = Math.round((spend / cpm) * 1000);
        const ctr = clamp(rng.normal(0.028, 0.006), 0.008, 0.06);
        const clicks = Math.max(1, Math.round(impressions * ctr));
        const cpc = spend / clicks;

        results.push({
          ageGroup: ageGroups[a],
          gender: genders[g],
          impressions,
          clicks,
          spend,
          ctr: Math.round(ctr * 10000) / 10000,
          cpc: Math.round(cpc * 100) / 100,
        });
      }
    }
    return results;
  },

  getPlatformBreakdown(
    startDate: string,
    endDate: string
  ): MetaPlatformBreakdown[] {
    const rng = createRng(704);
    const overview = this.getAccountOverview(startDate, endDate);

    const platforms: {
      platform: string;
      pct: number;
      ctrMod: number;
      convMod: number;
    }[] = [
      { platform: 'Facebook', pct: 0.48, ctrMod: 1.0, convMod: 1.0 },
      { platform: 'Instagram', pct: 0.38, ctrMod: 1.15, convMod: 0.9 },
      { platform: 'Audience Network', pct: 0.14, ctrMod: 0.6, convMod: 0.5 },
    ];

    return platforms.map((p) => {
      const pct = clamp(p.pct * rng.uniform(0.9, 1.1), 0.05, 0.7);
      const spend = Math.round(overview.spend * pct);
      const impressions = Math.round(overview.impressions * pct * rng.uniform(0.9, 1.1));
      const ctr = clamp(overview.ctr * p.ctrMod * rng.uniform(0.9, 1.1), 0.005, 0.08);
      const clicks = Math.max(1, Math.round(impressions * ctr));
      const conversions = Math.max(
        1,
        Math.round(overview.conversions * pct * p.convMod * rng.uniform(0.85, 1.15))
      );
      const revenue = Math.round(overview.revenue * pct * p.convMod * rng.uniform(0.85, 1.15));
      const roas = spend > 0 ? revenue / spend : 0;

      return {
        platform: p.platform,
        spend,
        impressions,
        clicks,
        ctr: Math.round(ctr * 10000) / 10000,
        conversions,
        revenue,
        roas: Math.round(roas * 100) / 100,
        percentage: Math.round(pct * 1000) / 10,
      };
    });
  },

  getAdsets(startDate: string, endDate: string): MetaAdset[] {
    const rng = createRng(705);
    const days = datesToArray(startDate, endDate).length;

    const adsets: {
      name: string;
      campaign: string;
      dailySpend: number;
      ctrBase: number;
      convRate: number;
      roasBase: number;
    }[] = [
      { name: '女性 25-34 興趣美妝', campaign: '品牌知名度 - 護膚系列', dailySpend: 110, ctrBase: 0.022, convRate: 0.025, roasBase: 2.0 },
      { name: '女性 35-44 興趣保養', campaign: '品牌知名度 - 護膚系列', dailySpend: 95, ctrBase: 0.019, convRate: 0.022, roasBase: 1.8 },
      { name: 'Lookalike 購買者 1%', campaign: '轉換 - 熱銷產品推廣', dailySpend: 150, ctrBase: 0.035, convRate: 0.05, roasBase: 3.5 },
      { name: 'Lookalike 購買者 3%', campaign: '轉換 - 熱銷產品推廣', dailySpend: 130, ctrBase: 0.03, convRate: 0.04, roasBase: 2.8 },
      { name: '部落格讀者 Retarget', campaign: '流量 - 部落格內容', dailySpend: 60, ctrBase: 0.028, convRate: 0.018, roasBase: 1.3 },
      { name: '興趣美容保健', campaign: '流量 - 部落格內容', dailySpend: 55, ctrBase: 0.024, convRate: 0.012, roasBase: 1.0 },
      { name: '購物車放棄 7天', campaign: '再行銷 - 購物車未結帳', dailySpend: 50, ctrBase: 0.048, convRate: 0.07, roasBase: 5.0 },
      { name: '購物車放棄 14天', campaign: '再行銷 - 購物車未結帳', dailySpend: 40, ctrBase: 0.04, convRate: 0.055, roasBase: 4.0 },
      { name: '彩妝新品廣泛興趣', campaign: '新客獲取 - 彩妝系列', dailySpend: 100, ctrBase: 0.026, convRate: 0.03, roasBase: 2.4 },
    ];

    return adsets.map((a, i) => {
      const spend = Math.round(a.dailySpend * days * rng.uniform(0.88, 1.12));
      const cpm = rng.uniform(130, 260);
      const impressions = Math.round((spend / cpm) * 1000);
      const ctr = clamp(a.ctrBase * rng.uniform(0.85, 1.15), 0.005, 0.08);
      const clicks = Math.max(1, Math.round(impressions * ctr));
      const conversions = Math.max(
        1,
        Math.round(clicks * a.convRate * rng.uniform(0.8, 1.2))
      );
      const cpc = clicks > 0 ? spend / clicks : 0;
      const roas = clamp(a.roasBase * rng.uniform(0.85, 1.15), 0.5, 8);

      return {
        id: `adset_${2000 + i}`,
        name: a.name,
        campaignName: a.campaign,
        status: 'ACTIVE',
        spend,
        impressions,
        clicks,
        ctr: Math.round(ctr * 10000) / 10000,
        cpc: Math.round(cpc * 100) / 100,
        conversions,
        roas: Math.round(roas * 100) / 100,
      };
    });
  },

  getAds(startDate: string, endDate: string): MetaAd[] {
    const rng = createRng(706);
    const days = datesToArray(startDate, endDate).length;

    const ads: {
      name: string;
      adset: string;
      dailySpend: number;
      ctrBase: number;
      convRate: number;
      roasBase: number;
    }[] = [
      { name: '護膚精華液 - 輪播圖', adset: '女性 25-34 興趣美妝', dailySpend: 38, ctrBase: 0.024, convRate: 0.028, roasBase: 2.2 },
      { name: '護膚精華液 - 影片15s', adset: '女性 25-34 興趣美妝', dailySpend: 35, ctrBase: 0.02, convRate: 0.023, roasBase: 1.9 },
      { name: '保濕面膜 - 靜態圖', adset: '女性 35-44 興趣保養', dailySpend: 32, ctrBase: 0.021, convRate: 0.024, roasBase: 1.8 },
      { name: '保濕面膜 - 限時優惠', adset: '女性 35-44 興趣保養', dailySpend: 30, ctrBase: 0.023, convRate: 0.026, roasBase: 2.1 },
      { name: '熱銷組合 - 輪播圖A', adset: 'Lookalike 購買者 1%', dailySpend: 50, ctrBase: 0.038, convRate: 0.055, roasBase: 3.8 },
      { name: '熱銷組合 - 輪播圖B', adset: 'Lookalike 購買者 1%', dailySpend: 48, ctrBase: 0.034, convRate: 0.048, roasBase: 3.3 },
      { name: '熱銷組合 - 影片30s', adset: 'Lookalike 購買者 3%', dailySpend: 45, ctrBase: 0.032, convRate: 0.042, roasBase: 3.0 },
      { name: '部落格精選 - 連結預覽', adset: '部落格讀者 Retarget', dailySpend: 28, ctrBase: 0.03, convRate: 0.02, roasBase: 1.4 },
      { name: '保養知識 - 影片', adset: '興趣美容保健', dailySpend: 25, ctrBase: 0.026, convRate: 0.014, roasBase: 1.1 },
      { name: '購物車提醒 - 動態產品', adset: '購物車放棄 7天', dailySpend: 22, ctrBase: 0.05, convRate: 0.075, roasBase: 5.2 },
      { name: '購物車提醒 - 折扣碼', adset: '購物車放棄 7天', dailySpend: 20, ctrBase: 0.046, convRate: 0.068, roasBase: 4.8 },
      { name: '14天回購提醒', adset: '購物車放棄 14天', dailySpend: 18, ctrBase: 0.042, convRate: 0.058, roasBase: 4.2 },
      { name: '彩妝新色 - 輪播圖', adset: '彩妝新品廣泛興趣', dailySpend: 35, ctrBase: 0.028, convRate: 0.032, roasBase: 2.5 },
      { name: '彩妝新色 - 試色影片', adset: '彩妝新品廣泛興趣', dailySpend: 33, ctrBase: 0.026, convRate: 0.029, roasBase: 2.3 },
    ];

    return ads.map((a, i) => {
      const spend = Math.round(a.dailySpend * days * rng.uniform(0.85, 1.15));
      const cpm = rng.uniform(130, 260);
      const impressions = Math.round((spend / cpm) * 1000);
      const ctr = clamp(a.ctrBase * rng.uniform(0.85, 1.15), 0.005, 0.08);
      const clicks = Math.max(1, Math.round(impressions * ctr));
      const conversions = Math.max(
        1,
        Math.round(clicks * a.convRate * rng.uniform(0.8, 1.2))
      );
      const revenue = Math.round(
        spend * a.roasBase * rng.uniform(0.85, 1.15)
      );
      const roas = spend > 0 ? revenue / spend : 0;

      return {
        id: `ad_${3000 + i}`,
        name: a.name,
        adsetName: a.adset,
        status: i < 12 ? 'ACTIVE' : 'PAUSED',
        spend,
        impressions,
        clicks,
        ctr: Math.round(ctr * 10000) / 10000,
        conversions,
        revenue,
        roas: Math.round(roas * 100) / 100,
      };
    });
  },

  getRoasTrend(startDate: string, endDate: string): MetaRoasTrend[] {
    const daily = this.getDailySpend(startDate, endDate);
    return daily.map((d) => ({
      date: d.date,
      roas: d.roas,
      spend: d.spend,
      revenue: d.revenue,
    }));
  },
};
