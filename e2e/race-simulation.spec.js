import { test, expect } from '@playwright/test';

test('Full Race Simulation: Create Event -> Load Demo -> Race -> Results', async ({ page }) => {
  // 1. Navigate and Ensure Clean State
  await page.goto('/');
  
  // Clear localStorage to ensure we aren't automatically logged into a previous event
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // 2. Create Event
  // The placeholder is "e.g. Dungog Day 2"
  const eventInput = page.locator('input[placeholder*="Dungog"]');
  await eventInput.fill('Playwright Championship');
  
  // The button text is "GO" and it's next to our input
  await page.click('button:has-text("GO")');

  // Verify we are in (Store appends date, so we check for partial match)
  await expect(page.locator('header')).toContainText(/PLAYWRIGHT CHAMPIONSHIP/i);

  // Select a Track (important for filtering results later)
  const trackInput = page.locator('#trackNameInput');
  await trackInput.fill('STAGE 1');
  await page.keyboard.press('Enter');

  // 2. Load Demo Data
  await page.click('button:has-text("Load Demo Data")');
  // Wait for toast or data to appear
  await page.waitForTimeout(1000); 

  // 3. Start Riders
  await page.click('button:has-text("Starter")');
  
  // Start 3 riders with a small delay between them
  const startButtons = page.locator('button:has-text("START")');
  const countToRace = 3;

  for (let i = 0; i < countToRace; i++) {
    await startButtons.nth(0).click();
    console.log(`Started rider ${i + 1}`);
    await page.waitForTimeout(2000); // 2 seconds between starts
  }

  // 4. Finish Riders
  await page.click('button:has-text("Finisher")');
  const finishButtons = page.locator('button:has-text("FINISH")');

  for (let i = 0; i < countToRace; i++) {
    // Click the first available finish button
    await finishButtons.nth(0).click();
    console.log(`Finished rider ${i + 1}`);
    await page.waitForTimeout(1000);
  }

  // 5. Check Results
  await page.click('button:has-text("Results")');
  
  // Verify results table exists and has finished riders in the status column
  await expect(page.locator('table')).toBeVisible();
  const finishedCells = page.locator('td:has-text("FINISHED")');
  await expect(finishedCells).toHaveCount(countToRace);

  // Take a screenshot of the final results
  await page.screenshot({ path: 'race-results.png' });
  console.log('🏁 Race simulation complete. Screenshot saved as race-results.png');
});
