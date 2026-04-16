import { test, expect } from '@playwright/test';

test.describe('MTB Race Timer - End to End Simulation', () => {
  
  test('should create event, import riders, conduct race and see results', async ({ page }) => {
    // 1. Create a New Event
    await page.goto('/');
    
    // Fill event name (placeholder is "e.g. Dungog Day 2")
    const eventInput = page.getByPlaceholder('e.g. Dungog Day 2');
    const eventName = `TEST EVENT ${new Date().getTime()}`;
    await eventInput.fill(eventName);
    await page.getByRole('button', { name: 'GO' }).click();

    // Verify we landed on Registration page
    await expect(page).toHaveURL(/.*registration/, { timeout: 15000 });
    await expect(page.getByText(eventName)).toBeVisible();

    // 2. Import Demo Riders
    // Button text is "Load Demo Data"
    await page.getByRole('button', { name: 'Load Demo Data' }).click();
    
    // Check if a rider from demo data (e.g., #101 Sam Hill) appears
    // Wait for the toast or the list to update
    await expect(page.getByText('Demo data loaded!')).toBeVisible();
    
    // 3. Select a Track (Default is "TRACK1" for new events)
    // We'll wait for the track name to appear in the header specifically
    const headerTrack = page.locator('header h1');
    await expect(headerTrack).toContainText('TRACK1', { timeout: 10000 });

    // Alternatively, verify the track select has the correct value
    const trackSelect = page.locator('#trackSelect');
    await expect(trackSelect).toHaveValue('TRACK1');

    // 4. Conduct the Race - Starter View
    // Navigate via Header tab "Starter"
    await page.getByRole('button', { name: 'Starter' }).click();
    await expect(page).toHaveURL(/.*starter/);

    // Start Rider #101
    const bibInput = page.getByPlaceholder('Bib #');
    await bibInput.fill('101');
    await page.getByRole('button', { name: 'START' }).click();
    await expect(page.getByText('Rider #101 Started!')).toBeVisible();

    // 5. Conduct the Race - Finish Line View
    await page.getByRole('button', { name: 'Finisher' }).click();
    await expect(page).toHaveURL(/.*finish/);

    // Ensure #101 is on track
    await page.getByRole('button', { name: 'On Track' }).click();
    await expect(page.getByText('#101')).toBeVisible();

    // Finish Rider #101
    // Using the "Capture" method for realism
    await page.getByRole('button', { name: 'Capture' }).click();
    await page.getByRole('button', { name: 'Capture Finish' }).click();
    
    // Click the "Bib #" button in the captured list to enter the number
    await page.getByRole('button', { name: 'Bib #' }).click();
    // The dialog opens
    const dialogInput = page.getByPlaceholder('Bib #');
    await dialogInput.fill('101');
    await page.getByRole('button', { name: 'OK' }).click();

    // 6. Verify Results
    await page.getByRole('button', { name: 'Results' }).click();
    await expect(page).toHaveURL(/.*results/);
    
    // Check if #101 appears in the Results table
    await expect(page.locator('table')).toContainText('#101');
    // Ensure a time is recorded (contains "00:")
    await expect(page.locator('table')).toContainText('00:');

    console.log(`✅ Simulation complete for event: ${eventName}`);
  });
});
