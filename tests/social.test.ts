import { describe, it, expect } from 'vitest';
import { extractPantipTopics, stripPantipHighlight } from '../src/collectors/social.js';
import { normalizeItems } from '../src/normalizers/item.js';
import type { RawItem } from '../src/types.js';

const nextData = (payload: unknown) =>
  `<html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(payload)}</script></body></html>`;

describe('Pantip — extract topics', () => {
  it('อ่านรายการกระทู้จาก __NEXT_DATA__ ได้', () => {
    const html = nextData({
      props: {
        pageProps: {
          data: { topics: [{ id: 1, title: 'ใช้ CRM ตัวไหนดีสำหรับทีมขาย', created_time: '2026-07-21T10:00:00Z' }] },
        },
      },
    });
    const topics = extractPantipTopics(html);
    expect(topics).toHaveLength(1);
    expect(topics[0].title).toBe('ใช้ CRM ตัวไหนดีสำหรับทีมขาย');
  });

  it('คืนอาเรย์ว่างเมื่อไม่มี __NEXT_DATA__ (โครงสร้างเว็บเปลี่ยน)', () => {
    expect(extractPantipTopics('<html><body>no data</body></html>')).toEqual([]);
  });

  it('คืนอาเรย์ว่างเมื่อ JSON เสีย ไม่โยน exception', () => {
    const html = '<script id="__NEXT_DATA__" type="application/json">{ broken</script>';
    expect(() => extractPantipTopics(html)).not.toThrow();
    expect(extractPantipTopics(html)).toEqual([]);
  });

  it('ไม่หลงไปเจออาเรย์อื่นที่ไม่ใช่กระทู้', () => {
    const html = nextData({ props: { menu: [{ label: 'หน้าแรก' }], data: { topics: [] } } });
    expect(extractPantipTopics(html)).toEqual([]);
  });
});

describe('Pantip — highlight markers', () => {
  it('ถอด {{em}}…{{eem}} ออกจากผลการค้นหา', () => {
    expect(stripPantipHighlight('{{em}}ใช้{{eem}}{{em}}CRM{{eem}}ตัวไหนดี')).toBe(
      'ใช้CRMตัวไหนดี',
    );
  });

  it('ไม่แตะข้อความที่ไม่มีเครื่องหมาย', () => {
    expect(stripPantipHighlight('ระบบ CRM สำหรับทีมขาย')).toBe('ระบบ CRM สำหรับทีมขาย');
  });
});

/**
 * บั๊กจริงที่เคยเกิด: หมายเหตุประกอบของกระทู้เคยมีคำค้นอยู่ในข้อความ ซึ่ง prefilter
 * ให้คะแนนจาก title + snippet ทำให้ทุกกระทู้จากคำค้นนั้นได้คะแนนเต็มโดยอัตโนมัติ
 * กระทู้ที่ไม่เกี่ยวข้องจึงหลุดเข้ามาด้วยคะแนนเต็ม จึงต้องใช้ snippet ที่เป็นกลาง
 */
describe('prefilter ต้องไม่ถูกปนเปื้อนจากคำค้นของเราเอง', () => {
  const item = (title: string, snippet: string): RawItem => ({
    title,
    link: 'https://pantip.com/topic/123',
    snippet,
    publishedAt: '2026-07-21T10:00:00Z',
    sourceId: 'pantip:CRM',
    sourceName: 'Pantip (ห้องเทคโนโลยี)',
    sourceTier: 3,
    sourceCountry: 'TH',
    language: 'th',
    unverified: true,
    itemKind: 'social',
  });

  const NEUTRAL_SNIPPET =
    'ความเห็นของผู้ใช้ทั่วไปบนเว็บบอร์ด ยังไม่ผ่านการตรวจสอบข้อเท็จจริง ใช้เป็นสัญญาณตลาดเท่านั้น';

  it('กระทู้ที่ไม่เกี่ยวข้องต้องไม่ผ่าน แม้จะมาจากห้องเทคโนโลยี', () => {
    const [n] = normalizeItems([item('รีวิวร้านกาแฟเปิดใหม่ย่านอารีย์', NEUTRAL_SNIPPET)]);
    expect(n.prefilterScore).toBeLessThan(8);
  });

  it('กระทู้เรื่อง CRM จริงต้องผ่าน', () => {
    const [n] = normalizeItems([item('ใช้ระบบ CRM ตัวไหนดีสำหรับทีมขาย', NEUTRAL_SNIPPET)]);
    expect(n.prefilterScore).toBeGreaterThanOrEqual(8);
    expect(n.matchedCategories).toContain('CRM_SALESTECH');
  });

  it('หมายเหตุประกอบต้องไม่มีคำที่ให้คะแนนอยู่ในตัวมันเอง', () => {
    const [n] = normalizeItems([item('วันนี้กินอะไรดี', NEUTRAL_SNIPPET)]);
    expect(n.prefilterScore).toBe(0);
  });

  it('ติดป้ายว่าเป็นโซเชียลและยังไม่ยืนยันเสมอ', () => {
    const [n] = normalizeItems([item('ใช้ระบบ CRM ตัวไหนดีสำหรับทีมขาย', NEUTRAL_SNIPPET)]);
    expect(n.itemKind).toBe('social');
    expect(n.unverified).toBe(true);
    expect(n.sourceTier).toBe(3);
  });
});
