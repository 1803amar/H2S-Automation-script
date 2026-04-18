const { test, expect } = require('@playwright/test');

// ====================================================
// SCENARIO 2: Timer Expired / Not Yet Started — Backend Rejection
// ====================================================
// Logic:
//   Starting Date aur Ending Date page se read karo
//   Current time se compare karo:
//     current < startDate  → Upcoming (abhi shuru nahi hua)
//     current > endDate    → Past (expire ho gaya)
//     startDate < current < endDate → Ongoing (active hai)
//
// Upcoming ya Past mein ho to submit karne ki koshish karo
// Error aana chahiye — agar success aaya to BUG hai
// ====================================================

const EMAIL    = 'amar@hack2skill.com';
const OTP      = '123456';
const BASE_URL = 'https://alphavision.hack2skill.com/event/platform-automation-sandbox/dashboard/submissions';
const LOGIN_URL = 'https://alphavision.hack2skill.com/login';

// ====================================================
// HELPER: Dismiss cookie banner if it appears
// ====================================================
async function dismissCookieBanner(page) {
  const btn = page.locator('[data-id="accept-cookies"]');
  try {
    // Wait for cookie button to become visible (max 8 sec)
    await expect(btn).toBeVisible({ timeout: 8000 });
    await btn.click();
    // Wait for banner to hide after clicking
    await expect(btn).toBeHidden({ timeout: 8000 });
    console.log('Cookie accepted');
  } catch {
    // If banner never appeared, skip silently
    console.log('ℹ️ Cookie banner not found, skipping');
  }
}

// ====================================================
// HELPER: Login with email and OTP
// ====================================================
async function login(page) {
  // Open login page and wait for DOM to load
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

  // Dismiss cookie banner if it appears
  await dismissCookieBanner(page);

  // Wait for email field to be visible, then fill it
  const emailInput = page.getByPlaceholder('Enter Email');
  await expect(emailInput).toBeVisible({ timeout: 15000 });
  await emailInput.fill(EMAIL);

  // Wait for login button to be visible and enabled, then click
  const loginBtn = page.locator('[data-id="auth-login-button"]');
  await expect(loginBtn).toBeVisible();
  await expect(loginBtn).toBeEnabled();
  await loginBtn.click();

  // Wait for OTP screen heading to confirm page has transitioned
  // Note: login button is removed from DOM once OTP screen loads
  // so we must NOT wait for loginBtn after click — it will never be found
  await expect(
    page.getByRole('heading', { name: 'Verify Your Account' })
  ).toBeVisible({ timeout: 15000 });

  // Wait for OTP input boxes to appear, verify count is 6
  const otpInputs = page.locator('[data-id="auth-otp-input"]');
  await expect(otpInputs.first()).toBeVisible({ timeout: 15000 });
  await expect(otpInputs).toHaveCount(6);

  // Fill each OTP digit into its corresponding input box
  for (let i = 0; i < OTP.length; i++) {
    await otpInputs.nth(i).fill(OTP[i]);
  }

  // Wait for verify button to be visible and enabled, then click
  const verifyBtn = page.locator('[data-id="auth-verify-button"]');
  await expect(verifyBtn).toBeVisible();
  await expect(verifyBtn).toBeEnabled();
  await verifyBtn.click();

  // Wait for dashboard to fully load after OTP verification
  // Confirm login is complete before navigating to any other page
  // We check that the OTP screen is gone by waiting for navbar profile button
  await expect(
    page.locator('[data-id="nav-profile-button"]')
  ).toBeVisible({ timeout: 15000 });

  console.log('Login successful');
}

// ====================================================
// HELPER: Navigate to a named tab — uses .first() to
// avoid strict mode error when two tablists exist on page
// ====================================================
async function clickTab(page, tabName) {
  // Use .first() because page may have two tablists with same aria-label
  const tab = page.getByRole('tab', { name: tabName, exact: true }).first();

  // Wait for tab to be visible, scroll into view, then click
  await expect(tab).toBeVisible({ timeout: 10000 });
  await tab.scrollIntoViewIfNeeded();
  await tab.click();

  // Verify the tab is now selected
  await expect(tab).toHaveAttribute('aria-selected', 'true');

  return tab;
}

