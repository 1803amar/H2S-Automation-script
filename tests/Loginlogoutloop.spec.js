const { test, expect } = require('@playwright/test');

// Force a completely fresh browser context for this test file
// Prevents cookie/session bleed from other tests running in the same suite
test.use({ storageState: undefined });

// ====================================================
// CONFIGURATION
// ====================================================

const TOTAL_ITERATIONS = 5;
const WAIT_AFTER_ACTION = 500;
const CAPTCHA_WAIT = 15000;
const WRONG_OTP = '000000';
const CORRECT_OTP = '123456';
const WRONG_OTP_ATTEMPTS = 2;
const LOGIN_URL = 'https://alphavision.hack2skill.com/login';

// ====================================================
// HELPER: Dismiss cookie banner if it appears
// ====================================================
async function dismissCookieBanner(page) {
  const btn = page.locator('[data-id="accept-cookies"]');
  try {
    await expect(btn).toBeVisible({ timeout: 8000 });
    await btn.click();
    await expect(btn).toBeHidden({ timeout: 8000 });
    console.log('Cookie accepted');
  } catch {
    console.log('ℹ️ Cookie banner not found, skipping');
  }
}

// ====================================================
// HELPER: Dismiss push notification popup if it appears
// ====================================================
async function dismissPushNotification(page) {
  try {
    const laterBtn = page.frameLocator('iframe').getByRole('button', { name: 'Later' });
    await expect(laterBtn).toBeVisible({ timeout: 5000 });
    await laterBtn.click();
    console.log('ℹ️ Push notification dismissed');
  } catch {
    // If popup never appeared, skip silently
  }
}

// ====================================================
// HELPER: Check for reCAPTCHA on page
// ====================================================
async function checkForCaptcha(page, context) {
  const captchaFrame = page.frameLocator('iframe[src*="recaptcha"]');
  const detected = await captchaFrame.locator('.recaptcha-checkbox').isVisible({ timeout: 2000 }).catch(() => false);
  if (detected) {
    console.log(`CAPTCHA DETECTED — ${context}. Pausing for ${CAPTCHA_WAIT / 1000} seconds to observe.`);
    await page.waitForTimeout(CAPTCHA_WAIT);
  }
  return detected;
}

// ====================================================
// HELPER: Generate a random 6-digit OTP (never correct)
// ====================================================
function getRandomWrongOtp() {
  let otp;
  do {
    otp = String(Math.floor(100000 + Math.random() * 900000));
    // Generate random 6-digit number
  } while (otp === CORRECT_OTP);
  // Keep generating until it is NOT the correct OTP
  return otp;
}

// ====================================================
// HELPER: Fill OTP inputs one character at a time
// ====================================================
async function fillOtp(page, otpInputs, otp) {
  // Verify OTP input boxes are visible and correct count before filling
  await expect(otpInputs.first()).toBeVisible({ timeout: 15000 });
  await expect(otpInputs).toHaveCount(6);
  for (let j = 0; j < otp.length; j++) {
    await otpInputs.nth(j).fill(otp[j]);
  }
}

// ====================================================
// HELPER: Clear all OTP input boxes
// ====================================================
async function clearOtp(page, otpInputs) {
  // Wait for inputs to be visible before clearing
  await expect(otpInputs.first()).toBeVisible({ timeout: 15000 });
  for (let j = 0; j < 6; j++) {
    await otpInputs.nth(j).fill('');
  }
}

