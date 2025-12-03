const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('[CONSOLE]', msg.text()));
  page.on('pageerror', err => console.log('[ERROR]', err.message));
  
  console.log('Loading multi-view page...');
  await page.goto('http://localhost:1234/=6bg25g8h1xy', {
    waitUntil: 'networkidle2',
    timeout: 10000
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  const result = await page.evaluate(() => {
    return {
      tabCount: document.querySelectorAll('.tab').length,
      bodyLength: document.body.innerText.length,
      bodyText: document.body.innerText.substring(0, 500),
      hasReactRoot: !!document.getElementById('react-root'),
      html: document.body.innerHTML.substring(0, 1000)
    };
  });
  
  console.log('\n=== RENDER RESULT ===');
  console.log('Tab count:', result.tabCount);
  console.log('Body length:', result.bodyLength);
  console.log('Has React root:', result.hasReactRoot);
  console.log('Body text:', result.bodyText);
  console.log('\nHTML sample:', result.html);
  
  await browser.close();
})();
