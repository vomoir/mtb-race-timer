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