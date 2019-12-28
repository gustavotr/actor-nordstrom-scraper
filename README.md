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
| searh | string | Keyword that will be used to search Nordstrom`s products |  |
| extendOutputFunction | string | Function that takes a Cheerio handle ($) as argument and returns data that will be merged with the result output. More information in [Extend output function](#extend-output-function) | |
| proxyConfiguration | object | Proxy settings of the run. This actor works better with the Apify proxy group SHADER. If you have access to this Apify proxy group, leave the default settings. If not, you can use other Apify proxy groups or you can set `{ "useApifyProxy": false" }` to disable proxy usage | `{"useApifyProxy": true, "apifyProxyGroups": ["SHADER"] }`|

### Output

Output is stored in a dataset. Each item is an information about a product. Example:

```json
{
  "id": "5537945",
  "name": "North Shore Thermal Knit Tunic Top",
  "description": "Comfortably oversized with exposed seaming, this cozy knit tunic is perfect for activities ranging from long beach walks to lounging with intent.",
  "url": "https://shop.nordstrom.com/s/free-people-north-shore-thermal-knit-tunic-top/5537945/full",
  "brand": "FREE PEOPLE",
  "rating": 3.2,
  "color": "CORAL",
  "gender": "F",
  "price": 68,
  "salePrice": 40.8,
  "currency": "USD",
  "images": [
    "https://n.nordstrommedia.com/imagegallery/store/product/zoom/7/_106001567.jpg",
    "https://n.nordstrommedia.com/imagegallery/store/product/zoom/17/_106005937.jpg"
  ],
  "sizes": [
    "XS",
    "S",
    "M",
    "L"
  ],
  "availableSizes": [],
  "scrapedAt": "2019-12-28T16:09:51.368Z",
  "extra": {
    "sizesDetail": [
      {
        "size": "XS",
        "info": "0-2"
      },
      {
        "size": "S",
        "info": "4-6"
      },
      {
        "size": "M",
        "info": "8-10"
      },
      {
        "size": "L",
        "info": "12-14."
      }
    ]
  }
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
        saleEnd: $('._3p7kp').text().trim(),
        salePrice: 0,
        url: undefined
    }
}
```
This example will add a new field `saleEnd`, change the `salePrice` field and remove `url` field
```json
{
  "id": "5537945",
  "name": "North Shore Thermal Knit Tunic Top",
  "description": "Comfortably oversized with exposed seaming, this cozy knit tunic is perfect for activities ranging from long beach walks to lounging with intent.",
  "brand": "FREE PEOPLE",
  "rating": 3.2,
  "color": "CORAL",
  "gender": "F",
  "price": 68,
  "salePrice": 0,
  "currency": "USD",
  "images": [
    "https://n.nordstrommedia.com/imagegallery/store/product/zoom/7/_106001567.jpg",
    "https://n.nordstrommedia.com/imagegallery/store/product/zoom/17/_106005937.jpg"
  ],
  "sizes": [
    "XS",
    "S",
    "M",
    "L"
  ],
  "availableSizes": [],
  "scrapedAt": "2019-12-28T16:09:51.368Z",
  "extra": {
    "sizesDetail": [
      {
        "size": "XS",
        "info": "0-2"
      },
      {
        "size": "S",
        "info": "4-6"
      },
      {
        "size": "M",
        "info": "8-10"
      },
      {
        "size": "L",
        "info": "12-14."
      }
    ]
  },
  "saleEnd": "$40.8"
}
```
