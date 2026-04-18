// const { test, expect } = require('@playwright/test');

// // ====================================================
// // SCENARIO 4: Complete Team Required — API Based Check
// // ====================================================
// //
// // GIVEN:
// //   - User is logged in
// //   - Dashboard API returns team size min/max and current member count
// //
// // WHEN:
// //   - Script intercepts the dashboard API response
// //   - Checks if current team members count is between min and max team size
// //
// // THEN (Team is complete — members between min and max):
// //   - Script proceeds to submit the project
// //   - Submission should be successful
// //
// // THEN (Team is incomplete — members less than min):
// //   - Script logs that team is incomplete
// //   - Does NOT attempt submission
// //   - Informs user to complete the team first
// //
// // ====================================================

// const EMAIL    = 'amar@hack2skill.com';
// const OTP      = '123456';
// const SUB_URL  = 'https://alphavision.hack2skill.com/event/platform-automation-sandbox/dashboard/submissions';
// const DASH_URL = 'https://alphavision.hack2skill.com/event/platform-automation-sandbox/dashboard/roadmap';
// const FILE_PATH = 'asset/challenges.png';
// const SLIDER_TARGET_SCORE = 5;

// // ====================================================
// // HELPER: Login
// // ====================================================
// async function login(page) {
//   await page.goto('https://alphavision.hack2skill.com/login');
//   await page.waitForTimeout(3000);

//   const cookieBtn = page.locator('[data-id="accept-cookies"]');
//   if (await cookieBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
//     await cookieBtn.click();
//     await cookieBtn.waitFor({ state: 'hidden' });
//     console.log('Cookie accepted');
//   }

//   await page.getByPlaceholder('Enter Email').fill(EMAIL);
//   await page.locator('[data-id="auth-login-button"]').click();
//   await page.waitForTimeout(3000);

//   const otpInputs = page.locator('[data-id="auth-otp-input"]');
//   for (let i = 0; i < OTP.length; i++) {
//     await otpInputs.nth(i).fill(OTP[i]);
//   }
//   await page.locator('[data-id="auth-verify-button"]').click();
//   await page.waitForTimeout(3000);
//   console.log('Login successful');
// }

// // ====================================================
// // HELPER: Set slider to target value
// // ====================================================
// async function setSlider(page, targetValue) {
//   // Scroll to slider container first using a visible parent element
//   const sliderContainer = page.locator('input[type="range"]').last();
//   await page.waitForTimeout(500);
//   // Small wait to ensure page is stable before interacting with slider
//   await sliderContainer.evaluate(el => el.scrollIntoView({ block: 'center' }));
//   // Use evaluate to scroll instead of scrollIntoViewIfNeeded
//   // — avoids "page closed" error when element is inside a modal or dynamic section
//   await page.waitForTimeout(500);
//   await sliderContainer.focus();
//   await sliderContainer.press('Home');
//   for (let i = 0; i < targetValue; i++) {
//     await sliderContainer.press('ArrowRight');
//   }
// }

// // ====================================================
// // TEST
// // ====================================================
// test('Scenario 4 — Check team size from API and submit if team is complete', async ({ page }) => {

//   test.setTimeout(180000);

//   // ── STEP 1: Login ─────────────────────────────────
//   await login(page);

//   // ── STEP 2: Intercept dashboard API response ───────
//   // The dashboard API is called when the dashboard page loads
//   // We capture its response to read team size info

//   let dashboardData = null;

//   page.on('response', async (response) => {
//     if (response.url().includes('dashboard') && response.request().method() === 'GET') {
//       try {
//         const json = await response.json().catch(() => null);
//         if (json && json.data && json.data.tags && json.data.tags.teamSize) {
//           dashboardData = json.data;
//           // Store API response data for later use
//         }
//       } catch (e) {
//         // Not a JSON response — skip
//       }
//     }
//   });

//   // ── STEP 3: Load dashboard page to trigger API call ─
//   await page.goto(DASH_URL);
//   await page.waitForTimeout(4000);
//   // Wait for API response to be captured

//   // ── STEP 4: Extract team size info from API response ─
//   if (!dashboardData) {
//     console.log('Dashboard API response not captured — trying to navigate again');
//     await page.reload();
//     await page.waitForTimeout(3000);
//   }

//   if (!dashboardData) {
//     console.log('Could not capture dashboard API data — manual check needed');
//     return;
//   }

//   // Read team size config from API
//   const minSize     = dashboardData.tags.teamSize.min;
//   const maxSize     = dashboardData.tags.teamSize.max;
//   const teamName    = dashboardData.team?.name || 'Unknown';
//   const innovators  = dashboardData.team?.innovators || [];
//   const currentSize = innovators.length;
//   // innovators array contains current team members

//   // Read current member count from webengage data as well
//   const currentMember = dashboardData.webengage?.teamManagement?.currentMember || currentSize;

//   console.log(`Team name: ${teamName}`);
//   console.log(`Team size config — Min: ${minSize}, Max: ${maxSize}`);
//   console.log(`Current members: ${currentMember}`);
//   innovators.forEach((m, i) => console.log(`  Member ${i + 1}: ${m.name}`));

