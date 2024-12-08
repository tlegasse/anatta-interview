import 'dotenv/config'
import '@shopify/shopify-api/adapters/node'

import {createStorefrontApiClient} from '@shopify/storefront-api-client';

import nodeFetch from 'node-fetch';

/*
 * @typeDef {{
 *     STORE_DOMAIN: string,
 *     ADMIN_TOKEN: string,
 *     STOREFRONT_TOKEN: string
 * }} Env
 */

const scopes = ['read_products']
const apiVersion = "2024-10"

/*
 * @return string
 */
function getNameArg() {
    const nameFlagIndex = process.argv.findIndex(arg => arg == '--name')

    if (nameFlagIndex < 0) {
        throw new Error("Name flag could not be found")
    }

    const nameVal = process.argv[nameFlagIndex + 1]

    if (nameVal == undefined) {
        throw new Error("Name value could not be found")
    }

    return nameVal
}

// Gather dotenv
/*
 * @return Env
 */
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

/*
 *
 */
function setupGraphQlClient(env) {
    const client = createStorefrontApiClient({
        storeDomain: env.STORE_DOMAIN,
        apiVersion: apiVersion,
        publicAccessToken: env.STOREFRONT_TOKEN,
        CustomFetchApi: nodeFetch
    });

    return client
}

/*
 * 
 */
async function getProductData(client, name) {
    const productQuery = `
        {
            products(first: 10, query:"title:${name}*") {
                edges {
                    node {
                        title
                        variants(first: 250) {
                            edges {
                                node {
                                    id
                                    title
                                    priceV2 {
                                        amount
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
            name: name,
        },
    });

    if (errors?.graphQLErrors) {
        throw new Error(
            'There was an error while processing this request: ' +
            JSON.stringify(errors)
        )
    }

    return data
}

/*
 *
 */
async function getFormattedProductData(productData) {
    const formattedProductData = []

    for (const product of productData.products.edges) {
        for (const variant of product.node.variants.edges) {
            formattedProductData.push({
                title: product.node.title + ' ' + variant.node.title,
                price: parseFloat(variant.node.priceV2.amount)
            })
        }
    }
    
    return formattedProductData
}

async function getSortedProductData(formattedProductData) {
    const compareFn = function(a, b) {
        if (a.price < b.price) {
            return -1;
        } else if (b.price < a.price) {
            return 1;
        }
        // a must be equal to b
        return 0;
    }

    console.log(formattedProductData)

    return formattedProductData.sort(compareFn) 
}

async function main() {
    try {
        const name = getNameArg()
        const env = getEnv()

        const graphQlClient = setupGraphQlClient(env)
        const productData = await getProductData(graphQlClient, name)

        const formattedProductData = await getFormattedProductData(productData)
        const sortedProductData = await getSortedProductData(formattedProductData)

        for (const product of sortedProductData) {
            console.log(product)
        }

    } catch(e) {
        console.error(e)
    }
}

main()
