import { describe, it, expect } from 'vitest';
import { normalizeItems } from '../src/normalizers/item.js';
import { fallbackAnalyze } from '../src/analysis/fallback.js';
import { MOCK_NEWS } from './fixtures/mock-news.js';
import { env } from '../src/config.js';

/**
 * Regression guard for the scoring calibration.
 *
 * The prefilter is the cost gate and the false-positive gate at once, so the two
 * populations must stay separated: anything genuinely about the SaaS/CRM/AI
 * business scores well above the threshold, and a competitor name appearing in a
 * non-tech story scores zero. Retuning weights without re-running this is how
 * "Monday Night Football" ends up in a founder's morning briefing.
 */
describe('scoring separation', () => {
  const scored = normalizeItems(MOCK_NEWS).map((i) => ({
    item: i,
    analysis: fallbackAnalyze(i),
  }));

  const find = (fragment: string) => {
    const hit = scored.find((s) => s.item.title.includes(fragment));
    if (!hit) throw new Error(`fixture not found: ${fragment}`);
    return hit;
  };

  it('scores every false positive at exactly zero', () => {
    for (const fragment of ['Monday Night Football', 'Wise ประกาศค่าธรรมเนียม']) {
      const { item, analysis } = find(fragment);
      expect(item.prefilterScore).toBe(0);
      expect(analysis.relevanceScore).toBe(0);
      expect(item.hasAutomotiveContext).toBe(false);
    }
  });

  it('puts every genuinely relevant story above the AI gate', () => {
    const relevant = [
      'องค์กรไทยแห่ลงทุน AI CRM',
      'depa หนุน SME',
      'Southeast Asia B2B SaaS',
      'ยอดใช้จ่ายไอทีองค์กรทรงตัว',
      'รีวิวจากผู้ใช้: เลือก CRM',
      'Close CRM บุกตลาดไทย',
      'องค์กรตัดงบไอที',
      'Salesforce launches new AI CRM',
      'PDPA คุมเข้ม',
    ];
    for (const fragment of relevant) {
      const { item } = find(fragment);
      expect(
        item.prefilterScore,
        `"${fragment}" scored ${item.prefilterScore}, below the gate of ${env.prefilterMinScore}`,
      ).toBeGreaterThanOrEqual(env.prefilterMinScore);
    }
  });

  it('keeps a clear margin between the two populations', () => {
    const noise = scored.filter((s) => !s.item.hasAutomotiveContext);
    const signal = scored.filter((s) => s.item.hasAutomotiveContext);
    const worstSignal = Math.min(...signal.map((s) => s.item.prefilterScore));
    const bestNoise = Math.max(...noise.map((s) => s.item.prefilterScore));
    expect(bestNoise).toBeLessThan(worstSignal);
  });

  it('ranks the core competitor story among the highest', () => {
    const close = find('Close CRM บุกตลาดไทย');
    // A competitor moving on our core market must land in the top half of the pack.
    const higher = scored.filter((s) => s.item.prefilterScore > close.item.prefilterScore).length;
    expect(higher).toBeLessThan(scored.length / 2);
  });
});
