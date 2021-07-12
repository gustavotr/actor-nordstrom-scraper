const Apify = require('apify');
const { hash, getProductUrl, log } = require('./tools');
const { EnumBaseUrl, EnumURLTypes } = require('./constants');

const parseMainPage = async ({ requestQueue, $ }) => {
    $('._18W94').each(async function () {
        const url = EnumBaseUrl.MAIN_URL + $(this).attr('href');
        const category = $(this).text();
        const type = EnumURLTypes.CATEGORY;
        await requestQueue.addRequest({ url, userData: { type, category } });
    });
};

const parseCategory = async ({ requestQueue, $, request }) => {
    $('article a').each(async function () {
        const url = EnumBaseUrl.MAIN_URL + $(this).attr('href');
        const type = EnumURLTypes.PRODUCT;
        if (!type) {
            log.error('URL does not match accepted patterns');
            return;
        }
        await requestQueue.addRequest({ url: getProductUrl(url), userData: { type } });
    });

    const nextPageUrl = $('._1ZIyZ._1MMVG a').attr('href');
    if (nextPageUrl) {
        const urlParams = new URLSearchParams(request.url.split('?')[1]);
        urlParams.set('page', nextPageUrl.split('=')[1]);
        urlParams.delete('origin');
        await requestQueue.addRequest({ url: `${EnumBaseUrl.SEARCH_URL}?${urlParams.toString()}`, userData: request.userData });
    }
};

const parseProduct = async ({ $, request, session, proxyConfiguration, userResult }) => {
    const productId = request.url.match(/(.+\/s\/.*\/)(\d+)(\/*.*)/)[2];

    const apiUrl = 'https://shop.nordstrom.com/api/recs';
    const searchParams = new URLSearchParams([
        ['page_type', 'product'],
        ['placement', 'PDP_1,PDP_2,FTR'],
        ['channel', 'web'],
        ['bound', '6,6,6'],
        ['apikey', 'fc9331b029725527fd30edde85e37ce7'],
        ['session_id', `${hash(4)}-${hash(2)}-${hash(2)}-${hash(2)}-${hash(6)}`],
        ['shopper_id', hash(16)],
        ['country_code', 'US'],
        ['currency_code', 'USD'],
        ['experiment_id', `${hash(4)}-${hash(2)}-${hash(2)}-${hash(2)}-${hash(6)}`],
        ['style_id', productId],
        ['url', request.url],
    ]);

    const url = `${apiUrl}?${searchParams.toString()}`;
    const requestOptions = {
        url,
        proxyUrl: proxyConfiguration.newUrl(session.id),
        abortFunction: () => false,
        json: true,
    };

    const { body } = await Apify.utils.requestAsBrowser(requestOptions);
    const apiProduct = body[2].SeedProduct;

    const name = apiProduct.Name;

    if (!name) {
        session.markBad();
        throw new Error('Could not get product info');
    }

    session.markGood();

    const brand = apiProduct.BrandLabelName;
    const rating = apiProduct.AverageRating;
    const prices = apiProduct.Prices;
    const price = prices.length ? prices[0].MinPrice : null;
    const salePrice = prices.length > 1 ? apiProduct.Prices[1] : null;
    const currency = apiProduct.CurrencyCode;
    const description = $('._26GPU').text();
    const sizes = [];
    const sizesDetail = [];
    const availableSizes = [];

    $('span._3s30g').each(function () {
        if ($(this).html().toLowerCase().match('size info')) {
            $(this).next('ul').find('li').each(function () {
                const text = $(this).text();
                if (text.match(/\w+=.+,?\s?/g)) {
                    const sizesInfo = text.split(',');
                    sizesInfo.forEach((sizeInfo) => {
                        const [size, info] = sizeInfo.split('=').map((str) => str.trim());
                        sizes.push(size);
                        sizesDetail.push({ size, info });
                        if (info > 0) {
                            availableSizes.push(size);
                        }
                    });
                }
            });
        }
    });

    const product = {
        id: productId,
        name,
        description,
        url: request.url,
        brand,
        rating,
        gender: apiProduct.Gender,
        price,
        salePrice,
        currency,
        sizes,
        availableSizes,
        scrapedAt: new Date().toISOString(),
        extra: {
            sizesDetail,
            apiProduct,
            peopleAlsoViewed: body[0].Products,
            boughtTogether: body[1].Products,
        },
    };

    Object.assign(product, userResult);

    if (apiProduct.Colors.length) {
        for (const color of apiProduct.Colors) {
            const colorVariant = {
                color: color.Name,
                images: color.Media.map((media) => `${EnumBaseUrl.IMG_URL}${media.Path}`),
            };
            await Apify.pushData({ ...product, ...colorVariant });
        }
    } else {
        await Apify.pushData(product);
    }
};

module.exports = {
    parseMainPage,
    parseCategory,
    parseProduct,
};
