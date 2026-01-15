const { test, expect } = require('@playwright/test');

test('hackthon listing page', async ({ page }) => {

    await page.goto('https://alphavision.hack2skill.com/hackathons-listing');

    await page.waitForTimeout(3000);

    const cookieBtn = page.locator('[data-id="accept-cookies"]');
    if (await cookieBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await cookieBtn.click();
        await cookieBtn.waitFor({ state: 'hidden' });
        console.log('✅ Cookie accepted');
    }

    // to click the flagship on filters section (by using text)
    // await page.locator("//main//div/div[2]/div[2]//div[4]//div[2]//div/div[2]//div[1]//div/div/div[1]").first().click();
    await page.getByText('Flagship', { exact: true }).click();

    // to click on community on filters section (by using text)
    // await page.getByText('Community', { exact: true }).click();

    // to click the free from pricing on filters section (by using text)
    await page.getByText('Free', { exact: true }).click();

    // to click the paid from pricing on filters section (by using text)
    // await page.getByText('Paid', { exact: true }).click();

    // to click the Team from Partipation type on filters section (by using text)
    // await page.getByText('Team', { exact: true }).click();

    // to click the Individual from Partipation type on filters section (by using text)
    await page.getByText('Individual', { exact: true }).click();

    // to click the Ongoing Registration from Filter by Activity on filters section (by using text)
    await page.getByText('Ongoing Registration', { exact: true }).click();

    // to click the Ongoing Submission from Filter by Activity on filters section (by using text)
    // await page.getByText('Ongoing Submission', { exact: true }).click();

    // Click on apply button for filter
    await page.getByRole('button', { name: 'Apply' }).click();

    // Click on cross icon to close the filter section
    await page.locator("//div[@class='cursor-pointer border border-text-h2sGrey-300 p-1 rounded-full text-gray-500 hover:text-gray-700']//*[name()='svg']//*[name()='path' and contains(@fill,'none')]").click();

    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });

    await page.waitForTimeout(5000);
});







