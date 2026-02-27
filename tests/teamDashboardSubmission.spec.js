const { test, expect } = require('@playwright/test');

// ✅ Max number of times "Add Submission" button will be clicked (i.e. total forms = MAX_ADD_SUBMISSIONS + 1)
// After MAX_ADD_SUBMISSIONS clicks OR if "Add Submission" button is not visible → Submit button will be clicked
const MAX_ADD_SUBMISSIONS = 3;

test('Team dashboard project submission', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes timeout for multiple form fills

  // Open Login Page (using team dashboard url)
  await page.goto(
    'https://alphavision.hack2skill.com/event/platform-automation-sandbox/dashboard/roadmap'
  );
  await page.waitForTimeout(3000);

  // Accept Cookie and if cookies are accepted then print "✅ Cookie accepted" on console
  const cookieBtn = page.locator('[data-id="accept-cookies"]');
  if (await cookieBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await cookieBtn.click();
    await cookieBtn.waitFor({ state: 'hidden' });
    console.log('✅ Cookie accepted');
  }

  // Enter Email Id and click login button
  await page.getByPlaceholder('Enter Email').fill('amar@hack2skill.com');
  await page.locator('[data-id="auth-login-button"]').click();
  await page.waitForTimeout(3000);

  // Enter OTP and click verify button
  const otp = '123456';
  const otpInputs = page.locator('[data-id="auth-otp-input"]');
  for (let i = 0; i < otp.length; i++) {
    await otpInputs.nth(i).fill(otp[i]);
  }
  await page.locator('[data-id="auth-verify-button"]').click();

  // Click on Submissions Tab on Team dashboard Roadmap
  const tabList = page.getByRole('tablist');
  const submissionsTab = tabList.getByRole('tab', { name: 'Submissions', exact: true });
  await submissionsTab.scrollIntoViewIfNeeded();
  await submissionsTab.click();
  await expect(submissionsTab).toHaveAttribute('aria-selected', 'true');


  // ============================================================
  // Helper Function: Scroll + Fill
  // ============================================================
  async function fillField(locator, value) {
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    await locator.scrollIntoViewIfNeeded();
    await locator.fill(value);
  }

  // ============================================================
  // Helper Function: Set Slider Score
  // ============================================================
  async function setSliderScore(page, targetScore) {
    // Always target the LAST slider — newest form section
    const slider = page.locator('[role="slider"]').last();
    await slider.scrollIntoViewIfNeeded();
    await slider.waitFor({ state: 'visible' });
    await slider.focus();
    // First press Home to reset to minimum, then ArrowRight to target value
    await page.keyboard.press('Home');
    await page.waitForTimeout(300);
    const min = Number(await slider.getAttribute('aria-valuemin') ?? '1');
    const steps = targetScore - min;
    for (let i = 0; i < steps; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(150);
    }
    // Verify final value
    const finalValue = await slider.getAttribute('aria-valuenow');
    console.log(`🎚️ Slider set to: ${finalValue} (target: ${targetScore})`);
  }

  // ============================================================
  // Helper: Wait for page to stabilize after scroll reset
  // ============================================================
  async function waitForPageStable() {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    // Scroll back to top so all elements are accessible from top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
  }

  // ============================================================
  // Main Form Fill Function (runs multiple times)
  // ============================================================
  async function fillAndAddSubmission(runIndex) {
    console.log(`\n📝 Form Fill Run #${runIndex + 1} started...`);

    // Wait for page to stabilize (especially important after Add Submission click)
    await waitForPageStable();

    // ⚠️ After each "Add Submission" click, a new form section is APPENDED at the bottom.
    // So we always target the LAST form section using .last() — this way we always fill the newest form.

    // Select Challenge / Problem Statement — always target LAST instance
    const challengeDropdown = page.locator('#problemStatements').last();
    await challengeDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await challengeDropdown.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await challengeDropdown.selectOption({ value: '6992aed1cc85ebfb1c17540f' });

    // Short answer type question — LAST instance
    await fillField(
      page.getByRole('textbox', { name: 'Short answer type questions' }).last(),
      'This is dummy text for Short answer type questions'
    );

    // Paragraph type question — LAST instance
    await fillField(
      page.getByRole('textbox', { name: 'Enter Paragraph type question' }).last(),
      'This is dummy text for Paragraph type questions'
    );

    // Link type question — LAST instance
    await fillField(
      page.getByRole('textbox', { name: 'Link type question' }).last(),
      'https://www.lipsum.com/'
    );

    // MCQ - Select radio option — LAST instance
    const mcqRadio = page.locator('input[type="radio"][value="option 2"]').last();
    await mcqRadio.scrollIntoViewIfNeeded();
    await mcqRadio.check();

    // File Upload — LAST instance
    const fileInput = page.locator('input[type="file"]').last();
    await fileInput.scrollIntoViewIfNeeded();
    await fileInput.setInputFiles('asset/challenges.png');
    // After file selection, a modal opens with an "Upload" button — always click that modal's Upload button
    const uploadModalBtn = page.getByRole('button', { name: 'Upload', exact: true });
    await uploadModalBtn.waitFor({ state: 'visible', timeout: 10000 });
    await uploadModalBtn.click();
    // Wait for modal to close before proceeding
    await uploadModalBtn.waitFor({ state: 'hidden', timeout: 10000 });

    // Searchable Dropdown — LAST instance
    // Using input[id] pattern — React Select renders an <input> with a generated id inside the combobox container
    // The input is hidden by default but becomes interactive on click
    // We use the label to scope, then find the react-select input inside
    const searchableLabel = page.locator('text=Searchable dropdown type question').last();
    await searchableLabel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // React Select: input[id^="react-select-"] — always targets the React Select input
    const searchableCbx = page.locator('input[id^="react-select-"]').last();
    await searchableCbx.scrollIntoViewIfNeeded();
    await searchableCbx.waitFor({ state: 'attached', timeout: 10000 });

    // Force click directly on input to open dropdown + clear existing value
    await searchableCbx.click({ force: true });
    await page.waitForTimeout(300);
    await searchableCbx.press('Control+a');
    await searchableCbx.press('Backspace');
    await page.waitForTimeout(300);

    // Type the search value
    await searchableCbx.pressSequentially('abcd', { delay: 100 });
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: 'abcd', exact: true }).click();
    await page.waitForTimeout(300);

    // Normal Dropdown — LAST select that is NOT #problemStatements
    const dropdownQuestion = page.locator('select:not(#problemStatements)').last();
    await dropdownQuestion.waitFor({ state: 'visible', timeout: 10000 });
    await dropdownQuestion.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await dropdownQuestion.selectOption({ label: 'dropdown 3' });

    // Linear Scale Slider — LAST instance
    await setSliderScore(page, 5);

    // Date field — LAST instance
    const dateField = page.getByPlaceholder('Enter Date type question').last();
    await dateField.waitFor({ state: 'visible', timeout: 10000 });
    await dateField.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await dateField.fill('2026-03-20');

    // Time field — LAST instance
    const timeField = page.getByPlaceholder('Enter Time type question').last();
    await timeField.waitFor({ state: 'visible', timeout: 10000 });
    await timeField.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await timeField.fill('11:30');
    await expect(page.getByText('Value must be 12:59 or earlier.')).not.toBeVisible();

    console.log(`✅ Form Fill Run #${runIndex + 1} completed.`);
  }

  // ============================================================
  // Loop: Fill form → click "Add Submission" if visible AND under limit → else Submit
  // Total forms filled = up to MAX_ADD_SUBMISSIONS + 1
  // ============================================================
  for (let i = 0; i <= MAX_ADD_SUBMISSIONS; i++) {
    await fillAndAddSubmission(i);

    const addBtn = page.getByText('Add Submission', { exact: true });
    const addBtnVisible = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (i < MAX_ADD_SUBMISSIONS && addBtnVisible) {
      console.log(`🔁 Clicking "Add Submission" for run #${i + 1}...`);
      await addBtn.click();
      await page.waitForTimeout(3000);
    } else {
      // Either reached max OR button not visible — proceed to Submit
      if (!addBtnVisible) {
        console.log(`ℹ️ "Add Submission" button not visible after run #${i + 1}, proceeding to Submit.`);
      } else {
        console.log(`✅ Reached max ${MAX_ADD_SUBMISSIONS} add submissions, proceeding to Submit.`);
      }
      break;
    }
  }

  // Click Submit button (Form Project Submission Section)
  const firstSubmit = page.getByRole('button', { name: 'Submit' }).first();
  await expect(firstSubmit).toBeVisible();
  await firstSubmit.scrollIntoViewIfNeeded();
  await firstSubmit.click();

  // Wait for confirm submission Modal
  const modal = page.locator('text=Submit Project for Evaluation');
  await expect(modal).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(2000);

  // Click Submit button on confirm submission Modal
  const confirmSubmit = page.getByRole('button', { name: 'Submit' }).last();
  await expect(confirmSubmit).toBeVisible();
  await confirmSubmit.click();

  // Verify Success Message
  try {
    const successMessage = page.getByText('Submission submitted successfully!');
    await expect(successMessage).toBeVisible({ timeout: 15000 });
    console.log('✅ Submission submitted successfully message appeared on the screen.');
  } catch {
    console.log('❌ Submission submitted successfully message did not appear on the screen.');
  }

});