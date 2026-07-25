# SaleSync — Daily AI & SaaS Market Intelligence

ระบบข่าวกรองตลาดอัตโนมัติสำหรับ **SaleSync** — B2B2C AI CRM (Revenue OS)
ที่พิสูจน์ผลในธุรกิจ Air4 แล้วขยายเป็น vertical SaaS

ทุกวันเวลา 08:00 น. (Asia/Bangkok) ระบบจะ **ดึง → คัดกรอง → วิเคราะห์ → สรุป** ข่าวที่เกี่ยวข้อง
แล้วอัปเดต **Executive Dashboard ภาษาไทยแบบหน้าเดียว**

โฟกัสข่าว: **AI / Generative AI · SaaS / cloud · CRM & sales-tech · กฎเกณฑ์ข้อมูล/AI (PDPA, AI Act)
· คู่แข่ง · แพลตฟอร์มใหญ่ · เศรษฐกิจดิจิทัลไทย/SME · การระดมทุน** — ทั้งในไทยและต่างประเทศ

> โครงสร้างระบบ clone มาจาก Air4 News Scrap (ข่าวยานยนต์) แล้วดัดแปลงเลเยอร์ธุรกิจให้เป็น SaleSync
> รายละเอียดการแมปชื่อภายในดูใน `CLAUDE.md`

---

## 1. ระบบนี้ทำอะไร

| ขั้นตอน | รายละเอียด |
|---|---|
| **ดึงข่าว** | RSS/Atom (Blognone, Techsauce, TechCrunch, The Verge, VentureBeat, e27, ฯลฯ) + Google News RSS 5 ภูมิภาค + Pantip (+ NewsAPI ถ้ามี key) |
| **คัดกรอง** | ให้คะแนนความเกี่ยวข้องด้วยกฎก่อนส่งเข้า AI (คุมต้นทุน + กัน False Positive) |
| **ตัดข่าวซ้ำ** | 4 สัญญาณ: canonical URL, content hash, ความคล้ายชื่อข่าว, ความคล้ายเนื้อหา |
| **วิเคราะห์** | AI ให้คะแนนผลกระทบต่อธุรกิจ (−5 ถึง +5), ความเชื่อมั่น, ช่องทาง/ผลิตภัณฑ์ที่กระทบ, OKR |
| **สรุปรายวัน** | บทสรุปผู้บริหาร, โอกาส, ความเสี่ยง, สิ่งที่ควรทำ, คำถามเชิงกลยุทธ์ |
| **แสดงผล** | Dashboard ภาษาไทย พร้อม Filter, Search, Drawer รายละเอียด, กราฟ, ข้อมูลย้อนหลัง |

**จุดสำคัญ:** ระบบจัดประเภทข่าวตาม **ผลกระทบต่อธุรกิจ SaleSync** ไม่ใช่ตามน้ำเสียงของข่าว
เช่น ข่าว "PDPA คุมเข้มการใช้ AI กับข้อมูลลูกค้า" มีทั้งด้านลบ (ต้นทุน compliance)
และด้านบวก (SaleSync ที่ compliant กลายเป็นจุดขาย) — ระบบประเมินผลกระทบสุทธิก่อนตัดสิน

---

## 2. เป้าหมายองค์กร (OKRs) ที่ระบบใช้เป็นเลนส์

- **O1 — พิสูจน์ผลใน Air4:** เพิ่มรายได้ Air4 ≥ 5% (reorder + ปลุกบัญชี dormant), payback ~0.3 ปี
- **O2 — ขยายเป็น vertical SaaS ภายนอก:** ได้ลูกค้าภายนอก 2–3 รายภายใน 12 เดือน (เป้า Year-3 ARR 15–50M)

---

## 3. วิธีติดตั้ง

```bash
npm install               # ต้องมี Node.js 20 ขึ้นไป
cp .env.example .env       # Windows PowerShell: Copy-Item .env.example .env
npm run mock              # ทดสอบด้วยข้อมูลจำลอง (ไม่แตะเครือข่าย ไม่เสียค่า AI)
npm run serve             # เปิด Dashboard → http://localhost:4173
```

**ระบบทำงานได้ครบทุกฟังก์ชันโดยไม่ต้องมี API key** — จะใช้การวิเคราะห์ด้วยกฎแทน
(คุณภาพต่ำกว่า และ `confidence` ไม่เกิน 75%) ใส่ `ANTHROPIC_API_KEY` ใน `.env` เพื่อใช้ AI

### Environment Variables หลัก (ดูครบใน `.env.example`)

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | ถ้าไม่ใส่ใช้กฎอัตโนมัติแทน |
| `AI_MODEL` | `claude-opus-4-8` | เปลี่ยนเป็น `claude-sonnet-5` เพื่อลดต้นทุน |
| `LOOKBACK_HOURS` | `48` | ช่วงเวลาย้อนหลังที่รับข่าว |
| `MIN_RELEVANCE_SCORE` | `40` | ต่ำกว่านี้ไม่แสดงบน Dashboard |
| `PREFILTER_MIN_SCORE` | `8` | ต่ำกว่านี้ไม่ส่งเข้า AI (ประตูคุมต้นทุน) |
| `TIMEZONE` | `Asia/Bangkok` | เขตเวลาของรายงาน |

---

## 4. วิธีปรับแต่ง (แก้ YAML ไม่ต้องแตะโค้ด แล้วรัน `npm test`)

