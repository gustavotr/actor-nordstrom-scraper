const Apify = require('apify');
const cheerio = require('cheerio');
const { parseMainPage, parseCategory, getUrlType, parseProduct, EnumURLTypes, stripUrl } = require('./tools');

const { log } = Apify.utils;
log.setLevel(log.LEVELS.DEBUG);

Apify.main(async () => {
    const input = await Apify.getInput();

    const { proxy, startUrls } = input;

    const requestQueue = await Apify.openRequestQueue();
    await Promise.all(startUrls.map((url) => {
        const type = getUrlType(url);
        requestQueue.addRequest({ url: stripUrl(url), userData: { type } });
    }));


    const crawler = new Apify.BasicCrawler({
        requestQueue,
        useSessionPool: true,
        maxRequestsPerCrawl: 50,

        handleRequestFunction: async ({ request, session }) => {
            log.info(`Processing ${request.url}...`);

            const requestOptions = {
                url: request.url,
                proxyUrl: Apify.getApifyProxyUrl({
                    groups: proxy.apifyProxyGroups,
                    session: session.id,
                }),
            };
            const { body } = await Apify.utils.requestAsBrowser(requestOptions);
            const $ = cheerio.load(body);

            const { type } = request.userData;
            log.debug('Type:', type);

            if (type === EnumURLTypes.START_URL) {
                log.debug('Start url...');
                await parseMainPage({ requestQueue, $, request, session });
            }

            if (type === EnumURLTypes.CATEGORY) {
                log.debug('Category url...');
                await parseCategory({ requestQueue, $, request, session });
            }

            if (type === EnumURLTypes.PRODUCT) {
                log.debug('Product url...');
                await parseProduct({ requestQueue, $, request, session, proxy });
            }
        },

        handleFailedRequestFunction: async ({ request }) => {
            console.log(`Request ${request.url} failed too many times`);
            await Apify.pushData(request.userData);
        },
    });

    await crawler.run();
});
