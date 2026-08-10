// Profile field translator for Marathi and English

const monthMapMr: { [key: number]: string } = {
  0: 'जानेवारी',
  1: 'फेब्रुवारी',
  2: 'मार्च',
  3: 'एप्रिल',
  4: 'मे',
  5: 'जून',
  6: 'जुलै',
  7: 'ऑगस्ट',
  8: 'सप्टेंबर',
  9: 'ऑक्टोबर',
  10: 'नोव्हेंबर',
  11: 'डिसेंबर'
};

const monthMapEn: { [key: number]: string } = {
  0: 'January',
  1: 'February',
  2: 'March',
  3: 'April',
  4: 'May',
  5: 'June',
  6: 'July',
  7: 'August',
  8: 'September',
  9: 'October',
  10: 'November',
  11: 'December'
};

const devanagariDigits: { [key: string]: string } = {
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
  '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
};

export function toDevanagariNumerals(str: string | number): string {
  return String(str).replace(/[0-9]/g, (digit) => devanagariDigits[digit] || digit);
}

const termsMapMr: { [key: string]: string } = {
  // Marital Status
  'Never Married': 'अविवाहित',
  'Unmarried': 'अविवाहित',
  'Divorced': 'घटस्फोटित',
  'Widowed': 'विधवा / विधुर',
  'Married': 'विवाहित',

  // Manglik
  'Yes': 'होय (मांगलिक)',
  'No': 'नाही (अमांगलिक)',
  'Doesn\'t Matter': 'काही फरक पडत नाही',

  // Gender
  'Male': 'पुरुष (वर)',
  'Female': 'स्त्री (वधू)',
  'Groom': 'वर',
  'Bride': 'वधू',

  // Professions
  'Software Engineer': 'सॉफ्टवेअर इंजिनिअर',
  'Software Developer': 'सॉफ्टवेअर डेव्हलपर',
  'Engineer': 'अभियांता (इंजिनिअर)',
  'Civil Engineer': 'सिव्हिल इंजिनिअर',
  'Mechanical Engineer': 'मेकॅनिकल इंजिनिअर',
  'Electrical Engineer': 'इलेक्ट्रिकल इंजिनिअर',
  'Doctor': 'डॉक्टर',
  'Teacher': 'शिक्षक / शिक्षिका',
  'Professor': 'प्राध्यापक',
  'Business': 'व्यवसाय',
  'Businessman': 'व्यावसायिक',
  'Businesswoman': 'महिला व्यावसायिक',
  'Accountant': 'लेखापाल (अकाउंटंट)',
  'Chartered Accountant': 'सनदी लेखापाल (C.A.)',
  'Farmer': 'शेतकरी (कृषी)',
  'Government Job': 'शासकीय नोकरी',
  'Private Job': 'खाजगी नोकरी',
  'Banker': 'बँक कर्मचारी / अधिकारी',
  'Lawyer': 'वकील',
  'Architect': 'वास्तुविशारद',
  'Service': 'नोकरी',
  'Self Employed': 'स्वयंरोजगार',
  'Homemaker': 'गृहिणी',
  'Student': 'विद्यार्थी',

  // Education
  'B.Tech': 'बी.टेक (अभियांत्रिकी पदवी)',
  'M.Tech': 'एम.टेक',
  'B.E.': 'बी.ई.',
  'M.E.': 'एम.ई.',
  'MBA': 'एम.बी.ए.',
  'MCA': 'एम.सी.ए.',
  'B.Com': 'बी.कॉम',
  'M.Com': 'एम.कॉम',
  'B.Sc': 'बी.एससी',
  'M.Sc': 'एम.एससी',
  'B.A.': 'बी.ए.',
  'M.A.': 'एम.ए.',
  'MBBS': 'एम.बी.बी.एस.',
  'BDS': 'बी.डी.एस.',
  'BAMS': 'बी.ए.एम.एस.',
  'BHMS': 'बी.एच.एम.एस.',
  'CA': 'सी.ए.',
  'Graduate': 'पदवीधर',
  'Post Graduate': 'पदव्युत्तर',
  'Doctorate': 'डॉक्टरेट',
  'Diploma': 'डिप्लोमा',
  'High School': 'उच्च माध्यमिक',

  // Sibling types
  'Brother': 'भाऊ',
  'Sister': 'बहीण',
  'Younger Brother': 'लहान भाऊ',
  'Elder Brother': 'मोठा भाऊ',
  'Younger Sister': 'लहान बहीण',
  'Elder Sister': 'मोठी बहीण',

  // Common Cities / Locations
  'Nashik': 'नाशिक',
  'Pune': 'पुणे',
  'Mumbai': 'मुंबई',
  'Thane': 'ठाणे',
  'Nagpur': 'नागपूर',
  'Chhatrapati Sambhajinagar': 'छत्रपती संभाजीनगर',
  'Aurangabad': 'छत्रपती संभाजीनगर (औरंगाबाद)',
  'Dhule': 'धुळे',
  'Jalgaon': 'जळगाव',
  'Ahmednagar': 'अहमदनगर',
  'Satara': 'सातारा',
  'Solapur': 'सोलापूर',
  'Kolhapur': 'कोल्हापूर',
  'Sangli': 'सांगली',
  'Nanded': 'नांदेड',
  'Amravati': 'अमरावती',
  'Akola': 'अकोला',
  'Latur': 'लातूर',
  'Yavatmal': 'यवतमाळ',
  'Buldhana': 'बुलढाणा',
  'Delhi': 'दिल्ली',
  'Bengaluru': 'बंगळुरू',
  'Hyderabad': 'हैदराबाद'
};

