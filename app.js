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
function setupGraphQlClient() {
    const client = createStorefrontApiClient({
        storeDomain: 'http://your-shop-name.myshopify.com',
        apiVersion: apiVersion,
        publicAccessToken: 'your-storefront-public-access-token',
        CustomFetchApi: nodeFetch
    });

    return client
}

/*
 *
 */
function getProductData() {

}

function main() {
    try {
        const name = getNameArg()
        const env = getEnv()

        const graphQlClient = setupGraphQlClient()

    } catch(e) {
        console.error(e)
    }
}

main()
