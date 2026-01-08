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
  await page.locator('[data-id="auth-login-button"]').click();

//   Wait for 3 sec
  await page.waitForTimeout(3000);

//   Enter OTP recived on entered Email id
  // await page.locator('[data-id="auth-otp-input"][0]').fill('123456');
  const otp = '123456';
const otpInputs = page.locator('[data-id="auth-otp-input"]');

for (let i = 0; i < otp.length; i++) {
  await otpInputs.nth(i).fill(otp[i]);
}

//   Click on Verify button
  await page.locator('[data-id="auth-verify-button"]').click();

//   Wait for 3 sec
  await page.waitForTimeout(3000);

//   Click on profile icon on navbar after login 
  await page.locator('[data-id="nav-profile-button"]').click();

  // Click on log out button
  // await page.locator('[data-id="nav-logout-button"]').click();
  await page.locator('[data-id="nav-logout-button"]:visible').click();


  await page.waitForTimeout(3000);

});
