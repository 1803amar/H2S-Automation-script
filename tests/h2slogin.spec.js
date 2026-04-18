const { test, expect } = require('@playwright/test');

// Force a completely fresh browser context for this test file
// Prevents cookie/session bleed from other tests running in the same suite
test.use({ storageState: undefined });

// ─── Helper: Dismiss cookie banner if it appears ──────────────────────────────
async function dismissCookieBanner(page) {
  const btn = page.locator('[data-id="accept-cookies"]');
  try {
    // Wait for cookie button to become visible (max 8 sec)
    await expect(btn).toBeVisible({ timeout: 8000 });
    await btn.click();
    // Wait for banner to hide after clicking
    await expect(btn).toBeHidden({ timeout: 8000 });
  } catch {
    // If banner never appeared, skip silently
    console.log('ℹ️ Cookie banner not found, skipping');
  }
}

// ─── Test: Valid Login ─────────────────────────────────────────────────────────
test('Valid Login', async ({ page }) => {

  // STEP 1: Open login page and wait for DOM to load
  // Using domcontentloaded instead of networkidle to avoid hanging
  // on push notification iframes that never become idle
  await page.goto('https://alphavision.hack2skill.com/login', {
    waitUntil: 'domcontentloaded',
  });

  // STEP 2: Dismiss cookie banner if it appears
  await dismissCookieBanner(page);

  // STEP 3: Wait for email field to be visible, then fill it
  const emailInput = page.getByPlaceholder('Enter Email');
  await expect(emailInput).toBeVisible({ timeout: 15000 });
  await emailInput.fill('amar@hack2skill.com');

  // STEP 4: Wait for login button to be visible and enabled, then click
  const loginBtn = page.locator('[data-id="auth-login-button"]');
  await expect(loginBtn).toBeVisible();
  await expect(loginBtn).toBeEnabled();
  await loginBtn.click();

  // STEP 5: Wait for OTP screen heading to confirm page has transitioned
  // Note: login button is removed from DOM once OTP screen loads
  // so we must NOT check loginBtn after click — it will never be found
  await expect(
    page.getByRole('heading', { name: 'Verify Your Account' })
  ).toBeVisible({ timeout: 15000 });

  // STEP 6: Wait for OTP inputs to appear, verify count is 6, then fill each box
  const otpInputs = page.locator('[data-id="auth-otp-input"]');
  await expect(otpInputs.first()).toBeVisible({ timeout: 15000 });
  await expect(otpInputs).toHaveCount(6);

  const otp = '123456';
  for (let i = 0; i < otp.length; i++) {
    await otpInputs.nth(i).fill(otp[i]);
  }

  // STEP 7: Wait for verify button to be visible and enabled, then click
  const verifyBtn = page.locator('[data-id="auth-verify-button"]');
  await expect(verifyBtn).toBeVisible();
  await expect(verifyBtn).toBeEnabled();
  await verifyBtn.click();

  // STEP 8: Wait for profile button to appear in navbar after login
  const profileBtn = page.locator('[data-id="nav-profile-button"]');
  await expect(profileBtn).toBeVisible({ timeout: 15000 });
  await profileBtn.click();

  // STEP 9: Wait for logout link to be visible, then click
  const logoutBtn = page.getByRole('link', { name: /^logout$/i });
  await expect(logoutBtn).toBeVisible();
  await logoutBtn.click();

  // STEP 10: Verify user is redirected back to homepage after logout
  await expect(page).toHaveURL(url =>
    url.origin === 'https://alphavision.hack2skill.com' &&
    url.pathname === '/'
  );
});