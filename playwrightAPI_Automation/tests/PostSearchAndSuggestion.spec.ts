import { test, expect } from '@playwright/test';

// const AUTH_BASE_URL = process.env.AUTH_BASE_URL!;   // e.g. https://<your-auth-server>.com
// const CLIENT_ID = process.env.CLIENT_ID!;
// const CLIENT_SECRET = process.env.CLIENT_SECRET!;


 const AUTH_BASE_URL = 'https://abg-api-preprod.oktapreview.com';   // e.g. https://<your-auth-server>.com
 const CLIENT_ID = '0oa6aeqgjljvKuPde1d7';
 const CLIENT_SECRET = '5eP4tviz-_dUY_xrWTKkv2MKMH6OD9_JXgEzKplU';

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

  const Responsebody = await response.json();

 // const body = await response.json();
const accessToken: string = Responsebody.access_token;

console.log('Access Token:', accessToken);
 // console.log('Response body:', JSON.stringify(Responsebody, null, 2));

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.access_token).toBeTruthy();
  expect(body.token_type).toBe('Bearer');


});

test('POST request with token', async ({ request }) => {
  const response = await request.post(API_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    data: {
      request_context: {
        correlation_identifier: randomUUID(),
        request_time: new Date().toISOString(),
      },
      request_type: 1,
      company_number: [{ discount_number: AVISD }],
      pickup_date,
      dropoff_date,
      pickup_location_details: {
        location_mnemonic: AVISStation,
      },
    },
    timeout: 10_000,
  });

  console.log('Status:', response.status());
  const body = await response.json();
  console.log('Response body:', JSON.stringify(body, null, 2));

  expect(response.status()).toBe(200);
});