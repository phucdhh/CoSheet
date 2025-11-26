const puppeteer = require('puppeteer');

(async () => {
    console.log('=== Testing Multi-User Avatars ===\n');

    const browser1 = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=800,600', '--window-position=0,0']
    });

    const browser2 = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=800,600', '--window-position=820,0']
    });

    const browser3 = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=800,600', '--window-position=0,650']
    });

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    try {
        const url = 'https://dulieu.truyenthong.edu.vn/test_avatars_' + Date.now();
        console.log('Opening room:', url);
        console.log('\n');

        // Open pages
        const page1 = await browser1.newPage();
        await page1.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
        console.log('✓ User 1 joined');
        await delay(2000);

        const page2 = await browser2.newPage();
        await page2.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
        console.log('✓ User 2 joined');
        await delay(2000);

        const page3 = await browser3.newPage();
        await page3.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
        console.log('✓ User 3 joined');
        await delay(3000);

        console.log('\n=== Checking User Avatars ===\n');

        // Check if avatars exist
        const avatarsExist = await page1.evaluate(() => {
            const container = document.getElementById('user-avatars-container');
            if (!container) return { exists: false };

            const avatars = container.querySelectorAll('.user-avatar');
            const badge = container.querySelector('.user-count-badge');

            return {
                exists: true,
                avatarCount: avatars.length,
                hasBadge: !!badge,
                badgeText: badge ? badge.textContent : null,
                containerVisible: container.style.display !== 'none'
            };
        });

        console.log('Avatars container:', avatarsExist);

        if (avatarsExist.exists && avatarsExist.avatarCount > 0) {
            console.log('✅ SUCCESS: User avatars are displayed!');
            console.log(`   ${avatarsExist.avatarCount} avatars visible`);
        } else {
            console.log('❌ FAILURE: Avatars not found');
        }

        // Let user see and interact
        console.log('\n👉 Check the browser windows!');
        console.log('   - Should see colored avatars in top-right');
        console.log('   - Click avatars to see dropdown');
        console.log('   - Select different cells to see colored borders');
        console.log('\nPress Ctrl+C to close...\n');

        // Keep browsers open
        await delay(300000); // 5 minutes

    } catch (error) {
        console.error('\n❌ Test error:', error.message);
    } finally {
        console.log('\nClosing browsers...');
        await browser1.close();
        await browser2.close();
        await browser3.close();
    }
})();
