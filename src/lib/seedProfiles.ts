import { db, doc, setDoc } from './firebase';

export interface SeedAccount {
  email: string;
  password: 'Password123!';
  gender: 'Male' | 'Female';
  uid: string;
  firstName: string;
  lastName: string;
  age: number;
  dob: string;
  timeOfBirth?: string;
  birthplace?: string;
  height: string;
  highestEducation?: string;
  degreeDetails?: string;
  university?: string;
  completionYear?: string;
  education: string;
  profession: string;
  companyName?: string;
  income?: string;
  location: string;
  nativePlace: string;
  gotraKul: string;
  maritalStatus: string;
  isManglik?: string;
  contactNumber: string;
  fatherTitle?: string;
  fatherName?: string;
  motherTitle?: string;
  motherName?: string;
  parentsHometown?: string;
  parentsOccupation?: string;
  parentsContact?: string;
  maternalUncleName?: string;
  maternalUncleGotraKul?: string;
  maternalUnclePlace?: string;
  maternalUnclePhone?: string;
  address?: string;
  siblings?: { name: string; type: string; occupation: string; maritalStatus: string }[];
  partnerExpectations?: string;
  photoUrl: string;
  additionalPhotos?: string[];
  status: 'approved' | 'pending' | 'archived';
  isArchived?: boolean;
  completeness: '100%' | '80%' | '60%' | '40%';
  partnerPreferences?: {
    preferredBirthYear?: number;
    education?: string;
    location?: string;
  };
}

// Helper to generate photo URLs from high quality Unsplash portraits
const MALE_PHOTOS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1480429370139-e0132c086e2a?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600'
];

const FEMALE_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1534751516642-a171e261f52c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&q=80&w=600'
];

const LAST_NAMES = [
  'Patil', 'Chaudhari', 'Kadam', 'Pawar', 'Shinde', 'Rathod', 'More', 'Wagh',
  'Deshmukh', 'Sonawane', 'Jadhav', 'Chavan', 'Kulkarni', 'Joshi', 'Borse',
  'Mahajan', 'Gaikwad', 'Suryawanshi', 'Nikam', 'Ahire', 'Deore', 'Bhamare',
  'Kharat', 'Shirsath', 'Wani', 'Pardeshi', 'Bhadane', 'Badgujar', 'Purohit', 'Saini'
];

const MALE_FIRST_NAMES = [
  'Rahul', 'Amit', 'Sachin', 'Rohan', 'Vikram', 'Gaurav', 'Prashant', 'Kunal',
  'Ajay', 'Nikhil', 'Sanket', 'Aditya', 'Swapnil', 'Akash', 'Bhushan', 'Chetan',
  'Dinesh', 'Harshal', 'Kiran', 'Mahesh', 'Mayur', 'Nilesh', 'Omkar', 'Pranav',
  'Rajesh', 'Sagar', 'Tejas', 'Umesh', 'Vaibhav', 'Yogesh', 'Abhijit', 'Aniket',
  'Deepak', 'Ganesh', 'Hemant', 'Jitendra', 'Lokesh', 'Manoj', 'Nitin', 'Pankaj',
  'Rakesh', 'Sameer', 'Tushar', 'Vijay', 'Vishal', 'Amol', 'Avinash', 'Dhananjay',
  'Kishor', 'Sandip'
];

const FEMALE_FIRST_NAMES = [
  'Pooja', 'Sneha', 'Priya', 'Anjali', 'Mayuri', 'Swati', 'Tejal', 'Diksha',
  'Pallavi', 'Aishwarya', 'Arti', 'Bhagyashree', 'Chaitrali', 'Divya', 'Gayatri',
  'Harshada', 'Komal', 'Madhuri', 'Neha', 'Poonam', 'Radhika', 'Sayali',
  'Tanvi', 'Urmila', 'Vaishali', 'Yogita', 'Akshata', 'Archana', 'Ashwini',
  'Dipali', 'Kavita', 'Mansi', 'Nisha', 'Pranali', 'Rutuja', 'Shweta',
  'Trishna', 'Varsha', 'Aarti', 'Anita', 'Bhakti', 'Deepali', 'Jeevika',
  'Kalyani', 'Monika', 'Pranjal', 'Rashmi', 'Sonali', 'Vidya', 'Prachi'
];

