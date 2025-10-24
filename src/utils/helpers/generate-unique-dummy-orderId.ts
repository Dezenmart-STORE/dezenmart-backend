export function generateOrderId() {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${ymd}-${random}`;
}


export function generateUUID(): string {
    // Uses the browser's built-in crypto module for high-quality random generation.
    return crypto.randomUUID();
}

export function generateUniqueNumericalId(): number {
    // The current timestamp in milliseconds (typically 13 digits)
    const timestamp = Date.now();
    
    // Add a small, 3-digit random number to the end to prevent collisions 
    // if multiple trades are submitted within the same millisecond.
    // We multiply by 1000 and floor it to ensure it stays an integer.
    const randomSuffix = Math.floor(Math.random() * 1000); 
    
    // Concatenate the two, ensuring the final number fits within JavaScript's safe integer limit (53 bits).
    // A 13-digit timestamp plus a 3-digit suffix is 16 digits, well within the 18-19 digit safety margin for u64.
    return timestamp * 1000 + randomSuffix;
}