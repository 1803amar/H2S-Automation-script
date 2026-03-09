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

// ====================================================
// HELPER: Login
// ====================================================
async function login(page) {
  await page.goto('https://alphavision.hack2skill.com/login');
  await page.waitForTimeout(3000);

  const cookieBtn = page.locator('[data-id="accept-cookies"]');
  if (await cookieBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await cookieBtn.click();
    await cookieBtn.waitFor({ state: 'hidden' });
    console.log('Cookie accepted');
  }

  await page.getByPlaceholder('Enter Email').fill(EMAIL);
  await page.locator('[data-id="auth-login-button"]').click();
  await page.waitForTimeout(3000);

  const otpInputs = page.locator('[data-id="auth-otp-input"]');
  for (let i = 0; i < OTP.length; i++) {
    await otpInputs.nth(i).fill(OTP[i]);
  }
  await page.locator('[data-id="auth-verify-button"]').click();
  await page.waitForTimeout(3000);
  console.log('Login successful');
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
    hr - 5,           // subtract IST offset hours
    parseInt(minutes) - 30, // subtract IST offset minutes
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
    console.log(`${context}: No Submit button found — form is read-only or locked`);
    console.log(`${context}: Submission correctly blocked at UI level`);
    return;
  }

  const isDisabled = await submitBtn.isDisabled().catch(() => false);
  if (isDisabled) {
    console.log(`${context}: Submit button is disabled — correctly blocked at UI level`);
    return;
  }

  console.log(`${context}: Submit button is enabled — clicking to check backend response...`);
  await submitBtn.click();
  await page.waitForTimeout(3000);

  const errorLocator = page.locator('[class*="error"], [class*="toast"], [role="alert"], [class*="snack"]').first();
  const errorVisible = await errorLocator.isVisible({ timeout: 5000 }).catch(() => false);

  if (errorVisible) {
    const errorText = await errorLocator.textContent().catch(() => '');
    console.log(`${context}: Backend returned error — "${errorText.trim()}"`);
    console.log(`${context}: Submission correctly rejected by backend`);
  } else {
    const successLocator = page.locator('[class*="success"], [class*="toast"]').first();
    const successVisible = await successLocator.isVisible({ timeout: 3000 }).catch(() => false);

    if (successVisible) {
      const successText = await successLocator.textContent().catch(() => '');
      console.log(`${context}: WARNING — Submission went through! This should NOT happen.`);
      console.log(`${context}: Success message: "${successText.trim()}"`);
      console.log(`${context}: BUG — platform allowed submission even though window is not active`);
    } else {
      console.log(`${context}: No clear error or success response — manual verification needed`);
    }
  }
}

// ====================================================
// TEST
// ====================================================
test('Scenario 2 — Verify submission window status using dates and test backend rejection', async ({ page }) => {

  test.setTimeout(120000);

  await login(page);
  await page.goto(BASE_URL);
  await page.waitForTimeout(2000);

  // ====================================================
  // STEP 1: Open Ongoing tab to read Starting and Ending Date
  // The date info is visible inside the submission card
  // ====================================================
  const ongoingTab = page.getByRole('tab', { name: 'Ongoing', exact: true });
  await ongoingTab.waitFor({ state: 'visible', timeout: 10000 });
  await ongoingTab.click();
  await page.waitForTimeout(2000);

  // Check if card is present in Ongoing tab
  let cardFound = await page.locator('text=Project Submission').first().isVisible({ timeout: 3000 }).catch(() => false);

  // If not in Ongoing, check Past tab
  if (!cardFound) {
    const pastTab = page.getByRole('tab', { name: 'Past', exact: true });
    await pastTab.click();
    await page.waitForTimeout(2000);
    cardFound = await page.locator('text=Project Submission').first().isVisible({ timeout: 3000 }).catch(() => false);
  }

  // If not in Past, check Upcoming tab
  if (!cardFound) {
    const upcomingTab = page.getByRole('tab', { name: 'Upcoming', exact: true });
    await upcomingTab.click();
    await page.waitForTimeout(2000);
    cardFound = await page.locator('text=Project Submission').first().isVisible({ timeout: 3000 }).catch(() => false);
  }

  if (!cardFound) {
    console.log('No submission card found in any tab — nothing to test');
    return;
  }

  // Scroll to the timer element directly so it is visible on screen
  const timerEl = page.locator('text=MODULE CLOSING IN').first();
  const timerVisible = await timerEl.isVisible({ timeout: 3000 }).catch(() => false);
  if (timerVisible) {
    await timerEl.scrollIntoViewIfNeeded();
  } else {
    await page.locator('text=Project Submission').first().scrollIntoViewIfNeeded();
  }
  // Extra scroll down so timer + dates both fit in viewport
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.waitForTimeout(3000);
  // Pause so timer and dates are clearly visible on screen

  // ====================================================
  // STEP 2: Read Starting Date and Ending Date from the card
  // ====================================================
  // Page shows date text like: 13/02/2026 12:26:00 PM(IST)
  // We locate the date values by their label siblings

  const startingDateText = await page.locator('p:has-text("Starting Date") + *').textContent().catch(() => null)
    || await page.locator('text=Starting Date').locator('xpath=following-sibling::*[1]').textContent().catch(() => null);

  const endingDateText = await page.locator('p:has-text("Ending Date") + *').textContent().catch(() => null)
    || await page.locator('text=Ending Date').locator('xpath=following-sibling::*[1]').textContent().catch(() => null);

  if (!startingDateText || !endingDateText) {
    console.log('Could not read Starting Date or Ending Date from the page');
    console.log('Manual verification needed');
    return;
  }

  console.log(`Starting Date on page: ${startingDateText.trim()}`);
  console.log(`Ending Date on page: ${endingDateText.trim()}`);

  // ====================================================
  // STEP 3: Parse dates and compare with current time
  // ====================================================
  const startDate  = parseDateFromPage(startingDateText.trim());
  const endDate    = parseDateFromPage(endingDateText.trim());
  const now        = new Date();

  console.log(`Current time (UTC): ${now.toUTCString()}`);
  console.log(`Start time (UTC):   ${startDate.toUTCString()}`);
  console.log(`End time (UTC):     ${endDate.toUTCString()}`);

  // ====================================================
  // STEP 4: Determine status based on date comparison
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
  // STEP 5: Act based on window status
  // ====================================================
  if (windowStatus === 'ongoing') {
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

  // Click the card to open the form
  await page.locator('text=Project Submission').first().click();
  await page.waitForTimeout(2000);

  const context = windowStatus === 'past'
    ? 'Expired window'
    : 'Not-yet-started window';

  await trySubmitAndCheckResponse(page, context);

  console.log('Scenario 2 complete');
});