- **แหล่งข่าว →** `config/sources.yaml` (ตรวจ URL ด้วย `npx tsx scripts/check-feeds.ts` ก่อนเสมอ)
- **คีย์เวิร์ด/น้ำหนัก →** `config/keywords.yaml` (หมวด: AI_TECH, CRM_SALESTECH, SAAS_CLOUD, DATA_REGULATION, THAI_DIGITAL, FUNDING_MACRO)
- **คู่แข่ง →** `config/competitors.yaml` (Salesforce, HubSpot, Zoho, monday.com, Close, BuzzeBees, Venio, Wisible ฯลฯ — ชื่อที่กำกวมตั้ง `ambiguous: true`)
- **ประเทศ →** `config/countries.yaml`
- **บริบทธุรกิจ/OKR →** `config/business-context.yaml`

> ⚠️ อย่าใส่คำกว้างเกิน (ลูกค้า/ธุรกิจ/sales) ใน `automotive_context` (= "บริบทเทคโนโลยี")
> เพราะจะทำให้ข่าวทั่วไปผ่านประตูคัดกรอง — มีเทสต์ `tests/separation.test.ts` คุมไว้

---

## 5. วิธีรันด้วยมือ

```bash
npm run daily              # รันเต็มระบบ (ดึง + วิเคราะห์ + บันทึก)
npm run daily -- --no-ai   # รันโดยไม่ใช้ AI (ไม่มีค่าใช้จ่าย)
npm run daily -- --dry-run # รันโดยไม่บันทึกลงดิสก์
npm run collect            # ดึงข่าว + ตรวจสุขภาพแหล่งข่าว
npm run build:standalone   # รวมรายงานเป็นไฟล์ HTML ไฟล์เดียว (ส่งอีเมลได้)
npm test                   # เทสต์ทั้งหมด (155 เทสต์)
```

---

## 6. ตั้งเวลารันอัตโนมัติทุกวัน 08:00 น.

**Windows Task Scheduler** — ชื่องาน `SaleSyncDailyIntelligence`

```powershell
.\scripts\windows-task-scheduler.ps1 -Install     # ติดตั้ง (ระดับผู้ใช้ ไม่ต้องเป็น Admin)
.\scripts\windows-task-scheduler.ps1 -Status      # ดูสถานะ / เวลารันครั้งถัดไป
.\scripts\windows-task-scheduler.ps1 -RunNow      # สั่งรันทันทีเพื่อทดสอบ
.\scripts\windows-task-scheduler.ps1 -Uninstall   # ถอนการติดตั้ง
```

Log อยู่ที่ `logs\daily.log` (หมุนไฟล์อัตโนมัติเมื่อเกิน 5 MB)

**ข้อควรรู้**
- งานเป็นระดับผู้ใช้ → รันเมื่อผู้ใช้ล็อกอินค้างไว้ (ใช้ `-Install -Elevated` เพื่อรันแม้ไม่ล็อกอิน — ต้อง Run as Administrator)
- ตั้งค่าให้ **รันได้แม้ใช้แบตเตอรี่** และ **ตื่นจาก sleep มารันเอง** (`-WakeToRun`) แล้ว
- เครื่องปิดสนิทตอน 08:00 → จะรันให้ทันทีที่เปิดเครื่อง (`StartWhenAvailable`)

**ทางเลือก GitHub Actions** — `.github/workflows/daily-intelligence.yml` พร้อมแล้ว
(cron `0 1 * * *` UTC = 08:00 น. ไทย) แต่ต้อง `git init` + push ขึ้น GitHub + ใส่ `ANTHROPIC_API_KEY` ใน Secrets ก่อน

---

## 7. โครงสร้างโปรเจกต์

```
salesync-intelligence/
├── CLAUDE.md                    คู่มือสำหรับ AI agent (มีตารางการแมปชื่อภายใน)
├── README.md
├── config/                      ปรับแต่งได้โดยไม่ต้องแก้โค้ด
│   ├── business-context.yaml    บริบท SaleSync, ช่องทาง, ผลิตภัณฑ์, OKRs
│   ├── sources.yaml             แหล่งข่าว (RSS + Google News + Pantip)
│   ├── keywords.yaml            คีย์เวิร์ด/น้ำหนัก/แพลตฟอร์ม
│   ├── competitors.yaml         คู่แข่งและกฎกัน False Positive
│   └── countries.yaml           ตลาดเป้าหมาย
├── prompts/                     Prompt ของ AI
├── src/                         collectors / normalizers / dedupe / analysis / ai / storage
├── public/                      Dashboard (static — deploy โฟลเดอร์นี้)
├── scripts/                     คำสั่งผู้ดูแล + windows-task-scheduler.ps1 + run-daily.cmd
├── tests/                       155 เทสต์
└── .github/workflows/           Schedule + Deploy
```

---

## 8. ข้อจำกัด

1. ระบบเห็นเฉพาะหัวข้อ + เนื้อหาย่อจาก RSS ไม่ใช่บทความเต็ม
2. บทวิเคราะห์คือการตีความ ไม่ใช่ข้อเท็จจริง — ตรวจข่าวต้นฉบับก่อนตัดสินใจสำคัญ
3. ฟีดข่าวเปลี่ยน URL บ่อย — ควรรัน `check-feeds.ts` เป็นระยะ (แหล่งที่ตายจะถูกข้ามโดยไม่ล้มทั้งระบบ)
4. เก็บเฉพาะ metadata + snippet สั้น เคารพ robots.txt ไม่ข้าม Paywall และลิงก์กลับต้นฉบับเสมอ

## License

Internal use — SaleSync
