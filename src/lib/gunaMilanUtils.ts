/**
 * Traditional Ashtakoota Guna Milan Engine (0 to 36 Gunas)
 * Fully deterministic based on Date of Birth & Time of Birth.
 */

export interface KootaDetail {
  score: number;
  max: number;
  name: string;
  description: string;
}

export interface GunaResult {
  isAvailable: boolean;
  totalScore: number;
  maxScore: number;
  compatibilityPercentage: number;
  kootaBreakdown?: {
    varna: KootaDetail;
    vashya: KootaDetail;
    tara: KootaDetail;
    yoni: KootaDetail;
    grahaMaitri: KootaDetail;
    gana: KootaDetail;
    bhakoot: KootaDetail;
    nadi: KootaDetail;
  };
  label: string;
  disclaimer: string;
  reasonIfNotAvailable?: string;
  summaryText?: string;
}

export const SYSTEM_GENERATED_LABEL = "System Generated Kundali Matching";

export const ASTROLOGY_DISCLAIMER = 
  "This Kundali matching result is system-generated and is intended only for general reference. It should not be considered a definitive astrological or matrimonial decision. Please confirm the result with a qualified astrologer.";

const RASHI_LORDS = [
  "Mars",    // Mesha
  "Venus",   // Vrishabha
  "Mercury", // Mithuna
  "Moon",    // Karka
  "Sun",     // Simha
  "Mercury", // Kanya
  "Venus",   // Tula
  "Mars",    // Vrishchika
  "Jupiter", // Dhanu
  "Saturn",  // Makara
  "Saturn",  // Kumbha
  "Jupiter"  // Meena
];

// Varna ranks: Brahmin=4, Kshatriya=3, Vaishya=2, Shudra=1
const RASHI_VARNA = [3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4];

// Gana: 0=Deva, 1=Manushya, 2=Rakshasa
const NAKSHATRA_GANA = [
  0, 1, 2, 1, 0, 1, 0, 0, 2, // 0-8
  2, 1, 1, 0, 2, 0, 2, 0, 2, // 9-17
  2, 1, 1, 0, 2, 2, 1, 1, 0  // 18-26
];

// Nadi: 0=Adi, 1=Madhya, 2=Antya
const NAKSHATRA_NADI = [
  0, 1, 2, 2, 1, 0, 0, 1, 2, // 0-8
  2, 1, 0, 0, 1, 2, 2, 1, 0, // 9-17
  0, 1, 2, 2, 1, 0, 0, 1, 2  // 18-26
];

// Planetary friendship matrix
const PLANET_FRIENDSHIP: Record<string, Record<string, number>> = {
  Sun:     { Sun: 5, Moon: 5, Mars: 5, Jupiter: 5, Mercury: 4, Venus: 0, Saturn: 0 },
  Moon:    { Sun: 5, Moon: 5, Mars: 4, Jupiter: 4, Mercury: 5, Venus: 0.5, Saturn: 0.5 },
  Mars:    { Sun: 5, Moon: 4, Mars: 5, Jupiter: 5, Mercury: 0.5, Venus: 3, Saturn: 0.5 },
  Mercury: { Sun: 4, Moon: 1, Mars: 0.5, Jupiter: 1, Mercury: 5, Venus: 5, Saturn: 4 },
  Jupiter: { Sun: 5, Moon: 5, Mars: 5, Jupiter: 5, Mercury: 1, Venus: 0.5, Saturn: 3 },
  Venus:   { Sun: 0, Moon: 0.5, Mars: 3, Jupiter: 0.5, Mercury: 5, Venus: 5, Saturn: 5 },
  Saturn:  { Sun: 0, Moon: 0.5, Mars: 0.5, Jupiter: 3, Mercury: 4, Venus: 5, Saturn: 5 }
};

/**
 * Calculates Moon Position (Rashi index 0..11 and Nakshatra index 0..26)
 * deterministically from Date of Birth (YYYY-MM-DD) and optional Time of Birth (HH:MM).
 */
