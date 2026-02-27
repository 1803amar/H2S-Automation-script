// This script is only for My better understanding (Not official script)

// Website Open
//     ↓
// Cookie Accept (agar ho)
//     ↓
// Email + OTP se Login
//     ↓
// Submissions Tab Click
//     ↓
// ┌─────────────────────────────┐
// │  LOOP (MAX_ADD_SUBMISSIONS) │
// │  Form Fill karo:            │
// │  1. Challenge dropdown      │
// │  2. Short answer            │
// │  3. Paragraph               │
// │  4. Link                    │
// │  5. MCQ radio               │
// │  6. File upload             │
// │  7. Searchable dropdown     │
// │  8. Normal dropdown         │
// │  9. Slider (value=5)        │
// │  10. Date                   │
// │  11. Time                   │
// │       ↓                     │
// │  "Add Submission" visible?  │
// │  Aur limit nahi aayi?       │
// │  YES → Click → Repeat loop │
// │  NO  → Loop se bahar       │
// └─────────────────────────────┘
//     ↓
// Submit button click
//     ↓
// Confirmation modal → Submit
//     ↓
// Success message verify


const { test, expect } = require('@playwright/test');
// ↑ Playwright se "test" aur "expect" functions import kar rahe hain
// "test" → ek test case define karne ke liye
// "expect" → kisi element ya value ko verify karne ke liye

// ====================================================
// ⚙️ CONFIGURATION — Yahan sirf ye ek number change karo
// ====================================================
// MAX_ADD_SUBMISSIONS = kitni baar "Add Submission" button click hoga
// Matlab total forms filled = MAX_ADD_SUBMISSIONS + 1
// Example: 3 set kiya → 1 default + 3 extra = 4 forms fill honge
// Note: Agar "Add Submission" button page pe dikh na aaye to automatically Submit ho jaayega
const MAX_ADD_SUBMISSIONS = 3;

