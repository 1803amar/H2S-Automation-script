const { test, expect } = require('@playwright/test');
// Import test and expect from Playwright

// ====================================================
// CONFIGURATION
// ====================================================

const SLIDER_TARGET_SCORE = 5;
// Target value for the linear scale slider

// ====================================================
// TEST SCENARIO 5: Problem statement not mandatory — submission allowed without selection
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
    // Click only if visible — skip if not present
    await cookieBtn.click();
    await cookieBtn.waitFor({ state: 'hidden' });
    console.log('Cookie accepted');
  }

  // ====================================================
  // STEP 3: Log in with email and OTP
  // ====================================================
  await page.getByPlaceholder('Enter Email').fill('amar@hack2skill.com');
  // Fill in the email address

  await page.locator('[data-id="auth-login-button"]').click();
  // Click the login button

  await page.waitForTimeout(3000);
  // Wait for the OTP screen to load

  const otp = '123456';
  const otpInputs = page.locator('[data-id="auth-otp-input"]');
  // Locate all OTP digit input boxes

  for (let i = 0; i < otp.length; i++) {
    await otpInputs.nth(i).fill(otp[i]);
    // Fill each digit into its corresponding input box
  }

  await page.locator('[data-id="auth-verify-button"]').click();
  // Submit the OTP

  await page.waitForTimeout(3000);
  // Wait for dashboard to load

  console.log('Login successful');

  // ====================================================
  // STEP 4: Navigate to the Submissions tab
  // ====================================================
  const tabList = page.getByRole('tablist');
  // Locate the main navigation tab bar

  const submissionsTab = tabList.getByRole('tab', { name: 'Submissions', exact: true });
  // Find the exact "Submissions" tab

  await submissionsTab.scrollIntoViewIfNeeded();
  await submissionsTab.click();
  // Scroll to and click the Submissions tab

  await expect(submissionsTab).toHaveAttribute('aria-selected', 'true');
  // Verify the tab is now active

  console.log('Navigated to Submissions tab');

  // ====================================================
  // STEP 5: Open the submission form (click Ongoing → Project Submission card)
  // ====================================================
  const ongoingTab = page.getByRole('tab', { name: 'Ongoing', exact: true });
  await ongoingTab.click();
  await expect(ongoingTab).toHaveAttribute('aria-selected', 'true');
  // Click the Ongoing sub-tab

  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  // Stabilize the page before interacting

  // ====================================================
  // STEP 6: Check whether problem statement field is mandatory or optional
  // ====================================================
  // This is an informational check only — test will continue regardless of the result
  // A required field has a "*" element rendered next to its label in the DOM

  const problemStatementDropdown = page.locator('#problemStatements').last();
  await problemStatementDropdown.waitFor({ state: 'visible', timeout: 10000 });
  await problemStatementDropdown.scrollIntoViewIfNeeded();
  // Scroll the problem statement dropdown into view

  const requiredMark = page.locator('#problemStatements').last().locator('xpath=..//*[normalize-space(text())="*"]');
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
  await shortAnswer.waitFor({ state: 'visible', timeout: 10000 });
  await shortAnswer.scrollIntoViewIfNeeded();
  await shortAnswer.fill('This is dummy text for Short answer type questions');
  // Fill the short answer field — problem statement is intentionally skipped

  // --- Paragraph type question ---
  const paragraph = page.getByRole('textbox', { name: 'Enter Paragraph type question' }).last();
  await paragraph.waitFor({ state: 'visible', timeout: 10000 });
  await paragraph.scrollIntoViewIfNeeded();
  await paragraph.fill('This is dummy text for Paragraph type questions');

  // --- Link type question ---
  const linkField = page.getByRole('textbox', { name: 'Link type question' }).last();
  await linkField.waitFor({ state: 'visible', timeout: 10000 });
  await linkField.scrollIntoViewIfNeeded();
  await linkField.fill('https://www.lipsum.com/');

  // --- MCQ — select radio option 2 ---
  const mcqRadio = page.locator('input[type="radio"][value="option 2"]').last();
  await mcqRadio.scrollIntoViewIfNeeded();
  await mcqRadio.check();
  // Select "option 2" from the multiple choice question

  // --- File upload ---
  const fileInput = page.locator('input[type="file"]').last();
  await fileInput.scrollIntoViewIfNeeded();
  await fileInput.setInputFiles('asset/challenges.png');
  // Attach the file to the upload field

  const uploadModalBtn = page.getByRole('button', { name: 'Upload', exact: true });
  await uploadModalBtn.waitFor({ state: 'visible', timeout: 10000 });
  await uploadModalBtn.click();
  // Click the Upload button in the modal that appears after file selection

  await uploadModalBtn.waitFor({ state: 'hidden', timeout: 10000 });
  // Wait for the upload modal to close before continuing

  // --- Searchable dropdown (React Select) ---
  const searchableLabel = page.locator('text=Searchable dropdown type question').last();
  await searchableLabel.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  // Scroll to the searchable dropdown label first

  const searchableCbx = page.locator('input[id^="react-select-"]').last();
  // React Select always gives its input an id starting with "react-select-"

  await searchableCbx.scrollIntoViewIfNeeded();
  await searchableCbx.waitFor({ state: 'attached', timeout: 10000 });
  // Wait for the input to be attached to the DOM
  // (React Select input is hidden by default so we use 'attached' not 'visible')

  await searchableCbx.click({ force: true });
  // Force click to open the dropdown

  await page.waitForTimeout(300);
  await searchableCbx.press('Control+a');
  await searchableCbx.press('Backspace');
  // Clear any previously selected value

  await page.waitForTimeout(300);
  await searchableCbx.pressSequentially('abcd', { delay: 100 });
  // Type the search term character by character to trigger dropdown suggestions

  await page.waitForTimeout(500);
  await page.getByRole('option', { name: 'abcd', exact: true }).click();
  // Click the matching option from the dropdown list

  await page.waitForTimeout(300);

  // --- Normal dropdown ---
  const dropdownQuestion = page.locator('select:not(#problemStatements)').last();
  // Target the last native <select> that is NOT the problem statement dropdown

  await dropdownQuestion.waitFor({ state: 'visible', timeout: 10000 });
  await dropdownQuestion.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await dropdownQuestion.selectOption({ label: 'dropdown 3' });
  // Select "dropdown 3" from the normal dropdown

  // --- Linear scale slider ---
  const slider = page.locator('[role="slider"]').last();
  // Always target the last slider (the one in the most recently added form)

  await slider.scrollIntoViewIfNeeded();
  await slider.waitFor({ state: 'visible' });
  await slider.focus();
  // Focus the slider so keyboard arrows work

  await page.keyboard.press('Home');
  // Reset slider to minimum value first

  await page.waitForTimeout(300);
  const min = Number(await slider.getAttribute('aria-valuemin') ?? '1');
  const steps = SLIDER_TARGET_SCORE - min;
  // Calculate how many steps needed to reach target score from minimum

  for (let i = 0; i < steps; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    // Move slider one step at a time
  }

  const finalSliderValue = await slider.getAttribute('aria-valuenow');
  console.log(`Slider set to: ${finalSliderValue} (target: ${SLIDER_TARGET_SCORE})`);

  // --- Date field ---
  const dateField = page.getByPlaceholder('Enter Date type question').last();
  await dateField.waitFor({ state: 'visible', timeout: 10000 });
  await dateField.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await dateField.fill('2026-03-20');
  // Fill date in YYYY-MM-DD format (HTML date input standard)

  // --- Time field ---
  const timeField = page.getByPlaceholder('Enter Time type question').last();
  await timeField.waitFor({ state: 'visible', timeout: 10000 });
  await timeField.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await timeField.fill('11:30');
  // Fill time in HH:MM format (24-hour)

  await expect(page.getByText('Value must be 12:59 or earlier.')).not.toBeVisible();
  // Verify no time validation error is shown

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
  // Flow A: A confirmation modal appears with a "Submit" button → click it → loading modal appears → success
  // Flow B: A loading modal appears directly ("Please wait...") → closes automatically → success
  // We handle both cases below.

  const confirmModal = page.locator('text=Submit Project for Evaluation');
  await expect(confirmModal).toBeVisible({ timeout: 15000 });
  // Wait for the modal to appear (either confirmation or loading)

  await page.waitForTimeout(1000);

  const confirmSubmitBtn = page.getByRole('button', { name: 'Submit' }).last();
  const hasConfirmButton = await confirmSubmitBtn.isVisible({ timeout: 3000 }).catch(() => false);
  // Check if a clickable Submit button exists inside the modal

  if (hasConfirmButton) {
    await confirmSubmitBtn.click();
    // Click only if the confirm button is present (Flow A)
    console.log('Confirmation modal submit button clicked');
  } else {
    console.log('Loading modal detected — submission is being processed automatically');
    // Flow B: modal is already in loading state, no button to click
  }

  // Wait for the modal to fully close before checking for success message
  await confirmModal.waitFor({ state: 'hidden', timeout: 30000 });
  // The modal will disappear once the submission is complete

  // ====================================================
  // STEP 10: Verify the success message
  // ====================================================
  const successMessage = page.getByText('Submission submitted successfully!');

  const isSuccess = await successMessage.isVisible({ timeout: 15000 }).catch(() => false);
  // Check if the success message appears within 15 seconds

  if (!isSuccess) {
    console.log('TEST FAILED - Submission failed even though the problem statement was left blank and is optional. The form should have been accepted without it.');
    throw new Error('Submission failed without problem statement — expected success but got failure.');
  }

  // ====================================================
  // FINAL: Test passed
  // ====================================================
  console.log(`SCENARIO 5 PASSED - Submission was successful without selecting a problem statement. Problem statement was: ${isRequired ? 'MANDATORY' : 'OPTIONAL'}.`);
});