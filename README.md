### Nordstrom Scraper

Nordstrom Scraper is an [Apify actor](https://apify.com/actors) for extracting data about actors from [Nordstrom](https://shop.nordstrom.com/). It allows you to extract all products. It is build on top of [Apify SDK](https://sdk.apify.com/) and you can run it both on [Apify platform](https://my.apify.com) and locally.

- [Input](#input)
- [Output](#output)
- [Compute units consumption](#compute-units-consumption)
- [Extend output function](#extend-output-function)

### Input

| Field | Type | Description | Default value
| ----- | ---- | ----------- | -------------|
| startUrls | array | List of [Request](https://sdk.apify.com/docs/api/request#docsNav) objects that will be deeply crawled. The URL can be home page like `https://shop.nordstrom.com/` or category page `https://shop.nordstrom.com/c/womens-boots` or detail page `https://shop.nordstrom.com/s/born-uchee-knee-high-boot-regular-wide-calf/5243853/full`. | `["https://shop.nordstrom.com/"]`|
| maxItems | number | Maximum number of products that will be scraped | all found |
| extendOutputFunction | string | Function that takes a Cheerio handle ($) as argument and returns data that will be merged with the result output. More information in [Extend output function](#extend-output-function) | |
| proxyConfiguration | object | Proxy settings of the run. This actor works better with the Apify proxy group SHADER. If you have access to this Apify proxy group, leave the default settings. If not, you can use other Apify proxy groups or you can set `{ "useApifyProxy": false" }` to disable proxy usage | `{"useApifyProxy": true, "apifyProxyGroups": ["SHADER"] }`|

### Output

Output is stored in a dataset. Each item is an information about a product. Example:

```json
{
  "id": "4587969",
  "name": "Quarter Zip Wool Pullover",
  "brand": "NORDSTROM MEN'S SHOP",
  "description": "Add to BagSee Full Details",
  "rating": 4.7,
  "price": 85,
  "gender": "M",
  "salePrice": 50.98,
  "color": "BLACK CAVIAR",
  "images": [
    "https://n.nordstrommedia.com/imagegallery/store/product/zoom/4/_105793904.jpg",
    "https://n.nordstrommedia.com/imagegallery/store/product/zoom/13/_101176153.jpg"
  ],
  "url": "https://shop.nordstrom.com/s/nordstrom-mens-shop-quarter-zip-wool-pullover/4587969",
  "currency": "USD",
  "sizes": [],
  "availableSizes": [],
  "sizesCount": []
}
```

### Compute units consumption
Keep in mind that it is much more efficient to run one longer scrape (at least one minute) than more shorter ones because of the startup time.

The average consumption is **0.2 Compute unit for 1000 actor pages** scraped

### Extend output function

You can use this function to update the result output of this actor. This function gets a Cheerio handle `$` as an argument so you can choose what data from the page you want to scrape. The output from this will function will get merged with the result output.

The return value of this function has to be an object!

You can return fields to achive 3 different things:
- Add a new field - Return object with a field that is not in the result output
- Change a field - Return an existing field with a new value
- Remove a field - Return an existing field with a value `undefined`


```js
($) => {
    return {
        "saleEnd": $('.sale-ends span').text().trim(),
        "salePrice": 0,
        url: undefined
    }
}
```
This example will add a new field `saleEnd`, change the `salePrice` field and remove `url` field
```json
{
  "saleEnd": "Sale Ends 11/30/19",
  "categories": [
    "Jewelry & Accessories"
  ],
  "scrapedAt": "2019-11-28T03:26:00.887Z",
  "title": "Lightweight Giant Check Wool & Silk Scarf",
  "description": "Burberry's oblong scarf offers lightweight luxe with its sheer, gauzy fabrication.",
  "designer": null,
  "itemId": "3611219",
  "color": "Limestone",
  "price": 390,
  "salePrice": 0,
  "currency": "USD",
  "source": "www.bloomingdales.com",
  "brand": "Burberry",
  "images": [
    {
      "src": "https://images.bloomingdalesassets.com/is/image/BLM/products/9/optimized/10295289_fpx.tif"
    },
    {
      "src": "https://images.bloomingdalesassets.com/is/image/BLM/products/0/optimized/10295290_fpx.tif"
    }
  ],
  "composition": [
    "Wool/silk"
  ],
  "sizes": [],
  "availableSizes": []
}
```
