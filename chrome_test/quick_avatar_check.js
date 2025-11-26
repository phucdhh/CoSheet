const puppeteer = require('puppeteer');

(async () => {
    console.log('=== Quick Avatar Component Check ===\n');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
    });

    const page = await browser.newPage();
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Capture console logs
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    try {
        const url = 'https://dulieu.truyenthong.edu.vn/test_avatar_check';
        console.log('Loading:', url);

        await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
        await delay(3000);

        // Check if components loaded
        const check = await page.evaluate(() => {
            return {
                animalNamesLoaded: typeof window.getAnimalName !== 'undefined',
                userAvatarsLoaded: typeof window.UserAvatars !== 'undefined',
                containerExists: !!document.getElementById('user-avatars-container'),
                containerHTML: document.getElementById('user-avatars-container')?.outerHTML.substring(0, 200),
                getUserColorExists: typeof SocialCalc?.getUserColor !== 'undefined',
                userColorsObj: typeof SocialCalc?._userColors !== 'undefined'
            };
        });

        console.log('\n=== Component Status ===');
        console.log('animal-names.js loaded:', check.animalNamesLoaded ? '✅' : '❌');
        console.log('user-avatars.js loaded:', check.userAvatarsLoaded ? '✅' : '❌');
        console.log('Container created:', check.containerExists ? '✅' : '❌');
        console.log('Color system ready:', check.getUserColorExists ? '✅' : '❌');

        if (check.containerHTML) {
            console.log('\nContainer HTML:', check.containerHTML);
        }

        // Check relevant console logs
        const relevantLogs = logs.filter(log =>
            log.includes('UserAvatars') || log.includes('animal') || log.includes('avatar')
        );

        if (relevantLogs.length > 0) {
            console.log('\nRelevant logs:');
            relevantLogs.forEach(log => console.log(' -', log));
        }

        if (check.animalNamesLoaded && check.userAvatarsLoaded && check.containerExists) {
            console.log('\n✅ All components loaded successfully!');
        } else {
            console.log('\n⚠️  Some components missing');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await browser.close();
    }
})();