// ====================================================
// HELPER: Enter email and click login button
// ====================================================
async function enterEmailAndLogin(page, email) {
  // Wait for email field to be visible, then fill it
  const emailInput = page.getByPlaceholder('Enter Email');
  await expect(emailInput).toBeVisible({ timeout: 15000 });
  await emailInput.fill(email);

  // Wait for login button to be visible and enabled, then click
  const loginBtn = page.locator('[data-id="auth-login-button"]');
  await expect(loginBtn).toBeVisible();
  await expect(loginBtn).toBeEnabled();
  await loginBtn.click();

  // Wait for login button to disappear from DOM
  // Confirms OTP request was sent and page is transitioning to OTP screen
  await expect(loginBtn).toBeHidden({ timeout: 15000 });

  // Wait for OTP screen heading to confirm page has fully transitioned
  // Login button is removed from DOM once OTP screen loads
  await expect(
    page.getByRole('heading', { name: 'Verify Your Account' })
  ).toBeVisible({ timeout: 15000 });
}

// ====================================================
// HELPER: Click verify button after OTP is filled
// ====================================================
async function clickVerify(page) {
  const verifyBtn = page.locator('[data-id="auth-verify-button"]');
  await expect(verifyBtn).toBeVisible();
  await expect(verifyBtn).toBeEnabled();
  await verifyBtn.click();
}

// ====================================================
// HELPER: Logout from the application
// ====================================================
async function logout(page) {
  // Wait for profile button to appear in navbar after login
  const profileBtn = page.locator('[data-id="nav-profile-button"]');
  await expect(profileBtn).toBeVisible({ timeout: 15000 });
  await profileBtn.click();

  // Wait for logout button to be visible, then click
  const logoutBtn = page.getByRole('link', { name: /^logout$/i });
  await expect(logoutBtn).toBeVisible({ timeout: 5000 });
  await logoutBtn.click();

  // Wait only for DOM to load after logout redirect
  // Reason: push notification iframe keeps network busy indefinitely
  // so networkidle would hang forever — domcontentloaded is safe here
  await page.waitForLoadState('domcontentloaded');

  // Dismiss push notification popup if it appears after logout
  await dismissPushNotification(page);
}

// ====================================================
// HELPER: Navigate directly to login page via URL
// ====================================================
async function goToLoginPage(page) {
  // Navigate directly to login page instead of relying on navbar link
  // Reason: after logout, site redirects to hack2skill.com main domain
  // where the alphavision navbar login link does not exist
  await page.goto(LOGIN_URL, {
    waitUntil: 'domcontentloaded',
  });

  // Dismiss cookie banner if it appears after navigation
  await dismissCookieBanner(page);

  // Verify login page is loaded by checking email input is visible
  await expect(page.getByPlaceholder('Enter Email')).toBeVisible({ timeout: 15000 });
}

