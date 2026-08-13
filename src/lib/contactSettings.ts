import { db, doc, getDoc, setDoc, onSnapshot } from './firebase';

export interface ContactUsSettings {
  phone: string;
  secondaryPhone?: string;
  whatsappNumber?: string;
  email: string;
  secondaryEmail?: string;
  officeHours?: string;
  
  // Office Address
  officeName: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  googleMapsUrl?: string;

  // Social Links
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;

  // Additional Notice
  supportNotice?: string;
}

export const DEFAULT_CONTACT_SETTINGS: ContactUsSettings = {
  phone: '+91 98765 43210',
  secondaryPhone: '+91 98765 43211',
  whatsappNumber: '+91 98765 43210',
  email: 'support@nashiktelisamaj.org',
  secondaryEmail: 'info@nashiktelisamaj.org',
  officeHours: 'Mon - Sat: 10:00 AM - 6:00 PM',

  officeName: 'Sneh Bandhan Vivah Mandal',
  addressLine: 'Nashik District Teli Samaj Bhavan, Panchavati',
  city: 'Nashik',
  state: 'Maharashtra',
  country: 'India',
  pincode: '422003',
  googleMapsUrl: 'https://maps.google.com/?q=Panchavati+Nashik+Maharashtra+422003',

  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  linkedinUrl: '',
  twitterUrl: '',

  supportNotice: 'Have questions regarding profile registration, verification, or community events? Send us a message or connect with our support team.'
};

/**
 * Fetches Contact Us settings from Firestore (settings/contact_us).
 * Merges with DEFAULT_CONTACT_SETTINGS so no field is ever missing.
 */
export async function getContactSettings(): Promise<ContactUsSettings> {
  try {
    const docRef = doc(db, 'settings', 'contact_us');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_CONTACT_SETTINGS, ...docSnap.data() };
    }
  } catch (err) {
    console.warn("Failed to fetch contact_us settings from Firestore:", err);
  }
  return DEFAULT_CONTACT_SETTINGS;
}

/**
 * Real-time listener for Contact Us settings from Firestore (settings/contact_us).
 */
export function subscribeContactSettings(callback: (settings: ContactUsSettings) => void): () => void {
  const docRef = doc(db, 'settings', 'contact_us');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ ...DEFAULT_CONTACT_SETTINGS, ...docSnap.data() });
    } else {
      callback(DEFAULT_CONTACT_SETTINGS);
    }
  }, (err) => {
    console.warn("Error listening to contact_us settings:", err);
    callback(DEFAULT_CONTACT_SETTINGS);
  });
}

/**
 * Saves or updates Contact Us settings in Firestore (settings/contact_us).
 */
export async function saveContactSettings(settings: Partial<ContactUsSettings>): Promise<void> {
  const docRef = doc(db, 'settings', 'contact_us');
  await setDoc(docRef, {
    ...settings,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}
