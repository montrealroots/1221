import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: 1280, height: 950 } });
p.on('pageerror', e => console.log('PAGE ERROR:', String(e).slice(0,160)));
await p.goto('http://localhost:4173', { waitUntil: 'networkidle' });
await p.waitForTimeout(3500);
const click = async (re, tag) => { const el = p.getByRole('button', { name: re }).first();
  if (await el.count()) { await el.click().catch(()=>{}); await p.waitForTimeout(700); return true; }
  if (tag) console.log('   (no button for', tag, ')');
  return false; };
await click(/new (save|game)|start|empty slot|create/i);
await click(/^(actor|actress)$/i);
for (let i=0;i<6;i++) await click(/^(next|continue)/i);
await click(/it.s time to be great|begin|start save/i);
await p.waitForTimeout(3000);
const toggle = p.getByRole('button', { name: /toggle navigation/i }).first();
if (await toggle.count()) { await toggle.click().catch(()=>{}); await p.waitForTimeout(400); }
await p.locator('nav.rail .rail-item', { hasText: 'Family Business' }).first().click().catch(()=>{});
await p.waitForTimeout(1500);
await click(/^got it$/i);

const score = async () => (await p.locator('text=/\\d\\/9/').first().innerText().catch(()=>'?'));
console.log('doors at start:', await score());

// Open every "What's Missing" then press whatever control it offers.
for (let round = 1; round <= 6; round += 1) {
  const chips = await p.getByRole('button', { name: /what.s missing/i }).all();
  console.log(`\nround ${round}: ${chips.length} shut doors`);
  if (!chips.length) break;
  for (const chip of chips) { await chip.click().catch(()=>{}); await p.waitForTimeout(220); }
  await p.waitForTimeout(400);
  const labels = ['Register With', 'Form The American Arm', 'Sign With', 'Bind ', 'Fill The Post', 'Take An Option'];
  for (const lab of labels) {
    for (let i = 0; i < 6; i += 1) {
      const btn = p.getByRole('button', { name: new RegExp('^' + lab, 'i') }).first();
      if (!(await btn.count())) break;
      const text = await btn.innerText().catch(()=>lab);
      await btn.click().catch(()=>{});
      await p.waitForTimeout(650);
      console.log('   pressed:', text.slice(0,44));
      const err = await p.locator('.negative').allInnerTexts().catch(()=>[]);
      if (err.length) console.log('      error:', err[0].slice(0,90));
    }
  }
  console.log('   doors now:', await score());
}
await p.screenshot({ path: '/tmp/shots2/doors.png' });
console.log('\nfinal:', await score());
await b.close();
