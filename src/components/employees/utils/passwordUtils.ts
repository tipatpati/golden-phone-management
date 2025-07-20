
import { calculatePasswordStrength } from '@/components/password/PasswordStrengthIndicator';

export const generateRandomPassword = (): string => {
  const length = 16; // Strong length for better security
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  
  // Use crypto.getRandomValues for cryptographically secure random generation
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(array[i] % chars.length);
  }
  
  // Ensure password meets strength requirements
  const strength = calculatePasswordStrength(password);
  
  // If password doesn't meet minimum strength requirements, regenerate
  if (strength.score < 5 || !strength.requirements.length || !strength.requirements.uppercase || 
      !strength.requirements.lowercase || !strength.requirements.numbers || 
      !strength.requirements.special || !strength.requirements.common) {
    return generateRandomPassword(); // Recursive call to regenerate
  }
  
  return password;
};
