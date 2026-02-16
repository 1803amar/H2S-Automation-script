const { test, expect } = require('@playwright/test');

test('Team dashboard project submission', async ({ page }) => {

  await page.goto('https://alphavision.hack2skill.com/event/platform-automation-sandbox/dashboard/roadmap');

  await page.waitForTimeout(3000);


 //   if cookie message appears then click on accept cookies button
  const cookieBtn = page.locator('[data-id="accept-cookies"]');
  if (await cookieBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await cookieBtn.click();
    await cookieBtn.waitFor({ state: 'hidden' });
    console.log('✅ Cookie accepted'); 
  }

  // Login
  await page.getByPlaceholder('Enter Email').fill('amar@hack2skill.com');
  await page.locator('[data-id="auth-login-button"]').click();

  await page.waitForTimeout(3000);

  const otp = '123456';
  const otpInputs = page.locator('[data-id="auth-otp-input"]');

  for (let i = 0; i < otp.length; i++) {
    await otpInputs.nth(i).fill(otp[i]);
  }

  await page.locator('[data-id="auth-verify-button"]').click();

  // Go to Submissions tab (stable wait)
  const tabList = page.getByRole('tablist');

const submissionsTab = tabList.getByRole('tab', {
  name: "Submissions",
  exact: true
});
console.log({submissionsTab})
await submissionsTab.scrollIntoViewIfNeeded();
await submissionsTab.click();

await expect(submissionsTab).toHaveAttribute('aria-selected', 'true');

// old code
//   const submissionsTab = page.getByRole('tab', { name: 'Submissions' });
//   await submissionsTab.click();

  // Wait until dropdown visible (prevents rare failure)
  const challengeDropdown = page.locator('#problemStatements');
  await expect(challengeDropdown).toBeVisible();

  // Select challenge (enter the challenge value like challenge1, challenge 2 or challenge 3)
  await challengeDropdown.selectOption({ value: '6992aed1cc85ebfb1c17540f' });

  // Helper function for smooth scroll + fill (this will scroll the submission section only not complete page and also fill the value in input field )
  async function fillField(locator, value) {
    await locator.scrollIntoViewIfNeeded();
    await locator.fill(value);
  }

  // Fill fields
  await fillField(
    page.getByRole('textbox', { name: 'Short answer type questions' }),
    'This is dummy text for Short answer type questions'
  );

  await fillField(
    page.getByRole('textbox', { name: 'Enter Paragraph type question' }),
    'This is dummy text for Paragraph type questions'
  );

  await fillField(
    page.getByRole('textbox', { name: 'Link type question' }),
    'https://www.lipsum.com/'
  );

//   Select MCQ option from radio button
//   const options = page.locator('div.flex.gap-5.w-full.pt-5.defaultRadio');
//   await expect(options).toBeVisible();

//   await options.selectOption({value: 'option 1'});

await page.locator('input[type="radio"][value="option 2"]').check();

//   // Checkbox
//   const checkbox = page.locator("//input[@id='7655_698ecaad468047f586282d6b_4_698ecaad468047f586282d6b_1']");
//   await checkbox.scrollIntoViewIfNeeded();
//   await checkbox.check();

// await page.setInputFiles('input[type="file"]', 'sample.pdf');

// to upload file
const fileInput = page.locator('input[type="file"]');
await fileInput.setInputFiles('asset/challenges.png');

// to click on upload button after uploading the file
await page.getByText('Upload', { exact: true }).click();

});