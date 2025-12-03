const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log('[' + msg.type() + ']', text);
    if (msg.type() === 'error') errors.push(text);
  });
  
  page.on('pageerror', error => {
    console.error('[PAGE ERROR]', error.message);
    errors.push(error.message);
  });
  
  page.on('response', response => {
    if (!response.ok()) {
      console.log('[HTTP ERROR]', response.status(), response.url());
    }
  });
  
  console.log('Loading multi-view directly...');
  await page.goto('http://localhost:1234/=test123', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('\n=== ERRORS ===');
  errors.forEach(e => console.log('-', e));
  
  const html = await page.content();
  console.log('\n=== HTML LENGTH ===', html.length);
  console.log('\n=== BODY (first 500 chars) ===');
  console.log(html.substring(0, 500));
  
  await browser.close();
})();
