import React from 'react';
import { calculateGunaMilan, GunaResult } from '../lib/gunaMilanUtils';
import { Sparkles, CheckCircle2, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GunaMatchingCardProps {
  myProfile: any;
  targetProfile: any;
}

export default function GunaMatchingCard({ myProfile, targetProfile }: GunaMatchingCardProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  if (!myProfile || !targetProfile) return null;
  if (myProfile.uid === targetProfile.uid) return null;
  if (myProfile.role === 'admin' || myProfile.isAdmin || targetProfile.role === 'admin' || targetProfile.isAdmin) return null;

  const myGender = (myProfile.gender || '').trim().toLowerCase();
  const targetGender = (targetProfile.gender || '').trim().toLowerCase();

  const isMyMale = myGender === 'male' || myGender === 'groom' || myGender === 'var';
  const isTargetMale = targetGender === 'male' || targetGender === 'groom' || targetGender === 'var';
  const isMyFemale = myGender === 'female' || myGender === 'bride' || myGender === 'vadu';
  const isTargetFemale = targetGender === 'female' || targetGender === 'bride' || targetGender === 'vadu';

  // Requirement 5: Male to male and female to female profile guna match not required. Only male to female pairs allowed.
  if ((isMyMale && isTargetMale) || (isMyFemale && isTargetFemale)) {
    return null;
  }

  // Must be one male and one female
  if (!(isMyMale && isTargetFemale) && !(isMyFemale && isTargetMale)) {
    return null;
  }

  const groomProfile = isMyMale ? myProfile : targetProfile;
  const brideProfile = isMyMale ? targetProfile : myProfile;

  const groomDob = groomProfile.dob || groomProfile.dateOfBirth;
  const groomTime = groomProfile.timeOfBirth || groomProfile.birthTime;
  const groomPlace = groomProfile.birthplace || groomProfile.birthPlace || groomProfile.placeOfBirth;

  const brideDob = brideProfile.dob || brideProfile.dateOfBirth;
  const brideTime = brideProfile.timeOfBirth || brideProfile.birthTime;
  const bridePlace = brideProfile.birthplace || brideProfile.birthPlace || brideProfile.placeOfBirth;

  const getMissingFieldsList = (dob?: string, time?: string, place?: string) => {
    const missing = [];
    if (!dob || !dob.trim()) missing.push(currentLang === 'mr' ? 'जन्म तारीख (Date of Birth)' : 'Date of Birth');
    if (!time || !time.trim()) missing.push(currentLang === 'mr' ? 'जन्म वेळ (Time of Birth)' : 'Time of Birth');
    if (!place || !place.trim()) missing.push(currentLang === 'mr' ? 'जन्म ठिकाण (Place of Birth)' : 'Place of Birth');
    return missing;
  };

  const myMissing = getMissingFieldsList(
    myProfile.dob || myProfile.dateOfBirth,
    myProfile.timeOfBirth || myProfile.birthTime,
    myProfile.birthplace || myProfile.birthPlace || myProfile.placeOfBirth
  );

  const targetMissing = getMissingFieldsList(
    targetProfile.dob || targetProfile.dateOfBirth,
    targetProfile.timeOfBirth || targetProfile.birthTime,
    targetProfile.birthplace || targetProfile.birthPlace || targetProfile.placeOfBirth
  );

  const isGunaCalculable = myMissing.length === 0 && targetMissing.length === 0;

  if (!isGunaCalculable) {
    return (
      <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-100/30 p-6 md:p-8 rounded-3xl border-2 border-amber-300/60 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-saffron via-gold to-saffron" />
        
        <div className="flex items-center gap-3 mb-4">
          <span className="p-2.5 bg-saffron/10 text-saffron rounded-2xl border border-saffron/20 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </span>
          <div>
            <h3 className="text-xl font-serif font-bold text-stone-900">
              {currentLang === 'mr' ? 'गुण जुळवणी (Kundali Match)' : 'Guna Milan (Kundali Match)'}
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              {currentLang === 'mr' 
                ? 'जन्म पत्रिका अष्टकूट गुण जुळवणी विश्लेषण' 
                : 'Ashtakoota 36 Guna Milan Analysis'}
            </p>
          </div>
        </div>

        <div className="bg-white/90 p-5 rounded-2xl border border-amber-200/80 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-stone-700 text-xs sm:text-sm leading-relaxed font-medium">
              <p className="font-bold text-stone-900">
                {currentLang === 'mr'
                  ? 'अष्टकूट गुण जुळवणी पाहण्यासाठी दोन्ही प्रोफाइलमध्ये जन्म तारीख, जन्म वेळ आणि जन्म ठिकाण भरणे आवश्यक आहे.'
                  : 'Guna Milan (Kundali Match) can only be calculated when Date of Birth, Time of Birth, and Place of Birth are filled in both your profile and the candidate profile.'}
              </p>

              {myMissing.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-900 text-xs space-y-1">
                  <span className="font-bold block">
                    {currentLang === 'mr' ? 'तुमच्या प्रोफाइलमध्ये पुढील माहिती आवश्यक आहे:' : 'Your profile is missing:'}
                  </span>
                  <ul className="list-disc list-inside font-semibold text-rose-800">
                    {myMissing.map((m, idx) => <li key={idx}>{m}</li>)}
                  </ul>
                  <div className="pt-1">
                    <a href="/profile" className="inline-block bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg shadow-xs transition-all">
                      {currentLang === 'mr' ? 'माझे प्रोफाइल अपडेट करा' : 'Update My Profile'}
                    </a>
                  </div>
                </div>
              )}

              {targetMissing.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-xs space-y-1">
                  <span className="font-bold block">
                    {currentLang === 'mr' ? 'सामोरील सदस्याच्या प्रोफाइलमध्ये पुढील माहिती अपूर्ण आहे:' : "Candidate's profile is missing:"}
                  </span>
                  <ul className="list-disc list-inside font-semibold text-amber-800">
                    {targetMissing.map((m, idx) => <li key={idx}>{m}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const gunaResult: GunaResult = calculateGunaMilan(groomDob, groomTime, brideDob, brideTime);

  if (!gunaResult || !gunaResult.isAvailable) {
    return null;
  }

  const score = gunaResult.totalScore;
  const kootas = gunaResult.kootaBreakdown;

  // Determine color and status
  let badgeBg = 'bg-emerald-600 text-white';
  let statusText = currentLang === 'mr' ? 'उत्तम गुण जुळवणी (High Compatibility)' : 'High Compatibility';
  if (score < 18) {
    badgeBg = 'bg-rose-600 text-white';
    statusText = currentLang === 'mr' ? 'कमी गुण जुळवणी (Low Compatibility)' : 'Low Compatibility';
  } else if (score < 25) {
    badgeBg = 'bg-amber-600 text-white';
    statusText = currentLang === 'mr' ? 'मध्यम गुण जुळवणी (Average Match)' : 'Average Compatibility';
  } else if (score < 32) {
    badgeBg = 'bg-emerald-600 text-white';
    statusText = currentLang === 'mr' ? 'छान गुण जुळवणी (Good Match)' : 'Good Compatibility';
  }

  return (
    <div className="bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 p-6 md:p-8 rounded-3xl border-2 border-saffron/20 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-saffron via-gold to-saffron"></div>
      
      {/* Title & Total Score */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-amber-200/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-saffron/10 text-saffron rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-serif font-bold text-stone-900">
              {currentLang === 'mr' ? 'गुण जुळवणी (अष्टकूट गुण)' : 'Guna Milan (Kundali Match)'}
            </h3>
          </div>
          <p className="text-xs text-stone-500 font-medium ml-9">
            {currentLang === 'mr' 
              ? 'जन्म तारीख व वेळेवर आधारित संगणकीय अष्टकूट गुण तक्ता' 
              : 'System-generated 36 Ashtakoota Guna Milan analysis'}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-amber-200 shadow-sm self-stretch sm:self-auto justify-between sm:justify-start">
          <div className="text-right">
            <div className="text-2xl font-serif font-extrabold text-saffron leading-none">
              {score} <span className="text-sm font-sans font-bold text-stone-400">/ 36</span>
            </div>
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mt-0.5">
              {currentLang === 'mr' ? 'एकूण गुण' : 'Total Gunas'}
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-xs ${badgeBg}`}>
            {statusText}
          </span>
        </div>
      </div>

      {/* Ashtakoota Breakdown Table */}
      {kootas && (
        <div className="space-y-4 mb-6">
          <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            {currentLang === 'mr' ? 'अष्टकूट गुण तक्ता (Ashtakoota Breakdown):' : 'Ashtakoota Score Details:'}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Varna (वर्ण)', item: kootas.varna },
              { label: 'Vashya (वश्य)', item: kootas.vashya },
              { label: 'Tara (तारा)', item: kootas.tara },
              { label: 'Yoni (योनी)', item: kootas.yoni },
              { label: 'Graha Maitri (ग्रह मैत्री)', item: kootas.grahaMaitri },
              { label: 'Gana (गण)', item: kootas.gana },
              { label: 'Bhakoot (भकुट)', item: kootas.bhakoot },
              { label: 'Nadi (नाडी)', item: kootas.nadi }
            ].map((k, idx) => (
              <div key={idx} className="bg-white/90 p-3 rounded-2xl border border-amber-100 shadow-xs flex flex-col justify-between">
                <span className="text-xs font-bold text-stone-800 line-clamp-1">{k.label}</span>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-100">
                  <span className="text-xs font-medium text-stone-500">{k.item.description}</span>
                  <span className="text-xs font-extrabold text-saffron bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    {k.item.score} / {k.item.max}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-100/50 p-3.5 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed font-medium flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <span>
          {currentLang === 'mr'
            ? 'हे गुण जुळवणी निकाल जन्म तारीख व वेळानुसार ऑटोमॅटिक तयार केले आहेत. अंतिम निर्णयासाठी कौटुंबिक गुरुजी / ज्योतिषांचा सल्ला घ्यावा.'
            : gunaResult.disclaimer}
        </span>
      </div>
    </div>
  );
}