const LOCATIONS = [
  'Nashik, Maharashtra', 'Pune, Maharashtra', 'Mumbai, Maharashtra',
  'Thane, Maharashtra', 'Nagpur, Maharashtra', 'Chhatrapati Sambhajinagar, Maharashtra',
  'Jalgaon, Maharashtra', 'Dhule, Maharashtra', 'Kolhapur, Maharashtra',
  'Ahilyanagar, Maharashtra', 'Solapur, Maharashtra', 'Amravati, Maharashtra'
];

const NATIVE_PLACES = [
  'Sinnar, Nashik', 'Yeola, Nashik', 'Malegaon, Nashik', 'Pachora, Jalgaon',
  'Bhadgaon, Jalgaon', 'Shirpur, Dhule', 'Niphad, Nashik', 'Satana, Nashik',
  'Chandwad, Nashik', 'Dindori, Nashik', 'Karad, Satara', 'Pandharpur, Solapur'
];

const GOTRA_KULS = [
  'Kadam (काढम)', 'Chaudhari (चौधरी)', 'Patil (पाटील)', 'Pawar (पवार)',
  'Shinde (शिंदे)', 'Rathod (राठोड)', 'More (मोरे)', 'Wagh (वाघ)',
  'Deshmukh (देशमुख)', 'Sonawane (सोनावणे)', 'Jadhav (जाधव)', 'Borse (बोर्से)'
];

const EDUCATIONS: { highest: string; degree: string; uni: string }[] = [
  { highest: 'Engineering', degree: 'B.E. Computer Engineering', uni: 'Savitribai Phule Pune University' },
  { highest: 'Engineering', degree: 'B.Tech Information Technology', uni: 'Veermata Jijabai Technological Institute (VJTI)' },
  { highest: 'Medical', degree: 'MBBS, MD Pediatrics', uni: 'Maharashtra University of Health Sciences' },
  { highest: 'Medical', degree: 'BDS Dental Surgery', uni: 'MUHS Nashik' },
  { highest: 'MBA', degree: 'MBA Marketing & Finance', uni: 'University of Mumbai' },
  { highest: 'CA / CS / CMA', degree: 'Chartered Accountant (CA)', uni: 'ICAI New Delhi' },
  { highest: 'Pharmacy', degree: 'M.Pharm Quality Assurance', uni: 'Pune University' },
  { highest: 'Master\'s Degree', degree: 'M.Sc Data Science', uni: 'NMIMS Mumbai' },
  { highest: 'Bachelor\'s Degree', degree: 'B.Com Accounting', uni: 'KBC North Maharashtra University Jalgaon' },
  { highest: 'Law', degree: 'LL.B Corporate Law', uni: 'ILSK Law College Pune' },
  { highest: 'Nursing', degree: 'B.Sc Nursing', uni: 'MUHS Nashik' },
  { highest: 'Diploma', degree: 'Diploma Mechanical Engg', uni: 'MSBTE Mumbai' }
];

const PROFESSIONS = [
  { title: 'Senior Software Engineer', company: 'TCS Innovation Labs', income: '₹ 14,00,000 PA' },
  { title: 'Data Scientist', company: 'Microsoft India', income: '₹ 20,00,000 PA' },
  { title: 'Pediatrician Doctor', company: 'Apollo Hospitals', income: '₹ 22,00,000 PA' },
  { title: 'Marketing Manager', company: 'Godrej Consumer Products', income: '₹ 16,50,000 PA' },
  { title: 'Financial Analyst & CA', company: 'PwC India', income: '₹ 18,00,000 PA' },
  { title: 'Construction Business Owner', company: 'Shinde Developers', income: '₹ 25,00,000 PA' },
  { title: 'Quality Assurance Scientist', company: 'Lupin Pharma', income: '₹ 8,50,000 PA' },
  { title: 'HR Operations Lead', company: 'Accenture India', income: '₹ 11,00,000 PA' },
  { title: 'Interior Architect', company: 'Space Crafts Design', income: '₹ 7,50,000 PA' },
  { title: 'Bank Branch Manager', company: 'State Bank of India', income: '₹ 13,50,000 PA' },
  { title: 'High School Senior Teacher', company: 'St. Xavier School', income: '₹ 6,50,000 PA' },
  { title: 'UI/UX Lead Designer', company: 'Zomato Ltd', income: '₹ 12,00,000 PA' }
];

