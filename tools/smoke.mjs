// E2E 스모크: 실제 브라우저에서 부팅→7개 스캔→피날레 완료를 검증.
// 사용: `npm run smoke` (기본 URL은 SMOKE_URL 환경변수 또는 아래 기본값).
// 시스템 Chrome 사용(별도 다운로드 불필요). 개발 서버가 떠 있어야 함.
import { chromium } from 'playwright';

const URL = process.env.SMOKE_URL || 'http://localhost:5188/still-surface/';
const errs = [];
let browser;

function assert(cond, msg) { if (!cond) throw new Error('ASSERT: ' + msg); }

try {
  browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1000, height: 620 } });
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

  await page.goto(URL, { waitUntil: 'networkidle' });
  assert(await page.$('#bootStart'), 'boot button present');
  await page.click('#bootStart');
  await page.waitForTimeout(300);

  const arts = await page.evaluate(() => window.__ss().artifacts);
  assert(arts.length === 7, `7 artifacts (got ${arts.length})`);

  for (let i = 0; i < arts.length; i++) {
    const a = arts[i];
    await page.evaluate(([x, z]) => { window.__teleport(x - 3, z - 3); window.__lookAt(x, z); }, [a.x, a.z]);
    await page.waitForTimeout(50);
    await page.keyboard.down('KeyF');
    await page.waitForTimeout(2800);
    await page.keyboard.up('KeyF');
    await page.waitForTimeout(80);
    const s = await page.evaluate(() => window.__ss());
    assert(s.scanned === i + 1, `after scan ${i}: scanned=${s.scanned} expected ${i + 1}`);
  }

  const fin = await page.evaluate(() => window.__ss());
  assert(fin.status === 'complete', `status complete (got ${fin.status})`);
  assert(errs.length === 0, 'no page errors: ' + errs.join(' | '));

  console.log('SMOKE PASS — booted, scanned 7/7, status=complete, 0 errors');
  await browser.close();
  process.exit(0);
} catch (e) {
  console.error('SMOKE FAIL —', e.message);
  if (errs.length) console.error('page errors:', errs);
  if (browser) await browser.close();
  process.exit(1);
}
