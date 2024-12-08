# Introduction
This is a coding challenge to demonstrate the ability to complete the following tasks:
- Query the Shopify GraphQL API by product name.
- From the retrieved Shopify products, sort the output in ascending order based on price
- Print the results as sorted

It is recommended to use the [Shopify GraphQL API](https://shopify.dev/docs/api/admin-graphql).

# Installation and setup
To install this project, clone the repository and execute the following command from the root project directory:
`npm install`

This project leverages environment variables collected from a .env file in the root directory.
The required envirenment variables are as follows, please replace the values with your own.

```
STORE_DOMAIN=some-domain.myshopify.com
STOREFRONT_TOKEN=123abc
API_VERSION=2024-10
```

# Usage
To search through your Shopify store for matching products, use the --name flag in conjunction with a provided search strig and pass to the command executed:
`node app.js --name "{some search string, E.g. 'shirt'}"`

Provided that there are products in your store, you will find output resembling the following:
```
❯ node app.js --name "shirt"
A shirt - 3 / black - price $15.00
A shirt - 3 / white - price $15.00
A shirt - 3 / red - price $15.00
A shirt - 3 / blue - price $15.00
A shirt - 2 / black - price $25.00
A shirt - 2 / white - price $25.00
A shirt - 2 / red - price $25.00
A shirt - 2 / blue - price $25.00
A shirt - 5 / black - price $30.00
A shirt - 5 / white - price $30.00
A shirt - 5 / red - price $30.00
A shirt - 5 / blue - price $30.00
A shirt - 4 / black - price $35.00
A shirt - 4 / white - price $35.00
A shirt - 4 / red - price $35.00
A shirt - 4 / blue - price $35.00
```

P.s. hire me
