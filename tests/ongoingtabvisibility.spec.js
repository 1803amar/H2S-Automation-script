const { test, expect } = require('@playwright/test');

// Force a completely fresh browser context for this test file
// Prevents cookie/session bleed from other tests running in the same suite
test.use({ storageState: undefined });

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
async function loginWithOtp(page, email, otp) {
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
  await expect(
    page.getByRole('heading', { name: 'Verify Your Account' })
  ).toBeVisible({ timeout: 15000 });

  // Wait for OTP input boxes to appear, verify count is 6
  const otpInputs = page.locator('[data-id="auth-otp-input"]');
  await expect(otpInputs.first()).toBeVisible({ timeout: 15000 });
  await expect(otpInputs).toHaveCount(6);

  // Fill each OTP digit into its corresponding input box
  for (let i = 0; i < otp.length; i++) {
    await otpInputs.nth(i).fill(otp[i]);
  }

  // Wait for verify button to be visible and enabled, then click
  const verifyBtn = page.locator('[data-id="auth-verify-button"]');
  await expect(verifyBtn).toBeVisible();
  await expect(verifyBtn).toBeEnabled();
  await verifyBtn.click();

  // Wait for navbar profile button to confirm login is fully complete
  // This ensures dashboard has loaded before any further navigation
  await expect(
    page.locator('[data-id="nav-profile-button"]')
  ).toBeVisible({ timeout: 15000 });

  console.log('Login successful');
}

// ====================================================
// HELPER: Navigate to a named tab inside a tablist
// ====================================================
async function clickTab(page, tabName, tabList = null) {
  // Use provided tablist locator, or locate tab directly on page
  // .first() used as fallback because page has two tablists with same aria-label
  // Sub-tabs (Upcoming, Ongoing, Past) are unique by name so .first() is safe
  const tab = tabList
    ? tabList.getByRole('tab', { name: tabName, exact: true })
    : page.getByRole('tab', { name: tabName, exact: true }).first();

  // Wait for tab to be visible, scroll into view, then click
  await expect(tab).toBeVisible({ timeout: 10000 });
  await tab.scrollIntoViewIfNeeded();
  await tab.click();

  // Verify the tab is now selected
  await expect(tab).toHaveAttribute('aria-selected', 'true');

  return tab;
}

// ====================================================
// TEST SCENARIO 3: Submission becomes active and visible in Ongoing tab
// ====================================================
// GIVEN:  The submission window is ongoing (active)
// WHEN:   The participant refreshes the page
// THEN:   The submission module appears in the Ongoing tab
// ====================================================

test('Submission becomes active and visible in Ongoing tab', async ({ page }) => {

  test.setTimeout(60000);
  // Allow up to 60 seconds for this test to complete

  // ====================================================
  // STEP 1: Open the dashboard page and wait for DOM to load
  // ====================================================
  await page.goto(
    'https://alphavision.hack2skill.com/event/platform-automation-sandbox/dashboard/roadmap',
    { waitUntil: 'domcontentloaded' }
  );

  // ====================================================
  // STEP 2: Dismiss cookie banner if it appears
  // ====================================================
  await dismissCookieBanner(page);

  // ====================================================
  // STEP 3: Log in with email and OTP
  // ====================================================
  await loginWithOtp(page, 'amar@hack2skill.com', '123456');

  // Wait for dashboard main tablist to be visible after login
  // Use .first() to avoid strict mode error — page has two tablists with same aria-label
  const tabList = page.getByRole('tablist').first();
  await expect(tabList).toBeVisible({ timeout: 15000 });

  // ====================================================
  // STEP 4: Navigate to the Submissions tab
  // ====================================================
  await clickTab(page, 'Submissions', tabList);
  console.log('Navigated to Submissions tab');

  // ====================================================
  // STEP 5: Check all three sub-tabs to find where the submission is
  // ====================================================
  // This pre-check gives a clear failure reason
  // if the submission is not in the Ongoing tab

  // Check Upcoming tab
  await clickTab(page, 'Upcoming');
  const inUpcoming = await page.locator('text=Project Submission')
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  // true if submission card is found in Upcoming tab

  // Check Past tab
  await clickTab(page, 'Past');
  const inPast = await page.locator('text=Project Submission')
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  // true if submission card is found in Past tab

  // Check Ongoing tab
  await clickTab(page, 'Ongoing');
  const inOngoing = await page.locator('text=Project Submission')
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  // true if submission card is found in Ongoing tab

  console.log(`Submission status — Upcoming: ${inUpcoming}, Ongoing: ${inOngoing}, Past: ${inPast}`);

  // ====================================================
  // STEP 6: Fail with a clear reason if submission is not in Ongoing tab
  // ====================================================

  if (inUpcoming && !inOngoing) {
    // Submission window has not started yet
    console.log('TEST FAILED - Submission is in Upcoming tab. Submission window has not opened yet.');
    throw new Error('Submission is in Upcoming tab — submission window has not started yet.');
  }

  if (inPast && !inOngoing) {
    // Submission window has already ended
    console.log('TEST FAILED - Submission is in Past tab. Submission window has already closed.');
    throw new Error('Submission is in Past tab — submission window has already closed.');
  }

  if (!inOngoing && !inUpcoming && !inPast) {
    // Submission not found anywhere
    console.log('TEST FAILED - Submission not found in any tab. Verify login and submission module.');
    throw new Error('Submission not found in any tab — check login and submission module.');
  }

  console.log('Submission confirmed in Ongoing tab before page refresh');

  // ====================================================
  // STEP 7: Refresh the page and wait for DOM to reload
  // ====================================================
  await page.reload({ waitUntil: 'domcontentloaded' });
  // Simulate pressing F5 — domcontentloaded avoids hanging on push notification iframes

  // Wait for main tablist to re-appear after React re-renders
  // Use .first() to target the main dashboard tablist only
  await expect(page.getByRole('tablist').first()).toBeVisible({ timeout: 15000 });

  console.log('Page refreshed successfully');

  // ====================================================
  // STEP 8: Navigate back to Submissions → Ongoing after refresh
  // ====================================================
  // After a page refresh, tab selection resets
  // so we must navigate back to Submissions → Ongoing manually

  const tabListAfterRefresh = page.getByRole('tablist').first();
  await clickTab(page, 'Submissions', tabListAfterRefresh);
  await clickTab(page, 'Ongoing');

  console.log('Navigated back to Ongoing tab after refresh');

  // ====================================================
  // STEP 9: MAIN ASSERTION — Submission still visible after refresh?
  // ====================================================
  const submissionCard = page.locator('text=Project Submission');
  await expect(submissionCard).toBeVisible({ timeout: 10000 });
  // If submission disappeared after refresh, this assertion will fail with a clear message

  // ====================================================
  // FINAL: Test passed
  // ====================================================
  console.log('SCENARIO 3 PASSED - Submission is still visible in the Ongoing tab after page refresh.');

});