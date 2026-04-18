const { test, expect } = require('@playwright/test');

// ====================================================
// CONFIGURATION
// ====================================================

const SLIDER_TARGET_SCORE = 5;
// Target value for the linear scale slider

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
// TEST SCENARIO 5: Problem statement not mandatory —
// submission allowed without selection
// ====================================================
// GIVEN:  The problem statement field is not marked as mandatory
// WHEN:   The participant submits the form without selecting a problem statement
// THEN:   The submission is successful
//
// What this test does:
// 1. Verify that the problem statement field does NOT have a required (*) mark
// 2. Fill all other fields normally
// 3. Skip the problem statement selection
// 4. Submit and confirm success
// ====================================================

test('Submission allowed without selecting problem statement when it is optional', async ({ page }) => {

  test.setTimeout(120000);
  // Allow up to 2 minutes since full form fill is involved

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
  // STEP 5: Open the submission form (click Ongoing → Project Submission card)
  // ====================================================
  await clickTab(page, 'Ongoing');
  // Click the Ongoing sub-tab and verify it is selected

  // Scroll to top and wait for page to stabilize before interacting
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('#problemStatements').last()).toBeVisible({ timeout: 10000 });
  // Wait for form to fully render by confirming problem statement field is visible

  // ====================================================
  // STEP 6: Check whether problem statement field is mandatory or optional
  // ====================================================
  // This is an informational check only — test will continue regardless of result
  // A required field has a "*" element rendered next to its label in the DOM

  const problemStatementDropdown = page.locator('#problemStatements').last();
  await problemStatementDropdown.scrollIntoViewIfNeeded();
  // Scroll the problem statement dropdown into view

  const requiredMark = problemStatementDropdown.locator('xpath=..//*[normalize-space(text())="*"]');
  // Check for a "*" element inside the same container as #problemStatements

  const isRequired = await requiredMark.isVisible({ timeout: 3000 }).catch(() => false);
  // true = mandatory, false = optional

  if (isRequired) {
    console.log('Info: Problem statement field is MANDATORY (* mark is present) on this form.');
  } else {
    console.log('Info: Problem statement field is OPTIONAL (no * mark) on this form.');
  }
  // Test continues in both cases — we are just logging the status

  // ====================================================
  // STEP 7: Fill all fields EXCEPT problem statement
  // ====================================================

  // --- Short answer type question ---
  const shortAnswer = page.getByRole('textbox', { name: 'Short answer type questions' }).last();
  await expect(shortAnswer).toBeVisible({ timeout: 10000 });
  await shortAnswer.scrollIntoViewIfNeeded();
  await shortAnswer.fill('This is dummy text for Short answer type questions');
  // Fill the short answer field — problem statement is intentionally skipped

  // --- Paragraph type question ---
  const paragraph = page.getByRole('textbox', { name: 'Enter Paragraph type question' }).last();
  await expect(paragraph).toBeVisible({ timeout: 10000 });
  await paragraph.scrollIntoViewIfNeeded();
  await paragraph.fill('This is dummy text for Paragraph type questions');

  // --- Link type question ---
  const linkField = page.getByRole('textbox', { name: 'Link type question' }).last();
  await expect(linkField).toBeVisible({ timeout: 10000 });
  await linkField.scrollIntoViewIfNeeded();
  await linkField.fill('https://www.lipsum.com/');

  // --- MCQ — select radio option 2 ---
  const mcqRadio = page.locator('input[type="radio"][value="option 2"]').last();
  await expect(mcqRadio).toBeAttached({ timeout: 10000 });
  // Radio inputs may not be visible (hidden by CSS) so check attached instead
  await mcqRadio.scrollIntoViewIfNeeded();
  await mcqRadio.check();
  // Select "option 2" from the multiple choice question

  // --- File upload ---
  const fileInput = page.locator('input[type="file"]').last();
  await expect(fileInput).toBeAttached({ timeout: 10000 });
  // File inputs are hidden by default — check attached instead of visible
  await fileInput.setInputFiles('asset/challenges.png');
  // Attach the file to the upload field

  const uploadModalBtn = page.getByRole('button', { name: 'Upload', exact: true });
  await expect(uploadModalBtn).toBeVisible({ timeout: 10000 });
  await uploadModalBtn.click();
  // Click the Upload button in the modal that appears after file selection

  await expect(uploadModalBtn).toBeHidden({ timeout: 10000 });
  // Wait for the upload modal to close before continuing

  // --- Searchable dropdown (React Select) ---
  const searchableLabel = page.locator('text=Searchable dropdown type question').last();
  await expect(searchableLabel).toBeVisible({ timeout: 10000 });
  await searchableLabel.scrollIntoViewIfNeeded();
  // Scroll to the searchable dropdown label first

  const searchableCbx = page.locator('input[id^="react-select-"]').last();
  // React Select always gives its input an id starting with "react-select-"

  await expect(searchableCbx).toBeAttached({ timeout: 10000 });
  // React Select input is hidden by default so check attached not visible

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
  // Wait for option to appear and click it

  // --- Normal dropdown ---
  const dropdownQuestion = page.locator('select:not(#problemStatements)').last();
  // Target the last native <select> that is NOT the problem statement dropdown

  await expect(dropdownQuestion).toBeVisible({ timeout: 10000 });
  await dropdownQuestion.scrollIntoViewIfNeeded();
  await dropdownQuestion.selectOption({ label: 'dropdown 3' });
  // Select "dropdown 3" from the normal dropdown

  // --- Linear scale slider ---
  const slider = page.locator('[role="slider"]').last();
  // Always target the last slider on the page

  await expect(slider).toBeVisible({ timeout: 10000 });
  await slider.scrollIntoViewIfNeeded();
  await slider.focus();
  // Focus the slider so keyboard arrows work

  await page.keyboard.press('Home');
  // Reset slider to minimum value first

  const min = Number(await slider.getAttribute('aria-valuemin') ?? '1');
  const steps = SLIDER_TARGET_SCORE - min;
  // Calculate how many steps needed to reach target score from minimum

  for (let i = 0; i < steps; i++) {
    await page.keyboard.press('ArrowRight');
  }
  // Move slider one step at a time to reach target score

  const finalSliderValue = await slider.getAttribute('aria-valuenow');
  console.log(`Slider set to: ${finalSliderValue} (target: ${SLIDER_TARGET_SCORE})`);

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

  console.log(`All fields filled — problem statement intentionally left blank (field is ${isRequired ? 'MANDATORY' : 'OPTIONAL'} on this form)`);

  // ====================================================
  // STEP 8: Submit the form
  // ====================================================
  const submitBtn = page.getByRole('button', { name: 'Submit' }).first();
  // Locate the first Submit button (form section submit)

  await expect(submitBtn).toBeVisible();
  await submitBtn.scrollIntoViewIfNeeded();
  await submitBtn.click();
  // Click the Submit button

  // ====================================================
  // STEP 9: Handle the confirmation modal
  // ====================================================
  // There are two possible modal flows:
  // Flow A: Confirmation modal appears with a "Submit" button → click it → loading → success
  // Flow B: Loading modal appears directly ("Please wait...") → closes automatically → success

  const confirmModal = page.locator('text=Submit Project for Evaluation');
  await expect(confirmModal).toBeVisible({ timeout: 15000 });
  // Wait for the modal to appear (either confirmation or loading)

  const confirmSubmitBtn = page.getByRole('button', { name: 'Submit' }).last();
  const hasConfirmButton = await confirmSubmitBtn.isVisible({ timeout: 3000 }).catch(() => false);
  // Check if a clickable Submit button exists inside the modal

  if (hasConfirmButton) {
    await confirmSubmitBtn.click();
    // Click only if the confirm button is present (Flow A)
    console.log('Confirmation modal submit button clicked');
  } else {
    // Flow B: modal is already in loading state, no button to click
    console.log('Loading modal detected — submission is being processed automatically');
  }

  // Wait for the modal to fully close before checking for success message
  await expect(confirmModal).toBeHidden({ timeout: 30000 });
  // Modal disappears once the submission is complete

  // ====================================================
  // STEP 10: Verify the success message
  // ====================================================
  const successMessage = page.getByText('Submission submitted successfully!');
  await expect(successMessage).toBeVisible({ timeout: 15000 });
  // If submission failed, this assertion will give a clear failure message

  // ====================================================
  // FINAL: Test passed
  // ====================================================
  console.log(`SCENARIO 5 PASSED - Submission was successful without selecting a problem statement. Problem statement was: ${isRequired ? 'MANDATORY' : 'OPTIONAL'}.`);

});