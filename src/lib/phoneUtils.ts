import { db, collection, query, where, getDocs } from './firebase';

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
  const digits = phoneInput.replace(/[^\d]/g, '');
  if (digits.length < 10) return null;
  const raw10 = digits.slice(-10);

  const phoneVariants = [
    raw10,
    `+91${raw10}`,
    `+91 ${raw10}`,
    `+91-${raw10}`,
    `0${raw10}`,
    `91${raw10}`
  ];

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
  { key: 'contactNumber', label: 'Contact Number' }
] as const;
