import { isOppositeGender } from './genderUtils';

export interface ProfileDataForMatching {
  uid: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: number;
  dob?: string;
  height?: string;
  education?: string;
  highestEducation?: string;
  degreeDetails?: string;
  profession?: string;
  location?: string;
  nativePlace?: string;
  parentsHometown?: string;
  address?: string;
  photoUrl?: string;
  status: string;
  isArchived?: boolean;
  maritalStatus?: string;
  updatedAt?: string;
  createdAt?: string;
  partnerPreferences?: {
    preferredBirthYear?: number | string;
    education?: string | string[];
    location?: string | string[];
    maritalStatus?: string;
    profession?: string;
    income?: string;
  };
}

export interface MatchAnalysis {
  matchPercentage: number;
  reasons: string[];
  isEligible: boolean;
  hasPreferencesSet: boolean;
  earnedPoints: number;
  maxPoints: number;
  educationMatched: boolean;
  locationMatched: boolean;
  birthYearSatisfied: boolean;
}

export function normalizeString(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function parsePreferenceTokens(pref: string | string[] | undefined): string[] {
  if (!pref) return [];
  if (Array.isArray(pref)) {
    return pref.map(normalizeString).filter(s => s && s !== 'any');
  }
  return pref
    .split(/[,/|]/)
    .map(s => normalizeString(s))
    .filter(s => s && s !== 'any');
}

export function matchesAnyToken(prefTokens: string[], candidateText?: string): boolean {
  if (prefTokens.length === 0) return true;
  if (!candidateText) return false;
  const candNorm = normalizeString(candidateText);
  return prefTokens.some(tok => candNorm.includes(tok) || tok.includes(candNorm));
}

export function getProfileBirthYear(p: { dob?: string; age?: number }): number {
  if (p.dob) {
    const parsed = parseInt(p.dob.slice(0, 4), 10);
    if (!isNaN(parsed) && parsed > 1950 && parsed < 2026) return parsed;
  }
  const currentYear = new Date().getFullYear();
  return currentYear - (p.age || 25);
}

export function calculateProfileCompleteness(p: ProfileDataForMatching): number {
  let score = 0;
  if (p.photoUrl) score += 20;
  if (p.highestEducation || p.degreeDetails || p.education) score += 15;
  if (p.profession) score += 15;
  if (p.location || p.nativePlace) score += 15;
  if (p.address || p.parentsHometown) score += 10;
  if (p.maritalStatus) score += 10;
  if (p.dob) score += 15;
  return score;
}

export function calculateMatchScore(
  myProfile: ProfileDataForMatching,
  candidate: ProfileDataForMatching
): MatchAnalysis {
  const prefs = myProfile.partnerPreferences || {};
  const reasons: string[] = [];

  // 1. MANDATORY ELIGIBILITY FILTERS
  // Self check
  if (candidate.uid === myProfile.uid) {
    return {
      matchPercentage: 0,
      reasons: [],
      isEligible: false,
      hasPreferencesSet: false,
      earnedPoints: 0,
      maxPoints: 0,
      educationMatched: false,
      locationMatched: false,
      birthYearSatisfied: false
    };
  }

  // Archived / Deleted / Status check
  if ((candidate as any).isArchived || candidate.status === 'archived' || candidate.status !== 'approved') {
    return {
      matchPercentage: 0,
      reasons: [],
      isEligible: false,
      hasPreferencesSet: false,
      earnedPoints: 0,
      maxPoints: 0,
      educationMatched: false,
      locationMatched: false,
      birthYearSatisfied: false
    };
  }

  // Gender check
  if (myProfile.gender && !isOppositeGender(myProfile.gender, candidate.gender)) {
    return {
      matchPercentage: 0,
      reasons: [],
      isEligible: false,
      hasPreferencesSet: false,
      earnedPoints: 0,
      maxPoints: 0,
      educationMatched: false,
      locationMatched: false,
      birthYearSatisfied: false
    };
  }

  // Birth Year Check
  let birthYearSatisfied = true;
  const prefYearRaw = prefs.preferredBirthYear;
  const prefYear = prefYearRaw ? Number(prefYearRaw) : null;
  const candidateBirthYear = getProfileBirthYear(candidate);

  if (prefYear && !isNaN(prefYear) && prefYear > 1950) {
    if (candidateBirthYear < prefYear) {
      // Fails mandatory eligibility filter
      return {
        matchPercentage: 0,
        reasons: [],
        isEligible: false,
        hasPreferencesSet: true,
        earnedPoints: 0,
        maxPoints: 0,
        educationMatched: false,
        locationMatched: false,
        birthYearSatisfied: false
      };
    } else {
      birthYearSatisfied = true;
      reasons.push(`✓ Birth year preference satisfied (${candidateBirthYear} ≥ ${prefYear})`);
    }
  }

  // 2. SCORING FIELDS
  let earnedPoints = 0;
  let maxPoints = 0;

  // Education = 40 points
  let educationMatched = false;
  const eduTokens = parsePreferenceTokens(prefs.education);
  if (eduTokens.length > 0) {
    maxPoints += 40;
    const candEdu = [candidate.highestEducation, candidate.degreeDetails, candidate.education]
      .filter(Boolean)
      .join(' ');

    if (matchesAnyToken(eduTokens, candEdu)) {
      earnedPoints += 40;
      educationMatched = true;
      reasons.push(`✓ Education matches (${candidate.highestEducation || candidate.degreeDetails || candidate.education})`);
    } else {
      reasons.push(`○ Location/Education preference (${Array.isArray(prefs.education) ? prefs.education.join(', ') : prefs.education}) not matched`);
    }
  }

  // Location = 30 points
  let locationMatched = false;
  const locTokens = parsePreferenceTokens(prefs.location);
  if (locTokens.length > 0) {
    maxPoints += 30;
    const candLoc = [candidate.location, candidate.nativePlace, candidate.parentsHometown, candidate.address]
      .filter(Boolean)
      .join(' ');

    if (matchesAnyToken(locTokens, candLoc)) {
      earnedPoints += 30;
      locationMatched = true;
      reasons.push(`✓ Location matches (${candidate.location || candidate.nativePlace})`);
    } else {
      reasons.push(`○ Location preference (${Array.isArray(prefs.location) ? prefs.location.join(', ') : prefs.location}) not matched`);
    }
  }

  // Additional Compatibility = 30 points (Marital Status 15 pts, Profession 15 pts)
  const msTokens = parsePreferenceTokens(prefs.maritalStatus);
  if (msTokens.length > 0) {
    maxPoints += 15;
    if (candidate.maritalStatus && matchesAnyToken(msTokens, candidate.maritalStatus)) {
      earnedPoints += 15;
      reasons.push(`✓ Marital status matches (${candidate.maritalStatus})`);
    } else if (candidate.maritalStatus) {
      reasons.push(`○ Marital status preference (${Array.isArray(prefs.maritalStatus) ? prefs.maritalStatus.join(', ') : prefs.maritalStatus}) not matched`);
    }
  }

  const profTokens = parsePreferenceTokens(prefs.profession);
  if (profTokens.length > 0) {
    maxPoints += 15;
    if (candidate.profession && matchesAnyToken(profTokens, candidate.profession)) {
      earnedPoints += 15;
      reasons.push(`✓ Profession matches (${candidate.profession})`);
    } else if (candidate.profession) {
      reasons.push(`○ Profession preference (${Array.isArray(prefs.profession) ? prefs.profession.join(', ') : prefs.profession}) not matched`);
    }
  }

  const hasPreferencesSet = maxPoints > 0 || (prefYear !== null && !isNaN(prefYear as number) && prefYear! > 1950);

  if (maxPoints === 0) {
    return {
      matchPercentage: hasPreferencesSet ? 100 : 0,
      reasons,
      isEligible: true,
      hasPreferencesSet,
      earnedPoints: 0,
      maxPoints: 0,
      educationMatched,
      locationMatched,
      birthYearSatisfied
    };
  }

  const matchPercentage = Math.round((earnedPoints / maxPoints) * 100);

  return {
    matchPercentage,
    reasons,
    isEligible: true,
    hasPreferencesSet,
    earnedPoints,
    maxPoints,
    educationMatched,
    locationMatched,
    birthYearSatisfied
  };
}
