const Apify = require('apify');

const { log } = Apify.utils;

const EnumURLTypes = {
    PRODUCT: 'product',
    CATEGORY: 'category',
    START_URL: 'startUrl',
    BRANDS: 'brands ',
};

const BASE_URL = 'https://shop.nordstrom.com';

const parseMainPage = async ({ requestQueue, $ }) => {
    $('._18W94').each(async function () {
        const url = BASE_URL + $(this).attr('href');
        const category = $(this).text();
        const type = EnumURLTypes.CATEGORY;
        await requestQueue.addRequest({ url: stripUrl(url), userData: { type, category } });
    });
};

const parseCategory = async ({ requestQueue, $, request }) => {
    const { category } = request.userData;
    $('article a').each(async function () {
        const url = BASE_URL + $(this).attr('href');
        const type = EnumURLTypes.PRODUCT;
        await requestQueue.addRequest({ url: stripUrl(url), userData: { type, category } });
    });
};

const getColorInfo = el => ({
    name: el.attr('alt').replace(/(selected|color)/g, '').trim(),
    img: stripUrl(el.attr('src')),
});

const parseProduct = async ({ requestQueue, $, request, session }) => {
    const productContext = $('#selling-essentials [itemtype="http://schema.org/Product"]');
    const brandContext = $('#selling-essentials [itemtype="http://schema.org/Brand"]');
    const name = $('h1[itemprop="name"]', productContext).text();

    if (!name) {
        session.markBad();
        throw new Error('Could not get product info');
    }

    session.markGood();

    const brand = $('span[itemprop="name"]', brandContext).text();
    const rating = $('[itemprop="ratingValue"]', productContext).text();
    const salePrice = $('._3p7kp').text();
    const price = salePrice.match(/(\D+)(\d.+)/)[2];
    const currency = salePrice.match(/(\D+)(\d.+)/)[1].trim();
    const description = $('._26GPU').text();
    const colors = [];
    const sizes = [];

    $('._5yJth').next('._1LuCz').find('._1zgoP').each(function () {
        const size = $(this).text();
        sizes.push(size);
    });

    if ($('._1n5Su').length) {
        $('._1aALu li ._2fvOm').each(function () {
            colors.push(getColorInfo($(this)));
        });
    } else {
        colors.push(getColorInfo($('._1NWVA ._2fvOm')));
    }

    const { category } = request.userData;

    for (const color of colors) {
        const product = {
            name,
            brand,
            description,
            rating,
            price,
            salePrice,
            color: color.name,
            img: color.img,
            url: request.url,
            currency,
            sizes,
            category,
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
