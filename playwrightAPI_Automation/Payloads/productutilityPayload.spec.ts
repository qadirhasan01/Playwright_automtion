import { test, expect } from '@playwright/test';

test('POST - AVIS Booking API', async ({ request }) => {

    // Step 1: Define the request payload
    const requestBody = {
        request_context: {
            correlation_identifier: 'c5999a76-d73c-4e3e-9d9a-6d8aaa7897ab',
            request_time: '2026-12-24T02:50:01Z',

            booking_channel_info: {
                booking_channel_code: 'DOTCOM',
                domain_country: 'US',
                iata_numbers: ['123', '123', ''],

                booking_location_details: {
                    number: 778,
                    mnemonic_code: 'CDG'
                }
            }
        },

        brand_information: {
            brand: 'AVIS'
        },

        product_types: ['VEHICLE'],
        selection_type: 'ALL',
        request_type: 'ESTIMATED-TOTAL',
        business_flow: 'BOOKING_DISPLAY',

        products: [
            {
                code: 'C',
                type: 'VEHICLE',
                quantity: 1,

                details: {
                    vehicle_information: {
                        main_carclass_code: ['R'],

                        vehicle_group: [
                            {
                                vehicle_category: '_',
                                sub_vehicle_group: ['C']
                            }
                        ]
                    }
                },

                features: {
                    upsell_processing: true
                }
            }
        ],

        requested_currencies: [
            {
                currency_type: 'RATE',

                currency: {
                    code_type: 'SYSTEM',
                    code: 'USD'
                }
            }
        ],

        pick_up_date_time: {
            date: '2026-09-30',
            time: '1200'
        },

        offer_date_time: {
            date: '2026-09-18',
            time: '1200'
        },

        drop_off_date_time: {
            date: '2026-09-30',
            time: '1300'
        },

        pick_up_location_details: {
            mnemonic_code: 'SFO',
            country_code: 'US',
            state_code: 'CO'
        }
    };

    // Step 2: Send POST request
    const response = await request.post(
        '/YOUR_API_ENDPOINT',
        {
            data: requestBody,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }
    );

    // Step 3: Read response
    const responseText = await response.text();

    // Step 4: Print response details
    console.log('Status Code:', response.status());
    console.log('Response Body:', responseText);

    // Step 5: Basic success validation
    expect(
        response.status(),
        `Unexpected response: ${responseText}`
    ).toBeGreaterThanOrEqual(200);

    expect(response.status()).toBeLessThan(300);

});