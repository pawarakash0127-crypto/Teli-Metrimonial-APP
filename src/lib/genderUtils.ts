export function normalizeGender(gender?: string): 'male' | 'female' | 'other' {
  if (!gender) return 'other';
  const g = gender.toLowerCase().trim();
  if (g === 'male' || g === 'पुरुष' || g === 'm') return 'male';
  if (g === 'female' || g === 'स्त्री' || g === 'f') return 'female';
  return 'other';
}

export function isOppositeGender(gender1?: string, gender2?: string): boolean {
  const g1 = normalizeGender(gender1);
  const g2 = normalizeGender(gender2);
  
  if (g1 === 'other' || g2 === 'other') return true; // Fail-open if unspecified
  return (g1 === 'male' && g2 === 'female') || (g1 === 'female' && g2 === 'male');
}

export function getOppositeGenderLabel(gender?: string): 'Female' | 'Male' | 'Any' {
  const normalized = normalizeGender(gender);
  if (normalized === 'male') return 'Female';
  if (normalized === 'female') return 'Male';
  return 'Any';
}
