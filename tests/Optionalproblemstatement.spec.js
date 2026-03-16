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

test('Submission allowed without selecting problem statement when it is optional', async ({ page }) => {

  test.setTimeout(120000);
  // Allow up to 2 minutes since full form fill is involved

  // ====================================================
  // STEP 1: Open the website
  // ====================================================
  await page.goto(
    'https://alphavision.hack2skill.com/event/platform-automation-sandbox/dashboard/roadmap'
  );
  
  // DYNAMIC WAIT: Wait for the email input to be visible instead of a hard 3-second wait
  const emailInput = page.getByPlaceholder('Enter Email');
  await emailInput.waitFor({ state: 'visible', timeout: 15000 });

  // ====================================================
  // STEP 2: Accept cookie popup if it appears
  // ====================================================
  const cookieBtn = page.locator('[data-id="accept-cookies"]');

  if (await cookieBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await cookieBtn.click();
    await cookieBtn.waitFor({ state: 'hidden' });
    console.log('Cookie accepted');
  }

  // ====================================================
  // STEP 3: Log in with email and OTP
  // ====================================================
  await emailInput.fill('amar@hack2skill.com');
  await page.locator('[data-id="auth-login-button"]').click();

  // DYNAMIC WAIT: Wait for the first OTP input to appear
  const otpInputs = page.locator('[data-id="auth-otp-input"]');
  await otpInputs.first().waitFor({ state: 'visible', timeout: 10000 });

  const otp = '123456';
  for (let i = 0; i < otp.length; i++) {
    await otpInputs.nth(i).fill(otp[i]);
  }

  await page.locator('[data-id="auth-verify-button"]').click();

  // DYNAMIC WAIT: Wait for the dashboard tablist to render to confirm login success
  const tabList = page.getByRole('tablist');
  await tabList.waitFor({ state: 'visible', timeout: 15000 });
  console.log('Login successful');

  // ====================================================
  // STEP 4: Navigate to the Submissions tab
  // ====================================================
  const submissionsTab = tabList.getByRole('tab', { name: 'Submissions', exact: true });
  await submissionsTab.scrollIntoViewIfNeeded();
  await submissionsTab.click();
  await expect(submissionsTab).toHaveAttribute('aria-selected', 'true');
  console.log('Navigated to Submissions tab');

  // ====================================================
  // STEP 5: Open the submission form
  // ====================================================
  const ongoingTab = page.getByRole('tab', { name: 'Ongoing', exact: true });
  await ongoingTab.click();
  await expect(ongoingTab).toHaveAttribute('aria-selected', 'true');

  // DYNAMIC WAIT: Wait for network to settle instead of arbitrary stabilize timeouts
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => window.scrollTo(0, 0));

  // ====================================================
  // STEP 6: Check whether problem statement field is mandatory or optional
  // ====================================================
  const problemStatementDropdown = page.locator('#problemStatements').last();
  await problemStatementDropdown.waitFor({ state: 'visible', timeout: 10000 });
  await problemStatementDropdown.scrollIntoViewIfNeeded();

  const requiredMark = problemStatementDropdown.locator('xpath=..//[normalize-space(text())=""]');
  const isRequired = await requiredMark.isVisible({ timeout: 3000 }).catch(() => false);

  if (isRequired) {
    console.log('Info: Problem statement field is MANDATORY (* mark is present) on this form.');
  } else {
    console.log('Info: Problem statement field is OPTIONAL (no * mark) on this form.');
  }

  // ====================================================
  // STEP 7: Fill all fields EXCEPT problem statement
  // ====================================================

  // Playwright automatically waits for elements to be actionable (visible, enabled) 
  // before filling/clicking, so we don't need arbitrary timeouts between fields.

  const shortAnswer = page.getByRole('textbox', { name: 'Short answer type questions' }).last();
  await shortAnswer.scrollIntoViewIfNeeded();
  await shortAnswer.fill('This is dummy text for Short answer type questions');

  const paragraph = page.getByRole('textbox', { name: 'Enter Paragraph type question' }).last();
  await paragraph.scrollIntoViewIfNeeded();
  await paragraph.fill('This is dummy text for Paragraph type questions');

  const linkField = page.getByRole('textbox', { name: 'Link type question' }).last();
  await linkField.scrollIntoViewIfNeeded();
  await linkField.fill('https://www.lipsum.com/');

  const mcqRadio = page.locator('input[type="radio"][value="option 2"]').last();
  await mcqRadio.scrollIntoViewIfNeeded();
  await mcqRadio.check();

  const fileInput = page.locator('input[type="file"]').last();
  await fileInput.scrollIntoViewIfNeeded();
  await fileInput.setInputFiles('asset/challenges.png');

  const uploadModalBtn = page.getByRole('button', { name: 'Upload', exact: true });
  await uploadModalBtn.waitFor({ state: 'visible', timeout: 10000 });
  await uploadModalBtn.click();
  await uploadModalBtn.waitFor({ state: 'hidden', timeout: 10000 });

  // --- Searchable dropdown (React Select) ---
  const searchableLabel = page.locator('text=Searchable dropdown type question').last();
  await searchableLabel.scrollIntoViewIfNeeded();

  const searchableCbx = page.locator('input[id^="react-select-"]').last();
  await searchableCbx.scrollIntoViewIfNeeded();
  await searchableCbx.waitFor({ state: 'attached', timeout: 10000 });
  await searchableCbx.click({ force: true });

  await searchableCbx.press('Control+a');
  await searchableCbx.press('Backspace');
  await searchableCbx.pressSequentially('abcd', { delay: 100 });

  // DYNAMIC WAIT: Wait for the specific dropdown option to appear before clicking
  const dropdownOption = page.getByRole('option', { name: 'abcd', exact: true });
  await dropdownOption.waitFor({ state: 'visible', timeout: 5000 });
  await dropdownOption.click();

  // --- Normal dropdown ---
  const dropdownQuestion = page.locator('select:not(#problemStatements)').last();
  await dropdownQuestion.scrollIntoViewIfNeeded();
  await dropdownQuestion.selectOption({ label: 'dropdown 3' });

  // --- Linear scale slider ---
  const slider = page.locator('[role="slider"]').last();
  await slider.scrollIntoViewIfNeeded();
  await slider.waitFor({ state: 'visible' });
  await slider.focus();
  await page.keyboard.press('Home');

  const min = Number(await slider.getAttribute('aria-valuemin') ?? '1');
  const steps = SLIDER_TARGET_SCORE - min;

  for (let i = 0; i < steps; i++) {
    // DYNAMIC WAIT: Use the built-in delay inside the press function instead of an external timeout
    await page.keyboard.press('ArrowRight', { delay: 50 });
  }

  const finalSliderValue = await slider.getAttribute('aria-valuenow');
  console.log(Slider set to: ${finalSliderValue} (target: ${SLIDER_TARGET_SCORE}));

  // --- Date & Time fields ---
  const dateField = page.getByPlaceholder('Enter Date type question').last();
  await dateField.scrollIntoViewIfNeeded();
  await dateField.fill('2026-03-20');

  const timeField = page.getByPlaceholder('Enter Time type question').last();
  await timeField.scrollIntoViewIfNeeded();
  await timeField.fill('11:30');

  await expect(page.getByText('Value must be 12:59 or earlier.')).not.toBeVisible();

  console.log(All fields filled — problem statement intentionally left blank);

  // ====================================================
  // STEP 8: Submit the form
  // ====================================================
  const submitBtn = page.getByRole('button', { name: 'Submit' }).first();
  await submitBtn.scrollIntoViewIfNeeded();
  await submitBtn.click();

  // ====================================================
  // STEP 9: Handle the confirmation modal
  // ====================================================
  const confirmModal = page.locator('text=Submit Project for Evaluation');
  await expect(confirmModal).toBeVisible({ timeout: 15000 });

  const confirmSubmitBtn = page.getByRole('button', { name: 'Submit' }).last();
  
  // DYNAMIC WAIT: Wait up to 3 seconds for the button to appear. If it does, click it.
  const hasConfirmButton = await confirmSubmitBtn.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false);

  if (hasConfirmButton) {
    await confirmSubmitBtn.click();
    console.log('Confirmation modal submit button clicked');
  } else {
    console.log('Loading modal detected — submission is being processed automatically');
  }

  // DYNAMIC WAIT: Wait for modal to hide
  await confirmModal.waitFor({ state: 'hidden', timeout: 30000 });

  // ====================================================
  // STEP 10: Verify the success message
  // ====================================================
  const successMessage = page.getByText('Submission submitted successfully!');
  const isSuccess = await successMessage.waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false);

  if (!isSuccess) {
    console.log('TEST FAILED - Submission failed even though the problem statement was left blank and is optional.');
    throw new Error('Submission failed without problem statement — expected success but got failure.');
  }

  // ====================================================
  // FINAL: Test passed
  // ====================================================
  console.log(SCENARIO 5 PASSED - Submission was successful without selecting a problem statement. Problem statement was: ${isRequired ? 'MANDATORY' : 'OPTIONAL'}.);
});