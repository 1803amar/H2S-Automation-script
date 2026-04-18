const { test, expect } = require('@playwright/test');

async function dismissCookieBanner(page) {
  const btn = page.locator('[data-id="accept-cookies"]');
  // Wait for the button to become visible (max 15 s)
  await expect(btn).toBeVisible({ timeout: 15000 });
  await btn.click();
  // Wait for the button to be hidden/removed (max 15 s)
  await expect(btn).toBeHidden({ timeout: 15000 });
}

test('Valid Login', async ({ page }) => {
  // 1️⃣ Load the page and wait for the consent API to finish
  await page.goto('https://alphavision.hack2skill.com/login', {
    waitUntil: 'networkidle',   // ensures delayed API‑driven UI is present
  });

  // 2️⃣ Dismiss the consent banner if it appeared
  await dismissCookieBanner(page);

  // 3️⃣ Fill email
  const email = page.getByPlaceholder('Enter Email');
  await expect(email).toBeVisible();
  await email.fill('amar@hack2skill.com');

  const loginBtn = page.locator('[data-id="auth-login-button"]');
  await expect(loginBtn).toBeVisible();
  await expect(loginBtn).toBeEnabled();
  await loginBtn.click();

  // 5️⃣ Fill OTP
  const otpInputs = page.locator('[data-id="auth-otp-input"]');
  await expect(otpInputs.first()).toBeVisible({ timeout: 15000 });
  await expect(otpInputs).toHaveCount(6);
  const otp = '123456';
  for (let i = 0; i < otp.length; i++) {
    await otpInputs.nth(i).fill(otp[i]);
  }

  // 6️⃣ Verify
  const verifyBtn = page.locator('[data-id="auth-verify-button"]');
  await expect(verifyBtn).toBeVisible();
  await verifyBtn.click();

  // 7️⃣ Logout flow
  const profileBtn = page.locator('[data-id="nav-profile-button"]');
  await expect(profileBtn).toBeVisible({ timeout: 15000 });
  await profileBtn.click();

  const logoutBtn = page.getByRole('link', { name: /^logout$/i });
  await expect(logoutBtn).toBeVisible();
  await logoutBtn.click();

  // 8️⃣ Assert we’re back at the home page
  await expect(page).toHaveURL(url =>
  url.origin === 'https://alphavision.hack2skill.com' &&
  url.pathname === '/'
);
});