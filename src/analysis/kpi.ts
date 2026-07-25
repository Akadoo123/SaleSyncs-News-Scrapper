import type { AnalyzedItem, Kpi } from '../types.js';

export interface PipelineCounts {
  totalCollected: number;
  afterDedup: number;
  afterPrefilter: number;
}

/**
 * หมายเหตุ: ชื่อฟิลด์ KPI บางตัวคงไว้ตามโครงเดิมของ Air4 (evRelated / *Opportunities)
 * เพื่อไม่ให้ Dashboard ต้องแก้ทั้งชุด แต่ "ความหมาย" ถูกปรับให้เข้ากับ SaleSync แล้ว:
 *   evRelated        → ข่าว AI / เทคโนโลยีหลัก (newsCategory = AI_TECH)
 *   oemOpportunities → โอกาสจากการพิสูจน์ผลใน Air4 (channel INTERNAL)
 *   b2bOpportunities → โอกาสขาย SaaS ให้ลูกค้าภายนอก (channel SAAS)
 *   b2cOpportunities → โอกาส Enterprise white-label (channel WHITELABEL)
 */
export function computeKpi(items: AnalyzedItem[], counts: PipelineCounts): Kpi {
  const has = (i: AnalyzedItem, c: 'INTERNAL' | 'SAAS' | 'WHITELABEL') =>
    i.affectedChannels.includes(c);

  return {
    totalCollected: counts.totalCollected,
    afterDedup: counts.afterDedup,
    afterPrefilter: counts.afterPrefilter,
    published: items.length,
    positive: items.filter((i) => i.classification === 'positive').length,
    neutral: items.filter((i) => i.classification === 'neutral').length,
    negative: items.filter((i) => i.classification === 'negative').length,
    highImpact: items.filter((i) => Math.abs(i.impactScore) >= 3).length,
    competitorAlerts: items.filter((i) => i.affectedCompetitors.length > 0).length,
    evRelated: items.filter((i) => i.newsCategory === 'AI_TECH').length,
    international: items.filter(
      (i) => !i.affectedCountries.includes('Thailand') && i.sourceCountry !== 'TH',
    ).length,
    oemOpportunities: items.filter((i) => has(i, 'INTERNAL') && i.classification === 'positive').length,
    b2bOpportunities: items.filter((i) => has(i, 'SAAS') && i.classification === 'positive').length,
    b2cOpportunities: items.filter((i) => has(i, 'WHITELABEL') && i.classification === 'positive').length,
    o1Supporting: items.filter((i) => i.okrImpact.O1 === 'positive').length,
    o2Supporting: items.filter((i) => i.okrImpact.O2 === 'positive').length,
    socialMentions: items.filter((i) => i.itemKind === 'social').length,
    demandSignals: items.filter((i) => i.itemKind === 'signal').length,
  };
}
