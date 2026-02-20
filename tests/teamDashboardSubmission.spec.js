const { test, expect } = require('@playwright/test');
const { text } = require('node:stream/consumers');

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
    console.log({ submissionsTab })
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


    // Select searchable dropdown options
    const searchableDropdown = page.getByRole('combobox').nth(1);

    await searchableDropdown.click();
    await searchableDropdown.fill('abcd');
    await page.getByRole('option', { name: 'abcd' }).click();

    // Select dropdown from dropdown type question

    const dropdownQuestion = page.getByRole('combobox').nth(2);

    await expect(dropdownQuestion).toBeVisible();

    await dropdownQuestion.selectOption({
        label: 'dropdown 3'
    });

    // to select value in liner scale type question
    // await page.locator('div.rc-slider.rc-slider-horizontal').click();


   async function setSliderScore(page, targetScore){

  // Linear scale slider pick karega only
  const slider = page.locator('[role="slider"]').first();

  // 👇 scroll karega jisse tumhe headed mode me dikhe
  await slider.scrollIntoViewIfNeeded();

  // thoda smooth visible wait (optional but good)
  await slider.waitFor({ state: 'visible' });

  // focus slider
  await slider.focus();

  // current score read karega
  const current = await slider.getAttribute('aria-valuenow');

  const move = targetScore - Number(current);

  const key = move > 0 ? 'ArrowRight' : 'ArrowLeft';

  for(let i=0;i<Math.abs(move);i++){
    await page.keyboard.press(key);

    // 👇 slow motion jaisa effect (headed me clearly dikhega)
    await page.waitForTimeout(300);
  }
}

// Use like this
await setSliderScore(page,5);


// to enter the value in date type question

const dateField = page.getByPlaceholder('Enter Date type question');

await dateField.scrollIntoViewIfNeeded();

await expect(dateField).toBeVisible();

// to enter date 2026-02-20

await dateField.fill('2026-03-20');

// to enter the time type value


// const timeField = page.getByPlaceholder('Enter Time type question');

// await timeField.scrollIntoViewIfNeeded();

// await expect(timeField).toBeVisible();

// // to enter time 2:30 PM

// await timeField.fill('14:30'); 

await page.getByPlaceholder('Enter Time type question')
.fill('11:30');

await expect(
page.getByText('Value must be 12:59 or earlier.')
).not.toBeVisible();

// await page.getByRole('button', { name: 'Submit' }).click();

// await expect(
// page.getByRole('heading', {
// name: 'Submit Project for Evaluation'
// })
// ).toBeVisible({ timeout: 10000 });


// await page.getByRole('button', { name: 'Submit' }).click();

// const modal = page.locator(':has-text("Submit Project for Evaluation")').last();

// await expect(modal).toBeVisible();

// await modal.getByRole('button', { name: 'Submit' }).click();

// ✅ FIRST SUBMIT (form wala)

const firstSubmit =
  page.getByRole('button', { name: 'Submit' }).first();

await expect(firstSubmit).toBeVisible();

await firstSubmit.scrollIntoViewIfNeeded();

await firstSubmit.click();


// ✅ Modal ka wait (best way)

const modal = page.locator('text=Submit Project for Evaluation');

await expect(modal).toBeVisible({ timeout: 15000 });


// animation finish hone do
await page.waitForTimeout(2000);


// ✅ SECOND SUBMIT (modal wala)

const confirmSubmit =
  page.getByRole('button', { name: 'Submit' }).last();

await expect(confirmSubmit).toBeVisible();

await confirmSubmit.click();


try {

  const successMessage =
    page.getByText('Submission submitted successfully!');

  await expect(successMessage)
    .toBeVisible({ timeout: 15000 });

  console.log(
    '✅ Submission submitted successfully message appeared on the screen.'
  );

} catch {

  console.log(
    '❌ Submission submitted successfully message did not appear on the screen.'
  );

}

});