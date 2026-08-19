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

  // Social Links & Visibility Toggles
  facebookUrl?: string;
  showFacebook?: boolean;
  instagramUrl?: string;
  showInstagram?: boolean;
  youtubeUrl?: string;
  showYoutube?: boolean;
  linkedinUrl?: string;
  showLinkedin?: boolean;
  twitterUrl?: string;
  showTwitter?: boolean;

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

  facebookUrl: 'https://facebook.com/nashiktelisamaj',
  showFacebook: true,
  instagramUrl: 'https://instagram.com/nashiktelisamaj',
  showInstagram: true,
  youtubeUrl: 'https://youtube.com/@nashiktelisamaj',
  showYoutube: true,
  linkedinUrl: 'https://linkedin.com/company/nashiktelisamaj',
  showLinkedin: true,
  twitterUrl: 'https://x.com/nashiktelisamaj',
  showTwitter: true,

  supportNotice: 'Have questions regarding profile registration, verification, or community events? Send us a message or connect with our support team.'
};

/**
 * Normalizes and validates whether a given string is a well-formed http or https URL.
 * Automatically adds https:// if protocol is omitted (e.g. facebook.com/page -> https://facebook.com/page).
 * Rejects javascript: URLs, empty strings, and malformed strings.
 */
export function normalizeHttpUrl(urlString?: string): string {
  if (!urlString || typeof urlString !== 'string') return '';
  let trimmed = urlString.trim();
  if (!trimmed) return '';
  
  // Auto-prepend https:// if protocol is missing
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  
  try {
    const url = new URL(trimmed);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
    return '';
  } catch {
    return '';
  }
}

export function isValidHttpUrl(urlString?: string): boolean {
  return !!normalizeHttpUrl(urlString);
}

export interface ActiveSocialPlatform {
  name: string;
  url: string;
  platformKey: 'facebook' | 'instagram' | 'youtube' | 'linkedin' | 'twitter';
}

/**
 * Returns strictly valid, enabled social media platforms.
 * Hides any platform with empty URL, disabled toggle (show !== true / false), or invalid URL scheme.
 */
export function getActiveSocialPlatforms(settings: ContactUsSettings): ActiveSocialPlatform[] {
  const isEnabled = (val: any) => val !== false && val !== 'false' && val !== 0;

  const platforms: { name: string; url?: string; show: boolean; platformKey: ActiveSocialPlatform['platformKey'] }[] = [
    { name: 'Facebook', url: settings.facebookUrl, show: isEnabled(settings.showFacebook), platformKey: 'facebook' },
    { name: 'Instagram', url: settings.instagramUrl, show: isEnabled(settings.showInstagram), platformKey: 'instagram' },
    { name: 'YouTube', url: settings.youtubeUrl, show: isEnabled(settings.showYoutube), platformKey: 'youtube' },
    { name: 'LinkedIn', url: settings.linkedinUrl, show: isEnabled(settings.showLinkedin), platformKey: 'linkedin' },
    { name: 'Twitter / X', url: settings.twitterUrl, show: isEnabled(settings.showTwitter), platformKey: 'twitter' },
  ];

  return platforms
    .filter(p => p.show && isValidHttpUrl(p.url))
    .map(p => ({
      name: p.name,
      url: normalizeHttpUrl(p.url),
      platformKey: p.platformKey
    }));
}

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
