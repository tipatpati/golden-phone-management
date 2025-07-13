
export const generateRandomPassword = (): string => {
  const length = 16; // Increased length for better security
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  
  // Use crypto.getRandomValues for cryptographically secure random generation
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(array[i] % chars.length);
  }
  
  // Ensure password contains at least one character from each category
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  if (!hasLower || !hasUpper || !hasDigit || !hasSpecial) {
    // Regenerate if password doesn't meet complexity requirements
    return generateRandomPassword();
  }
  
  return password;
};