// Helper to generate 100 profiles deterministically
function generate100Profiles(): SeedAccount[] {
  const accounts: SeedAccount[] = [];

  for (let i = 1; i <= 100; i++) {
    const isMale = i <= 50;
    const gender: 'Male' | 'Female' = isMale ? 'Male' : 'Female';
    const idNum = String(i).padStart(3, '0');
    const uid = `test_profile_${idNum}`;
    const email = `testuser${idNum}@telisamaj.org`;

    const firstNameList = isMale ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;
    const photoList = isMale ? MALE_PHOTOS : FEMALE_PHOTOS;

    const firstName = firstNameList[(i - 1) % firstNameList.length];
    const lastName = LAST_NAMES[(i - 1) % LAST_NAMES.length];

    // Age distribution: 23 to 34
    const age = 23 + (i % 11);
    const birthYear = 2026 - age;
    const dob = `${birthYear}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`;

    const heightInches = isMale ? (66 + (i % 7)) : (62 + (i % 6)); // 5'6" - 6'0" for male, 5'2" - 5'7" for female
    const feet = Math.floor(heightInches / 12);
    const inches = heightInches % 12;
    const height = `${feet}'${inches}"`;

    const eduObj = EDUCATIONS[i % EDUCATIONS.length];
    const profObj = PROFESSIONS[i % PROFESSIONS.length];

    const location = LOCATIONS[i % LOCATIONS.length];
    const nativePlace = NATIVE_PLACES[i % NATIVE_PLACES.length];
    const gotraKul = GOTRA_KULS[i % GOTRA_KULS.length];

    const photoUrl = photoList[(i - 1) % photoList.length];

    // Status: 80 Approved (1-80), 10 Pending (81-90), 10 Archived (91-100)
    let status: 'approved' | 'pending' | 'archived' = 'approved';
    let isArchived = false;
    if (i > 80 && i <= 90) {
      status = 'pending';
    } else if (i > 90) {
      status = 'archived';
      isArchived = true;
    }

    // Completeness distribution:
    // 1-30: 100% (Complete)
    // 31-70: 80% (Mostly complete)
    // 71-90: 60% (Partial)
    // 91-100: 40% (Minimal)
    let completeness: '100%' | '80%' | '60%' | '40%' = '100%';
    if (i > 30 && i <= 70) completeness = '80%';
    else if (i > 70 && i <= 90) completeness = '60%';
    else if (i > 90) completeness = '40%';

    const isFull = completeness === '100%' || completeness === '80%';

    // Partner expectations for matching scenarios
    const prefBirthYear = isMale ? birthYear - 3 : birthYear - 5;
    const prefEdu = i % 2 === 0 ? 'Engineering / Medical / MBA' : 'Graduate / Any';
    const prefLoc = i % 3 === 0 ? 'Nashik, Pune, Mumbai' : 'Maharashtra / Any';

    accounts.push({
      email,
      password: 'Password123!',
      gender,
      uid,
      firstName,
      lastName,
      age,
      dob,
      timeOfBirth: isFull ? `${(i % 12) + 1}:30 AM` : undefined,
      birthplace: isFull ? nativePlace.split(',')[0] : undefined,
      height,
      highestEducation: eduObj.highest,
      degreeDetails: eduObj.degree,
      university: eduObj.uni,
      completionYear: String(birthYear + 22),
      education: `${eduObj.degree} (${eduObj.uni})`,
      profession: profObj.title,
      companyName: isFull ? profObj.company : undefined,
      income: isFull ? profObj.income : undefined,
      location,
      nativePlace,
      gotraKul,
      maritalStatus: 'Never Married',
      isManglik: i % 5 === 0 ? 'Anshik (Mild)' : i % 7 === 0 ? 'Yes' : 'No',
      contactNumber: `98230${idNum}11`,
      fatherTitle: 'Shri',
      fatherName: isFull ? `Ramesh ${lastName}` : `Ramesh ${lastName}`,
      motherTitle: 'Smt.',
      motherName: isFull ? `Sunita ${lastName}` : `Sunita ${lastName}`,
      parentsHometown: nativePlace,
      parentsOccupation: isFull ? 'Business / Retired Govt Service' : undefined,
      parentsContact: `98230${idNum}22`,
      maternalUncleName: isFull ? `Dattatray Pawar` : undefined,
      maternalUncleGotraKul: isFull ? `Pawar (पवार)` : undefined,
      maternalUnclePlace: isFull ? `Nashik` : undefined,
      maternalUnclePhone: isFull ? `9823000999` : undefined,
      address: isFull ? `Panchavati, ${location}` : undefined,
      siblings: isFull ? [
        {
          name: gender === 'Male' ? `Pooja ${lastName}` : `Sachin ${lastName}`,
          type: gender === 'Male' ? 'Younger Sister' : 'Elder Brother',
          occupation: 'IT Professional',
          maritalStatus: 'Unmarried'
        }
      ] : undefined,
      partnerExpectations: `Looking for an educated, respectful, family-oriented partner from Teli Samaj. Preferred location: ${prefLoc}.`,
      photoUrl,
      additionalPhotos: [photoUrl],
      status,
      isArchived,
      completeness,
      partnerPreferences: {
        preferredBirthYear: prefBirthYear > 1980 ? prefBirthYear : 1995,
        education: prefEdu,
        location: prefLoc
      }
    });
  }

  return accounts;
}

