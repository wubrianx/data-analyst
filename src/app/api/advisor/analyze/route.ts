import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Category = 'anomaly' | 'health' | 'sanity' | 'recommendation';
type Severity = 'critical' | 'warning' | 'info' | 'positive';

interface Finding {
  category: Category;
  severity: Severity;
  title: string;
  description: string;
  suggestion: string;
}

interface GaDailyTraffic {
  date: string;
  sessions: number;
  activeUsers: number;
  bounceRate: number;
  engagementRate: number;
  conversions: number;
  revenue: number;
}

interface MetaDailySpend {
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

interface MetaCampaign {
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

interface GaData {
  trafficOverview?: GaDailyTraffic[];
  [key: string]: unknown;
}

interface MetaData {
  dailySpend?: MetaDailySpend[];
  campaigns?: MetaCampaign[];
  overview?: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    cpm: number;
    conversions: number;
    revenue: number;
    roas: number;
  };
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Rule engine
// ---------------------------------------------------------------------------

function analyzeData(gaData: GaData | null, metaData: MetaData | null): Finding[] {
  const findings: Finding[] = [];

  // --- GA4 rules ---
  if (gaData?.trafficOverview && gaData.trafficOverview.length > 0) {
    const traffic = gaData.trafficOverview;

    // Day-over-day session change > 25%
    for (let i = 1; i < traffic.length; i++) {
      const prev = traffic[i - 1].sessions;
      const curr = traffic[i].sessions;
      if (prev === 0) continue;
      const change = (curr - prev) / prev;
      if (Math.abs(change) > 0.25) {
        const direction = change > 0 ? 'increase' : 'decrease';
        const pct = Math.round(Math.abs(change) * 100);
        findings.push({
          category: 'anomaly',
          severity: 'warning',
          title: `Sessions ${direction}d ${pct}% day-over-day`,
          description: `Sessions went from ${prev} on ${traffic[i - 1].date} to ${curr} on ${traffic[i].date}, a ${pct}% ${direction}.`,
          suggestion: `Investigate potential causes for the sudden ${direction} in traffic. Check for marketing campaigns, site issues, or external events.`,
        });
      }
    }

    // Consecutive 3+ day decline in sessions
    let declineDays = 0;
    for (let i = 1; i < traffic.length; i++) {
      if (traffic[i].sessions < traffic[i - 1].sessions) {
        declineDays++;
      } else {
        if (declineDays >= 3) {
          findings.push({
            category: 'anomaly',
            severity: 'warning',
            title: `${declineDays} consecutive days of declining sessions`,
            description: `Sessions declined for ${declineDays} consecutive days ending on ${traffic[i - 1].date}.`,
            suggestion: 'Review traffic sources to identify which channels are losing volume. Check for technical issues or competitor activity.',
          });
        }
        declineDays = 0;
      }
    }
    // Check at the end of the array
    if (declineDays >= 3) {
      findings.push({
        category: 'anomaly',
        severity: 'warning',
        title: `${declineDays} consecutive days of declining sessions`,
        description: `Sessions declined for ${declineDays} consecutive days ending on ${traffic[traffic.length - 1].date}.`,
        suggestion: 'Review traffic sources to identify which channels are losing volume. Check for technical issues or competitor activity.',
      });
    }

    // Engagement rate health check
    const avgEngagement =
      traffic.reduce((sum, d) => sum + d.engagementRate, 0) / traffic.length;
    if (avgEngagement < 0.4) {
      findings.push({
        category: 'health',
        severity: 'warning',
        title: 'Low engagement rate',
        description: `Average engagement rate is ${(avgEngagement * 100).toFixed(1)}%, which is below the 40% threshold.`,
        suggestion: 'Improve content relevance, page load speed, and user experience. Consider A/B testing landing pages.',
      });
    } else if (avgEngagement > 0.7) {
      findings.push({
        category: 'health',
        severity: 'positive',
        title: 'Strong engagement rate',
        description: `Average engagement rate is ${(avgEngagement * 100).toFixed(1)}%, which is above the 70% mark.`,
        suggestion: 'Engagement is excellent. Consider scaling successful content strategies to other areas.',
      });
    }

    // Bounce rate health check
    const avgBounce =
      traffic.reduce((sum, d) => sum + d.bounceRate, 0) / traffic.length;
    if (avgBounce > 0.65) {
      findings.push({
        category: 'health',
        severity: 'warning',
        title: 'High bounce rate',
        description: `Average bounce rate is ${(avgBounce * 100).toFixed(1)}%, exceeding the 65% warning threshold.`,
        suggestion: 'Review landing page relevance, page speed, and mobile experience. Ensure ad targeting matches page content.',
      });
    }
  }

  // --- Meta Ads rules ---
  if (metaData) {
    const overview = metaData.overview;
    const daily = metaData.dailySpend;
    const campaigns = metaData.campaigns;

    if (overview) {
      // CTR checks
      const ctrPct = overview.ctr * 100;
      if (overview.ctr < 0.008) {
        findings.push({
          category: 'health',
          severity: 'warning',
          title: 'Low Meta CTR',
          description: `Overall CTR is ${ctrPct.toFixed(2)}%, below the 0.8% minimum threshold.`,
          suggestion: 'Review ad creatives and targeting. Consider refreshing ad copy, images, or audience segments.',
        });
      } else if (overview.ctr > 0.03) {
        findings.push({
          category: 'health',
          severity: 'warning',
          title: 'Unusually high Meta CTR',
          description: `Overall CTR is ${ctrPct.toFixed(2)}%, above 3%. While high CTR can be positive, verify audience is not too narrow.`,
          suggestion: 'Check if the high CTR is translating to conversions. Narrow audiences may limit scale.',
        });
      }

      // CTR sanity check
      if (overview.ctr > 0.1) {
        findings.push({
          category: 'sanity',
          severity: 'warning',
          title: 'CTR exceeds 10% - possible data error',
          description: `CTR of ${ctrPct.toFixed(2)}% is unusually high and may indicate a tracking or data issue.`,
          suggestion: 'Verify Meta Ads pixel configuration and event tracking setup.',
        });
      }

      // CPC check
      if (overview.cpc > 15) {
        findings.push({
          category: 'health',
          severity: 'warning',
          title: 'High cost per click',
          description: `Average CPC is $${overview.cpc.toFixed(2)}, exceeding the $15 warning threshold.`,
          suggestion: 'Review bidding strategy, audience targeting, and ad relevance scores. Consider testing broader audiences.',
        });
      }

      // ROAS checks
      if (overview.roas < 1.0) {
        findings.push({
          category: 'health',
          severity: 'critical',
          title: 'ROAS below breakeven',
          description: `Overall ROAS is ${overview.roas.toFixed(2)}x, meaning ad spend exceeds revenue generated.`,
          suggestion: 'Immediately review campaign performance. Pause underperforming campaigns and reallocate budget to profitable ones.',
        });
      } else if (overview.roas > 10.0) {
        findings.push({
          category: 'health',
          severity: 'warning',
          title: 'Unusually high ROAS',
          description: `Overall ROAS is ${overview.roas.toFixed(2)}x. While positive, verify attribution accuracy.`,
          suggestion: 'Cross-check with GA4 revenue data. High ROAS may indicate over-attribution or delayed reporting.',
        });
      }

      // ROAS sanity check
      if (overview.roas > 20) {
        findings.push({
          category: 'sanity',
          severity: 'critical',
          title: 'ROAS exceeds 20x - likely data error',
          description: `ROAS of ${overview.roas.toFixed(2)}x is unrealistically high and likely indicates a tracking issue.`,
          suggestion: 'Audit conversion tracking and revenue reporting. Check for duplicate events or incorrect values.',
        });
      }
    }

    // Day-over-day spend change > 25% in Meta daily data
    if (daily && daily.length > 1) {
      for (let i = 1; i < daily.length; i++) {
        const prev = daily[i - 1].spend;
        const curr = daily[i].spend;
        if (prev === 0) continue;
        const change = (curr - prev) / prev;
        if (Math.abs(change) > 0.25) {
          const direction = change > 0 ? 'increase' : 'decrease';
          const pct = Math.round(Math.abs(change) * 100);
          findings.push({
            category: 'anomaly',
            severity: 'warning',
            title: `Ad spend ${direction}d ${pct}% day-over-day`,
            description: `Meta spend went from $${prev} on ${daily[i - 1].date} to $${curr} on ${daily[i].date}.`,
            suggestion: `Review budget changes and delivery settings. Ensure the ${direction} was intentional.`,
          });
        }
      }

      // Consecutive 3+ day ROAS decline
      let roasDeclineDays = 0;
      for (let i = 1; i < daily.length; i++) {
        if (daily[i].roas < daily[i - 1].roas) {
          roasDeclineDays++;
        } else {
          if (roasDeclineDays >= 3) {
            findings.push({
              category: 'anomaly',
              severity: 'warning',
              title: `${roasDeclineDays} consecutive days of declining ROAS`,
              description: `Meta ROAS declined for ${roasDeclineDays} consecutive days ending on ${daily[i - 1].date}.`,
              suggestion: 'Review ad creative fatigue, audience saturation, and competitive landscape changes.',
            });
          }
          roasDeclineDays = 0;
        }
      }
      if (roasDeclineDays >= 3) {
        findings.push({
          category: 'anomaly',
          severity: 'warning',
          title: `${roasDeclineDays} consecutive days of declining ROAS`,
          description: `Meta ROAS declined for ${roasDeclineDays} consecutive days ending on ${daily[daily.length - 1].date}.`,
          suggestion: 'Review ad creative fatigue, audience saturation, and competitive landscape changes.',
        });
      }
    }

    // Campaign-level rules
    if (campaigns && campaigns.length > 0) {
      const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);

      // Budget concentration > 60% in single campaign
      for (const campaign of campaigns) {
        if (totalSpend > 0) {
          const concentration = campaign.spend / totalSpend;
          if (concentration > 0.6) {
            findings.push({
              category: 'recommendation',
              severity: 'warning',
              title: 'High budget concentration',
              description: `Campaign "${campaign.name}" accounts for ${(concentration * 100).toFixed(1)}% of total spend.`,
              suggestion: 'Diversify budget across campaigns to reduce risk. Test new campaigns to find additional profitable audiences.',
            });
          }
        }
      }

      // Campaign ROAS comparison for budget reallocation
      const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE' && c.spend > 0);
      if (activeCampaigns.length >= 2) {
        const sortedByRoas = [...activeCampaigns].sort((a, b) => b.roas - a.roas);
        const best = sortedByRoas[0];
        const worst = sortedByRoas[sortedByRoas.length - 1];

        if (best.roas > 0 && worst.roas > 0 && best.roas / worst.roas > 2) {
          findings.push({
            category: 'recommendation',
            severity: 'info',
            title: 'Budget reallocation opportunity',
            description: `"${best.name}" has ROAS of ${best.roas.toFixed(2)}x while "${worst.name}" has ${worst.roas.toFixed(2)}x (${(best.roas / worst.roas).toFixed(1)}x difference).`,
            suggestion: `Consider shifting budget from "${worst.name}" to "${best.name}" to improve overall return. Test incrementally with 10-20% budget shifts.`,
          });
        }
      }

      // Per-campaign ROAS sanity
      for (const campaign of campaigns) {
        if (campaign.roas > 20) {
          findings.push({
            category: 'sanity',
            severity: 'critical',
            title: `Campaign ROAS exceeds 20x - likely data error`,
            description: `Campaign "${campaign.name}" reports ROAS of ${campaign.roas.toFixed(2)}x, which is unrealistically high.`,
            suggestion: 'Audit conversion tracking for this campaign. Check for duplicate purchase events.',
          });
        }

        if (campaign.ctr > 0.1) {
          findings.push({
            category: 'sanity',
            severity: 'warning',
            title: `Campaign CTR exceeds 10%`,
            description: `Campaign "${campaign.name}" has CTR of ${(campaign.ctr * 100).toFixed(2)}%, which may indicate a tracking issue.`,
            suggestion: 'Verify click tracking and ensure no bot traffic is inflating metrics.',
          });
        }
      }
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gaData, metaData } = body as {
      gaData: GaData | null;
      metaData: MetaData | null;
    };

    const findings = analyzeData(gaData ?? null, metaData ?? null);
    return NextResponse.json({ findings });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
