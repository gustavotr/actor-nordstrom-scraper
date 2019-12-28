const Apify = require('apify');
const crypto = require('crypto');
const { EnumBaseUrl, EnumURLTypes } = require('./constants');

const { log } = Apify.utils;
log.setLevel(log.LEVELS.DEBUG);

const getProductUrl = (url) => {
    const productUrl = url.match(/(.+\/s\/.*\/\d+)(\/*.*)/);
    return `${productUrl[1]}/full`;
};

const getSearchUrl = (keyword) => {
    const params = new URLSearchParams([
        ['origin', 'keywordsearch'],
        ['keyword', keyword],
    ]);
    return `${EnumBaseUrl.SEARCH_URL}?${params.toString()}`;
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
    if (url.match(/shop\.nordstrom\.com\/sr\?.+/)) {
        type = EnumURLTypes.SEARCH;
    }
    return type;
};

const hash = bytes => crypto.randomBytes(bytes).toString('hex');

const isObject = val => typeof val === 'object' && val !== null && !Array.isArray(val);

const stripUrl = url => url.split('?')[0];

module.exports = {
    getProductUrl,
    getSearchUrl,
    getUrlType,
    hash,
    isObject,
    stripUrl,
    log,
};
