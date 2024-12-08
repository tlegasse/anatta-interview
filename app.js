import 'dotenv/config'
import '@shopify/shopify-api/adapters/node'
import {createStorefrontApiClient} from '@shopify/storefront-api-client';
import nodeFetch from 'node-fetch';

const apiVersion = "2024-10"
const PRODUCT_LIMIT = 250
const VARIANT_LIMIT = 250
const CURRENCY_SYMBOLS = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'CAD': 'C$',
  'AUD': 'A$',
  'CNY': '¥',
  'INR': '₹',
  'NZD': 'NZ$',
  'CHF': 'Fr.',
  'HKD': 'HK$',
  'SGD': 'S$',
  'SEK': 'kr',
  'KRW': '₩',
  'BRL': 'R$',
  'RUB': '₽',
  'ZAR': 'R',
  'MXN': 'Mex$',
  'PLN': 'zł',
  'THB': '฿'
};

function getNameArg() {
    const nameFlagIndex = process.argv.findIndex(arg => arg == '--name')

    if (nameFlagIndex < 0) {
        throw new Error("Name flag could not be found")
    }

    const nameVal = process.argv[nameFlagIndex + 1]

    if (!nameVal || nameVal.startsWith('--')) {
        throw new Error("Name value could not be found")
    }

    return nameVal.trim()
}

function getEnv() {
    const env = process.env

    if (!env.STORE_DOMAIN) {
        throw new Error('STORE_DOMAIN environment variable is required.')
    }

    if (!env.ADMIN_TOKEN) {
        throw new Error('STORE_DOMAIN environment variable is required.')
    }

    if (!env.STOREFRONT_TOKEN) {
        throw new Error('STORE_DOMAIN environment variable is required.')
    }

    return {
        STORE_DOMAIN: env.STORE_DOMAIN,
        ADMIN_TOKEN: env.ADMIN_TOKEN,
        STOREFRONT_TOKEN: env.STOREFRONT_TOKEN
    }
}

function setupGraphQlClient(env) {
    return createStorefrontApiClient({
        apiVersion: apiVersion,
        storeDomain: env.STORE_DOMAIN,
        publicAccessToken: env.STOREFRONT_TOKEN,
        CustomFetchApi: nodeFetch
    });
}

async function getProductData(client, name) {
    const productQuery = `
        query getProducts($searchQuery: String!) {
            products(first: ${PRODUCT_LIMIT}, query: $searchQuery) {
                edges {
                    node {
                        title
                        variants(first: ${VARIANT_LIMIT}) {
                            edges {
                                node {
                                    id
                                    title
                                    priceV2 {
                                        amount
                                        currencyCode
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    `;

    const {data, errors, extensions} = await client.request(productQuery, {
        variables: {
            searchQuery: `title:${name}*`,
        },
    });

    if (errors?.graphQLErrors) {
        throw new Error(
            `GraphQL Errors: ${errors.graphQLErrors.map(e => e.message).join(', ')}`
        )
    }

    return data
}

function getFormattedProductData(productData) {
    const formattedProductData = []

    for (const product of productData.products.edges) {
        for (const variant of product.node.variants.edges) {
            formattedProductData.push({
                title: product.node.title + " - " + variant.node.title,
                price: parseFloat(variant.node.priceV2.amount),
                currencyCode: variant.node.priceV2.currencyCode
            })
        }
    }
    
    return formattedProductData
}

function sortProductData(formattedProductData) {
    return [...formattedProductData].sort((a, b) => a.price - b.price);
}

function getCurrencySymbol(currencyCode) {
    return CURRENCY_SYMBOLS[currencyCode] || "$"
}

function displayProductData(productData, name) {
    if (!productData.length) {
        console.log(`No prouduct data was found for the search string: ${name}`)
        return
    }

    for (const product of productData) {
        console.log(`${product.title} - price ${getCurrencySymbol(product.currencyCode)}${product.price}`)
    }
}

async function main() {
    try {
        const name = getNameArg()
        const env = getEnv()
        const graphQlClient = setupGraphQlClient(env)

        const productData = await getProductData(graphQlClient, name)
        const formattedProductData = getFormattedProductData(productData)
        const sortedProductData = sortProductData(formattedProductData)

        displayProductData(sortedProductData, name)

    } catch(e) {
        console.error(`Error: ${e.message}`)
        process.exit(1)
    }
}

main()
