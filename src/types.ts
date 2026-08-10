export interface PartnerPreferences {
  preferredBirthYear?: string;
  education?: string;
  location?: string;
}

export interface ProfileData {
  uid: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | string;
  dob: string;
  timeOfBirth?: string;
  birthplace?: string;
  isManglik?: string;
  height: string;
  
  // Standardized Education
  highestEducation?: string; // Standardized category e.g. "Engineering", "MBA", "Bachelor's Degree"
  degreeDetails?: string;    // e.g. "B.E. Computer Science" or "B.Tech Electrical"
  university?: string;       // e.g. "Pune University"
  completionYear?: string;   // e.g. "2020"
  education: string;         // General display string (combines degree/highestEducation for backward compatibility)

  profession: string;
  companyName?: string;
  income?: string;
  location: string;
  nativePlace: string;
  gotraKul: string;
  maritalStatus: string;

  // Parents details
  fatherTitle?: 'Mr.' | 'Late' | 'Dr.' | 'Prof.' | 'Er.' | 'Shri' | string;
  fatherName: string;
  motherTitle?: 'Mrs.' | 'Smt.' | 'Late' | 'Dr.' | 'Prof.' | string;
  motherName: string;
  parentsHometown?: string;
  address?: string;
  parentsOccupation?: string;
  parentsContact?: string;

  // Maternal Uncle details
  maternalUncleName?: string;
  maternalUncleGotraKul?: string;
  maternalUnclePlace?: string;
  maternalUnclePhone?: string;

  // Siblings
  siblings?: {
    name: string;
    type: string;
    occupation: string;
    maritalStatus: string;
  }[];

  contactNumber: string;
  email?: string;
  partnerExpectations?: string;
  photoUrl?: string;
  additionalPhotos?: string[];
  favorites?: string[];
  partnerPreferences?: PartnerPreferences;

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

export const HIGHEST_EDUCATION_CATEGORIES = [
  "10th / SSC",
  "12th / HSC",
  "ITI",
  "Diploma",
  "Bachelor's Degree",
  "Engineering",
  "Medical",
  "Law",
  "Pharmacy",
  "Nursing",
  "MBA",
  "Master's Degree",
  "M.Tech",
  "PhD",
  "CA / CS / CMA",
  "Other"
] as const;

export type HighestEducationCategory = typeof HIGHEST_EDUCATION_CATEGORIES[number];
