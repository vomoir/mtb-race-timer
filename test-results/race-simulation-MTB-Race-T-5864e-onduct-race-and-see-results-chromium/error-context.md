# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: race-simulation.spec.js >> MTB Race Timer - End to End Simulation >> should create event, import riders, conduct race and see results
- Location: tests\e2e\race-simulation.spec.js:5:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*registration/
Received string:  "http://localhost:5173/"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    18 × unexpected value "http://localhost:5173/"

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - heading "Race Timer Pro" [level=1] [ref=e6]
  - paragraph [ref=e7]: "\"Ready for the next stage?\""
  - generic [ref=e8]:
    - heading "Start New Event" [level=2] [ref=e9]:
      - img [ref=e10]
      - text: Start New Event
    - generic [ref=e12]:
      - textbox "e.g. Dungog Day 2" [ref=e13]: TEST EVENT 1775091770127
      - button "GO" [active] [ref=e14]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('MTB Race Timer - End to End Simulation', () => {
  4  |   
  5  |   test('should create event, import riders, conduct race and see results', async ({ page }) => {
  6  |     // 1. Create a New Event
  7  |     await page.goto('/');
  8  |     
  9  |     // Fill event name (placeholder is "e.g. Dungog Day 2")
  10 |     const eventInput = page.getByPlaceholder('e.g. Dungog Day 2');
  11 |     const eventName = `TEST EVENT ${new Date().getTime()}`;
  12 |     await eventInput.fill(eventName);
  13 |     await page.getByRole('button', { name: 'GO' }).click();
  14 | 
  15 |     // Verify we landed on Registration page
> 16 |     await expect(page).toHaveURL(/.*registration/, { timeout: 15000 });
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  17 |     await expect(page.getByText(eventName)).toBeVisible();
  18 | 
  19 |     // 2. Import Demo Riders
  20 |     // Button text is "Load Demo Data"
  21 |     await page.getByRole('button', { name: 'Load Demo Data' }).click();
  22 |     
  23 |     // Check if a rider from demo data (e.g., #101 Sam Hill) appears
  24 |     // Wait for the toast or the list to update
  25 |     await expect(page.getByText('Demo data loaded!')).toBeVisible();
  26 |     
  27 |     // 3. Select a Track (Default is "TRACK1" for new events)
  28 |     // We'll wait for the track name to appear in the header specifically
  29 |     const headerTrack = page.locator('header h1');
  30 |     await expect(headerTrack).toContainText('TRACK1', { timeout: 10000 });
  31 | 
  32 |     // Alternatively, verify the track select has the correct value
  33 |     const trackSelect = page.locator('#trackSelect');
  34 |     await expect(trackSelect).toHaveValue('TRACK1');
  35 | 
  36 |     // 4. Conduct the Race - Starter View
  37 |     // Navigate via Header tab "Starter"
  38 |     await page.getByRole('button', { name: 'Starter' }).click();
  39 |     await expect(page).toHaveURL(/.*starter/);
  40 | 
  41 |     // Start Rider #101
  42 |     const bibInput = page.getByPlaceholder('Bib #');
  43 |     await bibInput.fill('101');
  44 |     await page.getByRole('button', { name: 'START' }).click();
  45 |     await expect(page.getByText('Rider #101 Started!')).toBeVisible();
  46 | 
  47 |     // 5. Conduct the Race - Finish Line View
  48 |     await page.getByRole('button', { name: 'Finisher' }).click();
  49 |     await expect(page).toHaveURL(/.*finish/);
  50 | 
  51 |     // Ensure #101 is on track
  52 |     await page.getByRole('button', { name: 'On Track' }).click();
  53 |     await expect(page.getByText('#101')).toBeVisible();
  54 | 
  55 |     // Finish Rider #101
  56 |     // Using the "Capture" method for realism
  57 |     await page.getByRole('button', { name: 'Capture' }).click();
  58 |     await page.getByRole('button', { name: 'Capture Finish' }).click();
  59 |     
  60 |     // Click the "Bib #" button in the captured list to enter the number
  61 |     await page.getByRole('button', { name: 'Bib #' }).click();
  62 |     // The dialog opens
  63 |     const dialogInput = page.getByPlaceholder('Bib #');
  64 |     await dialogInput.fill('101');
  65 |     await page.getByRole('button', { name: 'OK' }).click();
  66 | 
  67 |     // 6. Verify Results
  68 |     await page.getByRole('button', { name: 'Results' }).click();
  69 |     await expect(page).toHaveURL(/.*results/);
  70 |     
  71 |     // Check if #101 appears in the Results table
  72 |     await expect(page.locator('table')).toContainText('#101');
  73 |     // Ensure a time is recorded (contains "00:")
  74 |     await expect(page.locator('table')).toContainText('00:');
  75 | 
  76 |     console.log(`✅ Simulation complete for event: ${eventName}`);
  77 |   });
  78 | });
  79 | 
```