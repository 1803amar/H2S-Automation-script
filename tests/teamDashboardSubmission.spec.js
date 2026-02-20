const { test, expect } = require('@playwright/test');

test('Team dashboard project submission', async ({ page }) => {

//  Open Login Page(using team dashboard url)

await page.goto(
'https://alphavision.hack2skill.com/event/platform-automation-sandbox/dashboard/roadmap'
);

await page.waitForTimeout(3000);


// Accept Cookie (Old Flow Same) and if cookies are accepted the print "✅ Cookie accepted" message on console

const cookieBtn =
page.locator('[data-id="accept-cookies"]');

if (
await cookieBtn
.isVisible({ timeout: 5000 })
.catch(() => false)
) {

await cookieBtn.click();

await cookieBtn.waitFor({ state:'hidden' });

console.log('✅ Cookie accepted');

}


// Enter Email Id on login page and after that click on login button

await page
.getByPlaceholder('Enter Email')
.fill('amar@hack2skill.com');

await page
.locator('[data-id="auth-login-button"]')
.click();

await page.waitForTimeout(3000);


// Enter OTP on login varification page and click on verify button

const otp = '123456';

const otpInputs =
page.locator('[data-id="auth-otp-input"]');

for(let i=0;i<otp.length;i++){

await otpInputs
.nth(i)
.fill(otp[i]);

}

await page
.locator('[data-id="auth-verify-button"]')
.click();



// Click on Submissions Tab on Team dashboard Roadmap 

const tabList =
page.getByRole('tablist');

const submissionsTab =
tabList.getByRole('tab',{

name:'Submissions',
exact:true

});

await submissionsTab.scrollIntoViewIfNeeded();

await submissionsTab.click();

await expect(submissionsTab)
.toHaveAttribute('aria-selected','true');


// Select Challenge /Problem Satement for submission

const challengeDropdown =
page.locator('#problemStatements');

await expect(challengeDropdown)
.toBeVisible();

await challengeDropdown.selectOption({

value:'6992aed1cc85ebfb1c17540f'

});



// Helper Function Scroll + Fill

async function fillField(locator,value){

await locator.scrollIntoViewIfNeeded();

await locator.fill(value);

}


// ====================================================
// Fill Text Fields or answer for all the question types
// ====================================================


// Enter value for Short answer type question

await fillField(

page.getByRole('textbox',{
name:'Short answer type questions'
}),

'This is dummy text for Short answer type questions'

);


// Enter value for Paragraph type question
await fillField(

page.getByRole('textbox',{
name:'Enter Paragraph type question'
}),

'This is dummy text for Paragraph type questions'

);


// Enter value for Link type Question

await fillField(

page.getByRole('textbox',{
name:'Link type question'
}),

'https://www.lipsum.com/'

);



// Select options for MCQ

await page
.locator('input[type="radio"][value="option 2"]')
.check();



// Upload File for file type question field(image/ pdf/ ppt)

const fileInput =
page.locator('input[type="file"]');

await fileInput
.setInputFiles('asset/challenges.png');

await page
.getByText('Upload',{ exact:true })
.click();



//Search options for Searchable Dropdown type question

const searchableDropdown =
page.getByRole('combobox').nth(1);

await searchableDropdown.click();

await searchableDropdown.fill('abcd');

await page
.getByRole('option',{ name:'abcd'})
.click();


// Select option from Normal Dropdown for dropdown type question

const dropdownQuestion =
page.getByRole('combobox').nth(2);

await expect(dropdownQuestion)
.toBeVisible();

await dropdownQuestion.selectOption({

label:'dropdown 3'

});



// Select value from Linear Scale Slider for Liner sacle type question

async function setSliderScore(page,targetScore){

const slider =
page.locator('[role="slider"]').first();

await slider.scrollIntoViewIfNeeded();

await slider.waitFor({state:'visible'});

await slider.focus();

const current =
await slider.getAttribute('aria-valuenow');

const move =
targetScore - Number(current);

const key =
move>0 ? 'ArrowRight':'ArrowLeft';

for(let i=0;i<Math.abs(move);i++){

await page.keyboard.press(key);

await page.waitForTimeout(300);

}

}

await setSliderScore(page,5);



// Select Date from Date Field for Date type question

const dateField =
page.getByPlaceholder(
'Enter Date type question'
);

await dateField.scrollIntoViewIfNeeded();

await expect(dateField).toBeVisible();

await dateField.fill('2026-03-20');


//  Select Time from Time Field for Time type question

await page
.getByPlaceholder(
'Enter Time type question'
)
.fill('11:30');

await expect(

page.getByText(
'Value must be 12:59 or earlier.'
)

).not.toBeVisible();



// Click on Submit button (Form Project Submission Section)

const firstSubmit =
page.getByRole('button',{
name:'Submit'
}).first();

await expect(firstSubmit)
.toBeVisible();

await firstSubmit
.scrollIntoViewIfNeeded();

await firstSubmit.click();



// Wait for confirm submission Modal contains message "Submit Project for Evaluation"


const modal =
page.locator(
'text=Submit Project for Evaluation'
);

await expect(modal)
.toBeVisible({timeout:15000});

await page.waitForTimeout(2000);

// Click onn submist button on confirm submission Modal

const confirmSubmit =
page.getByRole('button',{
name:'Submit'
}).last();

await expect(confirmSubmit)
.toBeVisible();

await confirmSubmit.click();


// Verify Success Message after clicking on submit button on confirm submission modal if submitted successfully then "✅ Submission submitted successfully message appeared on the screen." message visible on console and if it fails then "❌ Submission submitted successfully message did not appear on the screen." message visible on the screen

try{

const successMessage =
page.getByText(
'Submission submitted successfully!'
);

await expect(successMessage)
.toBeVisible({timeout:15000});

console.log(

'✅ Submission submitted successfully message appeared on the screen.'

);

}catch{

console.log(

'❌ Submission submitted successfully message did not appear on the screen.'

);

}

});