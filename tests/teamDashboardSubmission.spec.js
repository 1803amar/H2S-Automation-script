const { test, expect } = require('@playwright/test');

// ====================================================
// CONFIGURATION
// ====================================================

// Max number of times "Add Submission" button will be clicked
// Total forms filled = MAX_ADD_SUBMISSIONS + 1
// After MAX_ADD_SUBMISSIONS clicks OR if "Add Submission" button
// is not visible, the Submit button will be clicked
const MAX_ADD_SUBMISSIONS = 3;

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
  for (let i = 0; i < otp.length; i++) {
    await otpInputs.nth(i).fill(otp[i]);
  }

  // Wait for verify button to be visible and enabled, then click
  const verifyBtn = page.locator('[data-id="auth-verify-button"]');
  await expect(verifyBtn).toBeVisible();
  await expect(verifyBtn).toBeEnabled();
  await verifyBtn.click();

  console.log('Login successful');
}

// ====================================================
// HELPER: Navigate to a named tab — uses .first() to
// avoid strict mode error when two tablists exist on page
// ====================================================
async function clickTab(page, tabName, tabList = null) {
  // Use provided tablist locator, or locate tab directly on page
  // .first() used because page has two tablists with same aria-label
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
// HELPER: Fill a visible text field with a value
// ====================================================
async function fillField(locator, value) {
  // Wait for field to be visible, scroll into view, then fill
  await expect(locator).toBeVisible({ timeout: 10000 });
  await locator.scrollIntoViewIfNeeded();
  await locator.fill(value);
}

// ====================================================
// HELPER: Set linear scale slider to a target score
// ====================================================
async function setSliderScore(page, targetScore) {
  // Always target the LAST slider — newest form section
  const slider = page.locator('[role="slider"]').last();
  await expect(slider).toBeVisible({ timeout: 10000 });
  await slider.scrollIntoViewIfNeeded();
  await slider.focus();
  // Press Home to reset to minimum, then ArrowRight to reach target
  await page.keyboard.press('Home');

  const min = Number(await slider.getAttribute('aria-valuemin') ?? '1');
  const steps = targetScore - min;
  // Calculate how many steps needed to reach target score from minimum

  for (let i = 0; i < steps; i++) {
    await page.keyboard.press('ArrowRight');
  }
  // Move slider one step at a time to reach target score

  const finalValue = await slider.getAttribute('aria-valuenow');
  console.log(`Slider set to: ${finalValue} (target: ${targetScore})`);
}

// ====================================================
// HELPER: Wait for page to stabilize after scroll reset
// ====================================================
async function waitForPageStable(page) {
  // Wait for DOM to load, then scroll back to top
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => window.scrollTo(0, 0));

  // Confirm page is stable by waiting for problem statement dropdown
  await expect(page.locator('#problemStatements').last()).toBeVisible({ timeout: 10000 });
}

// ====================================================
// HELPER: Fill one complete form section
// Always targets .last() — fills the newest appended form
// ====================================================
async function fillAndAddSubmission(page, runIndex) {
  console.log(`\nForm Fill Run #${runIndex + 1} started...`);

  // Wait for page to stabilize before filling
  // Important especially after "Add Submission" click appends a new section
  await waitForPageStable(page);

  // After each "Add Submission" click, a new form section is APPENDED at the bottom
  // So we always target .last() to fill the newest form section

  // --- Challenge / Problem Statement dropdown ---
  const challengeDropdown = page.locator('#problemStatements').last();
  await expect(challengeDropdown).toBeVisible({ timeout: 10000 });
  await challengeDropdown.scrollIntoViewIfNeeded();
  await challengeDropdown.selectOption({ value: '6992aed1cc85ebfb1c17540f' });

  // --- Short answer type question ---
  await fillField(
    page.getByRole('textbox', { name: 'Short answer type questions' }).last(),
    'This is dummy text for Short answer type questions'
  );

  // --- Paragraph type question ---
  await fillField(
    page.getByRole('textbox', { name: 'Enter Paragraph type question' }).last(),
    'This is dummy text for Paragraph type questions'
  );

  // --- Link type question ---
  await fillField(
    page.getByRole('textbox', { name: 'Link type question' }).last(),
    'https://www.lipsum.com/'
  );

  // --- MCQ — select radio option 2 ---
  const mcqRadio = page.locator('input[type="radio"][value="option 2"]').last();
  await expect(mcqRadio).toBeAttached({ timeout: 10000 });
  // Radio inputs may be CSS-hidden — check attached instead of visible
  await mcqRadio.scrollIntoViewIfNeeded();
  await mcqRadio.check();

  // --- File upload ---
  const fileInput = page.locator('input[type="file"]').last();
  await expect(fileInput).toBeAttached({ timeout: 10000 });
  // File inputs are hidden by default — check attached instead of visible
  await fileInput.setInputFiles('asset/challenges.png');

  // After file selection, a modal opens with an Upload button — click it
  const uploadModalBtn = page.getByRole('button', { name: 'Upload', exact: true });
  await expect(uploadModalBtn).toBeVisible({ timeout: 10000 });
  await uploadModalBtn.click();

  // Wait for upload modal to close before continuing
  await expect(uploadModalBtn).toBeHidden({ timeout: 10000 });

  // --- Searchable dropdown (React Select) ---
  // React Select renders a hidden <input> with generated id inside the combobox
  // Use .last() to always target the newest form's React Select input
  const searchableLabel = page.locator('text=Searchable dropdown type question').last();
  await expect(searchableLabel).toBeVisible({ timeout: 10000 });
  await searchableLabel.scrollIntoViewIfNeeded();

  const searchableCbx = page.locator('input[id^="react-select-"]').last();
  await expect(searchableCbx).toBeAttached({ timeout: 10000 });
  // React Select input is hidden by default — check attached not visible

  await searchableCbx.click({ force: true });
  // Force click to open the dropdown

  await searchableCbx.press('Control+a');
  await searchableCbx.press('Backspace');
  // Clear any previously selected value

  await searchableCbx.pressSequentially('abcd', { delay: 100 });
  // Type search term character by character to trigger dropdown suggestions

  const dropdownOption = page.getByRole('option', { name: 'abcd', exact: true });
  await expect(dropdownOption).toBeVisible({ timeout: 5000 });
  await dropdownOption.click();
  // Wait for option to appear then click it

  // --- Normal dropdown ---
  // Target the last native <select> that is NOT the problem statement dropdown
  const dropdownQuestion = page.locator('select:not(#problemStatements)').last();
  await expect(dropdownQuestion).toBeVisible({ timeout: 10000 });
  await dropdownQuestion.scrollIntoViewIfNeeded();
  await dropdownQuestion.selectOption({ label: 'dropdown 3' });

  // --- Linear scale slider ---
  await setSliderScore(page, 5);

  // --- Date field ---
  const dateField = page.getByPlaceholder('Enter Date type question').last();
  await expect(dateField).toBeVisible({ timeout: 10000 });
  await dateField.scrollIntoViewIfNeeded();
  await dateField.fill('2026-03-20');
  // Fill date in YYYY-MM-DD format (HTML date input standard)

  // --- Time field ---
  const timeField = page.getByPlaceholder('Enter Time type question').last();
  await expect(timeField).toBeVisible({ timeout: 10000 });
  await timeField.scrollIntoViewIfNeeded();
  await timeField.fill('11:30');
  // Fill time in HH:MM format (24-hour)

  // Verify no time validation error is shown after filling time
  await expect(page.getByText('Value must be 12:59 or earlier.')).not.toBeVisible();

  console.log(`Form Fill Run #${runIndex + 1} completed.`);
}

