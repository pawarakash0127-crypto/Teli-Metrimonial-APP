export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  raw10: string;
  error?: string;
}

export function validateAndFormatPhone(phoneStr: string): PhoneValidationResult {
  if (!phoneStr || !phoneStr.trim()) {
    return {
      isValid: false,
      formatted: '',
      raw10: '',
      error: 'Contact number is required.'
    };
  }

  // Extract digits only
  const digits = phoneStr.replace(/[^\d]/g, '');

  let raw10 = '';
  if (digits.length >= 10) {
    raw10 = digits.slice(-10);
  }

  if (raw10.length === 10) {
    return {
      isValid: true,
      formatted: `+91 ${raw10}`,
      raw10: raw10
    };
  }

  return {
    isValid: false,
    formatted: phoneStr,
    raw10: '',
    error: 'Contact number must be a valid 10-digit mobile number.'
  };
}

export const MANDATORY_PROFILE_FIELDS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'gender', label: 'Gender' },
  { key: 'dob', label: 'Date of Birth' },
  { key: 'fatherName', label: "Father's Name" },
  { key: 'motherName', label: "Mother's Name" },
  { key: 'height', label: 'Height' },
  { key: 'education', label: 'Education' },
  { key: 'profession', label: 'Profession' },
  { key: 'location', label: 'Current Location' },
  { key: 'nativePlace', label: 'Native Place' },
  { key: 'gotraKul', label: 'Gotra / Kul' },
  { key: 'maritalStatus', label: 'Marital Status' },
  { key: 'contactNumber', label: 'Contact Number' }
] as const;
