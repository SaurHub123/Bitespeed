import { ValidationResult } from "../interfaces/contact.interface";

export class ValidationUtils {
  static validateEmail(email?: string): ValidationResult {
    if (!email) return { isValid: true };
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValid = emailRegex.test(email);
    
    return {
      isValid,
      message: isValid ? undefined : 'Invalid email format'
    };
  }

static validatePhoneNumber(phoneNumber?: string): ValidationResult {
  if (!phoneNumber) return { isValid: true };

  const phoneRegex = /^[6-9]\d{9}$/; // Starts with 6–9, followed by 9 digits
  const isValid = phoneRegex.test(phoneNumber);

  return {
    isValid,
    message: isValid ? undefined : 'Invalid phone number format. It should be 10 digits and start with 6, 7, 8, or 9.'
  };
}

}