// ====================================================
// TEST: Team dashboard project submission
// ====================================================

test('Team dashboard project submission', async ({ page }) => {

  test.setTimeout(120000);
  // Allow up to 2 minutes since multiple form fills are involved

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

  // Wait for main dashboard tablist to be visible after login
  // Use .first() to avoid strict mode error — page has two tablists with same aria-label
  const tabList = page.getByRole('tablist').first();
  await expect(tabList).toBeVisible({ timeout: 15000 });

  // ====================================================
  // STEP 4: Navigate to the Submissions tab
  // ====================================================
  await clickTab(page, 'Submissions', tabList);
  console.log('Navigated to Submissions tab');

  // ====================================================
  // STEP 5: Click the Ongoing sub-tab
  // ====================================================
  await clickTab(page, 'Ongoing');
  console.log('Navigated to Ongoing sub-tab');

  // ====================================================
  // STEP 6: Fill form loop
  // Fill form → click "Add Submission" if visible AND under limit → else Submit
  // Total forms filled = up to MAX_ADD_SUBMISSIONS + 1
  // ====================================================
  for (let i = 0; i <= MAX_ADD_SUBMISSIONS; i++) {

    await fillAndAddSubmission(page, i);

    const addBtn = page.getByText('Add Submission', { exact: true });
    const addBtnVisible = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (i < MAX_ADD_SUBMISSIONS && addBtnVisible) {
      // More forms to fill and button is visible — click Add Submission
      console.log(`Clicking "Add Submission" for run #${i + 1}...`);
      await addBtn.click();

      // Wait for new form section to be appended before next fill
      await expect(page.locator('#problemStatements').last()).toBeVisible({ timeout: 10000 });
    } else {
      // Either reached max limit OR button not visible — proceed to Submit
      if (!addBtnVisible) {
        console.log(`"Add Submission" button not visible after run #${i + 1}, proceeding to Submit.`);
      } else {
        console.log(`Reached max ${MAX_ADD_SUBMISSIONS} add submissions, proceeding to Submit.`);
      }
      break;
    }
  }

  // ====================================================
  // STEP 7: Click the form Submit button
  // ====================================================
  const firstSubmit = page.getByRole('button', { name: 'Submit' }).first();
  await expect(firstSubmit).toBeVisible();
  await firstSubmit.scrollIntoViewIfNeeded();
  await firstSubmit.click();
  // Click the first Submit button in the form section

  // ====================================================
  // STEP 8: Handle the confirmation modal
  // ====================================================
  // Wait for confirmation modal to appear
  const modal = page.locator('text=Submit Project for Evaluation');
  await expect(modal).toBeVisible({ timeout: 15000 });

  // Click Submit button inside the confirmation modal
  const confirmSubmit = page.getByRole('button', { name: 'Submit' }).last();
  await expect(confirmSubmit).toBeVisible({ timeout: 5000 });
  await confirmSubmit.click();

  // Wait for modal to close after submission
  await expect(modal).toBeHidden({ timeout: 30000 });

  // ====================================================
  // STEP 9: Verify success message
  // ====================================================
  const successMessage = page.getByText('Submission submitted successfully!');
  await expect(successMessage).toBeVisible({ timeout: 15000 });
  // If success message is not visible, test will fail with a clear message

  console.log('Submission submitted successfully message appeared on the screen.');

});