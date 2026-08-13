import { MANDATORY_PROFILE_FIELDS } from './phoneUtils';

export interface MandatoryField {
  key: string;
  label: string;
}

export interface ProfileCompletenessResult {
  isComplete: boolean;
  missingFields: MandatoryField[];
  completedCount: number;
  totalCount: number;
  percentage: number;
}

/**
 * Centralized rule for checking profile completeness across the entire application.
 * Evaluates the actual Firestore profile data against mandatory field requirements.
 */
export function checkProfileCompleteness(profileData: any): ProfileCompletenessResult {
  if (!profileData) {
    return {
      isComplete: false,
      missingFields: [...MANDATORY_PROFILE_FIELDS],
      completedCount: 0,
      totalCount: MANDATORY_PROFILE_FIELDS.length,
      percentage: 0,
    };
  }

  const missingFields: MandatoryField[] = [];

  for (const field of MANDATORY_PROFILE_FIELDS) {
    let val = profileData[field.key];

    // Check alias keys if primary key is blank
    if (field.key === 'gotraKul' && (!val || String(val).trim() === '')) {
      val = profileData.gotra;
    } else if (field.key === 'education' && (!val || String(val).trim() === '')) {
      val = profileData.highestEducation || profileData.customEducation;
    }

    // Validation checks
    if (val === undefined || val === null || String(val).trim() === '') {
      missingFields.push({ key: field.key, label: field.label });
    } else if (field.key === 'contactNumber') {
      const digits = String(val).replace(/[^\d]/g, '');
      if (digits.length < 10) {
        missingFields.push({ key: field.key, label: field.label });
      }
    }
  }

  const totalCount = MANDATORY_PROFILE_FIELDS.length;
  const completedCount = totalCount - missingFields.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  // A profile is complete only if there are no missing mandatory fields
  const isComplete = missingFields.length === 0;

  return {
    isComplete,
    missingFields,
    completedCount,
    totalCount,
    percentage,
  };
}
