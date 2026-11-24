import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';

const AUTH_BASE_URL = 'https://abg-api-preprod.oktapreview.com';   // https:// added
const CLIENT_ID = '0oa6aeqgjljvKuPde1d7';
const CLIENT_SECRET = '5eP4tviz-_dUY_xrWTKkv2MKMH6OD9_JXgEzKplU';

// values that were JMeter variables
// const AVISD = 'your-discount-number';
// const AVISStation = 'JFK';
// const pickup_date = '2026-11-01T12:00:00.000Z';   // match the format JMeter uses
// const dropoff_date = '2026-11-03T12:00:00.000Z';

let accessToken: string;   // file level, so both tests can use it

test('POST /oauth2/default/v1/token returns access token', async ({ request }) => {
  const response = await request.post(`${AUTH_BASE_URL}/oauth2/default/v1/token`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    form: {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials',
    },
    timeout: 10_000,
  });

  console.log('Status:', response.status());
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.access_token).toBeTruthy();
  expect(body.token_type).toBe('Bearer');

  accessToken = body.access_token;   // no "const": assigns the file-level variable
  console.log('Access Token:', accessToken.slice(0, 15) + '...');
});

  test('POST request with token', async ({ request }) => {
  
  /*  const response = await request.post(
    'https://internal.preprod.sdp.abg.cloud/company-utility/avis/v1/validation',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        request_context: {
          correlation_identifier: "ee368c74-1a05-f143-e08a",
          request_time: new Date().toISOString(),
        },
        request_type: 1,
        company_number: [{ discount_number: "A0049000" }],
        pickup_date: "2023-02-12",
        dropoff_date: "2023-03-12",
        pickup_location_details: {
          location_mnemonic: "JFK",
        },
      },
    }
  );

  console.log('Status:', response.status());
  const body = await response.json();
  console.log('Response body:', JSON.stringify(body, null, 2));

  expect(response.status()).toBe(200); */

  

  const GraphqlRequest = await request.post(
  'https://location.preprod.sdp.abg.cloud/location/avis/v2/graphql',
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    data: {
      query: `
        query {
          location_information(
            input: {
              mnemonic: "A6B"
              brand: "A"
              asOf: "2025-12-30"
            }
          ) {
            augmented_information {
              location_augmented_location {
                brand_code
                street_address_line_1
                street_address_line_2
                airport_location_code
                airport_location_designator_code
                airport_location_increment_number
                iso_country_code
                primary_phone_display_text
                location_site_code
                county_name
                extended_airport_code
                number
                country_code
                city_name
                primary_phone_number
                iso_country_name
                state_name
                mnemonic
                state_code
                postal_code
              }
              location_augmented_location_locale {
                localeDetail {
                  description
                  locale
                }
              }
            }
          }
        }
      `,
    },
    timeout: 30000,
  }
);

const graphqlBody = await GraphqlRequest.json();

console.log('Status:', GraphqlRequest.status());
console.log('Response:', JSON.stringify(graphqlBody, null, 2));
});