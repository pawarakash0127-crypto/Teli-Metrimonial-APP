import { db, collection, query, where, getDocs } from './firebase';

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  raw10: string;
  e164: string;
  error?: string;
}

/**
 * Normalizes any Indian phone number input into standardized raw10 and E.164 (+91XXXXXXXXXX) format.
 * Works seamlessly with +91 8149909817, +918149901817, 8149909817, 08149909817, etc.
 */
export function normalizePhone(phoneStr: string): { raw10: string; e164: string; formatted: string; isValid: boolean } {
  if (!phoneStr || !phoneStr.trim()) {
    return { raw10: '', e164: '', formatted: '', isValid: false };
  }

  const digits = phoneStr.replace(/[^\d]/g, '');
  if (digits.length >= 10) {
    const raw10 = digits.slice(-10);
    return {
      raw10,
      e164: `+91${raw10}`,
      formatted: `+91 ${raw10}`,
      isValid: true
    };
  }

  return { raw10: '', e164: '', formatted: phoneStr, isValid: false };
}

export function getPhoneVariants(phoneInput: string): string[] {
  const norm = normalizePhone(phoneInput);
  if (!norm.isValid) return [phoneInput];
  const { raw10 } = norm;

  return Array.from(new Set([
    raw10,
    `+91${raw10}`,
    `+91 ${raw10}`,
    `+91-${raw10}`,
    `0${raw10}`,
    `91${raw10}`
  ]));
}

export function validateAndFormatPhone(phoneStr: string): PhoneValidationResult {
  const norm = normalizePhone(phoneStr);
  if (norm.isValid) {
    return {
      isValid: true,
      formatted: norm.formatted,
      raw10: norm.raw10,
      e164: norm.e164
    };
  }

  return {
    isValid: false,
    formatted: phoneStr,
    raw10: '',
    e164: '',
    error: 'Contact number must be a valid 10-digit mobile number.'
  };
}

export function validateEmail(emailStr: string): { isValid: boolean; error?: string } {
  if (!emailStr || !emailStr.trim()) {
    return { isValid: false, error: 'Email address is required.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailStr.trim())) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@example.com).' };
  }
  return { isValid: true };
}

export async function findAccountByPhone(phoneInput: string): Promise<any | null> {
  const norm = normalizePhone(phoneInput);
  if (!norm.isValid) return null;
  const raw10 = norm.raw10;
  const phoneVariants = getPhoneVariants(phoneInput);

  // 1. Query profiles collection by contactNumber
  try {
    const q1 = query(collection(db, 'profiles'), where('contactNumber', 'in', phoneVariants));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) return snap1.docs[0].data();
  } catch (e) {
    console.warn("Phone lookup q1 error:", e);
  }

  // 2. Query profiles collection by parentsContact
  try {
    const q2 = query(collection(db, 'profiles'), where('parentsContact', 'in', phoneVariants));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) return snap2.docs[0].data();
  } catch (e) {
    console.warn("Phone lookup q2 error:", e);
  }

  // 3. Query users collection by phoneNumber
  try {
    const q3 = query(collection(db, 'users'), where('phoneNumber', 'in', phoneVariants));
    const snap3 = await getDocs(q3);
    if (!snap3.empty) return snap3.docs[0].data();
  } catch (e) {
    console.warn("Phone lookup q3 error:", e);
  }

  // 4. Query users collection by contactNumber
  try {
    const q4 = query(collection(db, 'users'), where('contactNumber', 'in', phoneVariants));
    const snap4 = await getDocs(q4);
    if (!snap4.empty) return snap4.docs[0].data();
  } catch (e) {
    console.warn("Phone lookup q4 error:", e);
  }

  // 5. Fallback search: scan profiles collection documents by cleaned trailing 10 digits
  try {
    const allProfilesSnap = await getDocs(collection(db, 'profiles'));
    for (const docSnap of allProfilesSnap.docs) {
      const data = docSnap.data();
      const cn = String(data.contactNumber || '').replace(/[^\d]/g, '');
      const pc = String(data.parentsContact || '').replace(/[^\d]/g, '');
      const pn = String(data.phoneNumber || '').replace(/[^\d]/g, '');
      if ((cn.length >= 10 && cn.slice(-10) === raw10) ||
          (pc.length >= 10 && pc.slice(-10) === raw10) ||
          (pn.length >= 10 && pn.slice(-10) === raw10)) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Phone lookup fallback profiles error:", e);
  }

  // 6. Fallback search: scan users collection documents
  try {
    const allUsersSnap = await getDocs(collection(db, 'users'));
    for (const docSnap of allUsersSnap.docs) {
      const data = docSnap.data();
      const pn = String(data.phoneNumber || '').replace(/[^\d]/g, '');
      const cn = String(data.contactNumber || '').replace(/[^\d]/g, '');
      if ((pn.length >= 10 && pn.slice(-10) === raw10) ||
          (cn.length >= 10 && cn.slice(-10) === raw10)) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Phone lookup fallback users error:", e);
  }

  return null;
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
  { key: 'contactNumber', label: 'Contact Number' },
  { key: 'address', label: 'Address' },
  { key: 'parentsContact', label: "Parents' Contact" },
  { key: 'partnerExpectations', label: 'Partner Expectations' }
] as const;
