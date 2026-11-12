const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const fixture = process.env.STUDYAPP_WRITER_FIXTURE;
  const chrome = process.env.STUDYAPP_TEST_CHROME;
  if (!fixture || !chrome) throw new Error('Set STUDYAPP_WRITER_FIXTURE and STUDYAPP_TEST_CHROME');
  const browser = await chromium.launch({ headless:true, executablePath:chrome });
  try {
    const context = await browser.newContext({viewport:{width:1600,height:1000}});
    const page = await context.newPage();
    page.on('dialog', dialog => dialog.accept());
    await page.goto('http://127.0.0.1:8767/#/workspace-beta');
    await page.getByRole('link',{name:/Settings|Ρυθμίσεις/}).first().click();
    const frame = page.frameLocator('iframe[name=studyapp-workspace-info-modal]');
    await frame.getByLabel(/Application folder|Φάκελος εφαρμογής/).fill(fixture);
    await frame.getByRole('button',{name:/Save folder|Αποθήκευση φακέλου/}).click();
    await page.getByRole('dialog').getByRole('button',{name:/Close|Κλείσιμο/}).click();
    const marker = path.join(fixture, 'started.txt');
    const previous = fs.existsSync(marker) ? fs.statSync(marker).mtimeMs : 0;
    await page.getByRole('button',{name:/Writer & Translator/}).click();
    await page.getByText(/Writer start requested|Ζητήθηκε η εκκίνηση/).waitFor();
    for (let i=0; i<50 && (!fs.existsSync(marker) || fs.statSync(marker).mtimeMs <= previous); i++) await new Promise(r=>setTimeout(r,100));
    if (!fs.existsSync(marker) || fs.statSync(marker).mtimeMs <= previous) throw new Error('Fixture process did not start');
    console.log('StudyApp settings → Tools → local fixture launch: PASS');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
