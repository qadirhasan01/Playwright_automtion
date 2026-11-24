import { test, expect } from '@playwright/test';

test('GET - Fetch user details', async ({ request }) => {
    const response = await request.get(
        'https://dummyjson.com/users/1'
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.id).toBe(1);
    expect(body.firstName).toBeTruthy();
    expect(body.email).toContain('@');

    console.log(body);
});