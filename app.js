import 'dotenv/config'
import '@shopify/shopify-api/adapters/node'

import {createStorefrontApiClient} from '@shopify/storefront-api-client';

/*
 * typedef {{STORE_DOMAIN: string, ADMIN_TOKEN: string, STOREFRONT_TOKEN: string}} Env
 * typedef {{title: string, price: number, currencyCode: string} ProductVariant
 */

const API_VERSION = "2024-10"
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

/* 
 * Gets name arg from the --name flag.
 *
 * @return {string}
 *
 * @throws Will throw an error when --name flag isn't present
 * @throws Will throw an error when no name value proceeds --name flag
 */
function getNameArg() {
    const nameFlagIndex = process.argv.findIndex(arg => arg == '--name')

    if (nameFlagIndex < 0) {
        throw new Error("Please provide a --name value")
    }

    const nameVal = process.argv[nameFlagIndex + 1]

    if (!nameVal || nameVal.startsWith('--')) {
        throw new Error("--name flag present, but value could not be found")
    }

    return nameVal.trim()
}

/* 
 * Gets envirenment variables for required fields
 *
 * @return {Env}
 *
 * @throws an error per each if any field is missing
 */
function getEnv() {
    const env = process.env

    if (!env.STORE_DOMAIN) {
        throw new Error('STORE_DOMAIN environment variable is required.')
    }

    if (!env.ADMIN_TOKEN) {
        throw new Error('ADMIN_TOKEN environment variable is required.')
    }

    if (!env.STOREFRONT_TOKEN) {
        throw new Error('STOREFRONT_TOKEN environment variable is required.')
    }

    return {
        STORE_DOMAIN: env.STORE_DOMAIN,
        ADMIN_TOKEN: env.ADMIN_TOKEN,
        STOREFRONT_TOKEN: env.STOREFRONT_TOKEN
    }
}

/* 
 * Gets storefront API GraphQL client
 *
 * @param {Env}
 *
 * @return {object} representing the GraphQL client
 */
function setupGraphQlClient(env) {
    return createStorefrontApiClient({
        apiVersion: API_VERSION,
        storeDomain: env.STORE_DOMAIN,
        publicAccessToken: env.STOREFRONT_TOKEN
    });
}

/* 
 * Gets product data from Shopify query
 *
 * @param {object} GraphQL client
 * @param {string} search value from --name flag
 *
 * @throws GraphQL exception messages
 *
 * @return {object} data segment of the Shopify data query
 */
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

/* 
 * Formats an array of Shopify product variants' basic information
 *
 * @param {object} Product data as returned by Shopify
 *
 * @return {[ProductVariant]} formatted product information
 */
function formatProductData(productData) {
    const formattedProductData = []

    for (const product of productData.products.edges) {
        for (const variant of product.node.variants.edges) {
            formattedProductData.push({
                title: product.node.title + " - " + variant.node.title,
                price: parseFloat(variant.node.priceV2.amount).toFixed(2),
                currencyCode: variant.node.priceV2.currencyCode
            })
        }
    }
    
    return formattedProductData
}

/* 
 * Sorts formatted product data
 *
 * @param {[ProductVariant]} formatted product data
 *
 * @return {[ProductVariant]} formatted product information
 */
function sortProductData(formattedProductData) {
    return [...formattedProductData].sort((a, b) => a.price - b.price);
}

/* 
 * References a currency symbol table for code to symbol
 *
 * @param {string} currency code 
 *
 * @return {string} symbol
 */
function getCurrencySymbol(currencyCode) {
    return CURRENCY_SYMBOLS[currencyCode] || "$"
}

/* 
 * Displays our prouduct information.
 * If no data is returned from Shopify or the previous functions, displays a friendly message informing the user.
 *
 * @param {[productData]} The sorted and formatted product data.
 * @param {name} search term
 */
function displayProductData(productData, name) {
    if (!productData.length) {
        console.log(`No prouduct data was found for the search string: ${name}`)
        return
    }

    for (const product of productData) {
        console.log(`${product.title} - price ${getCurrencySymbol(product.currencyCode)}${product.price}`)
    }
}

/*
 * Mainnnnnnnnn
 * Controls high level flow of the application
 */
async function main() {
    try {
        // Gathering required data first
        const name = getNameArg()
        const env = getEnv()
        
        // Setting up our client
        const graphQlClient = setupGraphQlClient(env)

        // Gathering product data
        const productData = await getProductData(graphQlClient, name)
         
        // Foramtting and sorting
        const formattedProductData = formatProductData(productData)
        const sortedProductData = sortProductData(formattedProductData)

        displayProductData(sortedProductData, name)

    } catch(e) {
        console.error(`Error: ${e.message}`)
        process.exit(1)
    }
}

main()
