import { isValidPhoneNumber } from 'libphonenumber-js';
import { COUNTRIES } from './constants/countries';

/**
 * Validates a phone number based on its country dial code.
 * @param dialCode The dial code (e.g., '+977')
 * @param phone The phone number digits (e.g., '9812345678')
 * @returns boolean indicating if the number is valid
 */
export function validatePhoneNumber(dialCode: string, phone: string): { isValid: boolean; error?: string; countryName?: string } {
  const phoneDigits = phone.replace(/[^0-9]/g, '');
  const selectedCountry = COUNTRIES.find(c => c.dial_code === dialCode);

  if (!selectedCountry) {
    // Fallback for unknown country codes
    const isValid = phoneDigits.length >= 7 && phoneDigits.length <= 15;
    return { 
      isValid, 
      error: isValid ? undefined : "Phone number must be between 7 and 15 digits." 
    };
  }

  const fullNumber = `${dialCode}${phoneDigits}`;
  const isValid = isValidPhoneNumber(fullNumber, selectedCountry.code as any);

  return {
    isValid,
    error: isValid ? undefined : `Invalid phone number format for ${selectedCountry.name}.`,
    countryName: selectedCountry.name
  };
}