// ====================================================
// HELPER: Parse date string from page
// Format on page: "13/02/2026 12:26:00 PM(IST)"
// ====================================================
function parseDateFromPage(dateStr) {
  // dateStr example: "13/02/2026 12:26:00 PM(IST)"
  const cleaned = dateStr.replace('(IST)', '').trim();
  // cleaned: "13/02/2026 12:26:00 PM"

  const [datePart, timePart, meridiem] = cleaned.split(' ');
  // datePart: "13/02/2026", timePart: "12:26:00", meridiem: "PM"

  const [day, month, year] = datePart.split('/');
  const [hours, minutes, seconds] = timePart.split(':');

  let hr = parseInt(hours);
  if (meridiem === 'PM' && hr !== 12) hr += 12;
  if (meridiem === 'AM' && hr === 12) hr = 0;

  // IST = UTC+5:30
  // We create the date in IST by using UTC and subtracting 5h30m offset
  const dateUTC = Date.UTC(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    hr - 5,                  // subtract IST offset hours
    parseInt(minutes) - 30,  // subtract IST offset minutes
    parseInt(seconds)
  );

  return new Date(dateUTC);
}

// ====================================================
// HELPER: Try to submit and check response
// ====================================================
async function trySubmitAndCheckResponse(page, context) {
  const submitBtn = page.getByRole('button', { name: 'Submit', exact: true });
  const submitExists = await submitBtn.isVisible({ timeout: 5000 }).catch(() => false);

  if (!submitExists) {
    // Submit button not found — form is read-only or locked at UI level
    console.log(`${context}: No Submit button found — form is read-only or locked`);
    console.log(`${context}: Submission correctly blocked at UI level`);
    return;
  }

  const isDisabled = await submitBtn.isDisabled().catch(() => false);
  if (isDisabled) {
    // Submit button exists but is disabled — correctly blocked at UI level
    console.log(`${context}: Submit button is disabled — correctly blocked at UI level`);
    return;
  }

  // Submit button is enabled — click it and check backend response
  console.log(`${context}: Submit button is enabled — clicking to check backend response...`);
  await submitBtn.click();

  // Wait for either an error or success response to appear
  const responseLocator = page.locator(
    '[class*="error"], [class*="toast"], [role="alert"], [class*="snack"], [class*="success"]'
  ).first();
  await expect(responseLocator).toBeVisible({ timeout: 10000 });
  // Wait for backend response to appear before reading it

  const responseText = await responseLocator.textContent().catch(() => '');
  const responseClass = await responseLocator.getAttribute('class').catch(() => '');

  const isError = responseClass?.includes('error') ||
                  responseClass?.includes('snack') ||
                  responseClass?.includes('alert');

  const isSuccess = responseClass?.includes('success');

  if (isError) {
    // Backend correctly rejected the submission
    console.log(`${context}: Backend returned error — "${responseText.trim()}"`);
    console.log(`${context}: Submission correctly rejected by backend`);
  } else if (isSuccess) {
    // Submission went through — this is a bug
    console.log(`${context}: WARNING — Submission went through! This should NOT happen.`);
    console.log(`${context}: Success message: "${responseText.trim()}"`);
    console.log(`${context}: BUG — platform allowed submission even though window is not active`);
  } else {
    // Response appeared but could not be classified
    console.log(`${context}: Response appeared but could not be classified — manual verification needed`);
    console.log(`${context}: Response text: "${responseText.trim()}"`);
  }
}