export function translateText(text: string | undefined | null, lang: string): string {
  if (!text) return '';
  if (lang !== 'mr') return text;

  // Direct lookup
  if (termsMapMr[text]) return termsMapMr[text];

  // Partial replacement for locations / mixed strings
  let result = text;
  Object.keys(termsMapMr).forEach((key) => {
    if (result.includes(key)) {
      result = result.replace(new RegExp(key, 'g'), termsMapMr[key]);
    }
  });

  return result;
}

export function formatDateOfBirth(dob: string | undefined, timeOfBirth: string | undefined, lang: string): string {
  if (!dob) return lang === 'mr' ? 'माहिती उपलब्ध नाही' : 'N/A';
  try {
    const d = new Date(dob);
    if (isNaN(d.getTime())) return dob;

    const day = d.getDate();
    const monthIndex = d.getMonth();
    const year = d.getFullYear();

    let formattedTime = '';
    if (timeOfBirth) {
      const [hours, minutes] = timeOfBirth.split(':');
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      if (!isNaN(h) && !isNaN(m)) {
        const ampm = h >= 12 ? (lang === 'mr' ? 'संध्याकाळी/रात्री' : 'PM') : (lang === 'mr' ? 'सकाळी' : 'AM');
        const displayH = h % 12 || 12;
        const displayM = m < 10 ? `0${m}` : m;
        formattedTime = lang === 'mr'
          ? ` • ${ampm} ${toDevanagariNumerals(displayH)}:${toDevanagariNumerals(displayM)} वा.`
          : ` • ${displayH}:${displayM} ${ampm}`;
      }
    }

    if (lang === 'mr') {
      const monthMr = monthMapMr[monthIndex];
      return `${toDevanagariNumerals(day)} ${monthMr} ${toDevanagariNumerals(year)}${formattedTime}`;
    } else {
      const monthEn = monthMapEn[monthIndex];
      return `${day} ${monthEn} ${year}${formattedTime}`;
    }
  } catch (e) {
    return dob;
  }
}

export function formatAgeDisplay(age: number | string | undefined, lang: string): string {
  if (!age) return '';
  if (lang === 'mr') {
    return `${toDevanagariNumerals(age)} वर्षे`;
  }
  return `${age} yrs`;
}

export function formatHeightDisplay(height: string | undefined, lang: string): string {
  if (!height) return '';
  if (lang === 'mr') {
    // Translate feet/inches notation if present
    const devHeight = toDevanagariNumerals(height);
    return devHeight.replace(/'/g, ' फूट ').replace(/"/g, ' इंच');
  }
  return height;
}

export function translateSiblingsList(siblingsInput: any, lang: string): any[] {
  if (!siblingsInput) return [];
  let list: any[] = [];
  try {
    list = typeof siblingsInput === 'string' ? JSON.parse(siblingsInput) : siblingsInput;
  } catch (e) {
    return [];
  }
  if (!Array.isArray(list)) return [];

  if (lang !== 'mr') return list;

  return list.map((sib) => ({
    ...sib,
    name: sib.name,
    type: translateText(sib.type, 'mr'),
    occupation: translateText(sib.occupation, 'mr'),
    maritalStatus: translateText(sib.maritalStatus, 'mr')
  }));
}
