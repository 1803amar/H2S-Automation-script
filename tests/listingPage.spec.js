const { test, expect } = require('@playwright/test');

// ─── Helper: Dismiss cookie banner if it appears ──────────────────────────────
async function dismissCookieBanner(page) {
  const btn = page.locator('[data-id="accept-cookies"]');
  try {
    // Wait for cookie button to become visible (max 8 sec)
    await expect(btn).toBeVisible({ timeout: 8000 });
    await btn.click();
    // Wait for banner to hide after clicking
    await expect(btn).toBeHidden({ timeout: 8000 });
  } catch {
    // If banner never appeared, skip silently
    console.log('ℹ️ Cookie banner not found, skipping');
  }
}

// ─── Test: Hackathon Listing Page ─────────────────────────────────────────────
test('hackathon listing page', async ({ page }) => {

  // STEP 1: Open hackathon listing page and wait until network is idle
  await page.goto('https://alphavision.hack2skill.com/hackathons-listing', {
    waitUntil: 'networkidle',
  });

  // STEP 2: Dismiss cookie banner if it appears
  await dismissCookieBanner(page);

  // STEP 3: Wait for the filter section to be visible before interacting
  const flagshipFilter = page.locator('[data-id="hackathon-listing-filters-category-flagship"]');
  await expect(flagshipFilter).toBeVisible({ timeout: 15000 });

  // STEP 4: Click on "Flagship" filter under Category section
  await expect(flagshipFilter).toBeEnabled();
  await flagshipFilter.click();

  // STEP 5: Click on "Community" filter under Category section
  const communityFilter = page.locator('[data-id="hackathon-listing-filters-category-community"]');
  await expect(communityFilter).toBeVisible();
  await expect(communityFilter).toBeEnabled();
  await communityFilter.click();

  // STEP 6: Click on "Free" filter under Pricing section
  const freeFilter = page.locator('[data-id="hackathon-listing-filters-ticket-free"]');
  await expect(freeFilter).toBeVisible();
  await expect(freeFilter).toBeEnabled();
  await freeFilter.click();

  // STEP 7: Click on "Paid" filter under Pricing section
  const paidFilter = page.locator('[data-id="hackathon-listing-filters-ticket-paid"]');
  await expect(paidFilter).toBeVisible();
  await expect(paidFilter).toBeEnabled();
  await paidFilter.click();

  // STEP 8: Click on "Team" filter under Participation Type section
  const teamFilter = page.locator('[data-id="hackathon-listing-filters-participation-team"]');
  await expect(teamFilter).toBeVisible();
  await expect(teamFilter).toBeEnabled();
  await teamFilter.click();

  // STEP 9: Click on "Individual" filter under Participation Type section
  const individualFilter = page.locator('[data-id="hackathon-listing-filters-participation-individual"]');
  await expect(individualFilter).toBeVisible();
  await expect(individualFilter).toBeEnabled();
  await individualFilter.click();

  // STEP 10: Click on "Ongoing Registration" filter under Filter by Activity section
  const ongoingRegFilter = page.locator('[data-id="hackathon-listing-filters-module-ongoing-registration"]');
  await expect(ongoingRegFilter).toBeVisible();
  await expect(ongoingRegFilter).toBeEnabled();
  await ongoingRegFilter.click();

  // STEP 11: Click on "Ongoing Submission" filter under Filter by Activity section
  const ongoingSubFilter = page.locator('[data-id="hackathon-listing-filters-module-ongoing-submission"]');
  await expect(ongoingSubFilter).toBeVisible();
  await expect(ongoingSubFilter).toBeEnabled();
  await ongoingSubFilter.click();

  // STEP 12: Click on Reset button to clear all selected filters
  const resetBtn = page.locator('[data-id="hackathon-listing-filter-reset"]');
  await expect(resetBtn).toBeVisible();
  await expect(resetBtn).toBeEnabled();
  await resetBtn.click();

  // STEP 13: Click the close (cross) icon to close the filter panel
  // Note: Replace this XPath with a data-id locator if dev adds one
  const closeFilterBtn = page.locator("//div[@class='cursor-pointer border border-text-h2sGrey-300 p-1 rounded-full text-gray-500 hover:text-gray-700']//*[name()='svg']//*[name()='path' and contains(@fill,'none')]");
  await expect(closeFilterBtn).toBeVisible();
  await closeFilterBtn.click();

  // STEP 14: Scroll to the bottom of the page to load all hackathon cards
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  // STEP 15: Wait for hackathon cards to be visible after scrolling
  // Using "Register Now" link as card indicator — consistently present in every card
  // Note: Ask dev to add data-id="hackathon-listing-card" on card wrapper for a more stable locator
  const hackathonCard = page.getByRole('link', { name: 'Register Now' }).first();
  await expect(hackathonCard).toBeVisible({ timeout: 10000 });

});