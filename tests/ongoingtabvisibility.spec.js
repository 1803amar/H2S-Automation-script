const { test, expect } = require('@playwright/test');

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
  // STEP 1: Open the website
  // ====================================================
  await page.goto(
    'https://alphavision.hack2skill.com/event/platform-automation-sandbox/dashboard/roadmap'
  );
  await page.waitForTimeout(3000);
  // Wait for the page to fully load

  // ====================================================
  // STEP 2: Accept cookie popup if it appears
  // ====================================================
  const cookieBtn = page.locator('[data-id="accept-cookies"]');
  // Locate the cookie accept button by its data-id attribute

  if (await cookieBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    // If the cookie button is visible, click it — otherwise skip
    await cookieBtn.click();
    await cookieBtn.waitFor({ state: 'hidden' });
    // Wait until the cookie popup disappears before proceeding
    console.log('Cookie accepted');
  }

  // ====================================================
  // STEP 3: Log in with email and OTP
  // ====================================================
  await page.getByPlaceholder('Enter Email').fill('amar@hack2skill.com');
  // Fill in the email address

  await page.locator('[data-id="auth-login-button"]').click();
  // Click the login button to trigger OTP

  await page.waitForTimeout(3000);
  // Wait for the OTP input screen to load

  const otp = '123456';
  // The OTP to enter

  const otpInputs = page.locator('[data-id="auth-otp-input"]');
  // Locate all OTP input boxes (one box per digit)

  for (let i = 0; i < otp.length; i++) {
    await otpInputs.nth(i).fill(otp[i]);
    // Fill each digit into its corresponding input box
  }

  await page.locator('[data-id="auth-verify-button"]').click();
  // Submit the OTP

  await page.waitForTimeout(3000);
  // Wait for the dashboard to load after login

  console.log('Login successful');

  // ====================================================
  // STEP 4: Navigate to the Submissions tab
  // ====================================================
  const tabList = page.getByRole('tablist');
  // Locate the main tab bar (Roadmap, Submissions, etc.)

  const submissionsTab = tabList.getByRole('tab', { name: 'Submissions', exact: true });
  // Find the exact "Submissions" tab within the tab bar

  await submissionsTab.scrollIntoViewIfNeeded();
  await submissionsTab.click();
  // Scroll to and click the Submissions tab

  await expect(submissionsTab).toHaveAttribute('aria-selected', 'true');
  // Verify the tab is now selected

  console.log('Navigated to Submissions tab');

  // ====================================================
  // STEP 5: Check all three sub-tabs to find where the submission is
  // ====================================================
  // This pre-check helps us give a clear failure reason
  // if the submission is not in the Ongoing tab

  // Check Upcoming tab
  const upcomingTab = page.getByRole('tab', { name: 'Upcoming', exact: true });
  await upcomingTab.click();
  await page.waitForTimeout(1000);
  const inUpcoming = await page.locator('text=Project Submission').isVisible().catch(() => false);
  // true if submission card is found in Upcoming tab

  // Check Past tab
  const pastTab = page.getByRole('tab', { name: 'Past', exact: true });
  await pastTab.click();
  await page.waitForTimeout(1000);
  const inPast = await page.locator('text=Project Submission').isVisible().catch(() => false);
  // true if submission card is found in Past tab

  // Check Ongoing tab
  const ongoingTab = page.getByRole('tab', { name: 'Ongoing', exact: true });
  await ongoingTab.click();
  await page.waitForTimeout(1000);
  const inOngoing = await page.locator('text=Project Submission').isVisible().catch(() => false);
  // true if submission card is found in Ongoing tab

  console.log(`Submission status — Upcoming: ${inUpcoming}, Ongoing: ${inOngoing}, Past: ${inPast}`);

  // ====================================================
  // STEP 6: Fail with a clear reason if submission is not in Ongoing tab
  // ====================================================

  if (inUpcoming && !inOngoing) {
    // Submission window has not started yet
    console.log('TEST FAILED - Submission is currently in the Upcoming tab, not in Ongoing. The submission window has not opened yet. Run this test when the submission window is active.');
    throw new Error('Submission is in Upcoming tab — submission window has not started yet.');
  }

  if (inPast && !inOngoing) {
    // Submission window has already ended
    console.log('TEST FAILED - Submission has moved to the Past tab, meaning the submission window has already closed. Run this test when the submission window is active.');
    throw new Error('Submission is in Past tab — submission window has already closed.');
  }

  if (!inOngoing && !inUpcoming && !inPast) {
    // Submission not found anywhere
    console.log('TEST FAILED - Submission was not found in any tab (Upcoming, Ongoing, or Past). Please verify that the submission module exists and that the correct user account is logged in.');
    throw new Error('Submission not found in any tab — check login and submission module.');
  }

  console.log('Submission confirmed in Ongoing tab before page refresh');

  // ====================================================
  // STEP 7: Refresh the page
  // ====================================================
  await page.reload();
  // Simulate pressing F5 / browser refresh

  await page.waitForLoadState('domcontentloaded');
  // Wait for the HTML structure to fully reload

  await page.waitForTimeout(3000);
  // Wait for React components to re-render

  console.log('Page refreshed successfully');

  // ====================================================
  // STEP 8: Navigate back to Submissions → Ongoing after refresh
  // ====================================================
  // After a page refresh, the tab selection resets
  // So we need to navigate back to Submissions → Ongoing manually

  const submissionsTabAfterRefresh = page.getByRole('tablist').getByRole('tab', { name: 'Submissions', exact: true });
  await submissionsTabAfterRefresh.scrollIntoViewIfNeeded();
  await submissionsTabAfterRefresh.click();
  await expect(submissionsTabAfterRefresh).toHaveAttribute('aria-selected', 'true');
  // Confirm Submissions tab is selected

  const ongoingTabAfterRefresh = page.getByRole('tab', { name: 'Ongoing', exact: true });
  await ongoingTabAfterRefresh.scrollIntoViewIfNeeded();
  await ongoingTabAfterRefresh.click();
  await expect(ongoingTabAfterRefresh).toHaveAttribute('aria-selected', 'true');
  // Confirm Ongoing sub-tab is selected

  console.log('Navigated back to Ongoing tab after refresh');

  // ====================================================
  // STEP 9: MAIN ASSERTION — Submission still visible after refresh?
  // ====================================================
  const visibleAfterRefresh = await page.locator('text=Project Submission').isVisible({ timeout: 10000 }).catch(() => false);

  if (!visibleAfterRefresh) {
    // Submission was visible before refresh but disappeared after — this is a bug
    console.log('TEST FAILED - Submission was visible in the Ongoing tab before refresh, but it is no longer visible after refresh. This is a bug — refreshing the page should not cause the submission to disappear.');
    throw new Error('Submission disappeared after page refresh — this is a bug.');
  }

  // ====================================================
  // FINAL: Test passed
  // ====================================================
  console.log('SCENARIO 3 PASSED - Submission is still visible in the Ongoing tab after page refresh.');
});