import { isOppositeGender } from './genderUtils';
import { calculateGunaMilan, GunaResult } from './gunaMilanUtils';

export const DEFAULT_MATCH_THRESHOLD = 40;

export interface ProfileDataForMatching {
  uid: string;
  firstName: string;
  lastName: string;
  gender: string;
  age: number;
  dob?: string;
  timeOfBirth?: string;
  birthplace?: string;
  height?: string;
  education?: string;
  highestEducation?: string;
  degreeDetails?: string;
  customEducation?: string;
  profession?: string;
  income?: string;
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
  gunaResult?: GunaResult;
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

  // Calculate Guna Milan if gender is opposite
  let gunaResult: GunaResult | undefined;
  if (myProfile.dob && candidate.dob) {
    const isMaleGroom = myProfile.gender?.toLowerCase() === 'male';
    const groomDob = isMaleGroom ? myProfile.dob : candidate.dob;
    const groomTime = isMaleGroom ? myProfile.timeOfBirth : candidate.timeOfBirth;
    const brideDob = isMaleGroom ? candidate.dob : myProfile.dob;
    const brideTime = isMaleGroom ? candidate.timeOfBirth : myProfile.timeOfBirth;

    gunaResult = calculateGunaMilan(groomDob, groomTime, brideDob, brideTime);
    if (gunaResult.isAvailable) {
      reasons.push(`✓ Kundali / Guna Match: ${gunaResult.totalScore}/36 (${gunaResult.summaryText})`);
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
    const candEdu = [candidate.highestEducation, candidate.degreeDetails, candidate.customEducation, candidate.education]
      .filter(Boolean)
      .join(' ');

    if (matchesAnyToken(eduTokens, candEdu)) {
      earnedPoints += 40;
      educationMatched = true;
      reasons.push(`✓ Education matches (${candidate.highestEducation || candidate.degreeDetails || candidate.education})`);
    } else {
      reasons.push(`○ Education preference not matched`);
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
      reasons.push(`○ Location preference not matched`);
    }
  }

  // Additional Compatibility (Marital Status 15 pts, Profession 15 pts)
  const msTokens = parsePreferenceTokens(prefs.maritalStatus);
  if (msTokens.length > 0) {
    maxPoints += 15;
    if (candidate.maritalStatus && matchesAnyToken(msTokens, candidate.maritalStatus)) {
      earnedPoints += 15;
      reasons.push(`✓ Marital status matches (${candidate.maritalStatus})`);
    } else if (candidate.maritalStatus) {
      reasons.push(`○ Marital status preference not matched`);
    }
  }

  // Safely handle income matching
  const incTokens = parsePreferenceTokens(prefs.income);
  if (incTokens.length > 0 && candidate.income) {
    maxPoints += 10;
    if (matchesAnyToken(incTokens, candidate.income)) {
      earnedPoints += 10;
      reasons.push(`✓ Income preference matches`);
    }
  }

  const hasPreferencesSet = maxPoints > 0 || (prefYear !== null && !isNaN(prefYear as number) && prefYear! > 1950);

  if (maxPoints === 0) {
    return {
      matchPercentage: hasPreferencesSet ? 100 : 75,
      reasons,
      isEligible: true,
      hasPreferencesSet,
      earnedPoints: 0,
      maxPoints: 0,
      educationMatched,
      locationMatched,
      birthYearSatisfied,
      gunaResult
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
    birthYearSatisfied,
    gunaResult
  };
}

/**
 * Diagnostic helper for Admin Dashboard to analyze why a user has no matches.
 */
export function generateNoMatchReason(
  myProfile: ProfileDataForMatching,
  allApprovedCandidates: ProfileDataForMatching[]
): { category: string; detail: string } {
  if (myProfile.status !== 'approved') {
    return {
      category: 'Profile Not Approved',
      detail: `Profile status is '${myProfile.status || 'pending'}'. Only approved profiles appear in automated matching.`
    };
  }

  const completeness = calculateProfileCompleteness(myProfile);
  if (completeness < 40) {
    return {
      category: 'Incomplete Profile',
      detail: `Profile completion is low (${completeness}%). Missing crucial fields like photo, education, birthplace, or location.`
    };
  }

  if (!allApprovedCandidates || allApprovedCandidates.length === 0) {
    return {
      category: 'No Active Profiles',
      detail: "No active approved profiles exist in the system database."
    };
  }

  const oppositeGenderCandidates = allApprovedCandidates.filter(
    c => c.uid !== myProfile.uid && isOppositeGender(myProfile.gender, c.gender)
  );

  if (oppositeGenderCandidates.length === 0) {
    return {
      category: 'No Gender Candidates',
      detail: `No active approved ${myProfile.gender?.toLowerCase() === 'male' ? 'Female (Bride)' : 'Male (Groom)'} profiles available.`
    };
  }

  const prefs = myProfile.partnerPreferences || {};
  const hasBirthYear = Boolean(prefs.preferredBirthYear && Number(prefs.preferredBirthYear) > 1950);
  const hasEdu = Boolean(prefs.education && parsePreferenceTokens(prefs.education).length > 0);
  const hasLoc = Boolean(prefs.location && parsePreferenceTokens(prefs.location).length > 0);
  const hasMarital = Boolean(prefs.maritalStatus && parsePreferenceTokens(prefs.maritalStatus).length > 0);

  if (!hasBirthYear && !hasEdu && !hasLoc && !hasMarital) {
    return {
      category: 'Preferences Not Set',
      detail: "No partner preferences configured. Set preferred birth year, location, or education in profile."
    };
  }

  const prefYear = prefs.preferredBirthYear ? Number(prefs.preferredBirthYear) : null;
  if (prefYear && !isNaN(prefYear) && prefYear > 1950) {
    const satisfyingBirthYear = oppositeGenderCandidates.filter(c => getProfileBirthYear(c) >= prefYear);
    if (satisfyingBirthYear.length === 0) {
      return {
        category: 'Age / Birth-Year Preference Unmet',
        detail: `No profiles satisfy the birth-year criteria (${prefYear}+). Excluded all ${oppositeGenderCandidates.length} candidates.`
      };
    }
  }

  const eduTokens = parsePreferenceTokens(prefs.education);
  if (eduTokens.length > 0) {
    const eduMatches = oppositeGenderCandidates.filter(c => {
      const candEdu = [c.highestEducation, c.degreeDetails, c.customEducation, c.education].filter(Boolean).join(' ');
      return matchesAnyToken(eduTokens, candEdu);
    });
    if (eduMatches.length === 0) {
      return {
        category: 'Education Preference Unmet',
        detail: `No candidate profiles satisfy the required education criteria ('${Array.isArray(prefs.education) ? prefs.education.join(', ') : prefs.education}').`
      };
    }
  }

  const locTokens = parsePreferenceTokens(prefs.location);
  if (locTokens.length > 0) {
    const locMatches = oppositeGenderCandidates.filter(c => {
      const candLoc = [c.location, c.nativePlace, c.parentsHometown, c.address].filter(Boolean).join(' ');
      return matchesAnyToken(locTokens, candLoc);
    });
    if (locMatches.length === 0) {
      return {
        category: 'Location Preference Unmet',
        detail: `No candidate profiles satisfy the location criteria ('${Array.isArray(prefs.location) ? prefs.location.join(', ') : prefs.location}').`
      };
    }
  }

  const msTokens = parsePreferenceTokens(prefs.maritalStatus);
  if (msTokens.length > 0) {
    const msMatches = oppositeGenderCandidates.filter(c => c.maritalStatus && matchesAnyToken(msTokens, c.maritalStatus));
    if (msMatches.length === 0) {
      return {
        category: 'Marital Status Preference Unmet',
        detail: `No candidate profiles satisfy the marital status criteria ('${prefs.maritalStatus}').`
      };
    }
  }

  // Check Kundali / Guna threshold if DOBs available
  let gunaFilteredOutCount = 0;
  if (myProfile.dob) {
    for (const cand of oppositeGenderCandidates) {
      if (cand.dob) {
        const isMaleGroom = myProfile.gender?.toLowerCase() === 'male';
        const result = calculateGunaMilan(
          isMaleGroom ? myProfile.dob : cand.dob,
          isMaleGroom ? myProfile.timeOfBirth : cand.timeOfBirth,
          isMaleGroom ? cand.dob : myProfile.dob,
          isMaleGroom ? cand.timeOfBirth : myProfile.timeOfBirth
        );
        if (result.isAvailable && result.totalScore < 18) {
          gunaFilteredOutCount++;
        }
      }
    }
    if (gunaFilteredOutCount === oppositeGenderCandidates.length) {
      return {
        category: 'Kundali / Guna Threshold Not Met',
        detail: `Kundali Ashtakoota Guna Milan score was below 18/36 threshold for all ${gunaFilteredOutCount} available candidate profiles.`
      };
    }
  }

  return {
    category: 'Matching Criteria Conflict',
    detail: `Candidates did not meet combined threshold score of ${DEFAULT_MATCH_THRESHOLD}% matching criteria.`
  };
}
