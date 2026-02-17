export const convertMsToMinSec = (ms) => {
    // Calculate total minutes
    let minutes = Math.floor(ms / 60000); 

    // Calculate remaining milliseconds after removing whole minutes
    let remainingMs = ms % 60000;

    // Calculate whole seconds from remaining milliseconds
    let seconds = Math.floor(remainingMs / 1000);

    // Calculate remaining milliseconds after removing whole seconds (these are the hundredths implicitly)
    let hundredths = Math.floor((remainingMs % 1000) / 10); 

    // Format the output to ensure leading zeros for single-digit numbers for consistent display
    // padStart ensures the number takes up a certain number of characters
    let formattedMinutes = String(minutes).padStart(2, '0');
    let formattedSeconds = String(seconds).padStart(2, '0');
    let formattedHundredths = String(hundredths).padStart(2, '0');

    // Return the formatted string
    return `${formattedMinutes}:${formattedSeconds}.${formattedHundredths}`;
}
/**
 * Sorts riders by status priority (FINISHED > DNF > DNS) 
 * and then by duration for those who finished.
 */
export const sortRidersByTime = (riders) => {
  return [...riders].sort((a, b) => {
    // 1. Both finished? Sort by fastest time
    if (a.status === "FINISHED" && b.status === "FINISHED") {
      return (a.durationMs || 0) - (b.durationMs || 0);
    }

    // 2. One finished, one didn't? The finisher wins.
    if (a.status === "FINISHED") return -1;
    if (b.status === "FINISHED") return 1;

    // 3. Both didn't finish? DNF (Did Not Finish) beats DNS (Did Not Start)
    if (a.status === "DNF" && b.status === "DNS") return -1;
    if (a.status === "DNS" && b.status === "DNF") return 1;

    return 0;
  });
};