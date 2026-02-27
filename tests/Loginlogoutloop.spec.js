const { test, expect } = require('@playwright/test');

// ====================================================
// CONFIGURATION
// ====================================================

const TOTAL_ITERATIONS = 50;
// Phase 1: How many times to login and logout

const WAIT_AFTER_ACTION = 500;
// Wait time (ms) between actions — kept low to look suspicious

const CAPTCHA_WAIT = 15000;
// If captcha detected, pause this long so it is visible on screen

const WRONG_OTP = '000000';
// Wrong OTP for Phase 1 failed attempt

const CORRECT_OTP = '123456';
// Correct OTP to actually complete login in Phase 1

const WRONG_OTP_ATTEMPTS = 20;
// Phase 2: How many times to enter wrong OTP continuously

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
// TEST
// ====================================================
test('Login logout loop + repeated wrong OTP to trigger captcha', async ({ page }) => {

  test.setTimeout(900000);
  // 15 minutes — both phases combined need enough time

  // ====================================================
  // INITIAL SETUP: Open login page + accept cookie
  // ====================================================
  await page.goto('https://alphavision.hack2skill.com/login');
  await page.waitForTimeout(2000);

  const cookieBtn = page.locator('[data-id="accept-cookies"]');
  if (await cookieBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await cookieBtn.click();
    await cookieBtn.waitFor({ state: 'hidden' });
    console.log('Cookie accepted');
  }

  // ====================================================
  // PHASE 1: Login + Logout 50 times
  // Each iteration: wrong OTP first → then correct OTP → logout
  // ====================================================
  console.log('');
  console.log('========================================');
  console.log('PHASE 1 STARTED — Login/Logout 50 times');
  console.log('========================================');

  for (let i = 1; i <= TOTAL_ITERATIONS; i++) {

    console.log(`Phase 1 — Iteration ${i} of ${TOTAL_ITERATIONS}`);

    // Navigate to login page (from iteration 2 onwards)
    if (i > 1) {
      const loginNavBtn = page.getByRole('link', { name: 'Login/Sign Up' });
      await loginNavBtn.waitFor({ state: 'visible', timeout: 15000 });
      await loginNavBtn.click();
      await page.waitForTimeout(WAIT_AFTER_ACTION);
    }

    // Enter email and click login
    await page.getByPlaceholder('Enter Email').waitFor({ state: 'visible', timeout: 15000 });
    await page.getByPlaceholder('Enter Email').fill('amar@hack2skill.com');
    await page.locator('[data-id="auth-login-button"]').click();
    await page.waitForTimeout(WAIT_AFTER_ACTION);

    await checkForCaptcha(page, `Phase 1 iteration ${i} — after login click`);

    // Enter WRONG OTP first
    const otpInputs = page.locator('[data-id="auth-otp-input"]');
    await otpInputs.first().waitFor({ state: 'visible', timeout: 15000 });

    for (let j = 0; j < WRONG_OTP.length; j++) {
      await otpInputs.nth(j).fill(WRONG_OTP[j]);
    }
    await page.locator('[data-id="auth-verify-button"]').click();
    await page.waitForTimeout(WAIT_AFTER_ACTION);

    await checkForCaptcha(page, `Phase 1 iteration ${i} — after wrong OTP`);

    // Clear and enter CORRECT OTP
    for (let j = 0; j < CORRECT_OTP.length; j++) {
      await otpInputs.nth(j).fill('');
    }
    await page.waitForTimeout(300);
    for (let j = 0; j < CORRECT_OTP.length; j++) {
      await otpInputs.nth(j).fill(CORRECT_OTP[j]);
    }
    await page.locator('[data-id="auth-verify-button"]').click();
    await page.waitForTimeout(WAIT_AFTER_ACTION);

    // Logout
    await page.locator('[data-id="nav-profile-button"]').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('[data-id="nav-profile-button"]').click();
    await page.waitForTimeout(500);
    await page.locator('[data-id="nav-logout-button"]:visible').click();
    await page.waitForTimeout(WAIT_AFTER_ACTION);

    await checkForCaptcha(page, `Phase 1 iteration ${i} — after logout`);

    console.log(`Phase 1 — Iteration ${i} completed`);
  }

  console.log('');
  console.log('========================================');
  console.log('PHASE 1 COMPLETE');
  console.log('========================================');

  // ====================================================
  // PHASE 2: Go to login page and enter wrong OTP 20 times
  // Never enter correct OTP — only random wrong OTPs
  // ====================================================
  console.log('');
  console.log('================================================');
  console.log('PHASE 2 STARTED — Repeated wrong OTP 20 times');
  console.log('================================================');

  // Navigate to login page
  const loginNavBtn = page.getByRole('link', { name: 'Login/Sign Up' });
  await loginNavBtn.waitFor({ state: 'visible', timeout: 15000 });
  await loginNavBtn.click();
  await page.waitForTimeout(WAIT_AFTER_ACTION);

  // Enter email and click login — only do this ONCE for Phase 2
  await page.getByPlaceholder('Enter Email').waitFor({ state: 'visible', timeout: 15000 });
  await page.getByPlaceholder('Enter Email').fill('amar@hack2skill.com');
  await page.locator('[data-id="auth-login-button"]').click();
  await page.waitForTimeout(WAIT_AFTER_ACTION);

  await checkForCaptcha(page, 'Phase 2 — after login click');

  // Wait for OTP screen
  const otpInputsP2 = page.locator('[data-id="auth-otp-input"]');
  await otpInputsP2.first().waitFor({ state: 'visible', timeout: 15000 });

  for (let k = 1; k <= WRONG_OTP_ATTEMPTS; k++) {

    const randomOtp = getRandomWrongOtp();
    // Generate a random wrong OTP each time

    console.log(`Phase 2 — Wrong OTP attempt ${k} of ${WRONG_OTP_ATTEMPTS} — OTP: ${randomOtp}`);

    // Clear fields
    for (let j = 0; j < randomOtp.length; j++) {
      await otpInputsP2.nth(j).fill('');
    }
    await page.waitForTimeout(200);

    // Fill random wrong OTP
    for (let j = 0; j < randomOtp.length; j++) {
      await otpInputsP2.nth(j).fill(randomOtp[j]);
    }

    // Submit wrong OTP
    await page.locator('[data-id="auth-verify-button"]').click();
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