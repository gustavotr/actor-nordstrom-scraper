const Apify = require('apify');

const { log } = Apify.utils;

const EnumURLTypes = {
    PRODUCT: 'product',
    CATEGORY: 'category',
    START_URL: 'startUrl',
    BRANDS: 'brands ',
};

const parseMainPage = ({ requestQueue, $, body }) => {
};

const parseCategory = ({ requestQueue, $, body, userData }) => {

};

const parseProduct = async ({ requestQueue, $, body, session }) => {
    const productContext = $('#selling-essentials [itemtype="http://schema.org/Product"]');
    const brandContext = $('#selling-essentials [itemtype="http://schema.org/Brand"]');
    const name = $('h1[itemprop="name"]', productContext).text();
    const brand = $('span[itemprop="name"]', brandContext).text();
    const rating = $('[itemprop="ratingValue"]', productContext).text();
    const price = $('._3p7kp').text();
    const description = $('._26GPU').text();
    const colors = [];

    if ($('._1n5Su').length) {
        $('._1aALu li').map(function () {
            colors.push($(this).text());
        });
    } else {
        colors.push($('._1NWVA span').text());
    }


    const product = {
        name,
        brand,
        description,
        rating,
        price,
        colors,
    };

    if (!product.name) {
        session.markBad();
        throw new Error('Could not get product info');
    }

    await Apify.pushData(product);
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
