const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[CONSOLE ERROR]', msg.text());
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.message);
    errors.push(err.message);
  });
  
  page.on('requestfailed', request => {
    console.log('[FAILED REQUEST]', request.url(), request.failure().errorText);
  });
  
  await page.goto('http://localhost:1234/=6bg25g8h1xy', {
    waitUntil: 'networkidle2',
    timeout: 10000
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  const scripts = await page.evaluate(() => {
    return Array.from(document.scripts).map(s => ({
      src: s.src,
      loaded: !s.async || s.readyState === 'complete'
    }));
  });
  
  console.log('\n=== SCRIPTS ===');
  console.log(JSON.stringify(scripts, null, 2));
  
  console.log('\n=== TOTAL ERRORS:', errors.length);
  
  await browser.close();
})();