export const SAMPLE_ACCOUNTS: SeedAccount[] = generate100Profiles();

let isSeedingInProgress = false;

export async function seedSampleProfilesToFirestore(): Promise<{ count: number; profiles: SeedAccount[] }> {
  if (isSeedingInProgress) {
    console.log("Seeding already in progress, skipping duplicate call...");
    return { count: 0, profiles: [] };
  }
  isSeedingInProgress = true;
  let seededCount = 0;

  try {
    for (const account of SAMPLE_ACCOUNTS) {
    const profileRef = doc(db, 'profiles', account.uid);
    const userRef = doc(db, 'users', account.uid);

    const profileData = {
      uid: account.uid,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      gender: account.gender,
      age: account.age,
      dob: account.dob,
      timeOfBirth: account.timeOfBirth || '',
      birthplace: account.birthplace || '',
      height: account.height,
      highestEducation: account.highestEducation,
      degreeDetails: account.degreeDetails,
      university: account.university,
      completionYear: account.completionYear,
      education: account.education,
      profession: account.profession,
      companyName: account.companyName || '',
      income: account.income || '',
      location: account.location,
      nativePlace: account.nativePlace,
      gotraKul: account.gotraKul,
      maritalStatus: account.maritalStatus,
      isManglik: account.isManglik,
      contactNumber: account.contactNumber,
      parentsContact: account.parentsContact || '',
      fatherTitle: account.fatherTitle || 'Shri',
      fatherName: account.fatherName || '',
      motherTitle: account.motherTitle || 'Smt.',
      motherName: account.motherName || '',
      parentsHometown: account.parentsHometown || '',
      parentsOccupation: account.parentsOccupation || '',
      maternalUncleName: account.maternalUncleName || '',
      maternalUncleGotraKul: account.maternalUncleGotraKul || '',
      maternalUnclePlace: account.maternalUnclePlace || '',
      maternalUnclePhone: account.maternalUnclePhone || '',
      address: account.address || '',
      siblings: account.siblings ? JSON.stringify(account.siblings) : '[]',
      partnerExpectations: account.partnerExpectations,
      photoUrl: account.photoUrl,
      additionalPhotos: account.additionalPhotos || [account.photoUrl],
      status: account.status,
      isArchived: account.isArchived || false,
      isFeatured: account.status === 'approved',
      isTestProfile: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      partnerPreferences: account.partnerPreferences || {
        preferredBirthYear: 1995,
        education: 'Graduate / Engineering / Any',
        location: 'Maharashtra / Any'
      }
    };

    const userData = {
      uid: account.uid,
      email: account.email,
      phoneNumber: account.contactNumber,
      role: 'user',
      createdAt: new Date().toISOString(),
      favorites: []
    };

    await setDoc(profileRef, profileData, { merge: true });
    await setDoc(userRef, userData, { merge: true });
    seededCount++;
  }

  return { count: seededCount, profiles: SAMPLE_ACCOUNTS };
  } finally {
    isSeedingInProgress = false;
  }
}