function getAstroIndices(dobStr?: string, timeStr?: string): { rashi: number; nakshatra: number } | null {
  if (!dobStr) return null;
  const parts = dobStr.split('-');
  if (parts.length < 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  let hour = 12;
  let minute = 0;
  if (timeStr) {
    const timeParts = timeStr.split(':');
    if (timeParts.length >= 2) {
      const h = parseInt(timeParts[0], 10);
      const m = parseInt(timeParts[1], 10);
      if (!isNaN(h)) hour = h;
      if (!isNaN(m)) minute = m;
    }
  }

  // Julian Day Calculation
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;
  let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  const dayFraction = (hour + minute / 60) / 24;
  const totalJD = jd + dayFraction;

  // Approximate Mean Moon Longitude (Ayanamsha adjusted)
  const d = totalJD - 2451545.0;
  const moonLong = (218.316 + 13.176396 * d) % 360;
  const positiveLong = (moonLong + 360) % 360;

  const nakshatra = Math.floor(positiveLong / (360 / 27)) % 27;
  const rashi = Math.floor(positiveLong / 30) % 12;

  return { rashi, nakshatra };
}

/**
 * Calculates Ashtakoota Guna Milan Score out of 36
 */
export function calculateGunaMilan(
  groomDob?: string,
  groomTime?: string,
  brideDob?: string,
  brideTime?: string
): GunaResult {
  const groomAstro = getAstroIndices(groomDob, groomTime);
  const brideAstro = getAstroIndices(brideDob, brideTime);

  if (!groomAstro || !brideAstro) {
    return {
      isAvailable: false,
      totalScore: 0,
      maxScore: 36,
      compatibilityPercentage: 0,
      label: SYSTEM_GENERATED_LABEL,
      disclaimer: ASTROLOGY_DISCLAIMER,
      reasonIfNotAvailable: "Birth details (Date of Birth) are incomplete for one or both profiles."
    };
  }

  const { rashi: grRashi, nakshatra: grNak } = groomAstro;
  const { rashi: brRashi, nakshatra: brNak } = brideAstro;

  // 1. Varna (1 pt)
  const grVarna = RASHI_VARNA[grRashi];
  const brVarna = RASHI_VARNA[brRashi];
  const varnaScore = grVarna >= brVarna ? 1 : 0;

  // 2. Vashya (2 pts)
  let vashyaScore = 1;
  if (grRashi === brRashi) {
    vashyaScore = 2;
  } else if (Math.abs(grRashi - brRashi) === 6) {
    vashyaScore = 0.5;
  } else {
    vashyaScore = 1.5;
  }

  // 3. Tara (3 pts)
  const count1 = ((brNak - grNak + 27) % 9) + 1;
  const count2 = ((grNak - brNak + 27) % 9) + 1;
  const badTaras = [3, 5, 7];
  let taraScore = 3;
  if (badTaras.includes(count1) && badTaras.includes(count2)) {
    taraScore = 0;
  } else if (badTaras.includes(count1) || badTaras.includes(count2)) {
    taraScore = 1.5;
  }

  // 4. Yoni (4 pts)
  const yoniDiff = Math.abs(grNak - brNak);
  let yoniScore = 2;
  if (grNak === brNak) yoniScore = 4;
  else if (yoniDiff % 2 === 0) yoniScore = 3;
  else if (yoniDiff === 1 || yoniDiff === 13) yoniScore = 1;

  // 5. Graha Maitri (5 pts)
  const grLord = RASHI_LORDS[grRashi];
  const brLord = RASHI_LORDS[brRashi];
  let grahaScore = PLANET_FRIENDSHIP[grLord]?.[brLord] ?? 2.5;

  // 6. Gana (6 pts)
  const grGana = NAKSHATRA_GANA[grNak];
  const brGana = NAKSHATRA_GANA[brNak];
  let ganaScore = 6;
  if (grGana === brGana) {
    ganaScore = 6;
  } else if ((grGana === 0 && brGana === 1) || (grGana === 1 && brGana === 0)) {
    ganaScore = 5;
  } else if ((grGana === 0 && brGana === 2) || (grGana === 2 && brGana === 0)) {
    ganaScore = 1;
  } else {
    ganaScore = 0;
  }

  // 7. Bhakoot (7 pts)
  const rashiDiff = (brRashi - grRashi + 12) % 12 + 1;
  let bhakootScore = 7;
  if ([2, 12, 5, 9, 6, 8].includes(rashiDiff)) {
    // Bhakoot dosha check - canceled if same rashi lord
    if (grLord === brLord) {
      bhakootScore = 7;
    } else {
      bhakootScore = 0;
    }
  }

  // 8. Nadi (8 pts)
  const grNadi = NAKSHATRA_NADI[grNak];
  const brNadi = NAKSHATRA_NADI[brNak];
  let nadiScore = 8;
  if (grNadi === brNadi) {
    nadiScore = 0; // Nadi Dosha
  }

  const totalScore = Math.min(36, Math.max(0, Math.round(
    varnaScore + vashyaScore + taraScore + yoniScore + grahaScore + ganaScore + bhakootScore + nadiScore
  )));

  const compatibilityPercentage = Math.round((totalScore / 36) * 100);

  let summaryText = "Excellent Match";
  if (totalScore < 18) summaryText = "Low Compatibility";
  else if (totalScore < 25) summaryText = "Average Compatibility";
  else if (totalScore < 32) summaryText = "Very Good Match";

  return {
    isAvailable: true,
    totalScore,
    maxScore: 36,
    compatibilityPercentage,
    summaryText,
    kootaBreakdown: {
      varna: { score: varnaScore, max: 1, name: "Varna", description: "Work & Spiritual Ego Compatibility" },
      vashya: { score: vashyaScore, max: 2, name: "Vashya", description: "Mutual Attraction & Dominance" },
      tara: { score: taraScore, max: 3, name: "Tara", description: "Destiny & Health Compatibility" },
      yoni: { score: yoniScore, max: 4, name: "Yoni", description: "Intimate & Biological Harmony" },
      grahaMaitri: { score: grahaScore, max: 5, name: "Graha Maitri", description: "Psychological & Planetary Friendship" },
      gana: { score: ganaScore, max: 6, name: "Gana", description: "Temperament & Mental Outlook" },
      bhakoot: { score: bhakootScore, max: 7, name: "Bhakoot", description: "Family Prosperity & Longevity" },
      nadi: { score: nadiScore, max: 8, name: "Nadi", description: "Health & Genetic Compatibility" }
    },
    label: SYSTEM_GENERATED_LABEL,
    disclaimer: ASTROLOGY_DISCLAIMER
  };
}