//   // ── STEP 5: Check if team is complete ─────────────
//   // Team is complete if current members >= min required AND <= max allowed

//   // Edge case: if min is 0 or 1, it means no minimum team size is enforced
//   // In that case any number of members is acceptable
//   const effectiveMin = minSize <= 1 ? 1 : minSize;
//   // Treat min=0 same as min=1 — at least the user themselves is always present

//   if (currentMember < effectiveMin) {
//     // Team is incomplete — submission should not be allowed
//     console.log(`Team is INCOMPLETE — has ${currentMember} member(s) but minimum required is ${effectiveMin}`);
//     console.log('Attempting submission to verify backend rejects incomplete team...');

//     // Navigate to submissions and try to submit anyway to check backend response
//     await page.goto(SUB_URL);
//     await page.waitForTimeout(2000);

//     const ongoingTab = page.getByRole('tab', { name: 'Ongoing', exact: true });
//     await ongoingTab.waitFor({ state: 'visible', timeout: 10000 });
//     await ongoingTab.click();
//     await page.waitForTimeout(2000);

//     const submissionCard = page.locator('text=Project Submission').first();
//     const cardVisible = await submissionCard.isVisible({ timeout: 5000 }).catch(() => false);

//     if (!cardVisible) {
//       console.log('No submission card found in Ongoing tab');
//       return;
//     }

//     await submissionCard.click();
//     await page.waitForTimeout(2000);

//     const submitBtn = page.getByRole('button', { name: 'Submit', exact: true });
//     const submitVisible = await submitBtn.isVisible({ timeout: 5000 }).catch(() => false);

//     if (!submitVisible) {
//       console.log('Submit button not found — form may be locked for incomplete team');
//       console.log('Result: Submission correctly blocked at UI level for incomplete team');
//       return;
//     }

//     await submitBtn.scrollIntoViewIfNeeded();
//     await submitBtn.click();
//     await page.waitForTimeout(3000);
//     console.log('Submit clicked — checking for error response...');

//     // Check for error
//     const errorLocator = page.locator('[class*="error"], [class*="toast"], [role="alert"], [class*="snack"]').first();
//     const errorVisible = await errorLocator.isVisible({ timeout: 5000 }).catch(() => false);

//     if (errorVisible) {
//       const errorText = await errorLocator.textContent().catch(() => '');
//       console.log(`Error received: "${errorText.trim()}"`);
//       console.log('Result: Submission correctly blocked — incomplete team cannot submit');
//     } else {
//       const successLocator = page.locator('[class*="success"], [class*="toast"]').first();
//       const successVisible = await successLocator.isVisible({ timeout: 3000 }).catch(() => false);
//       if (successVisible) {
//         console.log('WARNING — Submission went through with an incomplete team!');
//         console.log('BUG — platform allowed submission even though team is incomplete');
//       } else {
//         console.log('No clear error or success — manual verification needed');
//       }
//     }
//     return;
//   }

//   if (maxSize > 0 && currentMember > maxSize) {
//     // maxSize=0 means unlimited — skip this check in that case
//     console.log(`Team size exceeds maximum — has ${currentMember} members but max allowed is ${maxSize}`);
//     console.log('This is an unusual state — manual check needed');
//     return;
//   }

//   // Team is complete (effectiveMin <= current <= max)
//   const maxLabel = maxSize === 0 ? 'unlimited' : String(maxSize);
//   console.log(`Team is COMPLETE — ${currentMember} member(s), within allowed range of ${effectiveMin}-${maxLabel}`);
//   console.log('Proceeding with project submission...');

//   // ── STEP 6: Navigate to Submissions → Ongoing ─────
//   await page.goto(SUB_URL);
//   await page.waitForTimeout(2000);

//   const ongoingTab = page.getByRole('tab', { name: 'Ongoing', exact: true });
//   await ongoingTab.waitFor({ state: 'visible', timeout: 10000 });
//   await ongoingTab.click();
//   await page.waitForTimeout(2000);

//   const submissionCard = page.locator('text=Project Submission').first();
//   const cardVisible = await submissionCard.isVisible({ timeout: 5000 }).catch(() => false);

//   if (!cardVisible) {
//     console.log('No submission card found in Ongoing tab');
//     return;
//   }

//   await submissionCard.click();
//   await page.waitForTimeout(2000);
//   console.log('Submission form opened');

//   // ── STEP 7: Fill all form fields ──────────────────
//   await page.evaluate(() => window.scrollTo(0, 0));
//   await page.waitForTimeout(1000);

//   // Challenges dropdown (problem statement) — select first available option
//   const challengesDropdown = page.locator('#problemStatements').last();
//   const challengesVisible = await challengesDropdown.isVisible({ timeout: 5000 }).catch(() => false);
//   if (challengesVisible) {
//     await challengesDropdown.scrollIntoViewIfNeeded();
//     await challengesDropdown.selectOption({ index: 1 });
//     await page.waitForTimeout(300);
//     console.log('Challenges selected');
//   }

