export interface PartnerPreferences {
  preferredBirthYear?: string;
  education?: string;
  location?: string;
  maritalStatus?: string;
  profession?: string;
  income?: string;
}

export interface Sibling {
  name: string;
  type: string;
  occupation: string;
  maritalStatus: string;
}

export interface ProfileData {
  uid: string;
  profileId?: string; // e.g. VADU-001 or VAR-001
  titlePrefix?: 'Mr.' | 'Ms.' | 'Dr.' | 'Adv.' | 'Prof.' | 'Shri' | 'Smt.' | '' | string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'Male' | 'Female' | string;
  dob: string;
  timeOfBirth?: string;
  birthplace?: string;
  isManglik?: string;
  height: string;
  
  // Standardized Education
  highestEducation?: string; // Standardized category e.g. "B.E. / B.Tech." or "MBA"
  customEducation?: string;  // Shown when highestEducation is "Others"
  degreeDetails?: string;    // e.g. "Computer Science" or "Electrical"
  university?: string;       // e.g. "Savitribai Phule Pune University"
  completionYear?: string;   // e.g. "2020"
  education: string;         // General display string

  profession: string;
  companyName?: string;
  income?: string;           // Optional dropdown e.g. "₹5 - ₹10 Lakhs"
  location: string;
  nativePlace: string;
  gotraKul: string;
  maritalStatus: string;

  // Parents details
  fatherTitle?: 'Mr.' | 'Late' | 'Dr.' | 'Prof.' | 'Shri' | string;
  fatherName: string;
  motherTitle?: 'Mrs.' | 'Smt.' | 'Late' | 'Dr.' | 'Prof.' | string;
  motherName: string;
  fatherOccupationCompany?: string; // Father's Occupation & Company
  motherOccupationCompany?: string; // Mother's Occupation & Company
  parentsHometown?: string;
  address?: string;
  parentsOccupation?: string;       // Combined legacy field
  parentsContact?: string;

  // Maternal Uncle details
  maternalUncleName?: string;
  maternalUncleGotraKul?: string;
  maternalUnclePlace?: string;
  maternalUnclePhone?: string;

  // Siblings
  siblings?: Sibling[];

  contactNumber: string;
  email?: string;
  partnerExpectations?: string;
  photoUrl?: string;
  additionalPhotos?: string[];
  favorites?: string[];
  partnerPreferences?: PartnerPreferences;

  // Account Verification & Status
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;

  // Status & Metadata
  status?: 'approved' | 'pending' | 'rejected' | 'archived' | 'deletion_pending';
  isArchived?: boolean;
  archivedAt?: string | null;
  deletionRequested?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  age?: number;
}

export const TITLE_PREFIXES = [
  "Mr.",
  "Ms.",
  "Dr.",
  "Adv.",
  "Er.",
  "Prof.",
  "Shri",
  "Smt.",
  "None"
] as const;

export const HIGHEST_EDUCATION_CATEGORIES = [
  "10th / SSC",
  "12th / HSC",
  "Diploma",
  "ITI",
  "B.A.",
  "B.Sc.",
  "B.Com.",
  "B.B.A.",
  "B.C.A.",
  "B.E. / B.Tech.",
  "M.B.B.S.",
  "B.D.S.",
  "L.L.B.",
  "B.Pharm.",
  "B.Ed.",
  "B.Arch.",
  "B.Des.",
  "Other Graduation",
  "M.A.",
  "M.Sc.",
  "M.Com.",
  "M.B.A.",
  "M.C.A.",
  "M.E. / M.Tech.",
  "M.Pharm.",
  "M.Ed.",
  "M.D.S.",
  "M.D. / M.S.",
  "L.L.M.",
  "Other Post Graduation",
  "Ph.D. / Doctorate",
  "CA",
  "CS",
  "CMA",
  "CFA",
  "Other Professional Qualification",
  "Others"
] as const;

export const ANNUAL_INCOME_OPTIONS = [
  "Below ₹2 Lakhs",
  "₹2 - ₹5 Lakhs",
  "₹5 - ₹10 Lakhs",
  "₹10 - ₹15 Lakhs",
  "₹15 - ₹20 Lakhs",
  "₹20 - ₹30 Lakhs",
  "₹30 - ₹50 Lakhs",
  "Above ₹50 Lakhs",
  "Prefer not to say"
] as const;

export type HighestEducationCategory = typeof HIGHEST_EDUCATION_CATEGORIES[number];
