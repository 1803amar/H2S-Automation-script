const { test, expect } = require('@playwright/test');

// Open URL in browser
test('Valid Login', async ({ page }) => {
  await page.goto('https://alphavision.hack2skill.com/login');

//   wait for 3 sec
  await page.waitForTimeout(3000);

//   if cookie message appears then click on accept cookies button
  const cookieBtn = page.locator('[data-id="accept-cookies"]');
  if (await cookieBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await cookieBtn.click();
    await cookieBtn.waitFor({ state: 'hidden' });
    console.log('✅ Cookie accepted'); 
  }

//   Enter emaiid to login 
  await page.getByPlaceholder('Enter Email').fill('amar@hack2skill.com');

//   Click on login button
  await page.locator('.buttonv1Comp.mt-2').click();

//   Wait for 3 sec
  await page.waitForTimeout(3000);

//   Enter OTP recived on entered Email id
  await page.locator(`input[aria-label='Please enter OTP character 1']`).fill('123456');

//   Click on Verify button
  await page.locator('.buttonv1Comp.mt-4.mb-6').click();

//   Wait for 3 sec
  await page.waitForTimeout(3000);

//   Click on profile icon on navbar after login 
  await page.locator('body > div:nth-child(1) > main:nth-child(2) > div:nth-child(1) > nav:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(4) > ul:nth-child(1) > li:nth-child(5)').click();

  // await page.locator('.cursor-pointer:has-text("Logout")').click();

  await page.waitForTimeout(3000);

});
