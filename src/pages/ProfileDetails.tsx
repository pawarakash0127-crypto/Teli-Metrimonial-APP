import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, doc, onSnapshot, updateDoc } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Briefcase, GraduationCap, Users, User, ArrowLeft, Heart, Phone, Lock, Calendar, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ImageCarousel from '../components/ImageCarousel';
import InterestButton from '../components/InterestButton';
import { 
  translateText, 
  formatDateOfBirth, 
  formatAgeDisplay, 
  formatHeightDisplay, 
  translateSiblingsList 
} from '../lib/profileTranslator';
import { getOrAssignProfileId, getDisplayProfileId } from '../lib/profileIdUtils';
import { isSubscriptionActive } from '../lib/subscriptionService';
import SubscriptionModal from '../components/SubscriptionModal';
import GunaMatchingCard from '../components/GunaMatchingCard';

export default function ProfileDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subModalOpen, setSubModalOpen] = useState(false);

  const isOwner = profile ? (user?.uid === profile.uid || user?.uid === profile.id) : false;
  const isAdmin = myProfile?.role === 'admin';
  const isSubscribed = isSubscriptionActive(myProfile);
  const canAccessContacts = isOwner || isAdmin || isSubscribed;

  const currentLang = i18n.language || 'en';

  const toggleLanguage = () => {
    const newLang = currentLang === 'mr' ? 'en' : 'mr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  useEffect(() => {
    if (!id) return;

    // Real-time listener for target profile details so updates reflect immediately
    const unsubTarget = onSnapshot(doc(db, 'profiles', id), (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.error("No such profile!");
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Profile listener error:", error.message);
      setLoading(false);
    });

    let unsubMine: (() => void) | undefined;
    if (user) {
      unsubMine = onSnapshot(doc(db, 'profiles', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setMyProfile({ id: docSnap.id, ...docSnap.data() });
        }
      }, (error) => {
        console.warn("My profile listener error:", error.message);
      });
    }

    return () => {
      unsubTarget();
      if (unsubMine) unsubMine();
    };
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user || !myProfile || !profile) return;
    if (profile.id === user.uid || profile.uid === user.uid || profile.id === myProfile.uid || profile.uid === myProfile.uid) {
      console.warn("User cannot favorite their own profile.");
      return;
    }
    
    const targetId = profile.id || profile.uid;
    const currentFavorites = myProfile.favorites || [];
    const isFavorite = currentFavorites.includes(targetId);
    
    const newFavorites = isFavorite 
      ? currentFavorites.filter((favId: string) => favId !== targetId)
      : [...currentFavorites, targetId];
      
    try {
      const userRef = doc(db, 'profiles', user.uid);
      await updateDoc(userRef, { favorites: newFavorites });
      setMyProfile({ ...myProfile, favorites: newFavorites });
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron"></div>
      </div>
    );
  }

  if (!profile || profile.isArchived || profile.status === 'archived') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4">
        <h2 className="text-2xl font-bold text-stone-900 mb-2">
          {currentLang === 'mr' ? 'प्रोफाईल उपलब्ध नाही' : 'Profile Unavailable'}
        </h2>
        <p className="text-stone-500 text-sm mb-6">
          {currentLang === 'mr' ? 'हे प्रोफाईल हटवले गेले आहे किंवा अर्काइव्ह केले आहे.' : 'This profile has been archived or removed from Nashik Teli Samaj Matrimony.'}
        </p>
        <button onClick={() => navigate('/search')} className="bg-saffron text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow hover:bg-orange-600 transition-all flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {currentLang === 'mr' ? 'शोध पानावर जा' : 'Back to Search'}
        </button>
      </div>
    );
  }

  // Candidates without an active subscription are not visible to other non-owner non-admin members
  const targetSubscribed = isSubscriptionActive(profile);
  const isTargetVisible = isOwner || isAdmin || targetSubscribed;

  if (!isTargetVisible) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-200 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900">
            {currentLang === 'mr' ? 'प्रोफाईल सध्या निष्क्रिय आहे' : 'Profile Currently Inactive'}
          </h2>
          <p className="text-stone-600 text-xs leading-relaxed">
            {currentLang === 'mr'
              ? 'हे प्रोफाईल सध्या कोणत्याही सक्रिय वार्षिक वर्गणीशी जोडलेले नाही. केवळ सक्रिय वर्गणीदार सदस्यांचीच प्रोफाईल्स वर-वधू शोधात दिसतात.'
              : 'This candidate profile does not currently have an active annual subscription. Only profiles with an active membership plan are visible on Nashik Teli Samaj Matrimony.'}
          </p>
          <button onClick={() => navigate('/search')} className="w-full bg-saffron text-white font-bold py-3 rounded-xl text-xs shadow hover:bg-orange-600 transition-all flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> {currentLang === 'mr' ? 'शोधाकडे परत जा' : 'Back to Search Profiles'}
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-stone-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-saffron/20 max-w-md w-full space-y-6">
          <div className="w-16 h-16 bg-saffron/10 text-saffron rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">
              {currentLang === 'mr' ? 'प्रोफाईल सुरक्षित आहे' : 'Profile Locked'}
            </h2>
            <p className="text-stone-600 text-sm">
              {currentLang === 'mr' 
                ? `${profile.firstName} ${profile.lastName} यांचे संपूर्ण बायोडाटा, फोटो आणि कौटुंबिक माहिती पाहण्यासाठी कृपया लॉगिन करा.`
                : `You must be logged in to view complete biodata, photos, family background, and contact details for ${profile.firstName} ${profile.lastName}.`
              }
            </p>
          </div>
          <button 
            onClick={() => navigate('/login', { state: { from: `/profile/${id}` } })}
            className="w-full bg-saffron text-white py-3.5 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-saffron/20"
          >
            {currentLang === 'mr' ? 'प्रोफाईल पाहण्यासाठी लॉगिन करा' : 'Login to View Profile'}
          </button>
          <button 
            onClick={() => navigate('/search')}
            className="text-stone-500 hover:text-stone-800 text-xs font-semibold block mx-auto"
          >
            {currentLang === 'mr' ? 'शोधाकडे परत जा' : 'Return to Search'}
          </button>
        </div>
      </div>
    );
  }

  const isFavorite = myProfile?.favorites?.includes(profile.id);
  const siblings = translateSiblingsList(profile.siblings, currentLang);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Top Bar with Back button and Language Switcher */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> {currentLang === 'mr' ? 'मागे जा' : 'Back'}
        </button>

        {/* Floating Language Toggle Button */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 bg-stone-100 hover:bg-orange-100 text-stone-800 px-4 py-2 rounded-xl text-sm font-bold border border-stone-200 transition-all shadow-sm hover:border-saffron/40"
        >
          <Globe className="w-4 h-4 text-saffron" />
          <span>{currentLang === 'mr' ? 'English मध्ये पहा' : 'मराठीत पहा'}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row gap-8 mb-10">
            <div className="flex flex-col gap-3">
              <div className="w-48 h-48 rounded-2xl overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
                <ImageCarousel 
                  images={[profile.photoUrl, ...(profile.additionalPhotos || [])].filter(Boolean) as string[]} 
                  altText={profile.firstName} 
                />
              </div>
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-stone-900 text-amber-300 shadow border border-amber-400/30">
                      ID: {getDisplayProfileId(profile)}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-stone-900 mb-3">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-4 py-1.5 bg-orange-50 text-saffron rounded-full text-sm font-medium">
                      {formatAgeDisplay(profile.age, currentLang)}, {formatHeightDisplay(profile.height, currentLang)}
                    </span>
                    <span className="px-4 py-1.5 bg-orange-100 text-maroon rounded-full text-sm font-bold">
                      {translateText(profile.maritalStatus || 'Unmarried', currentLang)}
                    </span>
                    {profile.isManglik === 'Yes' && (
                      <span className="px-4 py-1.5 bg-orange-200 text-orange-900 rounded-full text-sm font-bold shadow-sm">
                        {currentLang === 'mr' ? 'मांगलिक' : 'Manglik'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <InterestButton targetProfile={profile} variant="primary" />
                  {user && profile.id !== user.uid && profile.uid !== user.uid && (
                    <button 
                      onClick={toggleFavorite}
                      className={`p-3 rounded-2xl border transition-all ${isFavorite ? 'bg-orange-50 border-saffron/30 text-saffron' : 'bg-stone-50 border-stone-200 text-stone-400 hover:bg-stone-100'}`}
                      title={isFavorite ? (currentLang === 'mr' ? "आवडीतून काढा" : "Remove from favorites") : (currentLang === 'mr' ? "आवडीत जोडा" : "Add to favorites")}
                    >
                      <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-stone-600">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-stone-400" />
                  <span>{translateText(profile.profession, currentLang)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-stone-400" />
                  <span>{translateText(profile.location, currentLang)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-stone-400" />
                  <span>{translateText(profile.education, currentLang)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-stone-400" />
                  <span>{translateText(profile.gotraKul, currentLang) || 'N/A'} • {translateText(profile.nativePlace, currentLang) || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-saffron/20 pb-3 mb-5 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-saffron" />
                  {currentLang === 'mr' ? 'व्यवसाय व शिक्षण' : 'Professional & Education'}
                </h2>
                <div className="space-y-5">
                {/* Profession */}
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <Briefcase className="w-5 h-5 text-stone-400" />
                  </div>

                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-1">
                      {currentLang === 'mr' ? 'व्यवसाय / नोकरी' : 'Profession'}
                    </p>

                    <p className="text-stone-900 font-medium text-lg">
                      {translateText(profile.profession, currentLang)}
                    </p>
                  </div>
                </div>

                {/* Company */}
                {profile.companyName && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-stone-50 rounded-lg">
                      <Briefcase className="w-5 h-5 text-stone-400" />
                    </div>

                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-1">
                        {currentLang === 'mr' ? 'कंपनी' : 'Company'}
                      </p>

                      <p className="text-stone-900 font-medium text-lg">
                        {profile.companyName}
                      </p>
                    </div>
                  </div>
                )}
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-stone-50 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-stone-400" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-1">
                        {currentLang === 'mr' ? 'शिक्षण पदवी' : 'Education'}
                      </p>
                      <p className="text-stone-900 font-medium">{translateText(profile.education, currentLang)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-stone-50 rounded-lg">
                      <span className="w-5 h-5 flex items-center justify-center text-stone-400 font-bold">₹</span>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-1">
                        {currentLang === 'mr' ? 'वार्षिक उत्पन्न' : 'Annual Income'}
                      </p>
                      <p className="text-stone-900 font-medium">{translateText(profile.income, currentLang) || (currentLang === 'mr' ? 'माहिती उपलब्ध नाही' : 'N/A')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-saffron/20 pb-3 mb-5 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-saffron" />
                  {currentLang === 'mr' ? 'स्थान आणि मूळ स्थान' : 'Location & Roots'}
                </h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-stone-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-stone-400" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-1">
                        {currentLang === 'mr' ? 'सध्याचे ठिकाण' : 'Current Location'}
                      </p>
                      <p className="text-stone-900 font-medium">{translateText(profile.location, currentLang)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-stone-50 rounded-lg">
                      <Users className="w-5 h-5 text-stone-400" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-1">
                        {currentLang === 'mr' ? 'गोत्र / कुळ आणि मूळ गाव' : 'Gotra/Kul & Native'}
                      </p>
                      <p className="text-stone-900 font-medium">
                        {translateText(profile.gotraKul, currentLang) || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-stone-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-stone-400" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-1">
                        {currentLang === 'mr' ? 'मूळ गाव' : 'Native Place'}
                      </p>
                      <p className="text-stone-900 font-medium">
                        {translateText(profile.nativePlace, currentLang) || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-stone-50 rounded-lg">
                      <User className="w-5 h-5 text-stone-400" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-1">
                        {currentLang === 'mr' ? 'मांगलिक स्थिती' : 'Manglik Status'}
                      </p>
                      <p className={`font-bold ${profile.isManglik === 'Yes' ? 'text-orange-600' : 'text-stone-900'}`}>
                        {translateText(profile.isManglik || 'No', currentLang)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-stone-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-stone-400" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-1">
                        {currentLang === 'mr' ? 'जन्म तारीख व वेळ' : 'Birth Details'}
                      </p>
                      <p className="text-stone-900 font-medium">
                        {formatDateOfBirth(profile.dob, profile.timeOfBirth, currentLang)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-stone-400" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-1">
                      {currentLang === 'mr' ? 'जन्म ठिकाण' : 'Place of Birth'}
                    </p>
                    <p className="text-stone-900 font-medium">
                      {translateText(profile.birthplace, currentLang) || 'N/A'}
                    </p>
                  </div>
                </div>
                </div>
              </div>
                {/* Guna Milan Kundali Match Card - Positioned Below Background & Roots */}
                {myProfile && profile && (
                  <div className="my-8">
                    <GunaMatchingCard myProfile={myProfile} targetProfile={profile} />
                  </div>
                )}
            </div>

            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-saffron/20 pb-3 mb-5 flex items-center gap-2">
                  <Users className="w-5 h-5 text-saffron" />
                  {currentLang === 'mr' ? 'कौटुंबिक माहिती' : 'Family Details'}
                </h2>
                <div className="space-y-6">
                  {(profile.fatherName || profile.motherName || profile.parentsOccupation || profile.parentsHometown || profile.parentsContact) && (
                    <div className="bg-orange-50/30 p-4 rounded-xl border border-saffron/20">
                      <p className="text-xs text-saffron uppercase tracking-wider font-bold mb-3">
                        {currentLang === 'mr' ? 'पालकांची माहिती' : 'Parents Details'}
                      </p>
                      <div className="space-y-2">
                        {profile.fatherName && (
                          <p className="text-stone-900 text-sm flex justify-between">
                            <span className="text-stone-500">{currentLang === 'mr' ? 'वडिलांचे नाव' : "Father's Name"}</span>
                            <span className="font-bold">{profile.fatherTitle ? `${translateText(profile.fatherTitle, currentLang)} ` : ''}{profile.fatherName}</span>
                          </p>
                        )}
                        {profile.motherName && (
                          <p className="text-stone-900 text-sm flex justify-between">
                            <span className="text-stone-500">{currentLang === 'mr' ? 'आईचे नाव' : "Mother's Name"}</span>
                            <span className="font-bold">{profile.motherTitle ? `${translateText(profile.motherTitle, currentLang)} ` : ''}{profile.motherName}</span>
                          </p>
                        )}
                        {profile.parentsOccupation && (
                          <p className="text-stone-900 text-sm flex justify-between">
                            <span className="text-stone-500">{currentLang === 'mr' ? 'पालकांचा व्यवसाय' : 'Occupation'}</span>
                            <span className="font-medium">{translateText(profile.parentsOccupation, currentLang)}</span>
                          </p>
                        )}
                        {profile.parentsContact && (
                          <p className="text-stone-900 text-sm flex justify-between">
                            <span className="text-stone-500">{currentLang === 'mr' ? 'पालकांचा संपर्क' : 'Contact'}</span>
                            <span className="font-bold text-maroon">
                              {profile.parentsContact.replace(/\D/g, '').length === 10 
                                ? `+91 - ${profile.parentsContact.replace(/\D/g, '')}` 
                                : profile.parentsContact}
                            </span>
                          </p>
                        )}
                        {profile.parentsHometown && (
                        <p className="text-stone-900 text-sm flex justify-between">
                          <span className="text-stone-500">
                            {currentLang === 'mr' ? 'मूळ गाव' : 'Hometown'}
                          </span>
                          <span className="font-medium">
                            {translateText(profile.parentsHometown, currentLang)}
                          </span>
                        </p>
                      )}
                      </div>
                    </div>
                  )}

                  {profile.siblings && (
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-3">
                        {currentLang === 'mr' ? 'भावंडे' : 'Siblings'}
                      </p>
                      <div className="space-y-3">
                        {siblings.length === 0 ? (
                          <p className="text-stone-500 text-sm italic">
                            {currentLang === 'mr' ? 'कोणतीही भावंडे नाहीत' : 'No siblings added.'}
                          </p>
                        ) : (
                          siblings.map((sibling: any, index: number) => (
                            <div key={index} className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                              <span className="font-bold text-stone-900 block mb-1">{sibling.name}</span>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500 font-medium">
                                {sibling.type && <span className="bg-white px-2 py-0.5 rounded border border-stone-200">{sibling.type}</span>}
                                {sibling.occupation && <span className="bg-white px-2 py-0.5 rounded border border-stone-200">{sibling.occupation}</span>}
                                {sibling.maritalStatus && <span className="bg-orange-50 text-saffron px-2 py-0.5 rounded border border-saffron/20">{sibling.maritalStatus}</span>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {profile.maternalUncleName && (
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                      <p className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-3">
                        {currentLang === 'mr' ? 'मामाची माहिती' : 'Maternal Uncle (Mama)'}
                      </p>
                      <div className="space-y-2">
                        <p className="text-stone-900 text-sm flex justify-between">
                          <span className="text-stone-500">{currentLang === 'mr' ? 'मामाचे नाव' : 'Uncle Name'}</span>
                          <span className="font-bold">{profile.maternalUncleName}</span>
                        </p>
                        {profile.maternalUncleGotraKul && (
                          <p className="text-stone-900 text-sm flex justify-between">
                            <span className="text-stone-500">{currentLang === 'mr' ? 'गोत्र / कुळ' : 'Gotra/Kul'}</span>
                            <span className="font-medium">{translateText(profile.maternalUncleGotraKul, currentLang)}</span>
                          </p>
                        )}
                        {profile.maternalUnclePlace && (
                          <p className="text-stone-900 text-sm flex justify-between">
                            <span className="text-stone-500">{currentLang === 'mr' ? 'गाव / ठिकाण' : 'Location'}</span>
                            <span className="font-medium">{translateText(profile.maternalUnclePlace, currentLang)}</span>
                          </p>
                        )}
                        {profile.maternalUnclePhone && (
                          <p className="text-stone-900 text-sm flex justify-between">
                            <span className="text-stone-500">{currentLang === 'mr' ? 'संपर्क क्रमांक' : 'Contact'}</span>
                            <span className="font-bold text-maroon">
                              {profile.maternalUnclePhone.replace(/\D/g, '').length === 10 
                                ? `+91 - ${profile.maternalUnclePhone.replace(/\D/g, '')}` 
                                : profile.maternalUnclePhone}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              

              {(profile.partnerExpectations || profile.partnerPreferences) && (
                <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                  <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-saffron/20 pb-3 mb-5 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-saffron" />
                    {currentLang === 'mr' ? 'जोडीदाराकडून अपेक्षा' : 'Partner Preferences'}
                  </h2>
                  
                  {profile.partnerExpectations && (
                    <div className="mb-6">
                      <p className="text-xs text-stone-400 uppercase tracking-wider font-bold mb-2">
                        {currentLang === 'mr' ? 'विशेष अपेक्षा' : 'Expectations'}
                      </p>
                      <div className="relative">
                        <span className="absolute -top-2 -left-2 text-4xl text-saffron/20 font-serif">“</span>
                        <p className="text-stone-700 leading-relaxed bg-orange-50/50 p-5 rounded-2xl italic font-serif text-lg">
                          {profile.partnerExpectations}
                        </p>
                        <span className="absolute -bottom-4 -right-2 text-4xl text-saffron/20 font-serif">”</span>
                      </div>
                    </div>
                  )}

                  {profile.partnerPreferences && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                      {profile.partnerPreferences.education && (
                          <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-xl border border-stone-100">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <GraduationCap className="w-5 h-5 text-saffron" />
                            </div>
                            <div>
                              <p className="text-[10px] text-stone-400 uppercase font-bold">
                                {currentLang === 'mr' ? 'अपेक्षित शिक्षण' : 'Preferred Education'}
                              </p>
                              <p className="text-stone-900 font-bold">{translateText(profile.partnerPreferences.education, currentLang)}</p>
                            </div>
                          </div>
                        )}
                        {profile.partnerPreferences.location && (
                          <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-xl border border-stone-100">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <MapPin className="w-5 h-5 text-saffron" />
                            </div>
                            <div>
                              <p className="text-[10px] text-stone-400 uppercase font-bold">
                                {currentLang === 'mr' ? 'अपेक्षित ठिकाण' : 'Preferred Location'}
                              </p>
                              <p className="text-stone-900 font-bold">{translateText(profile.partnerPreferences.location, currentLang)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <SubscriptionModal
                isOpen={subModalOpen}
                onClose={() => setSubModalOpen(false)}
                featureName={currentLang === 'mr' ? 'संपर्क क्रमांक व पत्ता' : 'Phone Number & Address'}
              />

              {user && (profile.contactNumber || profile.address) && (
                <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                  <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-emerald-100 pb-3 mb-5 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-emerald-500" />
                      {currentLang === 'mr' ? 'संपर्क माहिती' : 'Contact Details'}
                    </span>
                    {!canAccessContacts && (
                      <span className="bg-amber-100 text-saffron text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Membership Required
                      </span>
                    )}
                  </h2>

                  {canAccessContacts ? (
                    <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50 space-y-5">
                      {profile.contactNumber && (
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm border border-emerald-100">
                            <Phone className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">
                              {currentLang === 'mr' ? 'मोबाईल नंबर' : 'Phone Number'}
                            </p>
                            <p className="text-emerald-900 font-bold text-xl">
                              {profile.contactNumber.replace(/\D/g, '').length === 10 
                                ? `+91 - ${profile.contactNumber.replace(/\D/g, '')}` 
                                : profile.contactNumber}
                            </p>
                          </div>
                        </div>
                      )}
                      {profile.address && (
                        <div className="flex items-start gap-4 pt-4 border-t border-emerald-100/50">
                          <div className="p-3 bg-white rounded-xl shadow-sm border border-emerald-100 mt-1">
                            <MapPin className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">
                              {currentLang === 'mr' ? 'पत्ता' : 'Address'}
                            </p>
                            <p className="text-emerald-900 font-medium leading-relaxed">{translateText(profile.address, currentLang)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-saffron/20 text-center space-y-4">
                      <div className="w-12 h-12 bg-saffron/10 text-saffron rounded-full flex items-center justify-center mx-auto">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900 text-base">
                          {currentLang === 'mr' ? 'संपर्क क्रमांक सुरक्षित आहे' : 'Contact Details Locked'}
                        </h4>
                        <p className="text-xs text-stone-600 mt-1">
                          {currentLang === 'mr'
                            ? 'या उमेदवाराचा मोबाईल नंबर आणि घरचा पत्ता पाहण्यासाठी ₹७९९/वर्ष सदस्यत्व घ्या.'
                            : 'Unlock candidate & parent contact numbers and home address with an Annual Matrimony Membership.'}
                        </p>
                      </div>
                      <button
                        onClick={() => setSubModalOpen(true)}
                        className="w-full bg-saffron hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <Lock className="w-4 h-4" /> Unlock Contact Details — ₹799/Year
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