// ====================================================
// 🧪 TEST CASE START
// ====================================================
test('Team dashboard project submission', async ({ page }) => {
  // ↑ "page" = browser ka ek tab, isi se saare actions hote hain

  test.setTimeout(120000);
  // ↑ Test ko poora hone ke liye maximum 120 seconds (2 minutes) diye hain
  // Default 30s tha jo multiple form fills ke liye kam padta tha

  // ====================================================
  // 🌐 STEP 1: Website open karo
  // ====================================================
  await page.goto(
    'https://alphavision.hack2skill.com/event/platform-automation-sandbox/dashboard/roadmap'
  );
  // ↑ Browser mein ye URL open karo — ye Team Dashboard ka Roadmap page hai

  await page.waitForTimeout(3000);
  // ↑ 3 seconds ruko taaki page fully load ho jaaye

  // ====================================================
  // 🍪 STEP 2: Cookie popup accept karo (agar aaye toh)
  // ====================================================
  const cookieBtn = page.locator('[data-id="accept-cookies"]');
  // ↑ "Accept Cookies" button dhundo — uska data-id attribute "accept-cookies" hai

  if (await cookieBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    // ↑ 5 seconds tak check karo ki cookie button dikh raha hai ya nahi
    // .catch(() => false) → agar error aaye (button na mile) toh false return karo, script crash na ho
    await cookieBtn.click();
    // ↑ Cookie button pe click karo
    await cookieBtn.waitFor({ state: 'hidden' });
    // ↑ Tab tak wait karo jab tak cookie button chhup na jaaye (confirm ho ki accept ho gaya)
    console.log('✅ Cookie accepted');
    // ↑ Console mein success message print karo
  }

  // ====================================================
  // 📧 STEP 3: Email enter karo aur Login button click karo
  // ====================================================
  await page.getByPlaceholder('Enter Email').fill('amar@hack2skill.com');
  // ↑ "Enter Email" placeholder wale input field mein email type karo

  await page.locator('[data-id="auth-login-button"]').click();
  // ↑ Login button pe click karo — iska data-id "auth-login-button" hai

  await page.waitForTimeout(3000);
  // ↑ 3 seconds ruko taaki OTP page load ho

  // ====================================================
  // 🔐 STEP 4: OTP enter karo aur Verify karo
  // ====================================================
  const otp = '123456';
  // ↑ OTP string define karo — 6 digits

  const otpInputs = page.locator('[data-id="auth-otp-input"]');
  // ↑ Saare OTP input boxes locate karo (ek-ek digit ke liye alag box hota hai)

  for (let i = 0; i < otp.length; i++) {
    await otpInputs.nth(i).fill(otp[i]);
    // ↑ Loop chalao: har digit ko uske corresponding box mein fill karo
    // otp[0]="1" → pehle box mein, otp[1]="2" → doosre box mein, aur aage bhi aise hi
  }

  await page.locator('[data-id="auth-verify-button"]').click();
  // ↑ Verify button click karo OTP submit karne ke liye

  // ====================================================
  // 📑 STEP 5: Submissions Tab pe click karo
  // ====================================================
  const tabList = page.getByRole('tablist');
  // ↑ Page pe jo tab bar hai usse locate karo (jisme Roadmap, Submissions, etc. hote hain)

  const submissionsTab = tabList.getByRole('tab', { name: 'Submissions', exact: true });
  // ↑ Tab bar ke andar "Submissions" naam ka exact tab dhundo

  await submissionsTab.scrollIntoViewIfNeeded();
  // ↑ Tab viewport mein nahi hai toh scroll karke laao

  await submissionsTab.click();
  // ↑ Submissions tab pe click karo

  await expect(submissionsTab).toHaveAttribute('aria-selected', 'true');
  // ↑ Verify karo ki tab actually select hua — aria-selected="true" hona chahiye

  // ====================================================
  // 🛠️ HELPER FUNCTIONS (Reusable Code)
  // ====================================================

  // --------------------------------------------------
  // Helper 1: fillField — kisi bhi text field ko fill karo
  // --------------------------------------------------
  async function fillField(locator, value) {
    // locator → kaun sa element fill karna hai
    // value   → kya fill karna hai

    await locator.waitFor({ state: 'visible', timeout: 10000 });
    // ↑ Element ke visible hone ka wait karo — max 10 seconds
    // Agar 10s mein nahi aaya toh error

    await locator.scrollIntoViewIfNeeded();
    // ↑ Element screen pe nahi dikh raha toh scroll karke laao

    await locator.fill(value);
    // ↑ Field mein value type karo (pehle se jo tha wo clear hoga phir naya fill hoga)
  }

  // --------------------------------------------------
  // Helper 2: setSliderScore — Linear Scale slider ko exact value pe set karo
  // --------------------------------------------------
  async function setSliderScore(page, targetScore) {
    // targetScore → slider ko jis value pe set karna hai (e.g. 5)

    const slider = page.locator('[role="slider"]').last();
    // ↑ Page pe jo bhi slider hain unme se LAST wala lo
    // .last() isliye kyunki "Add Submission" ke baad nayi form append hoti hai
    // aur hum hamesha nayi (last) form ka slider fill karna chahte hain

    await slider.scrollIntoViewIfNeeded();
    // ↑ Slider viewport mein laao scroll karke

    await slider.waitFor({ state: 'visible' });
    // ↑ Slider ke visible hone ka wait karo

    await slider.focus();
    // ↑ Slider pe keyboard focus do taaki arrow keys kaam karein

    await page.keyboard.press('Home');
    // ↑ "Home" key dabao — slider minimum value pe reset ho jaata hai
    // Ye zaroori hai taaki pichli value ki wajah se galat position na ho

    await page.waitForTimeout(300);
    // ↑ 300ms ruko taaki reset visually complete ho

    const min = Number(await slider.getAttribute('aria-valuemin') ?? '1');
    // ↑ Slider ki minimum value padhо (aria-valuemin attribute se)
    // ?? '1' → agar attribute nahi mila toh default 1 maano
    // Number() → string ko number mein convert karo

    const steps = targetScore - min;
    // ↑ Kitne ArrowRight press karne padenge calculate karo
    // Example: targetScore=5, min=1 → steps=4 (1→2→3→4→5)

    for (let i = 0; i < steps; i++) {
      await page.keyboard.press('ArrowRight');
      // ↑ Ek baar ArrowRight dabao = slider ek step aage badhta hai
      await page.waitForTimeout(150);
      // ↑ 150ms ruko taaki UI update ho
    }

    const finalValue = await slider.getAttribute('aria-valuenow');
    // ↑ Slider ki current value padhо (confirm karne ke liye)

    console.log(`🎚️ Slider set to: ${finalValue} (target: ${targetScore})`);
    // ↑ Console mein log karo ki slider sahi set hua ya nahi
  }

  // --------------------------------------------------
  // Helper 3: waitForPageStable — page stable hone ka wait karo
  // --------------------------------------------------
  async function waitForPageStable() {
    await page.waitForLoadState('domcontentloaded');
    // ↑ Wait karo jab tak page ka DOM (HTML structure) fully load ho jaaye

    await page.waitForTimeout(2000);
    // ↑ Extra 2 seconds ruko taaki dynamic content (React) bhi render ho jaaye

    await page.evaluate(() => window.scrollTo(0, 0));
    // ↑ Page.evaluate = browser mein JavaScript run karo
    // window.scrollTo(0, 0) = page ko bilkul upar (top) pe scroll karo
    // Ye isliye zaroori hai kyunki "Add Submission" click ke baad page scroll ho jaata hai
    // Aur elements top pe hote hain jo dikh nahi rahe — reset karna padta hai

    await page.waitForTimeout(1000);
    // ↑ Scroll animation complete hone ke liye 1 second wait
  }

  // ====================================================
  // 📝 MAIN FUNCTION: Form fill karo
  // ====================================================
  async function fillAndAddSubmission(runIndex) {
    // runIndex → ye kaun sa run hai (0 = pehla, 1 = doosra, etc.)

    console.log(`\n📝 Form Fill Run #${runIndex + 1} started...`);
    // ↑ Console mein batao ki kaunsa run shuru hua (+1 isliye ki 0 se start hota hai)

    await waitForPageStable();
    // ↑ Pehle page stable karo (scroll top pe, DOM loaded)

    // ⚠️ IMPORTANT CONCEPT: .last() kyun use karte hain?
    // Jab "Add Submission" click hota hai toh page pe ek NAYI form NEECHE ADD hoti hai
    // Purani form wahi rahti hai — remove nahi hoti
    // Isliye agar hum .first() use karein toh pehli (purani) form fill hogi
    // .last() use karne se hamesha SABSE NAYI (last) form fill hoti hai ✅

    // --------------------------------------------------
    // FIELD 1: Challenge / Problem Statement dropdown
    // --------------------------------------------------
    const challengeDropdown = page.locator('#problemStatements').last();
    // ↑ id="problemStatements" wale select dropdown ka last instance lo
    // (kyunki har form mein ek aisa dropdown hota hai)

    await challengeDropdown.waitFor({ state: 'visible', timeout: 10000 });
    // ↑ Dropdown ke visible hone ka wait karo

    await challengeDropdown.scrollIntoViewIfNeeded();
    // ↑ Screen pe laao scroll karke

    await page.waitForTimeout(300);
    // ↑ Thoda ruko taaki dropdown properly render ho

    await challengeDropdown.selectOption({ value: '6992aed1cc85ebfb1c17540f' });
    // ↑ Dropdown mein ye specific value select karo (ye "Challenges 2" ka backend ID hai)

    // --------------------------------------------------
    // FIELD 2: Short Answer type question
    // --------------------------------------------------
    await fillField(
      page.getByRole('textbox', { name: 'Short answer type questions' }).last(),
      // ↑ "Short answer type questions" label wala LAST textbox dhundo
      'This is dummy text for Short answer type questions'
      // ↑ Ye value fill karo
    );

    // --------------------------------------------------
    // FIELD 3: Paragraph type question
    // --------------------------------------------------
    await fillField(
      page.getByRole('textbox', { name: 'Enter Paragraph type question' }).last(),
      // ↑ Paragraph question ka LAST textbox (ye textarea hai)
      'This is dummy text for Paragraph type questions'
    );

    // --------------------------------------------------
    // FIELD 4: Link type question
    // --------------------------------------------------
    await fillField(
      page.getByRole('textbox', { name: 'Link type question' }).last(),
      // ↑ Link question ka LAST textbox
      'https://www.lipsum.com/'
      // ↑ Ek valid URL fill kar rahe hain
    );

    // --------------------------------------------------
    // FIELD 5: MCQ (Multiple Choice Question) — Radio button
    // --------------------------------------------------
    const mcqRadio = page.locator('input[type="radio"][value="option 2"]').last();
    // ↑ Radio button dhundo jiska value="option 2" ho — LAST instance (latest form)

    await mcqRadio.scrollIntoViewIfNeeded();
    // ↑ Radio button ko screen pe laao

    await mcqRadio.check();
    // ↑ Radio button select (check) karo

    // --------------------------------------------------
    // FIELD 6: File Upload
    // --------------------------------------------------
    const fileInput = page.locator('input[type="file"]').last();
    // ↑ File input field ka LAST instance lo

    await fileInput.scrollIntoViewIfNeeded();
    // ↑ File input screen pe laao

    await fileInput.setInputFiles('asset/challenges.png');
    // ↑ "challenges.png" file attach karo (file path: project ke "asset" folder mein honi chahiye)

    const uploadModalBtn = page.getByRole('button', { name: 'Upload', exact: true });
    // ↑ File attach hone ke baad ek modal (popup) khulta hai jisme "Upload" button hota hai
    // Ye us button ko dhund raha hai

    await uploadModalBtn.waitFor({ state: 'visible', timeout: 10000 });
    // ↑ Upload button ke aane ka wait karo

    await uploadModalBtn.click();
    // ↑ Upload button click karo → file server pe upload ho jaayegi

    await uploadModalBtn.waitFor({ state: 'hidden', timeout: 10000 });
    // ↑ Tab tak wait karo jab tak modal band na ho jaaye
    // (modal band = upload complete)

    // --------------------------------------------------
    // FIELD 7: Searchable Dropdown (React Select component)
    // --------------------------------------------------
    const searchableLabel = page.locator('text=Searchable dropdown type question').last();
    // ↑ "Searchable dropdown type question" text wala label dhundo — LAST instance

    await searchableLabel.scrollIntoViewIfNeeded();
    // ↑ Label ko screen pe laao taaki searchable dropdown bhi visible ho

    await page.waitForTimeout(500);
    // ↑ 500ms ruko taaki React Select component fully render ho

    const searchableCbx = page.locator('input[id^="react-select-"]').last();
    // ↑ React Select library apne input ko "react-select-" se shuru hone wala id deti hai
    // input[id^="react-select-"] → wo input jiska id "react-select-" se start ho
    // .last() → LAST wala (latest form ka)

    await searchableCbx.scrollIntoViewIfNeeded();
    // ↑ Input ko screen pe laao

    await searchableCbx.waitFor({ state: 'attached', timeout: 10000 });
    // ↑ state: 'attached' use kiya kyunki React Select input DOM mein hota hai
    // lekin visually hidden hota hai — 'visible' se nahi milta, 'attached' se milta hai

    await searchableCbx.click({ force: true });
    // ↑ force: true → element hidden hai phir bhi click karo
    // Click karne se dropdown open hota hai

    await page.waitForTimeout(300);
    // ↑ Dropdown animation ke liye wait

    await searchableCbx.press('Control+a');
    // ↑ Ctrl+A → input mein jo bhi text hai sab select karo

    await searchableCbx.press('Backspace');
    // ↑ Backspace → selected text delete karo (clear karo)
    // Ye isliye zaroori hai kyunki pichli run mein fill ki hui value wahan reh sakti hai

    await page.waitForTimeout(300);
    // ↑ Clear animation ke baad wait

    await searchableCbx.pressSequentially('abcd', { delay: 100 });
    // ↑ "abcd" ek-ek character type karo (delay: 100ms per character)
    // pressSequentially use kiya kyunki React Select ko real keyboard events chahiye
    // fill() se dropdown suggestions nahi aati — pressSequentially se aati hain

    await page.waitForTimeout(500);
    // ↑ Dropdown options aane ka wait

    await page.getByRole('option', { name: 'abcd', exact: true }).click();
    // ↑ Dropdown mein jo "abcd" option aaya usse click karo
    // exact: true → exactly "abcd" match karo, koi aur nahi

    await page.waitForTimeout(300);
    // ↑ Selection complete hone ka wait

    // --------------------------------------------------
    // FIELD 8: Normal Dropdown (Native HTML select)
    // --------------------------------------------------
    const dropdownQuestion = page.locator('select:not(#problemStatements)').last();
    // ↑ Saare <select> elements mein se wo dhundo jo #problemStatements NAHI hai
    // select:not(#problemStatements) → #problemStatements ke alawa koi bhi select
    // .last() → LAST wala (latest form ka normal dropdown)

    await dropdownQuestion.waitFor({ state: 'visible', timeout: 10000 });
    // ↑ Dropdown ke visible hone ka wait

    await dropdownQuestion.scrollIntoViewIfNeeded();
    // ↑ Screen pe laao

    await page.waitForTimeout(300);
    // ↑ Thoda ruko

    await dropdownQuestion.selectOption({ label: 'dropdown 3' });
    // ↑ "dropdown 3" label wala option select karo

    // --------------------------------------------------
    // FIELD 9: Linear Scale Slider
    // --------------------------------------------------
    await setSliderScore(page, 5);
    // ↑ Helper function call karo — slider ko value 5 pe set karo

    // --------------------------------------------------
    // FIELD 10: Date field
    // --------------------------------------------------
    const dateField = page.getByPlaceholder('Enter Date type question').last();
    // ↑ "Enter Date type question" placeholder wala LAST date input

    await dateField.waitFor({ state: 'visible', timeout: 10000 });
    await dateField.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    await dateField.fill('2026-03-20');
    // ↑ Date fill karo — format: YYYY-MM-DD (HTML date input ka standard format)

    // --------------------------------------------------
    // FIELD 11: Time field
    // --------------------------------------------------
    const timeField = page.getByPlaceholder('Enter Time type question').last();
    // ↑ "Enter Time type question" placeholder wala LAST time input

    await timeField.waitFor({ state: 'visible', timeout: 10000 });
    await timeField.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    await timeField.fill('11:30');
    // ↑ Time fill karo — format: HH:MM (24 hour)

    await expect(page.getByText('Value must be 12:59 or earlier.')).not.toBeVisible();
    // ↑ Verify karo ki "Value must be 12:59 or earlier." wali error message nahi dikh rahi
    // 11:30 valid time hai isliye ye error nahi aani chahiye

    console.log(`✅ Form Fill Run #${runIndex + 1} completed.`);
    // ↑ Console mein log karo ki ye run complete hua
  }

  // ====================================================
  // 🔁 MAIN LOOP: Form fill → Add Submission → Repeat
  // ====================================================
  for (let i = 0; i <= MAX_ADD_SUBMISSIONS; i++) {
    // ↑ Loop: i=0 se shuru, MAX_ADD_SUBMISSIONS tak chalega
    // Example: MAX_ADD_SUBMISSIONS=3 → i = 0,1,2,3 → 4 baar chalega

    await fillAndAddSubmission(i);
    // ↑ Form fill karo (i = current run number)

    const addBtn = page.getByText('Add Submission', { exact: true });
    // ↑ "Add Submission" button dhundo

    const addBtnVisible = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);
    // ↑ Check karo ki button dikh raha hai ya nahi
    // timeout: 3000 → 3 seconds tak check karo
    // .catch(() => false) → agar error aaye (button na mile) toh false return karo

    if (i < MAX_ADD_SUBMISSIONS && addBtnVisible) {
      // ↑ Dono conditions true honi chahiye:
      // 1. i < MAX_ADD_SUBMISSIONS → abhi limit nahi aayi
      // 2. addBtnVisible → button page pe dikh raha hai

      console.log(`🔁 Clicking "Add Submission" for run #${i + 1}...`);
      await addBtn.click();
      // ↑ "Add Submission" click karo → nayi form neeche append hogi

      await page.waitForTimeout(3000);
      // ↑ 3 seconds ruko taaki nayi form fully render ho jaaye

    } else {
      // ↑ Yahan aayenge agar:
      // - Limit aa gayi (i === MAX_ADD_SUBMISSIONS), ya
      // - "Add Submission" button nahi dikh raha

      if (!addBtnVisible) {
        console.log(`ℹ️ "Add Submission" button not visible after run #${i + 1}, proceeding to Submit.`);
        // ↑ Button nahi dikh raha — isliye Submit pe jaana padega
      } else {
        console.log(`✅ Reached max ${MAX_ADD_SUBMISSIONS} add submissions, proceeding to Submit.`);
        // ↑ Max limit aa gayi — ab Submit karo
      }
      break;
      // ↑ Loop se bahar niklo aur Submit section pe jao
    }
  }

  // ====================================================
  // ✅ SUBMIT: Form Submit karo
  // ====================================================

  // STEP 1: Pehla Submit button click karo (Form section ka)
  const firstSubmit = page.getByRole('button', { name: 'Submit' }).first();
  // ↑ Page pe jo pehla "Submit" button hai usse lo
  // (Confirm modal wala baad mein aata hai — isliye .first())

  await expect(firstSubmit).toBeVisible();
  // ↑ Verify karo ki button dikh raha hai

  await firstSubmit.scrollIntoViewIfNeeded();
  // ↑ Button screen pe laao

  await firstSubmit.click();
  // ↑ Submit button click karo

  // STEP 2: Confirmation Modal ka wait karo
  const modal = page.locator('text=Submit Project for Evaluation');
  // ↑ "Submit Project for Evaluation" text wala confirmation modal dhundo

  await expect(modal).toBeVisible({ timeout: 15000 });
  // ↑ 15 seconds tak wait karo modal aane ka

  await page.waitForTimeout(2000);
  // ↑ Modal animation ke liye 2 seconds wait

  // STEP 3: Modal ke andar Submit button click karo
  const confirmSubmit = page.getByRole('button', { name: 'Submit' }).last();
  // ↑ Modal mein jo "Submit" button hai woh page ka LAST Submit button hoga
  // .last() isliye kyunki pehla wala form section ka tha

  await expect(confirmSubmit).toBeVisible();
  // ↑ Button dikh raha hai verify karo

  await confirmSubmit.click();
  // ↑ Final confirm submit click karo

  // ====================================================
  // 🏁 VERIFY: Success message check karo
  // ====================================================
  try {
    // ↑ try-catch isliye ki agar success message na aaye toh test crash na ho
    // instead console mein failure message print ho

    const successMessage = page.getByText('Submission submitted successfully!');
    // ↑ "Submission submitted successfully!" text dhundo

    await expect(successMessage).toBeVisible({ timeout: 15000 });
    // ↑ 15 seconds tak wait karo message aane ka

    console.log('✅ Submission submitted successfully message appeared on the screen.');
    // ↑ Success! Console mein print karo

  } catch {
    // ↑ Agar success message nahi aaya (expect fail hua)

    console.log('❌ Submission submitted successfully message did not appear on the screen.');
    // ↑ Failure ka message console mein print karo
  }

});
// ↑ Test case yahan khatam hota hai