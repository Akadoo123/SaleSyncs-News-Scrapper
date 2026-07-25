import { describe, it, expect } from 'vitest';
import { prefilter } from '../src/analysis/prefilter.js';

const T2 = { sourceTier: 2 as const, sourceCountry: 'TH' };

describe('prefilter — relevance scoring', () => {
  it('scores a core CRM/sales-tech story highly', () => {
    const r = prefilter(
      'เปิดตัวระบบ CRM และซอฟต์แวร์การขายสำหรับธุรกิจ SME',
      'แพลตฟอร์มบริหารลูกค้าและระบบขายช่วยเพิ่มยอดขายให้ทีมขาย',
      T2,
    );
    expect(r.score).toBeGreaterThan(20);
    expect(r.categories).toContain('CRM_SALESTECH');
    expect(r.hasAutomotiveContext).toBe(true); // (ชื่อฟิลด์เดิม = "มีบริบทเทคโนโลยี")
  });

  it('scores an unrelated story near zero', () => {
    const r = prefilter('ราคาทองคำวันนี้ปรับตัวขึ้น 50 บาท', 'ตลาดทองคำในประเทศ', T2);
    expect(r.score).toBeLessThan(12);
    expect(r.hasAutomotiveContext).toBe(false);
  });

  it('drops hard-excluded noise entirely', () => {
    const r = prefilter('เลขเด็ดงวดนี้ หวยออกอะไร', 'ดูดวงประจำวัน', T2);
    expect(r.hardExcluded).toBe(true);
    expect(r.score).toBe(0);
  });

  it('boosts official Tier 1 sources', () => {
    const t1 = prefilter('ตลาดซอฟต์แวร์ธุรกิจเติบโต', '', { sourceTier: 1, sourceCountry: 'TH' });
    const t2 = prefilter('ตลาดซอฟต์แวร์ธุรกิจเติบโต', '', T2);
    expect(t1.score).toBeGreaterThan(t2.score);
  });

  it('penalises unverified Tier 3 sources', () => {
    const t3 = prefilter('ตลาดซอฟต์แวร์ธุรกิจเติบโต', '', { sourceTier: 3, sourceCountry: 'TH' });
    const t2 = prefilter('ตลาดซอฟต์แวร์ธุรกิจเติบโต', '', T2);
    expect(t3.score).toBeLessThan(t2.score);
  });

  it('flags press releases and sponsored content', () => {
    expect(prefilter('ข่าวประชาสัมพันธ์: เปิดตัวซอฟต์แวร์ CRM รุ่นใหม่', '', T2).isPressRelease).toBe(true);
    expect(prefilter('[Advertorial] ระบบ CRM น่าสนใจ', '', T2).isSponsored).toBe(true);
  });
});

describe('prefilter — competitor false-positive guard', () => {
  it('detects a competitor when tech context is present', () => {
    const r = prefilter(
      'Close CRM เปิดตัวบริการซอฟต์แวร์การขายราคาพิเศษ',
      'ผู้ให้บริการ CRM ประกาศลดราคาสำหรับธุรกิจ SME',
      T2,
    );
    expect(r.competitors).toContain('Close');
    expect(r.categories).toContain('COMPETITOR');
  });

  it('ignores "Monday" with no tech context at all', () => {
    const r = prefilter(
      'Monday Night Football breaks viewership records',
      'Record audiences tuned in for the primetime broadcast this season.',
      T2,
    );
    expect(r.competitors).toEqual([]);
  });

  it('ignores "Wise" when the story is about money transfer', () => {
    const r = prefilter(
      'Wise ประกาศค่าธรรมเนียมโอนเงินระหว่างประเทศแบบใหม่',
      'ผู้ให้บริการโอนเงินระหว่างประเทศประกาศโครงสร้างค่าธรรมเนียมใหม่ แลกเงิน',
      T2,
    );
    expect(r.competitors).toEqual([]);
  });

  it('does not match a competitor name inside a longer word', () => {
    const r = prefilter('Otherwise the software market remained flat', 'enterprise software', T2);
    expect(r.competitors).toEqual([]);
  });
});

describe('prefilter — brands and categories', () => {
  it('recognises priority platform brands', () => {
    const r = prefilter('Salesforce เปิดตัว AI CRM รุ่นใหม่', 'ระบบบริหารลูกค้า', T2);
    expect(r.brands).toContain('Salesforce');
    expect(r.categories).toContain('PLATFORM');
  });

  // Thai outlets sometimes write vendor names in Thai script.
  it('recognises brand names written in Thai', () => {
    expect(prefilter('ไมโครซอฟท์เปิดตัวฟีเจอร์ CRM ใหม่', '', T2).brands).toContain('Microsoft');
    expect(prefilter('กูเกิลเพิ่มเครื่องมือ AI สำหรับธุรกิจ', '', T2).brands).toContain('Google');
  });

  it('matches short Thai forms that outlets actually use', () => {
    expect(prefilter('แนะนำระบบ CRM สำหรับทีมขาย', '', T2).categories).toContain('CRM_SALESTECH');
    expect(prefilter('ปัญญาประดิษฐ์เปลี่ยนงานขาย', '', T2).categories).toContain('AI_TECH');
  });

  it('tags data-regulation stories', () => {
    const r = prefilter('PDPA คุมเข้มการใช้ข้อมูลลูกค้ากับ AI', 'คุ้มครองข้อมูลส่วนบุคคล', T2);
    expect(r.categories).toContain('DATA_REGULATION');
  });

  it('tags Thai digital / SME stories', () => {
    const r = prefilter('depa หนุน SME ไทยเปลี่ยนผ่านดิจิทัล', 'เศรษฐกิจดิจิทัลและซอฟต์แวร์ธุรกิจ', T2);
    expect(r.categories).toContain('THAI_DIGITAL');
  });
});