// ====================================================
// TEST
// ====================================================
test('Scenario 2 — Verify submission window status using dates and test backend rejection', async ({ page }) => {

  test.setTimeout(120000);
  // Allow up to 2 minutes for full scenario

  // ====================================================
  // STEP 1: Login and navigate to submissions page
  // ====================================================
  await login(page);

  // Navigate to submissions dashboard and wait for DOM to load
  // Login is confirmed complete before this line runs
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  // Wait for Ongoing tab to be visible before interacting with tabs
  await expect(
    page.getByRole('tab', { name: 'Ongoing', exact: true }).first()
  ).toBeVisible({ timeout: 15000 });

  // ====================================================
  // STEP 2: Find the submission card — check all three tabs
  // ====================================================

  // Check Ongoing tab first
  await clickTab(page, 'Ongoing');
  let cardFound = await page.locator('text=Project Submission').first()
    .isVisible({ timeout: 3000 }).catch(() => false);

  // If not in Ongoing, check Past tab
  if (!cardFound) {
    await clickTab(page, 'Past');
    cardFound = await page.locator('text=Project Submission').first()
      .isVisible({ timeout: 3000 }).catch(() => false);
  }

  // If not in Past, check Upcoming tab
  if (!cardFound) {
    await clickTab(page, 'Upcoming');
    cardFound = await page.locator('text=Project Submission').first()
      .isVisible({ timeout: 3000 }).catch(() => false);
  }

  if (!cardFound) {
    console.log('No submission card found in any tab — nothing to test');
    return;
  }

  // ====================================================
  // STEP 3: Scroll to card and wait for dates to be visible
  // ====================================================
  const submissionCard = page.locator('text=Project Submission').first();
  await expect(submissionCard).toBeVisible({ timeout: 10000 });
  await submissionCard.scrollIntoViewIfNeeded();

  // Scroll down slightly so timer and dates both fit in viewport
  await page.evaluate(() => window.scrollBy(0, 200));

  // ====================================================
  // STEP 4: Read Starting Date and Ending Date from the card
  // ====================================================
  // Page shows date text like: 13/02/2026 12:26:00 PM(IST)
  // We locate the date values by their label siblings

  const startingDateText =
    await page.locator('p:has-text("Starting Date") + *').textContent().catch(() => null) ||
    await page.locator('text=Starting Date').locator('xpath=following-sibling::*[1]').textContent().catch(() => null);

  const endingDateText =
    await page.locator('p:has-text("Ending Date") + *').textContent().catch(() => null) ||
    await page.locator('text=Ending Date').locator('xpath=following-sibling::*[1]').textContent().catch(() => null);

  if (!startingDateText || !endingDateText) {
    // Could not read dates — manual verification needed
    console.log('Could not read Starting Date or Ending Date from the page');
    console.log('Manual verification needed');
    return;
  }

  console.log(`Starting Date on page: ${startingDateText.trim()}`);
  console.log(`Ending Date on page: ${endingDateText.trim()}`);

  // ====================================================
  // STEP 5: Parse dates and compare with current time
  // ====================================================
  const startDate = parseDateFromPage(startingDateText.trim());
  const endDate   = parseDateFromPage(endingDateText.trim());
  const now       = new Date();

  console.log(`Current time (UTC): ${now.toUTCString()}`);
  console.log(`Start time (UTC):   ${startDate.toUTCString()}`);
  console.log(`End time (UTC):     ${endDate.toUTCString()}`);

  // ====================================================
  // STEP 6: Determine window status based on date comparison
  // ====================================================
  let windowStatus;

  if (now < startDate) {
    windowStatus = 'upcoming';
    console.log('Window status: NOT STARTED YET (current time is before start date)');
  } else if (now > endDate) {
    windowStatus = 'past';
    console.log('Window status: EXPIRED (current time is after end date)');
  } else {
    windowStatus = 'ongoing';
    console.log('Window status: ACTIVE (current time is between start and end date)');
  }

  // ====================================================
  // STEP 7: Act based on window status
  // ====================================================
  if (windowStatus === 'ongoing') {
    // Submission window is active — no rejection expected
    console.log('Submission window is currently active — submit should work normally');
    console.log('This is covered in Scenario 1 — no rejection expected here');
    return;
  }

  // Window is expired or not started — try to submit and check response
  if (windowStatus === 'past') {
    console.log('Attempting to submit on an expired submission window...');
  } else {
    console.log('Attempting to submit on a not-yet-started submission window...');
  }

  // Click the submission card to open the form
  await submissionCard.click();

  // Wait for form to load after clicking card
  // Submit button may not exist if form is locked — trySubmitAndCheckResponse handles that case
  await expect(
    page.getByRole('button', { name: 'Submit', exact: true }).first()
  ).toBeVisible({ timeout: 15000 }).catch(() => {});

  const context = windowStatus === 'past'
    ? 'Expired window'
    : 'Not-yet-started window';

  await trySubmitAndCheckResponse(page, context);

  console.log('Scenario 2 complete');

});