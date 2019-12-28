const Apify = require('apify');
const crypto = require('crypto');
const { BASE_URL, BASE_IMG_URL, EnumURLTypes } = require('./constants');

const { log } = Apify.utils;

const parseMainPage = async ({ requestQueue, $ }) => {
    $('._18W94').each(async function () {
        const url = BASE_URL + $(this).attr('href');
        const category = $(this).text();
        const type = EnumURLTypes.CATEGORY;
        await requestQueue.addRequest({ url: stripUrl(url), userData: { type, category } });
    });
};

const parseCategory = async ({ requestQueue, $ }) => {
    $('article a').each(async function () {
        const url = BASE_URL + $(this).attr('href');
        const type = EnumURLTypes.PRODUCT;
        if (!type) {
            log.error('URL does not match accepted patterns');
            return;
        }
        await requestQueue.addRequest({ url: stripUrl(url), userData: { type } });
    });
};

const hash = bytes => crypto.randomBytes(bytes).toString('hex');

const parseProduct = async ({ $, request, session, proxy }) => {
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

    const requestOptions = {
        url: `${apiUrl}?${searchParams.toString()}`,
        proxyUrl: Apify.getApifyProxyUrl({
            groups: proxy.apifyProxyGroups,
            session: session.id,
        }),
        abortFunction: () => false,
        json: true,
    };

    const { body } = await Apify.utils.requestAsBrowser(requestOptions);
    const apiProduct = body[2].SeedProduct;

    const productContext = $('#selling-essentials [itemtype="http://schema.org/Product"]');
    const brandContext = $('#selling-essentials [itemtype="http://schema.org/Brand"]');
    const name = $('h1[itemprop="name"]', productContext).text();

    if (!name) {
        session.markBad();
        throw new Error('Could not get product info');
    }

    session.markGood();

    const brand = $('span[itemprop="name"]', brandContext).text();
    const rating = apiProduct.AverageRating || Number($('[itemprop="ratingValue"]', productContext).text());
    const price = apiProduct.Prices[0].MinPrice || $('._3p7kp').text().match(/(\D+)(\d.+)/)[2];
    const salePrice = apiProduct.Prices[1].MinPrice;
    const currency = apiProduct.CurrencyCode || $('._3p7kp').text().match(/(\D+)(\d.+)/)[1].trim();
    const description = $('._26GPU').text();
    const sizes = [];
    const sizesCount = [];
    const availableSizes = [];

    $('span._3s30g').each(function () {
        if ($(this).html().toLowerCase().match('size info')) {
            $(this).next('ul').find('li').each(function () {
                const text = $(this).text();
                if (text.match(/\d+=\d+/g)) {
                    const sizesInfo = text.split(',');
                    sizesInfo.forEach((sizeInfo) => {
                        const [size, count] = sizeInfo.split('=').map(str => str.trim());
                        sizes.push(size);
                        sizesCount.push({ size, count });
                        if (count > 0) {
                            availableSizes.push(size);
                        }
                    });
                }
            });
        }
    });

    for (const color of apiProduct.Colors) {
        const product = {
            id: productId,
            name,
            brand,
            description,
            rating,
            price,
            gender: apiProduct.Gender,
            salePrice,
            color: color.Name,
            images: color.Media.map(media => `${BASE_IMG_URL}${media.Path}`),
            url: request.url,
            currency,
            sizes,
            availableSizes,
            sizesCount,
            apiProduct,
            peopleAlsoViewed: body[0].Products,
            boughtTogether: body[1].Products,
        };

        await Apify.pushData(product);
    }
};
const getUrlType = (url) => {
    let type = null;

    if (url.match(/shop\.nordstrom\.com\/*$/)) {
        type = EnumURLTypes.START_URL;
    }

    if (url.match(/shop\.nordstrom\.com\/s\/.+/)) {
        type = EnumURLTypes.PRODUCT;
    }

    if (url.match(/shop\.nordstrom\.com\/c\/.+/)) {
        type = EnumURLTypes.CATEGORY;
    }

    if (url.match(/shop\.nordstrom\.com\/brands\/.+/)) {
        type = EnumURLTypes.BRANDS;
    }
    return type;
};

const stripUrl = url => url.split('?')[0];

module.exports = {
    parseMainPage,
    parseCategory,
    parseProduct,
    getUrlType,
    EnumURLTypes,
    stripUrl,
};