//   // Short answer
//   const shortAnswer = page.getByRole('textbox', { name: 'Short answer type questions' }).last();
//   await shortAnswer.waitFor({ state: 'visible', timeout: 10000 });
//   await shortAnswer.scrollIntoViewIfNeeded();
//   await shortAnswer.fill('This is dummy text for Short answer type questions');

//   // Paragraph
//   const paragraph = page.getByRole('textbox', { name: 'Enter Paragraph type question' }).last();
//   await paragraph.waitFor({ state: 'visible', timeout: 10000 });
//   await paragraph.scrollIntoViewIfNeeded();
//   await paragraph.fill('This is dummy text for Paragraph type questions');

//   // Link
//   const linkField = page.getByRole('textbox', { name: 'Link type question' }).last();
//   await linkField.waitFor({ state: 'visible', timeout: 10000 });
//   await linkField.scrollIntoViewIfNeeded();
//   await linkField.fill('https://www.lipsum.com/');

//   // MCQ
//   const mcqRadio = page.locator('input[type="radio"][value="option 2"]').last();
//   await mcqRadio.scrollIntoViewIfNeeded();
//   await mcqRadio.check();

//   // File upload
//   const fileInput = page.locator('input[type="file"]').last();
//   await fileInput.scrollIntoViewIfNeeded();
//   await fileInput.setInputFiles(FILE_PATH);
//   const uploadModalBtn = page.getByRole('button', { name: 'Upload', exact: true });
//   await uploadModalBtn.waitFor({ state: 'visible', timeout: 10000 });
//   await uploadModalBtn.click();
//   await uploadModalBtn.waitFor({ state: 'hidden', timeout: 10000 });
//   await page.waitForLoadState('domcontentloaded');
//   await page.waitForTimeout(1500);
//   // Wait for page to fully stabilize after file upload modal closes

//   // Searchable dropdown (React Select)
//   const searchableLabel = page.locator('text=Searchable dropdown type question').last();
//   await searchableLabel.scrollIntoViewIfNeeded();
//   await page.waitForTimeout(500);
//   const searchableCbx = page.locator('input[id^="react-select-"]').last();
//   await searchableCbx.scrollIntoViewIfNeeded();
//   await searchableCbx.waitFor({ state: 'attached', timeout: 10000 });
//   await searchableCbx.click({ force: true });
//   await page.waitForTimeout(300);
//   await searchableCbx.press('Control+a');
//   await searchableCbx.press('Backspace');
//   await page.waitForTimeout(300);
//   await searchableCbx.pressSequentially('abcd', { delay: 100 });
//   await page.waitForTimeout(500);
//   await page.getByRole('option', { name: 'abcd', exact: true }).click();
//   await page.waitForTimeout(300);

//   // Normal dropdown
//   const dropdownQuestion = page.locator('select:not(#problemStatements)').last();
//   await dropdownQuestion.waitFor({ state: 'visible', timeout: 10000 });
//   await dropdownQuestion.scrollIntoViewIfNeeded();
//   await dropdownQuestion.selectOption({ index: 3 });
//   await page.waitForTimeout(300);

//   // Slider
//   await setSlider(page, SLIDER_TARGET_SCORE);
//   await page.waitForTimeout(300);

//   // Date
//   const dateField = page.getByRole('textbox', { name: /date type question/i }).last();
//   await dateField.waitFor({ state: 'visible', timeout: 10000 });
//   await dateField.scrollIntoViewIfNeeded();
//   await dateField.fill('2026-03-20');

//   // Time
//   const timeField = page.getByRole('textbox', { name: /time type question/i }).last();
//   await timeField.waitFor({ state: 'visible', timeout: 10000 });
//   await timeField.scrollIntoViewIfNeeded();
//   await timeField.fill('11:30');

//   console.log('All fields filled — submitting...');

//   // ── STEP 8: Submit ─────────────────────────────────
//   const submitBtn = page.getByRole('button', { name: 'Submit', exact: true });
//   await submitBtn.scrollIntoViewIfNeeded();
//   await page.waitForTimeout(500);
//   await submitBtn.click();
//   await page.waitForTimeout(2000);

//   // Handle modal
//   const confirmModal = page.locator('[role="dialog"], [class*="modal"]').first();
//   const confirmSubmitBtn = page.getByRole('button', { name: /submit/i }).last();
//   const hasConfirmButton = await confirmSubmitBtn.isVisible({ timeout: 3000 }).catch(() => false);
//   if (hasConfirmButton) {
//     await confirmSubmitBtn.click();
//     console.log('Confirmation modal submitted');
//   }
//   await confirmModal.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

//   // Check result
//   const successMsg = page.locator('[class*="success"], [class*="toast"], text=successfully').first();
//   const successVisible = await successMsg.isVisible({ timeout: 10000 }).catch(() => false);

//   if (successVisible) {
//     const successText = await successMsg.textContent().catch(() => '');
//     console.log(`Submission successful: "${successText.trim()}"`);
//     console.log('Result: Team was complete — submission went through as expected');
//   } else {
//     console.log('Submission result unclear — manual verification needed');
//   }

//   console.log('Scenario 4 complete');
// });     