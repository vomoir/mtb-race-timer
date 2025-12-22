/**
 * MTB Race Timer - Full Stress Test
 * 1. Loads Demo Data
 * 2. Starts all riders at 30s intervals
 * 3. Finishes all riders at 30s intervals
 */
export const runRaceTest = async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const INTERVAL = 30000; // 30 seconds

  console.log("🚀 Starting Race Test...");

  // --- STEP 1: LOAD DEMO DATA ---
  console.log("Step 1: Loading Demo Data...");
  const loadBtn = Array.from(document.querySelectorAll("button")).find((el) =>
    el.textContent.includes("Load Demo Data")
  );

  if (loadBtn) {
    loadBtn.click();
    await delay(2000); // Wait for state to sync
  } else {
    console.warn(
      "Could not find 'Load Demo Data' button. Ensure you are on the Register page."
    );
  }

  // --- STEP 2: START RIDERS ---
  console.log("Step 2: Starting Riders...");
  // Find all buttons that look like "Start" buttons
  let startButtons = Array.from(document.querySelectorAll("button")).filter(
    (el) => el.textContent.toLowerCase() === "start"
  );

  for (let i = 0; i < startButtons.length; i++) {
    console.log(`Starting rider ${i + 1} of ${startButtons.length}...`);
    startButtons[i].click();

    if (i < startButtons.length - 1) {
      console.log(`Waiting ${INTERVAL / 1000}s for next starter...`);
      await delay(INTERVAL);
      // Re-query in case DOM changed
      startButtons = Array.from(document.querySelectorAll("button")).filter(
        (el) => el.textContent.toLowerCase() === "start"
      );
    }
  }

  console.log("✅ All riders started. Waiting 5s before finishing...");
  await delay(5000);

  // --- STEP 3: FINISH RIDERS ---
  console.log("Step 3: Finishing Riders...");
  let finishButtons = Array.from(document.querySelectorAll("button")).filter(
    (el) => el.textContent.toLowerCase() === "finish"
  );

  for (let i = 0; i < finishButtons.length; i++) {
    console.log(`Finishing rider ${i + 1} of ${finishButtons.length}...`);
    finishButtons[i].click();

    if (i < finishButtons.length - 1) {
      console.log(`Waiting ${INTERVAL / 1000}s for next finisher...`);
      await delay(INTERVAL);
      // Re-query for the next set of buttons
      finishButtons = Array.from(document.querySelectorAll("button")).filter(
        (el) => el.textContent.toLowerCase() === "finish"
      );
    }
  }

  console.log("🏁 Test Complete. Check your Results page for sorting!");
};

// To run this, paste it into the console and type:
// runRaceTest();