// ====================================================
// TEST
// ====================================================
test('Login logout loop + repeated wrong OTP to trigger captcha', async ({ page }) => {

  test.setTimeout(900000);
  // 15 minutes — both phases combined need enough time

  // ====================================================
  // INITIAL SETUP: Open login page + accept cookie
  // ====================================================

  // Open login page directly — domcontentloaded avoids push notification iframe hang
  await page.goto(LOGIN_URL, {
    waitUntil: 'domcontentloaded',
  });

  // Dismiss cookie banner if it appears
  await dismissCookieBanner(page);

  // Verify login page loaded correctly before starting Phase 1
  await expect(page.getByPlaceholder('Enter Email')).toBeVisible({ timeout: 15000 });

  // ====================================================
  // PHASE 1: Login + Logout N times
  // Each iteration: wrong OTP first → then correct OTP → logout
  // ====================================================
  console.log('');
  console.log('========================================');
  console.log(`PHASE 1 STARTED — Login/Logout ${TOTAL_ITERATIONS} times`);
  console.log('========================================');

  for (let i = 1; i <= TOTAL_ITERATIONS; i++) {

    console.log(`Phase 1 — Iteration ${i} of ${TOTAL_ITERATIONS}`);

    // Navigate directly to login page from iteration 2 onwards
    if (i > 1) {
      await goToLoginPage(page);
    }

    // Enter email and click login button
    // enterEmailAndLogin now waits for OTP screen before returning
    await enterEmailAndLogin(page, 'amar@hack2skill.com');
    await page.waitForTimeout(WAIT_AFTER_ACTION);

    await checkForCaptcha(page, `Phase 1 iteration ${i} — after login click`);

    // Enter WRONG OTP first to simulate failed attempt
    const otpInputs = page.locator('[data-id="auth-otp-input"]');
    await fillOtp(page, otpInputs, WRONG_OTP);
    await clickVerify(page);
    await page.waitForTimeout(WAIT_AFTER_ACTION);

    await checkForCaptcha(page, `Phase 1 iteration ${i} — after wrong OTP`);

    // Clear fields and enter CORRECT OTP to complete login
    await clearOtp(page, otpInputs);
    await page.waitForTimeout(300);
    await fillOtp(page, otpInputs, CORRECT_OTP);
    await clickVerify(page);
    await page.waitForTimeout(WAIT_AFTER_ACTION);

    // Logout and wait for redirect to complete
    await logout(page);
    await page.waitForTimeout(WAIT_AFTER_ACTION);

    await checkForCaptcha(page, `Phase 1 iteration ${i} — after logout`);

    console.log(`Phase 1 — Iteration ${i} completed`);
  }

  console.log('');
  console.log('========================================');
  console.log('PHASE 1 COMPLETE');
  console.log('========================================');

  // ====================================================
  // PHASE 2: Go to login page and enter wrong OTP N times
  // Never enter correct OTP — only random wrong OTPs
  // ====================================================
  console.log('');
  console.log('================================================');
  console.log(`PHASE 2 STARTED — Repeated wrong OTP ${WRONG_OTP_ATTEMPTS} times`);
  console.log('================================================');

  // Navigate directly to login page for Phase 2
  await goToLoginPage(page);

  // Enter email and click login — only done ONCE for entire Phase 2
  // enterEmailAndLogin now waits for OTP screen before returning
  await enterEmailAndLogin(page, 'amar@hack2skill.com');
  await page.waitForTimeout(WAIT_AFTER_ACTION);

  await checkForCaptcha(page, 'Phase 2 — after login click');

  // Wait for OTP screen to appear before starting wrong attempts
  const otpInputsP2 = page.locator('[data-id="auth-otp-input"]');
  await expect(otpInputsP2.first()).toBeVisible({ timeout: 15000 });
  await expect(otpInputsP2).toHaveCount(6);

  for (let k = 1; k <= WRONG_OTP_ATTEMPTS; k++) {

    const randomOtp = getRandomWrongOtp();
    // Generate a random wrong OTP each time

    console.log(`Phase 2 — Wrong OTP attempt ${k} of ${WRONG_OTP_ATTEMPTS} — OTP: ${randomOtp}`);

    // Clear fields before filling new wrong OTP
    await clearOtp(page, otpInputsP2);
    await page.waitForTimeout(200);

    // Fill random wrong OTP
    await fillOtp(page, otpInputsP2, randomOtp);

    // Submit wrong OTP
    await clickVerify(page);
    await page.waitForTimeout(WAIT_AFTER_ACTION);

    // Check for captcha after every wrong attempt
    const captchaFound = await checkForCaptcha(page, `Phase 2 — wrong OTP attempt ${k}`);

    if (captchaFound) {
      console.log(`Phase 2 stopped at attempt ${k} — captcha appeared. Test purpose achieved.`);
      break;
      // Stop Phase 2 if captcha is triggered — we got what we wanted
    }
  }

  // ====================================================
  // FINAL SUMMARY
  // ====================================================
  console.log('');
  console.log('========================================');
  console.log('ALL PHASES COMPLETE — SUMMARY');
  console.log(`Phase 1: ${TOTAL_ITERATIONS} login/logout cycles done`);
  console.log(`Phase 2: Up to ${WRONG_OTP_ATTEMPTS} wrong OTP attempts done`);
  console.log('If CAPTCHA DETECTED was printed above, captcha was triggered successfully.');
  console.log('If not, the site may use a non-standard captcha or has no captcha implemented.');
  console.log('========================================');

});