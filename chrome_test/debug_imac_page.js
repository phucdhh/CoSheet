const CDP = require('chrome-remote-interface');

async function debugPage() {
    let client;
    try {
        client = await CDP({ host: 'localhost', port: 9222 });
        const { Page, Runtime } = client;

        await Page.enable();
        await Runtime.enable();

        console.log('Getting page info...');

        const pageInfo = await Runtime.evaluate({
            expression: `
                (function() {
                    return {
                        url: window.location.href,
                        title: document.title,
                        hasSocialCalc: typeof window.SocialCalc !== 'undefined',
                        hasTableEditor: !!document.getElementById('tableeditor'),
                        bodyClasses: document.body.className,
                        scriptTags: Array.from(document.scripts).map(s => s.src).slice(0, 10)
                    };
                })()
            `,
            returnByValue: true
        });

        console.log('Page Info:', JSON.stringify(pageInfo.result.value, null, 2));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (client) {
            await client.close();
        }
        process.exit();
    }
}

debugPage();
