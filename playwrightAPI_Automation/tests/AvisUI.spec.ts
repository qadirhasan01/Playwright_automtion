import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://ci8.avis.com/')
  await expect(page.locator("//h1[@class='MuiTypography-root MuiTypography-h1 mui-1s98t8b']")).toContainText('BOOK YOUR CAR RENTAL');

  await page.locator("//button[@id='onetrust-reject-all-handler']").click();
 
  await page.locator("//input[@Aria-label='Enter pick-up location or delivery address']").click();

  await page.locator("//input[@Aria-label='Enter pick-up location or delivery address']").fill('jfk');
  
  await page.locator("//h3[text()='John F Kennedy Intl Airport, Jamaica, New York, United States-(JFK)']").click();
  await page.waitForTimeout(5000);

  await page.locator("//button[@data-testid='buttonCancel']").click();

  await page.locator("//button[text()='Show Vehicles']").click();

  await expect(page.locator("//h6[contains(text(), 'Available vehicles')]"));

  await page.waitForTimeout(5000);
});
